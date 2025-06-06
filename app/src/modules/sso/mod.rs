use std::collections::HashMap;
use anyhow::{anyhow, Result};
use figment::{Figment, providers::Env};
use serde::{Deserialize, Serialize};
use jsonwebtoken::{encode, decode, Header, Algorithm, Validation, EncodingKey, DecodingKey};
use chrono::{Utc, Duration};
use tracing::info;
use poem_openapi::Object;
use url::Url;
use sqlx::PgPool;
use reqwest;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct SSOProviderConfig {
    pub client_id: String,
    pub client_secret: String,
    pub issuer_url: String,
    pub redirect_uri: String,
    pub scopes: Option<Vec<String>>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct SSOConfig {
    pub providers: HashMap<String, SSOProviderConfig>,
    pub jwt_secret: String,
    pub jwt_expiry_hours: Option<i64>,
}

impl Default for SSOConfig {
    fn default() -> Self {
        Self {
            providers: HashMap::new(),
            jwt_secret: "default-secret".to_string(),
            jwt_expiry_hours: Some(24),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct UserInfo {
    pub sub: String,
    pub email: String,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct AuthResponse {
    pub token: String,
    pub user: crate::models::user::User,
    pub expires_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct JWTClaims {
    pub sub: String,    // user ID (now UUID)
    pub email: String,
    pub name: String,
    pub provider: String,
    pub iat: i64,      // issued at
    pub exp: i64,      // expiry
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthSession {
    pub csrf_token: String,
    pub nonce: String,
    pub provider_id: String,
    pub redirect_uri: String,
}

// OAuth token response structures
#[derive(Debug, Deserialize)]
struct TokenResponse {
    access_token: String,
    token_type: String,
    expires_in: Option<i64>,
    refresh_token: Option<String>,
    id_token: Option<String>,
}

// OpenID Connect UserInfo endpoint response
#[derive(Debug, Deserialize, Serialize)]
struct OIDCUserInfo {
    sub: String,
    email: Option<String>,
    email_verified: Option<bool>,
    name: Option<String>,
    given_name: Option<String>,
    family_name: Option<String>,
    picture: Option<String>,
    locale: Option<String>,
    preferred_username: Option<String>,
}

pub struct SSOService {
    pub config: SSOConfig,
    jwt_encoding_key: EncodingKey,
    jwt_decoding_key: DecodingKey,
}

impl SSOService {
    pub async fn new(figment: Figment) -> Result<Self> {
        // Load environment with SSO prefix
        let env_config = figment.clone().merge(Env::prefixed("SSO_"));
        
        // Debug: let's see what figment is finding
        let raw_config = env_config
            .extract::<serde_json::Value>()
            .unwrap_or(serde_json::Value::Null);
        
        tracing::info!("Raw SSO config from figment: {:?}", raw_config);

        // Extract individual components since figment has trouble with nested HashMaps
        let jwt_secret: String = env_config
            .extract_inner("jwt_secret")
            .map_err(|_| anyhow!("SSO_JWT_SECRET is required"))?;
            
        let jwt_expiry_hours: Option<i64> = env_config
            .extract_inner("jwt_expiry_hours")
            .ok();

        // Extract providers manually from the environment
        let mut providers = HashMap::new();
        
        // Look for all provider configurations in the raw config
        if let serde_json::Value::Object(map) = raw_config {
            // Find all keys that start with "providers__"
            for (key, value) in map.iter() {
                if key.starts_with("providers__") {
                    let parts: Vec<&str> = key.split("__").collect();
                    if parts.len() == 3 {
                        let provider_id = parts[1];
                        let field_name = parts[2];
                        
                        // Initialize provider if not exists
                        if !providers.contains_key(provider_id) {
                            providers.insert(provider_id.to_string(), HashMap::new());
                        }
                        
                        // Add field to provider
                        if let Some(provider_map) = providers.get_mut(provider_id) {
                            if let Some(str_value) = value.as_str() {
                                provider_map.insert(field_name.to_string(), str_value.to_string());
                            }
                        }
                    }
                }
            }
        }

        // Convert the raw provider data into proper SSOProviderConfig structs
        let mut typed_providers = HashMap::new();
        
        for (provider_id, provider_data) in providers {
            let client_id = provider_data.get("client_id")
                .ok_or_else(|| anyhow!("Missing client_id for provider {}", provider_id))?;
            let client_secret = provider_data.get("client_secret")
                .ok_or_else(|| anyhow!("Missing client_secret for provider {}", provider_id))?;
            let issuer_url = provider_data.get("issuer_url")
                .ok_or_else(|| anyhow!("Missing issuer_url for provider {}", provider_id))?;
            let redirect_uri = provider_data.get("redirect_uri")
                .ok_or_else(|| anyhow!("Missing redirect_uri for provider {}", provider_id))?;

            let scopes = provider_data.get("scopes").map(|s| {
                // Try to parse as JSON array, fallback to comma-separated
                serde_json::from_str::<Vec<String>>(s)
                    .unwrap_or_else(|_| s.split(',').map(|s| s.trim().to_string()).collect())
            });

            typed_providers.insert(provider_id.clone(), SSOProviderConfig {
                client_id: client_id.clone(),
                client_secret: client_secret.clone(),
                issuer_url: issuer_url.clone(),
                redirect_uri: redirect_uri.clone(),
                scopes,
            });

            info!("Configured SSO provider: {}", provider_id);
        }

        if typed_providers.is_empty() {
            return Err(anyhow!("No SSO providers configured. Please set SSO_PROVIDERS__<provider>__* environment variables"));
        }

        let config = SSOConfig {
            providers: typed_providers,
            jwt_secret,
            jwt_expiry_hours,
        };

        let jwt_encoding_key = EncodingKey::from_secret(config.jwt_secret.as_ref());
        let jwt_decoding_key = DecodingKey::from_secret(config.jwt_secret.as_ref());

        Ok(Self {
            config,
            jwt_encoding_key,
            jwt_decoding_key,
        })
    }

    pub fn get_authorization_url(&self, provider_id: &str) -> Result<(String, AuthSession)> {
        let provider_config = self.config.providers.get(provider_id)
            .ok_or_else(|| anyhow!("Unknown SSO provider: {}", provider_id))?;

        let state = uuid::Uuid::new_v4().to_string();
        let nonce = uuid::Uuid::new_v4().to_string();
        
        // Use the correct Authentik OAuth endpoint based on the OpenID Connect configuration
        let mut auth_url = Url::parse(&provider_config.issuer_url)?;
        auth_url.set_path("/application/o/authorize/");
        
        // Build the scopes string (use default if not specified)
        let scopes = provider_config.scopes.as_ref()
            .map(|s| s.join(" "))
            .unwrap_or_else(|| "openid email profile".to_string());
        
        let auth_url_string = format!(
            "{}?client_id={}&redirect_uri={}&response_type=code&scope={}&state={}",
            auth_url,
            provider_config.client_id,
            urlencoding::encode(&provider_config.redirect_uri),
            scopes.replace(" ", "+"), // Use + for spaces like the real v3x.sh system
            state
        );

        let session = AuthSession {
            csrf_token: state.clone(),
            nonce: nonce.clone(),
            provider_id: provider_id.to_string(),
            redirect_uri: provider_config.redirect_uri.clone(),
        };

        Ok((auth_url_string, session))
    }

    pub async fn exchange_code_for_token(
        &self,
        provider_id: &str,
        code: &str,
        _session: &AuthSession,
        pool: &PgPool,
    ) -> Result<(String, crate::models::user::User)> {
        let provider_config = self.config.providers.get(provider_id)
            .ok_or_else(|| anyhow!("Unknown SSO provider: {}", provider_id))?;

        // Exchange authorization code for access token
        let token_response = self.exchange_code_for_access_token(provider_config, code).await?;
        
        // Get user information from the provider
        let user_info = self.get_user_info(provider_config, &token_response.access_token).await?;
        
        // Create UserInfo struct for compatibility
        let sso_user_info = UserInfo {
            sub: user_info.sub.clone(),
            email: user_info.email.clone().unwrap_or_else(|| format!("{}@{}", user_info.sub, provider_id)),
            name: user_info.name.clone()
                .or_else(|| user_info.preferred_username.clone())
                .unwrap_or_else(|| "Unknown User".to_string()),
        };

        // Create extras with additional user information
        let mut extras = serde_json::Map::new();
        if let Some(picture) = &user_info.picture {
            extras.insert("avatar_url".to_string(), serde_json::Value::String(picture.clone()));
        }
        if let Some(given_name) = &user_info.given_name {
            extras.insert("given_name".to_string(), serde_json::Value::String(given_name.clone()));
        }
        if let Some(family_name) = &user_info.family_name {
            extras.insert("family_name".to_string(), serde_json::Value::String(family_name.clone()));
        }
        if let Some(locale) = &user_info.locale {
            extras.insert("locale".to_string(), serde_json::Value::String(locale.clone()));
        }
        if let Some(preferred_username) = &user_info.preferred_username {
            extras.insert("preferred_username".to_string(), serde_json::Value::String(preferred_username.clone()));
        }
        extras.insert("provider_user_info".to_string(), serde_json::to_value(&user_info)?);

        // Find or create user in database
        let user = crate::models::user::User::find_or_create_from_sso(
            pool,
            provider_id,
            &user_info.sub,
            &sso_user_info,
            Some(serde_json::Value::Object(extras)),
        ).await?;

        // Generate JWT token with the user's UUID
        let jwt_token = self.generate_jwt_token_for_user(&user, provider_id)?;
        
        Ok((jwt_token, user))
    }

    async fn exchange_code_for_access_token(
        &self,
        provider_config: &SSOProviderConfig,
        code: &str,
    ) -> Result<TokenResponse> {
        let client = reqwest::Client::new();
        
        // Build token endpoint URL
        let mut token_url = Url::parse(&provider_config.issuer_url)?;
        token_url.set_path("/application/o/token/");

        let params = [
            ("grant_type", "authorization_code"),
            ("code", code),
            ("redirect_uri", &provider_config.redirect_uri),
            ("client_id", &provider_config.client_id),
            ("client_secret", &provider_config.client_secret),
        ];

        let response = client
            .post(token_url)
            .form(&params)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(anyhow!("Token exchange failed: {}", error_text));
        }

        let token_response: TokenResponse = response.json().await?;
        Ok(token_response)
    }

    async fn get_user_info(
        &self,
        provider_config: &SSOProviderConfig,
        access_token: &str,
    ) -> Result<OIDCUserInfo> {
        let client = reqwest::Client::new();
        
        // Build userinfo endpoint URL
        let mut userinfo_url = Url::parse(&provider_config.issuer_url)?;
        userinfo_url.set_path("/application/o/userinfo/");

        let response = client
            .get(userinfo_url)
            .bearer_auth(access_token)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(anyhow!("UserInfo fetch failed: {}", error_text));
        }

        let user_info: OIDCUserInfo = response.json().await?;
        Ok(user_info)
    }

    pub fn generate_jwt_token_for_user(&self, user: &crate::models::user::User, provider: &str) -> Result<String> {
        let now = Utc::now();
        let expiry_hours = self.config.jwt_expiry_hours.unwrap_or(24);
        let exp = now + Duration::hours(expiry_hours);

        let claims = JWTClaims {
            sub: user.user_id.to_string(), // Use user_id as string
            email: user.email.clone().unwrap_or_default(),
            name: user.display_name.clone().unwrap_or_default(),
            provider: provider.to_string(),
            iat: now.timestamp(),
            exp: exp.timestamp(),
        };

        let token = encode(&Header::default(), &claims, &self.jwt_encoding_key)?;
        Ok(token)
    }

    pub fn validate_jwt_token(&self, token: &str) -> Result<JWTClaims> {
        tracing::debug!("🔍 Validating JWT token with length: {}", token.len());
        
        let validation = Validation::new(Algorithm::HS256);
        
        match decode::<JWTClaims>(token, &self.jwt_decoding_key, &validation) {
            Ok(token_data) => {
                let claims = &token_data.claims;
                tracing::debug!("✅ JWT decode successful - sub: {}, email: {}, provider: {}, exp: {}", 
                    claims.sub, claims.email, claims.provider, claims.exp);
                Ok(token_data.claims)
            },
            Err(e) => {
                tracing::warn!("❌ JWT decode failed: {:?}", e);
                match e.kind() {
                    jsonwebtoken::errors::ErrorKind::InvalidSignature => {
                        tracing::error!("❌ JWT signature validation failed - check JWT_SECRET");
                    },
                    jsonwebtoken::errors::ErrorKind::ExpiredSignature => {
                        tracing::warn!("❌ JWT token has expired");
                    },
                    jsonwebtoken::errors::ErrorKind::InvalidToken => {
                        tracing::warn!("❌ JWT token format is invalid");
                    },
                    _ => {
                        tracing::warn!("❌ Other JWT validation error: {:?}", e.kind());
                    }
                }
                Err(anyhow::Error::from(e))
            }
        }
    }
} 
//! JWT Bearer Token Authentication Middleware
//! 
//! This module provides comprehensive JWT-based authentication for the Ethereum Forum API.
//! 
//! ## Features:
//! - JWT Bearer token validation via poem_openapi SecurityScheme
//! - Automatic user lookup and authentication state management
//! - Token expiration checking with early warning
//! - Resource ownership validation helpers
//! - Comprehensive error handling and logging
//! - Optional authentication extraction for public/private endpoints
//! 
//! ## Usage:
//! 
//! ### Protected Endpoints:
//! ```rust
//! #[oai(path = "/protected", method = "get")]
//! async fn protected_endpoint(&self, auth_user: AuthUser) -> Result<Json<Response>> {
//!     let user_id = auth_user.0.user_id();
//!     // User is guaranteed to be authenticated
//! }
//! ```
//! 
//! ### Optional Authentication:
//! ```rust
//! async fn optional_auth_endpoint(req: &Request) -> Result<Response> {
//!     match extract_user_from_request(req).await {
//!         Ok(Some(user)) => /* authenticated logic */,
//!         Ok(None) => /* public logic */,
//!         Err(e) => /* handle auth error */
//!     }
//! }
//! ```

use poem::Request;
use poem_openapi::{auth::Bearer, SecurityScheme};
use uuid::Uuid;

use crate::models::user::User;
use crate::modules::sso::JWTClaims;
use crate::state::AppState;

/// Represents an authenticated user with their information
#[derive(Debug, Clone)]
pub struct AuthenticatedUser {
    pub user: User,
    pub claims: JWTClaims,
}

impl AuthenticatedUser {
    pub fn user_id(&self) -> Uuid {
        self.user.user_id
    }

    pub fn email(&self) -> &str {
        &self.claims.email
    }

    pub fn name(&self) -> &str {
        &self.claims.name
    }

    pub fn provider(&self) -> &str {
        &self.claims.provider
    }

    /// Check if the authenticated user matches the given user_id
    pub fn owns_resource(&self, user_id: Uuid) -> bool {
        self.user_id() == user_id
    }

    /// Check if the token is about to expire (within 1 hour)
    pub fn is_token_expiring_soon(&self) -> bool {
        let now = chrono::Utc::now().timestamp();
        let expires_in = self.claims.exp - now;
        expires_in < 3600 // 1 hour
    }

    /// Get the token expiration timestamp
    pub fn expires_at(&self) -> i64 {
        self.claims.exp
    }
}

/// Bearer token authentication scheme
#[derive(SecurityScheme)]
#[oai(
    ty = "bearer",
    bearer_format = "JWT",
    checker = "validate_bearer_token"
)]
pub struct JWTAuth(pub AuthenticatedUser);

/// Parse and validate JWT token from Authorization header
async fn validate_bearer_token(req: &Request, bearer: Bearer) -> Option<AuthenticatedUser> {
    tracing::info!("🔐 Starting JWT validation for token: {}...", &bearer.token[..20]);
    
    // Debug: list all available extensions
    tracing::debug!("🔍 Request extensions debug info:");
    
    // Try different ways to access the app state
    let state = if let Some(state) = req.extensions().get::<poem::web::Data<AppState>>() {
        tracing::debug!("✅ Found AppState via poem::web::Data<AppState>");
        state
    } else if let Some(state) = req.extensions().get::<AppState>() {
        tracing::debug!("✅ Found AppState directly");
        state
    } else if let Some(state) = req.extensions().get::<std::sync::Arc<crate::state::AppStateInner>>() {
        tracing::debug!("✅ Found AppState via Arc<AppStateInner>");
        state
    } else {
        tracing::error!("❌ No app state found in request extensions with any method");
        
        // Debug: Log what extensions are available
        tracing::debug!("Available request extension types: (this may be empty)");
        
        return None;
    };

    // Get SSO service from app state
    let sso_service = match state.sso.as_ref() {
        Some(sso) => sso,
        None => {
            tracing::error!("❌ SSO service not configured in app state");
            return None;
        }
    };

    tracing::debug!("✅ SSO service found, attempting JWT validation");

    // Validate JWT token
    let claims = match sso_service.validate_jwt_token(&bearer.token) {
        Ok(claims) => {
            tracing::debug!("✅ JWT signature validation successful for user: {}", claims.sub);
            claims
        },
        Err(e) => {
            tracing::warn!("❌ JWT validation failed: {}", e);
            return None;
        }
    };

    // Check if token is expired
    let now = chrono::Utc::now().timestamp();
    if claims.exp <= now {
        tracing::warn!("❌ JWT token has expired: exp={}, now={}", claims.exp, now);
        return None;
    }
    tracing::debug!("✅ Token expiration check passed: exp={}, now={}", claims.exp, now);

    // Parse user_id from claims.sub (which is now a UUID string)
    let user_id = match Uuid::parse_str(&claims.sub) {
        Ok(id) => {
            tracing::debug!("✅ Parsed user UUID: {}", id);
            id
        },
        Err(e) => {
            tracing::warn!("❌ Invalid user ID format in token: '{}', error: {}", claims.sub, e);
            return None;
        }
    };

    tracing::debug!("🔍 Looking up user in database: {}", user_id);

    // Look up user in database
    let user = match User::find_by_id(&state.database.pool, user_id).await {
        Ok(Some(user)) => {
            tracing::info!("✅ User found in database: {} ({})", user.display_name.as_deref().unwrap_or("no name"), user.user_id);
            user
        },
        Ok(None) => {
            tracing::warn!("❌ User not found in database: {}", user_id);
            return None;
        }
        Err(e) => {
            tracing::error!("❌ Database error looking up user {}: {}", user_id, e);
            return None;
        }
    };

    tracing::info!("🎉 JWT authentication successful for user: {} ({})", 
        user.display_name.as_deref().unwrap_or("no name"), user.user_id);

    Some(AuthenticatedUser { user, claims })
}

// Convenience type alias for easier usage in handlers
pub type AuthUser = JWTAuth;

/// Authentication error types for better error handling
#[derive(Debug)]
pub enum AuthError {
    TokenMissing,
    TokenInvalid,
    TokenExpired,
    UserNotFound,
    DatabaseError(anyhow::Error),
}

impl std::fmt::Display for AuthError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AuthError::TokenMissing => write!(f, "Authentication token is missing"),
            AuthError::TokenInvalid => write!(f, "Authentication token is invalid"),
            AuthError::TokenExpired => write!(f, "Authentication token has expired"),
            AuthError::UserNotFound => write!(f, "User not found"),
            AuthError::DatabaseError(e) => write!(f, "Database error: {}", e),
        }
    }
}

impl std::error::Error for AuthError {}

/// Helper function to extract authenticated user from request without using SecurityScheme
/// Useful for optional authentication scenarios
pub async fn extract_user_from_request(req: &Request) -> Result<Option<AuthenticatedUser>, AuthError> {
    let auth_header = match req.headers().get("authorization") {
        Some(header) => header,
        None => return Ok(None),
    };

    let token = match auth_header.to_str() {
        Ok(header_str) if header_str.starts_with("Bearer ") => {
            &header_str[7..] // Remove "Bearer " prefix
        }
        _ => return Err(AuthError::TokenInvalid),
    };

    let state = req.extensions()
        .get::<poem::web::Data<AppState>>()
        .ok_or(AuthError::TokenInvalid)?;

    let sso_service = state.sso.as_ref()
        .ok_or(AuthError::TokenInvalid)?;

    let claims = sso_service.validate_jwt_token(token)
        .map_err(|_| AuthError::TokenInvalid)?;

    let now = chrono::Utc::now().timestamp();
    if claims.exp <= now {
        return Err(AuthError::TokenExpired);
    }

    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| AuthError::TokenInvalid)?;

    let user = User::find_by_id(&state.database.pool, user_id).await
        .map_err(AuthError::DatabaseError)?
        .ok_or(AuthError::UserNotFound)?;

    Ok(Some(AuthenticatedUser { user, claims }))
} 
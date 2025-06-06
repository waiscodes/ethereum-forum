use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use anyhow::Result;
use poem_openapi::Object;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, Object)]
pub struct User {
    pub user_id: Uuid,
    pub username: Option<String>,
    pub display_name: Option<String>,
    pub email: Option<String>,
    pub avatar_url: Option<String>,
    pub sso_provider: String,
    pub sso_user_id: String,
    #[serde(default)]
    pub extras: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub last_login_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateUserRequest {
    pub username: Option<String>,
    pub display_name: Option<String>,
    pub email: Option<String>,
    pub avatar_url: Option<String>,
    pub sso_provider: String,
    pub sso_user_id: String,
    pub extras: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateUserRequest {
    pub username: Option<String>,
    pub display_name: Option<String>,
    pub email: Option<String>,
    pub avatar_url: Option<String>,
    pub extras: Option<serde_json::Value>,
}

impl User {
    /// Find a user by their SSO provider and user ID
    pub async fn find_by_sso(
        pool: &PgPool,
        sso_provider: &str,
        sso_user_id: &str,
    ) -> Result<Option<User>> {
        let user = sqlx::query_as::<_, User>(
            r#"
            SELECT user_id, username, display_name, email, avatar_url, sso_provider, sso_user_id,
                   extras, created_at, updated_at, last_login_at
            FROM users
            WHERE sso_provider = $1 AND sso_user_id = $2
            "#,
        )
        .bind(sso_provider)
        .bind(sso_user_id)
        .fetch_optional(pool)
        .await?;

        Ok(user)
    }

    /// Find a user by their ID
    pub async fn find_by_id(pool: &PgPool, user_id: Uuid) -> Result<Option<User>> {
        let user = sqlx::query_as::<_, User>(
            r#"
            SELECT user_id, username, display_name, email, avatar_url, sso_provider, sso_user_id,
                   extras, created_at, updated_at, last_login_at
            FROM users
            WHERE user_id = $1
            "#,
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        Ok(user)
    }

    /// Find a user by email
    pub async fn find_by_email(pool: &PgPool, email: &str) -> Result<Option<User>> {
        let user = sqlx::query_as::<_, User>(
            r#"
            SELECT user_id, username, display_name, email, avatar_url, sso_provider, sso_user_id,
                   extras, created_at, updated_at, last_login_at
            FROM users
            WHERE email = $1
            "#,
        )
        .bind(email)
        .fetch_optional(pool)
        .await?;

        Ok(user)
    }

    /// Create a new user
    pub async fn create(pool: &PgPool, request: CreateUserRequest) -> Result<User> {
        let extras = request.extras.unwrap_or_else(|| serde_json::json!({}));

        let user = sqlx::query_as::<_, User>(
            r#"
            INSERT INTO users (username, display_name, email, avatar_url, sso_provider, sso_user_id, extras)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING user_id, username, display_name, email, avatar_url, sso_provider, sso_user_id,
                      extras, created_at, updated_at, last_login_at
            "#,
        )
        .bind(&request.username)
        .bind(&request.display_name)
        .bind(&request.email)
        .bind(&request.avatar_url)
        .bind(&request.sso_provider)
        .bind(&request.sso_user_id)
        .bind(&extras)
        .fetch_one(pool)
        .await?;

        Ok(user)
    }

    /// Update a user
    pub async fn update(&mut self, pool: &PgPool, request: UpdateUserRequest) -> Result<()> {
        let extras = request.extras.unwrap_or(self.extras.clone());

        let updated_user = sqlx::query_as::<_, User>(
            r#"
            UPDATE users
            SET username = COALESCE($1, username),
                display_name = COALESCE($2, display_name),
                email = COALESCE($3, email),
                avatar_url = COALESCE($4, avatar_url),
                extras = $5
            WHERE user_id = $6
            RETURNING user_id, username, display_name, email, avatar_url, sso_provider, sso_user_id,
                      extras, created_at, updated_at, last_login_at
            "#,
        )
        .bind(&request.username)
        .bind(&request.display_name)
        .bind(&request.email)
        .bind(&request.avatar_url)
        .bind(&extras)
        .bind(self.user_id)
        .fetch_one(pool)
        .await?;

        *self = updated_user;
        Ok(())
    }

    /// Update last login time
    pub async fn update_last_login(&mut self, pool: &PgPool) -> Result<()> {
        let now = Utc::now();
        
        sqlx::query(
            r#"
            UPDATE users
            SET last_login_at = $1
            WHERE user_id = $2
            "#,
        )
        .bind(now)
        .bind(self.user_id)
        .execute(pool)
        .await?;

        self.last_login_at = Some(now);
        Ok(())
    }

    /// Create or update a user from SSO information
    pub async fn find_or_create_from_sso(
        pool: &PgPool,
        sso_provider: &str,
        sso_user_id: &str,
        sso_user_info: &crate::modules::sso::UserInfo,
        extras: Option<serde_json::Value>,
    ) -> Result<User> {
        // First try to find existing user
        if let Some(mut user) = Self::find_by_sso(pool, sso_provider, sso_user_id).await? {
            // Update user information with latest from SSO
            let update_request = UpdateUserRequest {
                username: None, // Don't override username
                display_name: Some(sso_user_info.name.clone()),
                email: Some(sso_user_info.email.clone()),
                avatar_url: None, // We don't have avatar info in the basic UserInfo
                extras,
            };

            user.update(pool, update_request).await?;
            user.update_last_login(pool).await?;
            
            Ok(user)
        } else {
            // Create new user
            let create_request = CreateUserRequest {
                username: None, // Let them set username later
                display_name: Some(sso_user_info.name.clone()),
                email: Some(sso_user_info.email.clone()),
                avatar_url: None,
                sso_provider: sso_provider.to_string(),
                sso_user_id: sso_user_id.to_string(),
                extras,
            };

            let mut user = Self::create(pool, create_request).await?;
            user.update_last_login(pool).await?;
            
            Ok(user)
        }
    }

    /// Delete a user
    pub async fn delete(&self, pool: &PgPool) -> Result<()> {
        sqlx::query("DELETE FROM users WHERE user_id = $1")
            .bind(self.user_id)
            .execute(pool)
            .await?;

        Ok(())
    }

    /// List all users with pagination
    pub async fn list(
        pool: &PgPool,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<User>> {
        let users = sqlx::query_as::<_, User>(
            r#"
            SELECT user_id, username, display_name, email, avatar_url, sso_provider, sso_user_id,
                   extras, created_at, updated_at, last_login_at
            FROM users
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
            "#,
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await?;

        Ok(users)
    }

    /// Count total users
    pub async fn count(pool: &PgPool) -> Result<i64> {
        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users")
            .fetch_one(pool)
            .await?;

        Ok(count)
    }
} 
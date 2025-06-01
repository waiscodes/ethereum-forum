use poem::web::Data;
use poem::Result;
use poem_openapi::param::Path;
use poem_openapi::payload::Json;
use poem_openapi::{Object, OpenApi};
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use crate::models::discourse::user::{DiscourseUserProfile, DiscourseUserSummaryResponse};
use crate::modules::discourse::LResult;
use crate::state::AppState;
use crate::server::ApiTags;

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct UserApi;

#[OpenApi]
impl UserApi {
    /// /users
    ///
    /// List users
    #[oai(path = "/users", method = "get", tag = "ApiTags::User")]
    async fn list(
        &self,
        _state: Data<&AppState>,
    ) -> Result<Json<serde_json::Value>> {
        // let party = Party::create(&user.user_id, state.0).await.map_err(|e| {
        //     tracing::error!("Error creating party: {:?}", e);
        //     poem::Error::from_status(StatusCode::INTERNAL_SERVER_ERROR)
        // })?;

        // Ok(Json(PartyCreateResponse {
        //     id: party.party_id,
        //     created_at: party.created_at.to_rfc3339(),
        // }))
        Ok(Json(serde_json::Value::Null))
    }

    /// /user/:username
    ///
    /// Get user profile
    #[oai(path = "/user/:username", method = "get", tag = "ApiTags::User")]
    async fn get_user(
        &self,
        state: Data<&AppState>,
        #[oai(style = "simple")] username: Path<String>,
    ) -> Result<Json<DiscourseUserProfile>> {
        let user = match state.discourse.fetch_discourse_user_cached(&username).await {
            LResult::Success(user) => user,
            LResult::Failed(e) => {
                tracing::error!("Error fetching user: {:?}", e);
                return Err(poem::Error::from_status(StatusCode::INTERNAL_SERVER_ERROR));
            }
        };

        Ok(Json(user))
    }

    /// /user/:username/summary
    ///
    /// Get user summary
    #[oai(path = "/user/:username/summary", method = "get", tag = "ApiTags::User")]
    async fn get_user_summary(
        &self,
        state: Data<&AppState>,
        #[oai(style = "simple")] username: Path<String>,
    ) -> Result<Json<DiscourseUserSummaryResponse>> {
        let summary = match state.discourse.fetch_discourse_user_summary_cached(&username).await {
            LResult::Success(summary) => summary,
            LResult::Failed(e) => {
                tracing::error!("Error fetching user summary: {:?}", e);
                return Err(poem::Error::from_status(StatusCode::INTERNAL_SERVER_ERROR));
            }
        };

        Ok(Json(summary))
    }

    /// /user/sso/:sso_id/login
    /// 
    /// Login with SSO
    #[oai(path = "/user/sso/:sso_id/login", method = "get", tag = "ApiTags::User")]
    async fn login(
        &self,
        _state: Data<&AppState>,
        #[oai(style = "simple")] sso_id: Path<String>,
    ) -> Result<Json<serde_json::Value>> {
        Ok(Json(serde_json::Value::Null))
    }
}

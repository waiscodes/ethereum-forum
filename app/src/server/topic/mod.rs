use poem::{Result, web::Data};
use poem_openapi::param::{Path, Query};
use poem_openapi::{Object, OpenApi, payload::Json};
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};

use crate::models::topics::Post;
use crate::server::ApiTags;
use crate::state::AppState;

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct TopicApi;

#[OpenApi]
impl TopicApi {
    /// /topics
    ///
    /// List topics
    #[oai(path = "/topics", method = "get", tag = "ApiTags::Topic")]
    async fn list(&self, state: Data<&AppState>) -> Result<Json<serde_json::Value>> {
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

    /// /t/:topic_id/posts?page={page}
    ///
    /// Get all data for a topic
    #[oai(path = "/t/:topic_id/posts", method = "get", tag = "ApiTags::Topic")]
    async fn get(
        &self,
        state: Data<&AppState>,
        #[oai(style = "simple")] topic_id: Path<i32>,
        #[oai(style = "simple")] page: Query<i32>,
    ) -> Result<Json<Vec<Post>>> {
        let topic_id = topic_id.0;
        let page = page.0;

        let posts = Post::find_by_topic_id(topic_id, page, &state).await.map_err(|e| {
            tracing::error!("Error finding posts: {:?}", e);
            poem::Error::from_status(StatusCode::INTERNAL_SERVER_ERROR)
        })?;

        Ok(Json(posts))
    }
}

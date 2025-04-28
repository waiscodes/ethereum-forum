use poem::{Result, web::Data};
use poem_openapi::param::{Path, Query};
use poem_openapi::{Object, OpenApi, payload::Json};
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use tracing::info;

use crate::models::topics::{Post, Topic};
use crate::server::ApiTags;
use crate::state::AppState;

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct TopicApi;

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct PostsResponse {
    pub posts: Vec<Post>,
    pub has_more: bool,
}

#[OpenApi]
impl TopicApi {
    /// /topics
    ///
    /// List topics
    #[oai(path = "/topics", method = "get", tag = "ApiTags::Topic")]
    async fn list(&self, state: Data<&AppState>) -> Result<Json<Vec<Topic>>> {
        let topics = Topic::get_by_latest_post_at(&state).await.map_err(|e| {
            tracing::error!("Error getting topics: {:?}", e);
            poem::Error::from_status(StatusCode::INTERNAL_SERVER_ERROR)
        })?;

        Ok(Json(topics))
    }

    /// /t/:topic_id
    ///
    /// Get a topic
    #[oai(path = "/t/:topic_id", method = "get", tag = "ApiTags::Topic")]
    async fn get_topic(&self, state: Data<&AppState>, #[oai(style = "simple")] topic_id: Path<i32>) -> Result<Json<Topic>> {
        let topic = Topic::get_by_topic_id(topic_id.0, &state).await.map_err(|e| {
            tracing::error!("Error getting topic: {:?}", e);
            poem::Error::from_status(StatusCode::INTERNAL_SERVER_ERROR)
        })?;

        Ok(Json(topic))
    }

    /// /t/:topic_id
    /// 
    /// Force refresh a topic
    #[oai(path = "/t/:topic_id", method = "post", tag = "ApiTags::Topic")]
    async fn refresh_topic(&self, state: Data<&AppState>, #[oai(style = "simple")] topic_id: Path<i32>) -> Result<Json<serde_json::Value>> {
        info!("Refreshing topic: {:?}", topic_id.0);
        state.discourse.enqueue(topic_id.0, 1).await;

        Ok(Json(serde_json::json!({})))
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
    ) -> Result<Json<PostsResponse>> {
        let topic_id = topic_id.0;
        let page = page.0;

        let (posts, has_more) = Post::find_by_topic_id(topic_id, page, &state).await.map_err(|e| {
            tracing::error!("Error finding posts: {:?}", e);
            poem::Error::from_status(StatusCode::INTERNAL_SERVER_ERROR)
        })?;

        Ok(Json(PostsResponse { posts, has_more }))
    }
}

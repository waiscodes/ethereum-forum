use poem::web::Data;
use poem::Result;
use poem_openapi::param::Path;
use poem_openapi::payload::Json;
use poem_openapi::{Object, OpenApi};
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::state::AppState;
use crate::server::ApiTags;
use crate::models::workshop::{WorkshopChat, WorkshopMessage};

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct WorkshopApi;

#[OpenApi]
impl WorkshopApi {
    /// /ws/chat
    ///
    /// Get all chats
    #[oai(path = "/ws/chat", method = "get", tag = "ApiTags::Workshop")]
    async fn get_chats(
        &self,
        state: Data<&AppState>,
    ) -> Result<Json<Vec<WorkshopChat>>> {
        let user_id = 1;
        let chats = WorkshopChat::find_by_user_id(user_id, &state.0).await.map_err(|e| {
            tracing::error!("Error finding chats: {:?}", e);
            poem::Error::from_status(StatusCode::INTERNAL_SERVER_ERROR)
        })?;

        Ok(Json(chats))
    }

    /// /ws/chat/:chat_id
    ///
    /// Get a chat
    #[oai(path = "/ws/chat/:chat_id", method = "get", tag = "ApiTags::Workshop")]
    async fn get_chat(
        &self,
        state: Data<&AppState>,
        #[oai(style = "simple")] chat_id: Path<Uuid>,
    ) -> Result<Json<Vec<WorkshopMessage>>> {
        let messages = WorkshopMessage::get_messages_by_chat_id(*chat_id, &state.0).await.map_err(|e| {
            tracing::error!("Error finding messages: {:?}", e);
            poem::Error::from_status(StatusCode::INTERNAL_SERVER_ERROR)
        })?;

        Ok(Json(messages))
    }
}

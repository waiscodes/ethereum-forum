use poem::web::Data;
use poem::Result;
use poem_openapi::param::{Path, Query};
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

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct WorkshopChatInput {
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct WorkshopChatPayload {
    pub chat_id: Uuid,
    pub chat: WorkshopChat,
    pub messages: Vec<WorkshopMessage>,
}

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
    ) -> Result<Json<WorkshopChatPayload>> {
        let messages = WorkshopMessage::get_messages_by_chat_id(*chat_id, &state).await.map_err(|e| {
            tracing::error!("Error finding messages: {:?}", e);
            poem::Error::from_status(StatusCode::INTERNAL_SERVER_ERROR)
        })?;

        let chat = WorkshopChat::find_by_id(*chat_id, &state).await.map_err(|e| {
            tracing::error!("Error finding chat: {:?}", e);
            poem::Error::from_status(StatusCode::INTERNAL_SERVER_ERROR)
        })?;

        Ok(Json(WorkshopChatPayload {
            chat_id: *chat_id,
            chat,
            messages,
        }))
    }

    /// /ws/chat/:chat_id
    ///
    /// Send a message
    /// Specify parent_message as query param to send a reply
    #[oai(path = "/ws/chat/:chat_id", method = "post", tag = "ApiTags::Workshop")]
    async fn send_message(
        &self,
        state: Data<&AppState>,
        payload: Json<WorkshopChatInput>,
        #[oai(style = "simple")] chat_id: Path<String>,
        #[oai(style = "simple")] parent_message: Query<Option<Uuid>>,
    ) -> Result<Json<WorkshopMessage>> {
        let user_id = 1;
        let message = payload.message.clone();

        let chat_id = if chat_id.eq("new") {
            None
        } else {
            Some(Uuid::parse_str(&chat_id).map_err(|e| {
                tracing::error!("Error parsing chat id: {:?}", e);
                poem::Error::from_status(StatusCode::BAD_REQUEST)
            })?)
        };
        let message = WorkshopMessage::create_user_message(chat_id, *parent_message, user_id, message.to_string(), &state).await.map_err(|e| {
            tracing::error!("Error sending message: {:?}", e);
            poem::Error::from_status(StatusCode::INTERNAL_SERVER_ERROR)
        })?;

        WorkshopChat::update_last_message(&message.chat_id, &message.message_id, &state).await.map_err(|e| {
            tracing::error!("Error updating chat: {:?}", e);
            poem::Error::from_status(StatusCode::INTERNAL_SERVER_ERROR)
        })?;

        Ok(Json(message))
    }
}

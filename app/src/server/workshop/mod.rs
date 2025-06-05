use poem::web::Data;
use poem::Result;
use poem_openapi::param::{Path, Query};
use poem_openapi::payload::{Json, EventStream};
use poem_openapi::{Object, OpenApi};
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use futures::{StreamExt, stream::BoxStream};
use crate::models::topics::Topic;
use crate::modules::workshop::WorkshopService;
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

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct StreamingResponse {
    pub content: String,
    pub is_complete: bool,
    pub error: Option<String>,
}

#[OpenApi]
impl WorkshopApi {
    /// /ws/t/:topic_id/summary/to-chat
    ///
    /// Create a new chat from a topic summary
    #[oai(path = "/ws/t/:topic_id/summary/to-chat", method = "post", tag = "ApiTags::Workshop")]
    async fn create_chat_from_summary(
        &self,
        state: Data<&AppState>,
        #[oai(style = "simple")] topic_id: Path<i32>,
    ) -> Result<Json<WorkshopMessage>> {
        let user_id = 1;
        let user_prompt = format!("Summarize ethereum.forum topic #{}", topic_id.0);

        let message = WorkshopMessage::create_user_message(None, None, user_id, user_prompt, &state).await.map_err(|e| {
            tracing::error!("Error creating message: {:?}", e);
            poem::Error::from_status(StatusCode::INTERNAL_SERVER_ERROR)
        })?;

        let summary = Topic::get_summary_by_topic_id(topic_id.0, &state)
            .await
            .map_err(|e| {
                tracing::error!("Error getting topic summary: {:?}", e);
                poem::Error::from_status(StatusCode::INTERNAL_SERVER_ERROR)
            })?;

        let message2 = WorkshopMessage::create_system_response(&message.chat_id, None, summary.summary_text, &state).await.map_err(|e| {
            tracing::error!("Error creating message: {:?}", e);
            poem::Error::from_status(StatusCode::INTERNAL_SERVER_ERROR)
        })?;

        Ok(Json(message2))
    }

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
        let messages = WorkshopMessage::get_messages_by_chat_id(&chat_id, &state).await.map_err(|e| {
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

        // Start processing the next message (this will create an OngoingPrompt)
        let (ongoing_prompt, created_message) = WorkshopService::process_next_message(message.chat_id, message.message_id, &state).await.map_err(|e| {
            tracing::error!("Error processing next message: {:?}", e);
            poem::Error::from_status(StatusCode::INTERNAL_SERVER_ERROR)
        })?;

        // Return the system response message that's being generated
        // Add debug logging to help with troubleshooting
        tracing::info!("Created system message with ID: {} for chat: {}", created_message.message_id, created_message.chat_id);

        Ok(Json(created_message))
    }

    /// /ws/chat/:chat_id/:message_id/stream
    ///
    /// Get SSE stream for a specific message response
    #[oai(path = "/ws/chat/:chat_id/:message_id/stream", method = "get", tag = "ApiTags::Workshop")]
    async fn stream_message_response(
        &self,
        state: Data<&AppState>,
        #[oai(style = "simple")] chat_id: Path<Uuid>,
        #[oai(style = "simple")] message_id: Path<Uuid>,
    ) -> Result<EventStream<BoxStream<'static, StreamingResponse>>> {
        tracing::info!("Stream request for chat: {}, message: {}", *chat_id, *message_id);
        
        // List all ongoing prompts for debugging
        let all_keys = state.workshop.ongoing_prompts.list_keys().await;
        tracing::info!("Available ongoing prompt keys: {:?}", all_keys);
        
        // Try to get the ongoing prompt
        let ongoing_prompt = state.workshop.get_ongoing_prompt(*chat_id, *message_id).await
            .ok_or_else(|| {
                tracing::error!("No ongoing prompt found for chat {} message {}", *chat_id, *message_id);
                poem::Error::from_status(StatusCode::NOT_FOUND)
            })?;

        tracing::info!("Found ongoing prompt, starting stream");

        // Get the stream
        let stream = ongoing_prompt.get_stream().await;
        
        // Convert to streaming response events
        let response_stream = stream.map(|result| {
            match result {
                Ok(delta) => {
                    let content = delta.choices.first()
                        .and_then(|c| c.delta.content.as_ref())
                        .cloned()
                        .unwrap_or_default();
                    
                    StreamingResponse {
                        content,
                        is_complete: false,
                        error: None,
                    }
                }
                Err(err) => {
                    tracing::error!("Stream error: {}", err);
                    StreamingResponse {
                        content: String::new(),
                        is_complete: true,
                        error: Some(err),
                    }
                }
            }
        }).boxed();

        Ok(EventStream::new(response_stream))
    }
}

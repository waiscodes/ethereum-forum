use crate::state::AppState;
use crate::modules::workshop::prompts::StreamingEntry;
use chrono::{DateTime, Utc};
use async_openai::types::{ChatCompletionRequestMessage, ChatCompletionRequestSystemMessage, ChatCompletionRequestUserMessage, ChatCompletionRequestAssistantMessage};
use poem_openapi::Object;
use serde::{Deserialize, Serialize};
use sqlx::query_as;
use uuid::Uuid;
use serde_json;

#[derive(Debug, Clone, sqlx::FromRow, Serialize, Deserialize, Object)]
pub struct WorkshopMessage {
    pub message_id: Uuid,
    pub chat_id: Uuid,
    pub sender_role: String, // "user", "assistant", or "system"
    pub message: String,
    pub created_at: DateTime<Utc>,
    pub parent_message_id: Option<Uuid>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub streaming_events: Option<serde_json::Value>,
}

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize, Object)]
pub struct WorkshopChat {
    pub chat_id: Uuid,
    pub user_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub summary: Option<String>,
    pub last_message_id: Option<Uuid>,
}

#[derive(Debug, sqlx::FromRow)]
pub struct WorkshopSnapshot {
    pub snapshot_id: Uuid,
    pub chat_id: Uuid,
    pub user_id: Uuid,
    pub message_id: Uuid,
    pub created_at: DateTime<Utc>,
}

impl WorkshopChat {
    pub async fn find_by_user_id(user_id: Uuid, state: &AppState) -> Result<Vec<Self>, sqlx::Error> {
        query_as("SELECT * FROM workshop_chats WHERE user_id = $1 ORDER BY created_at DESC")
            .bind(user_id)
            .fetch_all(&state.database.pool)
            .await
    }

    pub async fn find_by_id(chat_id: Uuid, state: &AppState) -> Result<Self, sqlx::Error> {
        query_as("SELECT * FROM workshop_chats WHERE chat_id = $1")
            .bind(chat_id)
            .fetch_one(&state.database.pool)
            .await
    }

    pub async fn create(user_id: Uuid, state: &AppState) -> Result<Self, sqlx::Error> {
        query_as("INSERT INTO workshop_chats (user_id) VALUES ($1) RETURNING *")
            .bind(user_id)
            .fetch_one(&state.database.pool)
            .await
    }

    pub async fn update_last_message(chat_id: &Uuid, message_id: &Uuid, state: &AppState) -> Result<Self, sqlx::Error> {
        query_as("UPDATE workshop_chats SET last_message_id = $1 WHERE chat_id = $2 RETURNING *")
            .bind(message_id)
            .bind(chat_id)
            .fetch_one(&state.database.pool)
            .await
    }

    pub async fn update_summary(chat_id: &Uuid, summary: &str, state: &AppState) -> Result<Self, sqlx::Error> {
        query_as("UPDATE workshop_chats SET summary = $1 WHERE chat_id = $2 RETURNING *")
            .bind(summary)
            .bind(chat_id)
            .fetch_one(&state.database.pool)
            .await
    }
}

impl WorkshopMessage {
    pub async fn create_user_message(
        chat_id: Option<Uuid>,
        parent_message_id: Option<Uuid>,
        user_id: Uuid,
        message: String,
        state: &AppState,
    ) -> Result<Self, sqlx::Error> {
        let chat_id = match chat_id {
            Some(chat_id) => chat_id,
            _ => {
                let chat = WorkshopChat::create(user_id, state).await?;
                chat.chat_id
            }
        };

        query_as!(Self, "INSERT INTO workshop_messages (chat_id, sender_role, message, parent_message_id) VALUES ($1, $2, $3, $4) RETURNING *",
            chat_id,
            "user",
            message,
            parent_message_id
        )
            .fetch_one(&state.database.pool)
            .await
    }

    pub async fn create_system_response(
        chat_id: &Uuid,
        parent_message_id: Option<Uuid>,
        message: String,
        state: &AppState,
    ) -> Result<Self, sqlx::Error> {
        query_as!(Self, "INSERT INTO workshop_messages (chat_id, sender_role, message, parent_message_id) VALUES ($1, $2, $3, $4) RETURNING *",
            chat_id,
            "assistant",
            message,
            parent_message_id
        )
            .fetch_one(&state.database.pool)
            .await
    }

    pub async fn update_message_content(message_id: &Uuid, content: &str, state: &AppState) -> Result<Self, sqlx::Error> {
        query_as!(Self, "UPDATE workshop_messages SET message = $1 WHERE message_id = $2 RETURNING *",
            content,
            message_id
        )
            .fetch_one(&state.database.pool)
            .await
    }

    pub async fn update_message_with_streaming_events(
        message_id: &Uuid, 
        content: &str, 
        streaming_events: &[StreamingEntry], 
        state: &AppState
    ) -> Result<Self, sqlx::Error> {
        let events_json = serde_json::to_value(streaming_events).unwrap_or(serde_json::Value::Null);
        query_as!(Self, "UPDATE workshop_messages SET message = $1, streaming_events = $2 WHERE message_id = $3 RETURNING *",
            content,
            events_json,
            message_id
        )
            .fetch_one(&state.database.pool)
            .await
    }

    pub async fn get_messages_by_chat_id(
        chat_id: &Uuid,
        state: &AppState,
    ) -> Result<Vec<Self>, sqlx::Error> {
        query_as!(
            Self,
            "SELECT * FROM workshop_messages WHERE chat_id = $1 ORDER BY created_at ASC",
            chat_id
        )
        .fetch_all(&state.database.pool)
        .await
    }

    /// Gets all messages (for use with snapshots) upwards
    /// As such only returning the singular branch up until parent_message_id = NULL
    /// Starts querying at chat_id message_id and works its way up to the root message
    pub async fn get_messages_upwards(
        message_id: &Uuid,
        state: &AppState,
    ) -> Result<Vec<Self>, sqlx::Error> {
        query_as(
            r#"WITH RECURSIVE message_tree AS (
            SELECT * FROM workshop_messages WHERE message_id = $1
            UNION ALL
            SELECT m.* FROM workshop_messages m
            INNER JOIN message_tree mt ON m.message_id = mt.parent_message_id
        )
        SELECT * FROM message_tree
        ORDER BY created_at ASC"#,
        )
        .bind(message_id)
        .fetch_all(&state.database.pool)
        .await
    }

    /// Get streaming events as a Vec<StreamingEntry> if they exist
    pub fn get_streaming_events(&self) -> Option<Vec<StreamingEntry>> {
        self.streaming_events.as_ref().and_then(|v| {
            serde_json::from_value(v.clone()).ok()
        })
    }

    /// Set streaming events from a Vec<StreamingEntry>
    pub fn set_streaming_events(&mut self, events: Vec<StreamingEntry>) {
        self.streaming_events = serde_json::to_value(events).ok();
    }

    /// Extract OpenAI-compatible tool calls from streaming events for reuse in subsequent requests
    pub fn get_openai_tool_calls(&self) -> Option<Vec<async_openai::types::ChatCompletionMessageToolCall>> {
        let events = self.get_streaming_events()?;
        let mut tool_calls = std::collections::HashMap::new();

        // Process events to build complete tool calls
        for event in events {
            if let Some(tool_call_entry) = event.tool_call {
                let tool_call_id = tool_call_entry.tool_id.clone();
                
                // Get or create the tool call
                let tool_call = tool_calls.entry(tool_call_id.clone()).or_insert_with(|| {
                    async_openai::types::ChatCompletionMessageToolCall {
                        id: tool_call_id.clone(),
                        function: async_openai::types::FunctionCall {
                            name: tool_call_entry.tool_name.clone(),
                            arguments: tool_call_entry.arguments.clone().unwrap_or_default(),
                        },
                        r#type: async_openai::types::ChatCompletionToolType::Function,
                    }
                });

                // Update with any new information (tool calls can be updated across multiple events)
                if let Some(args) = &tool_call_entry.arguments {
                    if !args.is_empty() {
                        tool_call.function.arguments = args.clone();
                    }
                }
            }
        }

        if tool_calls.is_empty() {
            None
        } else {
            Some(tool_calls.into_values().collect())
        }
    }
}

impl Into<ChatCompletionRequestMessage> for WorkshopMessage {
    fn into(self) -> ChatCompletionRequestMessage {
        match self.sender_role.as_str() {
            "user" => ChatCompletionRequestMessage::User(ChatCompletionRequestUserMessage {
                content: self.message.into(),
                name: None,
            }),
            "assistant" => {
                // Extract tool calls from streaming events if available
                let tool_calls = self.get_openai_tool_calls();
                
                ChatCompletionRequestMessage::Assistant(ChatCompletionRequestAssistantMessage {
                    content: if self.message.is_empty() { None } else { Some(self.message.into()) },
                    name: None,
                    tool_calls,
                    #[allow(deprecated)]
                    function_call: None,
                    refusal: None,
                    audio: None,
                })
            },
            "system" => ChatCompletionRequestMessage::System(ChatCompletionRequestSystemMessage {
                content: self.message.into(),
                name: None,
            }),
            _ => ChatCompletionRequestMessage::User(ChatCompletionRequestUserMessage {
                content: self.message.into(),
                name: None,
            }),
        }
    }
}
use async_std::task;
use figment::providers::Env;
use openai::{
    chat::{self, ChatCompletion, ChatCompletionMessage, ChatCompletionMessageRole}, Credentials
};
use opentelemetry_http::HttpError;
use reqwest::StatusCode;
use serde_json::json;
use tracing::info;
use uuid::Uuid;

use crate::{
    models::{
        topics::{Post, Topic},
        workshop::{WorkshopChat, WorkshopMessage},
    },
    state::AppState,
};

pub mod prompts;

pub struct WorkshopService {
    pub credentials: Credentials,
    pub prompts: WorkshopPrompts,
}

pub struct WorkshopPrompts {
    pub summerize: ChatCompletionMessage,
}

impl Default for WorkshopPrompts {
    fn default() -> Self {
        Self {
            summerize: ChatCompletionMessage {
                role: ChatCompletionMessageRole::System,
                content: Some(prompts::SUMMARY_PROMPT.to_string()),
                name: None,
                function_call: None,
                tool_call_id: None,
                tool_calls: None,
            },
        }
    }
}

impl WorkshopService {
    pub async fn init() -> Self {
        let base_url = Env::var_or(
            "WORKSHOP_INTELLIGENCE_BASE_URL",
            "https://openrouter.ai/api/v1",
        );

        let credentials = Credentials::new(
            Env::var("WORKSHOP_INTELLIGENCE_KEY").expect("WORKSHOP_INTELLIGENCE_KEY not set"),
            base_url,
        );

        Self {
            credentials,
            prompts: WorkshopPrompts::default(),
        }
    }

    pub async fn create_workshop_summary(
        topic: &Topic,
        state: &AppState,
    ) -> Result<String, HttpError> {
        let posts = Post::find_by_topic_id(topic.topic_id, 1, Some(512), state);

        let messages = vec![
            state.workshop.prompts.summerize.clone(),
            ChatCompletionMessage {
                role: ChatCompletionMessageRole::User,
                content: Some(
                    serde_json::to_string(&json!({
                        "topic_info": topic,
                        "posts": posts.await.map(|(posts, _)| posts).unwrap_or_else(|_| vec![]),
                    }))
                    .unwrap(),
                ),
                name: None,
                function_call: None,
                tool_call_id: None,
                tool_calls: None,
            },
        ];

        let chat_completion =
            ChatCompletion::builder("deepseek/deepseek-r1-0528-qwen3-8b:free", messages.clone())
                .credentials(state.workshop.credentials.clone())
                .create()
                .await?;

        let response = chat_completion.choices.first().unwrap().message.clone();

        Ok(response.content.unwrap_or_default())
    }

    /// Process next message
    ///
    /// Fetches the entire chat history from chat_id upwards and processes it with the LLM
    /// Returns the next message from the LLM
    pub async fn process_next_message(
        chat_id: Uuid,
        message_id: Uuid,
        state: &AppState,
    ) -> Result<(), sqlx::Error> {
        let messages: Vec<ChatCompletionMessage> =
            WorkshopMessage::get_messages_upwards(&message_id, state)
                .await?
                .into_iter()
                .map(|m| m.into())
                .collect();

        info!("Messages: {:?}", messages);

        let mut chat_completion = ChatCompletion::builder("deepseek/deepseek-r1-0528-qwen3-8b:free", messages.clone())
            .credentials(state.workshop.credentials.clone())
            .create_stream()
            .await
            .unwrap();
        
        // create empty message
        let message = WorkshopMessage::create_system_response(&chat_id, Some(message_id), "".to_string(), state).await.map_err(|e| {
            tracing::error!("Error creating message: {:?}", e);
            poem::Error::from_status(StatusCode::INTERNAL_SERVER_ERROR)
        }).unwrap();
    
        let statex = state.clone();
        
        task::spawn(async move {
            let mut data = String::new();

            while let Some(chunk) = chat_completion.recv().await {
            info!("Chunk: {:?}", chunk);
                data.push_str(&chunk.choices.first().unwrap().delta.content.clone().unwrap_or_default());
            }

            info!("Chat completion: {:?}", data);

            WorkshopMessage::update_message_content(&message.message_id, &data, &statex).await.map_err(|e| {
                tracing::error!("Error updating message: {:?}", e);
                poem::Error::from_status(StatusCode::INTERNAL_SERVER_ERROR)
            }).unwrap();

            WorkshopChat::update_last_message(&message.chat_id, &message.message_id, &statex).await.map_err(|e| {
                tracing::error!("Error updating chat: {:?}", e);
                poem::Error::from_status(StatusCode::INTERNAL_SERVER_ERROR)
            }).unwrap();    
        });

        Ok(())
    }
}

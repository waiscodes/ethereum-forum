use figment::providers::Env;
use openai::{
    chat::{ChatCompletion, ChatCompletionMessage, ChatCompletionMessageRole}, Credentials
};
use opentelemetry_http::HttpError;
use serde_json::json;
use tracing::info;
use uuid::Uuid;
use async_std::task;

use crate::{
    models::{
        topics::{Post, Topic},
        workshop::{WorkshopMessage, WorkshopChat},
    }, modules::workshop::prompts::{OngoingPrompt, OngoingPromptManager}, state::AppState
};

pub mod prompts;

pub struct WorkshopService {
    pub credentials: Credentials,
    pub prompts: WorkshopPrompts,
    // Manager for request coalescing of streaming responses
    pub ongoing_prompts: OngoingPromptManager,
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
            ongoing_prompts: OngoingPromptManager::new(),
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
    /// Returns the next message from the LLM using request coalescing
    pub async fn process_next_message(
        chat_id: Uuid,
        message_id: Uuid,
        state: &AppState,
    ) -> Result<(OngoingPrompt, WorkshopMessage), Box<dyn std::error::Error + Send + Sync>> {
        let mut messages: Vec<ChatCompletionMessage> =
            WorkshopMessage::get_messages_upwards(&message_id, state)
                .await?
                .into_iter()
                .map(|m| m.into())
                .collect();

        info!("Messages: {:?}", messages);

        let system_message = ChatCompletionMessage {
            role: ChatCompletionMessageRole::System,
            content: Some(prompts::WORKSHOP_PROMPT.to_string()),
            name: None,
            function_call: None,
            tool_call_id: None,
            tool_calls: None,
        };

        messages.insert(0, system_message);

        // Use chat_id + message_id as the coalescing key
        let key = format!("{}-{}", chat_id, message_id);
        
        // Get or create the ongoing prompt
        let ongoing_prompt = state.workshop.ongoing_prompts
            .get_or_create(key.clone(), state, messages)
            .await?;

        // Create an empty system message for this response
        let system_response = WorkshopMessage::create_system_response(&chat_id, Some(message_id), "".to_string(), state).await?;

        // Also store the ongoing prompt with the system message key for streaming access
        let system_message_key = format!("{}-{}", chat_id, system_response.message_id);
        state.workshop.ongoing_prompts.insert_additional_key(system_message_key.clone(), ongoing_prompt.clone()).await;
        tracing::info!("Also stored ongoing prompt with system key: {}", system_message_key);

        // Spawn a task to handle completion and update the message
        let prompt_clone = ongoing_prompt.clone();
        let state_clone = state.clone();
        let system_response_clone = system_response.clone();
        let system_message_key_clone = system_message_key.clone();
        
        task::spawn(async move {
            match prompt_clone.await_completion().await {
                Ok(content) => {
                    // Update the message content
                    if let Err(e) = WorkshopMessage::update_message_content(&system_response_clone.message_id, &content, &state_clone).await {
                        tracing::error!("Error updating message: {:?}", e);
                    }

                    // Update the chat's last message
                    if let Err(e) = WorkshopChat::update_last_message(&system_response_clone.chat_id, &system_response_clone.message_id, &state_clone).await {
                        tracing::error!("Error updating chat: {:?}", e);
                    }
                },
                Err(e) => {
                    tracing::error!("Error in prompt completion: {:?}", e);
                    // Optionally update the message with an error message
                    if let Err(update_err) = WorkshopMessage::update_message_content(&system_response_clone.message_id, &format!("Error: {}", e), &state_clone).await {
                        tracing::error!("Error updating message with error: {:?}", update_err);
                    }
                }
            }

            // Clean up the system message key after a delay
            task::sleep(std::time::Duration::from_secs(30)).await;
            state_clone.workshop.ongoing_prompts.remove(&system_message_key_clone).await;
            tracing::info!("Cleaned up system message key: {}", system_message_key_clone);
        });

        Ok((ongoing_prompt, system_response))
    }
    
    /// Get an ongoing prompt for streaming (if it exists)
    pub async fn get_ongoing_prompt(&self, chat_id: Uuid, message_id: Uuid) -> Option<OngoingPrompt> {
        let key = format!("{}-{}", chat_id, message_id);
        info!("Getting ongoing prompt for key: {}", key);
        self.ongoing_prompts.get(&key).await
    }
}

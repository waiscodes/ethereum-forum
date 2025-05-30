use figment::{providers::Env};
use openai::{
    Credentials,
    chat::{ChatCompletion, ChatCompletionMessage, ChatCompletionMessageRole},
};
use opentelemetry_http::HttpError;
use serde_json::json;

use crate::{
    models::topics::{Post, Topic},
    state::AppState,
};

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
                    content: Some("You are an expert ethereum magician and are tasked with summarizing threads on the ethereum magicians forum. You will be provided with a thread and you will summarize the thread in a way that is easy to understand for a layman. You will also provide an overview of the stances of the top conversers in the thread, sorted by their stance (pro, against, other). You will also provide a summary of each person's stance.
When evaluating a heated argument ensure to capture all sides and create an overview at the end of our output showcasing the stances of the top conversers. So those who are pro, those who are against, and potentially those with alternative solutions.
Ensure to output the list sorted by overal stance (pro, against, other), and then by person, with a small summary of that persons stance.
Return valid markdown, without any images. You may use simple code snippets.".to_string()),
                    name: None,
                    function_call: None,
                    tool_call_id: None,
                    tool_calls: None,
                }
        }
    }
}

impl WorkshopService {
    pub async fn init() -> Self {
        let credentials = Credentials::new(
            Env::var("WORKSHOP_INTELLIGENCE_KEY").expect("WORKSHOP_INTELLIGENCE_API_KEY not set"),
            Env::var("WORKSHOP_INTELLIGENCE_BASE_URL").expect("WORKSHOP_INTELLIGENCE_BASE_URL not set"),
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
            ChatCompletion::builder("meta-llama/llama-3.3-8b-instruct:free", messages.clone())
                .credentials(state.workshop.credentials.clone())
                .create()
                .await?;

        let response = chat_completion.choices.first().unwrap().message.clone();

        Ok(response.content.unwrap_or_default())
    }
}

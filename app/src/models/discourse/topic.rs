use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct DiscourseTopicResponse {
    pub post_stream: DiscourseTopicPostStream,
    // pub timeline_lookup,
    #[serde(flatten)]
    extra: serde_json::Value, // unknown
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DiscourseTopicPostStream {
    pub posts: Vec<DiscourseTopicPost>,
    #[serde(flatten)]
    pub extra: serde_json::Value, // unknown
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DiscourseTopicPost {
    pub id: i32,
    pub name: String,
    pub username: String,
    pub avatar_template: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub cooked: String,
    pub user_id: i32,
    pub topic_id: i32,
    pub post_url: Option<String>,
    pub post_number: i32,
    #[serde(flatten)]
    pub extra: serde_json::Value, // unknown
}
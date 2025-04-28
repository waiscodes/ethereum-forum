use serde::{Deserialize, Serialize};

pub mod latest;
pub mod topic;

#[derive(Debug, Serialize, Deserialize)]
pub struct DiscourseUser {
    // i32 because system user is `-1`
    id: i32,
    username: String,
    name: Option<String>,
    avatar_template: Option<String>,
    admin: Option<bool>,
    moderator: Option<bool>,
    trust_level: Option<u32>,
    #[serde(flatten)]
    extra: serde_json::Value, // unknown
}

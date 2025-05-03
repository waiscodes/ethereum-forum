use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct DiscourseTopicResponse {
    pub post_stream: DiscourseTopicPostStream,
    // pub timeline_lookup,

    pub id: i32,
    pub title: String,
    // pub fancy_title: String,
    pub slug: String,
    pub posts_count: i32,
    // pub reply_count: u32,
    // pub highest_post_number: u32,
    pub image_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub last_posted_at: DateTime<Utc>,
    // pub archetype: String,
    // pub unseen: bool,
    // pub pinned: bool,
    // pub unpinned: Option<String>, // unknown
    // pub visible: bool,
    // pub closed: bool,
    // pub archived: bool,
    // pub bookmarked: Option<String>, // unknown
    // pub liked: Option<String>, // unknown
    // pub tags: Vec<String>, // Vec<unknown>
    // pub tags_descriptions: serde_json::Value, // unknown
    pub views: i32,
    pub like_count: i32,
    // pub has_summary: bool,
    // pub last_poster_username: String,
    // pub category_id: u32,
    // pub pinned_globally: bool,
    // pub featured_link: Option<String>, // unknown
    // pub posters: Vec<DiscourseLatestTopicPoster>,
    #[serde(flatten)]
    pub extra: serde_json::Value, // unknown
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
    // pub name: String,
    // pub username: String,
    // pub avatar_template: String,
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

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct DiscourseLatestResponse {
    pub users: Vec<DiscourseUser>,
    // primary_groups: serde_json::Value, // Vec<unknown>
    // flair_groups: serde_json::Value, // Vec<unknown>
    pub topic_list: DiscourseLatestTopicList,
    #[serde(flatten)]
    extra: serde_json::Value, // unknown
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DiscourseLatestTopicList {
    can_create_topic: bool,
    more_topics_url: Option<String>, // if None, no more topics to fetch
    per_page: u32,
    top_tags: Vec<String>,
    topics: Vec<DiscourseLatestTopic>,
    #[serde(flatten)]
    extra: serde_json::Value, // unknown
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DiscourseLatestTopic {
    id: u32,
    title: String,
    fancy_title: String,
    slug: String,
    posts_count: u32,
    reply_count: u32,
    highest_post_number: u32,
    image_url: Option<String>,
    created_at: String,
    last_posted_at: String,
    archetype: String,
    unseen: bool,
    pinned: bool,
    unpinned: Option<String>, // unknown
    visible: bool,
    closed: bool,
    archived: bool,
    bookmarked: Option<String>, // unknown
    liked: Option<String>, // unknown
    tags: Vec<String>, // Vec<unknown>
    tags_descriptions: serde_json::Value, // unknown
    views: u32,
    like_count: u32,
    has_summary: bool,
    last_poster_username: String,
    category_id: u32,
    pinned_globally: bool,
    featured_link: Option<String>, // unknown
    posters: Vec<DiscourseLatestTopicPoster>,
    #[serde(flatten)]
    extra: serde_json::Value, // unknown
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DiscourseLatestTopicPoster {
    extras: Option<String>, // unknown
    description: String,
    // i32 because system user is `-1`
    user_id: i32,
    primary_group_id: Option<i32>, // unknown
    flair_group_id: Option<i32>, // unknown
    #[serde(flatten)]
    extra: serde_json::Value, // unknown
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DiscourseUser {
    // i32 because system user is `-1`
    id: i32,
    username: String,
    name: String,
    avatar_template: String,
    admin: Option<bool>,
    moderator: Option<bool>,
    trust_level: Option<u32>,
    #[serde(flatten)]
    extra: serde_json::Value, // unknown
}

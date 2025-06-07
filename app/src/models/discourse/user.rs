use poem_openapi::Object;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Object, Clone)]
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

#[derive(Debug, Serialize, Deserialize, Object, Clone)]
pub struct DiscourseUserSummary {
    likes_given: u32,
    likes_received: u32,
    topics_entered: u32,
    posts_read_count: u32,
    days_visited: u32,
    topic_count: u32,
    post_count: u32,
    time_read: u32,
    recent_time_read: u32,
    can_see_summary_stats: bool,
    can_see_user_actions: bool,
    topic_ids: Vec<u32>,
    replies: Vec<DiscourseReply>,
    links: Vec<DiscourseLink>,
    most_liked_by_users: Vec<DiscourseUserStats>,
    most_liked_users: Vec<DiscourseUserStats>,
    most_replied_to_users: Vec<DiscourseUserStats>,
    badges: Vec<DiscourseUserBadge>,
    top_categories: Vec<DiscourseTopCategory>,
}

#[derive(Debug, Serialize, Deserialize, Object, Clone)]
pub struct DiscourseUserBadge {
    id: u32,
    granted_at: Option<String>, // ISO datetime
    created_at: Option<String>, // ISO datetime
    count: u32,
    badge_id: u32,
    user_id: i32,
    granted_by_id: i32,
}

#[derive(Debug, Serialize, Deserialize, Object, Clone)]
pub struct DiscourseBadge {
    id: u32,
    name: String,
    description: String,
    grant_count: u32,
    allow_title: bool,
    multiple_grant: bool,
    icon: String,
    image_url: Option<String>,
    listable: bool,
    enabled: bool,
    badge_grouping_id: u32,
    system: bool,
    slug: String,
    manually_grantable: bool,
    show_in_post_header: bool,
    badge_type_id: u32,
}

#[derive(Debug, Serialize, Deserialize, Object, Clone)]
pub struct DiscourseBadgeType {
    id: u32,
    name: String,
    sort_order: u32,
}

#[derive(Debug, Serialize, Deserialize, Object, Clone)]
pub struct DiscourseDetailedUser {
    pub id: i32,
    pub username: String,
    name: Option<String>,
    avatar_template: Option<String>,
    last_posted_at: Option<String>,
    last_seen_at: Option<String>,
    created_at: Option<String>,
    ignored: Option<bool>,
    muted: Option<bool>,
    can_ignore_user: Option<bool>,
    can_mute_user: Option<bool>,
    can_send_private_messages: Option<bool>,
    can_send_private_message_to_user: Option<bool>,
    trust_level: Option<u32>,
    moderator: Option<bool>,
    admin: Option<bool>,
    title: Option<String>,
    badge_count: Option<u32>,
    custom_fields: Option<serde_json::Value>,
    time_read: Option<u32>,
    recent_time_read: Option<u32>,
    primary_group_id: Option<u32>,
    primary_group_name: Option<String>,
    flair_group_id: Option<u32>,
    flair_name: Option<String>,
    flair_url: Option<String>,
    flair_bg_color: Option<String>,
    flair_color: Option<String>,
    featured_topic: Option<serde_json::Value>,
    can_edit: Option<bool>,
    can_edit_username: Option<bool>,
    can_edit_email: Option<bool>,
    can_edit_name: Option<bool>,
    uploaded_avatar_id: Option<u32>,
    pending_count: Option<u32>,
    profile_view_count: Option<u32>,
    can_upload_profile_header: Option<bool>,
    can_upload_user_card_background: Option<bool>,
    gravatar_avatar_upload_id: Option<u32>,
    gravatar_avatar_template: Option<String>,
    custom_avatar_upload_id: Option<u32>,
    custom_avatar_template: Option<String>,
    featured_user_badge_ids: Option<Vec<u32>>,
    invited_by: Option<serde_json::Value>,
    groups: Option<Vec<serde_json::Value>>,
    profile_hidden: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Object, Clone)]
pub struct DiscourseUserProfile {
    badges: Option<Vec<DiscourseUserBadge>>,
    badge_types: Option<Vec<DiscourseBadgeType>>,
    users: Option<Vec<DiscourseUser>>,
    pub user: DiscourseDetailedUser,
}

#[derive(Debug, Serialize, Deserialize, Object, Clone)]
pub struct DiscourseTopic {
    id: u32,
    title: String,
    fancy_title: String,
    slug: String,
    posts_count: u32,
    category_id: u32,
    like_count: u32,
    created_at: String, // ISO datetime
}

#[derive(Debug, Serialize, Deserialize, Object, Clone)]
pub struct DiscourseReply {
    post_number: u32,
    like_count: u32,
    created_at: String, // ISO datetime
    topic_id: u32,
}

#[derive(Debug, Serialize, Deserialize, Object, Clone)]
pub struct DiscourseLink {
    url: String,
    title: Option<String>,
    clicks: u32,
    post_number: u32,
    topic_id: u32,
}

#[derive(Debug, Serialize, Deserialize, Object, Clone)]
pub struct DiscourseUserStats {
    id: i32,
    username: String,
    name: Option<String>,
    count: u32,
    avatar_template: String,
    admin: bool,
    moderator: bool,
    trust_level: u32,
    flair_name: Option<String>,
    flair_url: Option<String>,
    flair_bg_color: Option<String>,
    flair_color: Option<String>,
    primary_group_name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Object, Clone)]
pub struct DiscourseTopCategory {
    topic_count: u32,
    post_count: u32,
    id: u32,
    name: String,
    color: String,
    text_color: String,
    slug: String,
    read_restricted: bool,
    parent_category_id: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize, Object, Clone)]
pub struct DiscourseUserSummaryResponse {
    pub topics: Option<Vec<DiscourseTopic>>,
    pub badges: Option<Vec<DiscourseBadge>>,
    pub badge_types: Option<Vec<DiscourseBadgeType>>,
    pub users: Option<Vec<DiscourseUser>>,
    pub user_summary: Option<DiscourseUserSummary>,
}

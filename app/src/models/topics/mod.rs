use chrono::{DateTime, Utc};
use poem_openapi::Object;
use sqlx::{prelude::FromRow, query, query_as};
use serde::{Deserialize, Serialize};

use crate::state::AppState;

use super::discourse::topic::DiscourseTopicPost;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Topic {
    pub topic_id: u32,
    pub title: String,
    pub slug: String,
    pub post_count: u32,
    pub view_count: u32,
    pub like_count: u32,
    pub image_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub last_post_at: Option<DateTime<Utc>>,
    pub bumped_at: Option<DateTime<Utc>>,
    pub extra: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct User {
    pub user_id: u32,
    pub username: String,
    pub name: String,
    pub avatar_template: Option<String>,
    pub trust_level: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Object)]
pub struct Post {
    pub post_id: i32,
    pub topic_id: i32,
    pub user_id: i32,
    pub post_number: i32,
    pub updated_at: Option<DateTime<Utc>>,
    pub cooked: Option<String>,
    pub post_url: Option<String>,
    pub extra: Option<serde_json::Value>,
}

impl Post {
    pub fn from_discourse(post: DiscourseTopicPost) -> Self {
        Self {
            post_id: post.id,
            topic_id: post.topic_id,
            user_id: post.user_id,
            post_number: post.post_number,
            updated_at: Some(post.updated_at),
            cooked: Some(post.cooked),
            post_url: post.post_url,
            extra: Some(post.extra),
        }
    }

    pub async fn upsert(&self, state: &AppState) -> Result<(), sqlx::Error> {
        query!("INSERT INTO posts (post_id, topic_id, user_id, post_number, updated_at, cooked, post_url, extra) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (post_id) DO UPDATE SET post_id=$1, topic_id=$2, user_id=$3, post_number=$4, updated_at = $5, cooked = $6, post_url = $7, extra = $8",
            self.post_id,
            self.topic_id,
            self.user_id,
            self.post_number,
            self.updated_at,
            self.cooked,
            self.post_url,
            self.extra,
        )
        .execute(&state.database.pool)
        .await?;
        Ok(())
    }

    pub async fn find_by_topic_id(topic_id: i32, page: i32, state: &AppState) -> Result<Vec<Self>, sqlx::Error> {
        let offset = (page - 1) * 20;
        let posts = query_as!(
            Self,
            "SELECT * FROM posts WHERE topic_id = $1 ORDER BY post_number ASC LIMIT 20 OFFSET $2",
            topic_id,
            offset as i64
        )
        .fetch_all(&state.database.pool)
        .await?;
        Ok(posts)
    }
}

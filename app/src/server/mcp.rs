use poem::IntoEndpoint;
use poem_mcpserver::{
    McpServer, Tools,
    content::{Json, Text},
    streamable_http,
};

use crate::{
    models::{
        topics::{Post, Topic},
        discourse::user::{DiscourseUserProfile, DiscourseUserSummaryResponse},
    },
    modules::discourse::{ForumSearchDocument, LResult},
    state::AppState,
};

pub struct ForumTools {
    state: AppState,
}

impl ForumTools {
    pub fn new(state: AppState) -> Self {
        Self { state }
    }

    /// Create a standardized error response for Meilisearch operations
    fn create_error_document(
        error_message: String,
        topic_id: Option<i32>,
        user_id: Option<i32>,
        username: Option<String>,
    ) -> ForumSearchDocument {
        ForumSearchDocument {
            entity_type: "error".to_string(),
            topic_id,
            post_id: None,
            post_number: None,
            user_id,
            username,
            title: None,
            slug: None,
            pm_issue: None,
            cooked: Some(error_message),
            entity_id: "error".to_string(),
        }
    }


}

#[Tools]
impl ForumTools {
    /// Get the latest summary for a topic.
    async fn get_topic_summary(&self, topic_id: i32) -> Text<String> {
        match Topic::get_summary_by_topic_id(topic_id, &self.state).await {
            Ok(summary) => Text(summary.summary_text),
            Err(err) => Text(format!("error: {err}")),
        }
    }

    /// Get posts for a topic. Page starts at 1.
    async fn get_posts(
        &self,
        topic_id: i32,
        page: Option<i32>,
        size: Option<i32>,
    ) -> Json<Vec<Post>> {
        let page = page.unwrap_or(1);
        match Post::find_by_topic_id(topic_id, page, size, &self.state).await {
            Ok((posts, _)) => Json(posts),
            Err(err) => Json(vec![Post {
                post_id: -1,
                topic_id,
                user_id: 0,
                post_number: 0,
                updated_at: None,
                created_at: None,
                cooked: Some(format!("error: {err}")),
                post_url: None,
                extra: None,
            }]),
        }
    }

    /// Search forum documents using Meilisearch. Returns both topics and posts matching the query.
    async fn search_forum(
        &self,
        query: String,
        limit: Option<usize>,
        offset: Option<usize>,
    ) -> Json<Vec<ForumSearchDocument>> {
        let Some(meili) = &self.state.meili else {
            return Json(vec![Self::create_error_document(
                "Meilisearch is not configured".to_string(),
                None,
                None,
                None,
            )]);
        };

        let forum = meili.index("forum");
        let limit = limit.unwrap_or(20);
        let offset = offset.unwrap_or(0);

        match forum
            .search()
            .with_query(&query)
            .with_limit(limit)
            .with_offset(offset)
            .execute::<ForumSearchDocument>()
            .await
        {
            Ok(results) => {
                let documents: Vec<ForumSearchDocument> = results.hits.into_iter().map(|hit| hit.result).collect();
                Json(documents)
            }
            Err(err) => {
                Json(vec![Self::create_error_document(
                    format!("search error: {err}"),
                    None,
                    None,
                    None,
                )])
            }
        }
    }

    /// Search only topics using Meilisearch.
    async fn search_topics(
        &self,
        query: String,
        limit: Option<usize>,
        offset: Option<usize>,
    ) -> Json<Vec<ForumSearchDocument>> {
        let Some(meili) = &self.state.meili else {
            return Json(vec![Self::create_error_document(
                "Meilisearch is not configured".to_string(),
                None,
                None,
                None,
            )]);
        };

        let forum = meili.index("forum");
        let limit = limit.unwrap_or(20);
        let offset = offset.unwrap_or(0);

        match forum
            .search()
            .with_query(&query)
            .with_filter("entity_type = topic")
            .with_limit(limit)
            .with_offset(offset)
            .execute::<ForumSearchDocument>()
            .await
        {
            Ok(results) => {
                let documents: Vec<ForumSearchDocument> = results.hits.into_iter().map(|hit| hit.result).collect();
                Json(documents)
            }
            Err(err) => {
                Json(vec![Self::create_error_document(
                    format!("search error: {err}"),
                    None,
                    None,
                    None,
                )])
            }
        }
    }

    /// Search only posts using Meilisearch.
    async fn search_posts(
        &self,
        query: String,
        limit: Option<usize>,
        offset: Option<usize>,
    ) -> Json<Vec<ForumSearchDocument>> {
        let Some(meili) = &self.state.meili else {
            return Json(vec![Self::create_error_document(
                "Meilisearch is not configured".to_string(),
                None,
                None,
                None,
            )]);
        };

        let forum = meili.index("forum");
        let limit = limit.unwrap_or(20);
        let offset = offset.unwrap_or(0);

        match forum
            .search()
            .with_query(&query)
            .with_filter("entity_type = post")
            .with_limit(limit)
            .with_offset(offset)
            .execute::<ForumSearchDocument>()
            .await
        {
            Ok(results) => {
                let documents: Vec<ForumSearchDocument> = results.hits.into_iter().map(|hit| hit.result).collect();
                Json(documents)
            }
            Err(err) => {
                Json(vec![Self::create_error_document(
                    format!("search error: {err}"),
                    None,
                    None,
                    None,
                )])
            }
        }
    }

    /// Search for posts within a specific topic using Meilisearch.
    async fn search_posts_in_topic(
        &self,
        topic_id: i32,
        query: String,
        limit: Option<usize>,
        offset: Option<usize>,
    ) -> Json<Vec<ForumSearchDocument>> {
        let Some(meili) = &self.state.meili else {
            return Json(vec![Self::create_error_document(
                "Meilisearch is not configured".to_string(),
                Some(topic_id),
                None,
                None,
            )]);
        };

        let forum = meili.index("forum");
        let limit = limit.unwrap_or(20);
        let offset = offset.unwrap_or(0);

        let filter = format!("entity_type = post AND topic_id = {}", topic_id);

        match forum
            .search()
            .with_query(&query)
            .with_filter(&filter)
            .with_limit(limit)
            .with_offset(offset)
            .execute::<ForumSearchDocument>()
            .await
        {
            Ok(results) => {
                let documents: Vec<ForumSearchDocument> = results.hits.into_iter().map(|hit| hit.result).collect();
                Json(documents)
            }
            Err(err) => {
                Json(vec![Self::create_error_document(
                    format!("search error: {err}"),
                    Some(topic_id),
                    None,
                    None,
                )])
            }
        }
    }

    /// Search for forum documents by a specific user using Meilisearch.
    async fn search_by_user(
        &self,
        user_id: i32,
        query: Option<String>,
        limit: Option<usize>,
        offset: Option<usize>,
    ) -> Json<Vec<ForumSearchDocument>> {
        let Some(meili) = &self.state.meili else {
            return Json(vec![Self::create_error_document(
                "Meilisearch is not configured".to_string(),
                None,
                Some(user_id),
                None,
            )]);
        };

        let forum = meili.index("forum");
        let limit = limit.unwrap_or(20);
        let offset = offset.unwrap_or(0);

        let filter = format!("user_id = {}", user_id);

        let result = if let Some(q) = query {
            forum
                .search()
                .with_filter(&filter)
                .with_limit(limit)
                .with_offset(offset)
                .with_query(&q)
                .execute::<ForumSearchDocument>()
                .await
        } else {
            forum
                .search()
                .with_filter(&filter)
                .with_limit(limit)
                .with_offset(offset)
                .execute::<ForumSearchDocument>()
                .await
        };

        match result {
            Ok(results) => {
                let documents: Vec<ForumSearchDocument> = results.hits.into_iter().map(|hit| hit.result).collect();
                Json(documents)
            }
            Err(err) => {
                Json(vec![Self::create_error_document(
                    format!("search error: {err}"),
                    None,
                    Some(user_id),
                    None,
                )])
            }
        }
    }

    /// Get user profile information from Discourse by username.
    async fn get_user_profile(&self, username: String) -> Json<Option<DiscourseUserProfile>> {
        match self.state.discourse.fetch_discourse_user_cached(&username).await {
            LResult::Success(profile) => Json(Some(profile)),
            LResult::Failed(_) => Json(None),
        }
    }

    /// Get user summary information from Discourse by username.
    async fn get_user_summary(&self, username: String) -> Json<Option<DiscourseUserSummaryResponse>> {
        match self.state.discourse.fetch_discourse_user_summary_cached(&username).await {
            LResult::Success(summary) => Json(Some(summary)),
            LResult::Failed(_) => Json(None),
        }
    }

    /// Convert username to user ID. Returns the user ID if found, -1 if not found.
    async fn username_to_user_id(&self, username: String) -> Json<i32> {
        match self.state.discourse.fetch_discourse_user_cached(&username).await {
            LResult::Success(profile) => Json(profile.user.id),
            LResult::Failed(_) => Json(-1),
        }
    }

    /// Search for forum documents by username using Meilisearch.
    async fn search_by_username(
        &self,
        username: String,
        query: Option<String>,
        limit: Option<usize>,
        offset: Option<usize>,
    ) -> Json<Vec<ForumSearchDocument>> {
        let Some(meili) = &self.state.meili else {
            return Json(vec![Self::create_error_document(
                "Meilisearch is not configured".to_string(),
                None,
                None,
                Some(username),
            )]);
        };

        let forum = meili.index("forum");
        let limit = limit.unwrap_or(20);
        let offset = offset.unwrap_or(0);

        let filter = format!("username = \"{}\"", username);

        let result = if let Some(q) = query {
            forum
                .search()
                .with_filter(&filter)
                .with_limit(limit)
                .with_offset(offset)
                .with_query(&q)
                .execute::<ForumSearchDocument>()
                .await
        } else {
            forum
                .search()
                .with_filter(&filter)
                .with_limit(limit)
                .with_offset(offset)
                .execute::<ForumSearchDocument>()
                .await
        };

        match result {
            Ok(results) => {
                let documents: Vec<ForumSearchDocument> = results.hits.into_iter().map(|hit| hit.result).collect();
                Json(documents)
            }
            Err(err) => {
                Json(vec![Self::create_error_document(
                    format!("search error: {err}"),
                    None,
                    None,
                    Some(username),
                )])
            }
        }
    }

    /// Convert @username or /u/username format to clean username and search.
    async fn search_by_username_mention(
        &self,
        username_mention: String,
        query: Option<String>,
        limit: Option<usize>,
        offset: Option<usize>,
    ) -> Json<Vec<ForumSearchDocument>> {
        // Clean up the username - handle @username and /u/username formats
        let clean_username = if username_mention.starts_with('@') {
            username_mention.trim_start_matches('@').to_string()
        } else if username_mention.starts_with("/u/") {
            username_mention.trim_start_matches("/u/").to_string()
        } else {
            username_mention
        };

        self.search_by_username(clean_username, query, limit, offset).await
    }
}

pub fn endpoint(state: AppState) -> impl IntoEndpoint {
    streamable_http::endpoint(move |_| McpServer::new().tools(ForumTools::new(state.clone())))
}

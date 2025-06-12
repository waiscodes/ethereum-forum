use poem_openapi::Object;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::state::AppState;

#[derive(Debug, Clone, Serialize, Deserialize, Object)]
pub struct UserUsageStats {
    pub total_prompt_tokens: i64,
    pub total_completion_tokens: i64,
    pub total_tokens: i64,
    pub total_reasoning_tokens: i64,
    pub message_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Object)]
pub struct ModelUsage {
    pub model_name: String,
    pub prompt_tokens: i64,
    pub completion_tokens: i64,
    pub total_tokens: i64,
    pub reasoning_tokens: i64,
    pub message_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Object)]
pub struct DailyUsage {
    pub date: String,
    pub prompt_tokens: i64,
    pub completion_tokens: i64,
    pub total_tokens: i64,
    pub reasoning_tokens: i64,
    pub message_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Object)]
pub struct UserUsageOverview {
    pub user_id: Uuid,
    pub username: Option<String>,
    pub total_tokens: i64,
    pub prompt_tokens: i64,
    pub completion_tokens: i64,
    pub reasoning_tokens: i64,
    pub message_count: i64,
}

/// Get user's overall usage statistics
pub async fn get_user_usage_stats(
    user_id: Uuid,
    state: &AppState,
) -> Result<UserUsageStats, sqlx::Error> {
    let row = sqlx::query!(
            r#"SELECT 
                COALESCE(SUM(prompt_tokens), 0) as total_prompt_tokens,
                COALESCE(SUM(completion_tokens), 0) as total_completion_tokens,
                COALESCE(SUM(total_tokens), 0) as total_tokens,
                COALESCE(SUM(reasoning_tokens), 0) as total_reasoning_tokens,
                COUNT(*) as message_count
            FROM workshop_messages wm
            INNER JOIN workshop_chats wc ON wm.chat_id = wc.chat_id
            WHERE wc.user_id = $1 AND wm.sender_role = 'assistant' AND wm.total_tokens IS NOT NULL"#,
            user_id
        )
        .fetch_one(&state.database.pool)
        .await?;

    Ok(UserUsageStats {
        total_prompt_tokens: row.total_prompt_tokens.unwrap_or(0),
        total_completion_tokens: row.total_completion_tokens.unwrap_or(0),
        total_tokens: row.total_tokens.unwrap_or(0),
        total_reasoning_tokens: row.total_reasoning_tokens.unwrap_or(0),
        message_count: row.message_count.unwrap_or(0),
    })
}

/// Get user's usage by model
pub async fn get_user_usage_by_model(
    user_id: Uuid,
    state: &AppState,
) -> Result<Vec<ModelUsage>, sqlx::Error> {
    let rows = sqlx::query!(
        r#"SELECT 
                COALESCE(model_used, 'unknown') as model_name,
                COALESCE(SUM(prompt_tokens), 0) as prompt_tokens,
                COALESCE(SUM(completion_tokens), 0) as completion_tokens,
                COALESCE(SUM(total_tokens), 0) as total_tokens,
                COALESCE(SUM(reasoning_tokens), 0) as reasoning_tokens,
                COUNT(*) as message_count
            FROM workshop_messages wm
            INNER JOIN workshop_chats wc ON wm.chat_id = wc.chat_id
            WHERE wc.user_id = $1 AND wm.sender_role = 'assistant' AND wm.total_tokens IS NOT NULL
            GROUP BY model_used
            ORDER BY total_tokens DESC"#,
        user_id
    )
    .fetch_all(&state.database.pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(|row| ModelUsage {
            model_name: row.model_name.unwrap_or_else(|| "unknown".to_string()),
            prompt_tokens: row.prompt_tokens.unwrap_or(0),
            completion_tokens: row.completion_tokens.unwrap_or(0),
            total_tokens: row.total_tokens.unwrap_or(0),
            reasoning_tokens: row.reasoning_tokens.unwrap_or(0),
            message_count: row.message_count.unwrap_or(0),
        })
        .collect())
}

/// Get user's daily usage over time
pub async fn get_user_daily_usage(
    user_id: Uuid,
    days: i32,
    state: &AppState,
) -> Result<Vec<DailyUsage>, sqlx::Error> {
    let rows = sqlx::query!(
        r#"SELECT 
                DATE(wm.created_at) as date,
                COALESCE(SUM(prompt_tokens), 0) as prompt_tokens,
                COALESCE(SUM(completion_tokens), 0) as completion_tokens,
                COALESCE(SUM(total_tokens), 0) as total_tokens,
                COALESCE(SUM(reasoning_tokens), 0) as reasoning_tokens,
                COUNT(*) as message_count
            FROM workshop_messages wm
            INNER JOIN workshop_chats wc ON wm.chat_id = wc.chat_id
            WHERE wc.user_id = $1 
                AND wm.sender_role = 'assistant' 
                AND wm.total_tokens IS NOT NULL
                AND wm.created_at >= NOW() - ($2 || ' days')::INTERVAL
            GROUP BY DATE(wm.created_at)
            ORDER BY date DESC"#,
        user_id,
        days.to_string()
    )
    .fetch_all(&state.database.pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(|row| DailyUsage {
            date: row.date.map(|d| d.to_string()).unwrap_or_default(),
            prompt_tokens: row.prompt_tokens.unwrap_or(0),
            completion_tokens: row.completion_tokens.unwrap_or(0),
            total_tokens: row.total_tokens.unwrap_or(0),
            reasoning_tokens: row.reasoning_tokens.unwrap_or(0),
            message_count: row.message_count.unwrap_or(0),
        })
        .collect())
}

/// Get all users' usage overview (admin only)
pub async fn get_all_users_usage_overview(
    state: &AppState,
) -> Result<Vec<UserUsageOverview>, sqlx::Error> {
    let rows = sqlx::query!(
        r#"SELECT 
                wc.user_id,
                u.username,
                COALESCE(SUM(wm.total_tokens), 0) as total_tokens,
                COALESCE(SUM(wm.prompt_tokens), 0) as prompt_tokens,
                COALESCE(SUM(wm.completion_tokens), 0) as completion_tokens,
                COALESCE(SUM(wm.reasoning_tokens), 0) as reasoning_tokens,
                COUNT(wm.*) as message_count
            FROM workshop_chats wc
            LEFT JOIN users u ON wc.user_id = u.user_id
            LEFT JOIN workshop_messages wm ON wc.chat_id = wm.chat_id 
                AND wm.sender_role = 'assistant' 
                AND wm.total_tokens IS NOT NULL
            GROUP BY wc.user_id, u.username
            HAVING COUNT(wm.*) > 0
            ORDER BY total_tokens DESC"#
    )
    .fetch_all(&state.database.pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(|row| UserUsageOverview {
            user_id: row.user_id,
            username: row.username,
            total_tokens: row.total_tokens.unwrap_or(0),
            prompt_tokens: row.prompt_tokens.unwrap_or(0),
            completion_tokens: row.completion_tokens.unwrap_or(0),
            reasoning_tokens: row.reasoning_tokens.unwrap_or(0),
            message_count: row.message_count.unwrap_or(0),
        })
        .collect())
}

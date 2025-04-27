use crate::models::discourse::DiscourseLatestResponse;
use anyhow::Error;

pub async fn fetch_latest_topics() -> Result<DiscourseLatestResponse, Error> {
    let url = "https://ethereum-magicians.org/latest.json";
    let response = reqwest::get(url).await?;
    let body = response.text().await?;
    let parsed: DiscourseLatestResponse = serde_json::from_str(&body)?;
    Ok(parsed)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[async_std::test]
    async fn test_fetch_latest_topics() {
        let result = fetch_latest_topics().await.unwrap();
        // assert!(result.topic_list.topics.len() > 0);

        println!("Active Users: {:?}", result.users.len());
    }
}

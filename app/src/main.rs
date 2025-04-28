use std::sync::Arc;

use anyhow::Error;
use futures::join;
use tracing::info;

pub mod database;
pub mod models;
pub mod modules;
pub mod server;
pub mod state;
pub mod tmp;

#[async_std::main]
pub async fn main() -> Result<(), Error> {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt::init();
    // let topics = modules::discourse::fetch_latest_topics().await?;

    let state = state::AppStateInner::init().await;
    let state = Arc::new(state);

    // use async_std to run both server::start_http and state.discourse.run
    let discourse_state = state.clone();
    let discourse_handle = async_std::task::spawn(async move {
        discourse_state.clone().discourse.run(discourse_state).await;
    });
    let server_handle = async_std::task::spawn(server::start_http(state.clone()));

    // fetch discourse topics
    let topics = modules::discourse::fetch_latest_topics().await?;
    for topic in topics.topic_list.topics {
        info!("Topic ({}): {:?}", topic.id, topic.title);
        state.discourse.enqueue(topic.id, 1).await;
        info!("Queued");
    }

    join!(server_handle, discourse_handle);
    Ok(())
}

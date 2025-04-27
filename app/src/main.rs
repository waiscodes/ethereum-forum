use std::sync::Arc;

use anyhow::Error;

pub mod database;
pub mod models;
pub mod modules;
pub mod server;
pub mod state;
pub mod tmp;

#[async_std::main]
pub async fn main() -> Result<(), Error> {
    dotenvy::dotenv().ok();
    // let topics = modules::discourse::fetch_latest_topics().await?;

    let state = state::AppStateInner::init().await;
    let state = Arc::new(state);

    server::start_http(state).await;
    Ok(())
}

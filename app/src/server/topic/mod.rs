use poem::{Result, web::Data};
use poem_openapi::{Object, OpenApi, payload::Json};
use serde::{Deserialize, Serialize};

use crate::state::AppState;
use crate::server::ApiTags;

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct TopicApi;

#[OpenApi]
impl TopicApi {
    /// /topics
    ///
    /// List topics
    #[oai(path = "/topics", method = "get", tag = "ApiTags::Topic")]
    async fn list(&self, state: Data<&AppState>) -> Result<Json<serde_json::Value>> {
        // let party = Party::create(&user.user_id, state.0).await.map_err(|e| {
        //     tracing::error!("Error creating party: {:?}", e);
        //     poem::Error::from_status(StatusCode::INTERNAL_SERVER_ERROR)
        // })?;

        // Ok(Json(PartyCreateResponse {
        //     id: party.party_id,
        //     created_at: party.created_at.to_rfc3339(),
        // }))
        Ok(Json(serde_json::Value::Null))
    }
}

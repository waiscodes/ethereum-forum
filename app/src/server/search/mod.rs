use poem::{web::Data, Result};
use poem_openapi::{payload::Json, Object, OpenApi};
use serde::{Deserialize, Serialize};
use super::ApiTags;

use crate::state::AppState;

pub struct SearchApi;

#[derive(Clone, Serialize, Deserialize, Object)]
pub struct SearchResponse {

}

#[OpenApi]
impl SearchApi {

    /// /search
    ///
    /// Search everything
    #[oai(path = "/search", method = "get", tag = "ApiTags::Search")]
    async fn search_everything(
        &self,
        _state: Data<&AppState>,
    ) -> Result<Json<SearchResponse>> {
        todo!()
    }
}

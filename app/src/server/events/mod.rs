use poem::{Result, web::Data};
use poem_openapi::{Object, OpenApi, payload::Json};
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};

use crate::models::ical::CalendarEvent;
use crate::modules::ical::ICalConfig;
use crate::server::ApiTags;
use crate::state::AppState;

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct EventsApi;

#[OpenApi]
impl EventsApi {
    /// /events
    ///
    /// List events
    #[oai(path = "/events", method = "get", tag = "ApiTags::Events")]
    async fn list(&self, state: Data<&AppState>) -> Result<Json<Vec<CalendarEvent>>> {
        if let Some(ical) = &state.ical {
            let events = ical.fetch_upcoming(&state).await.unwrap();
            let events = events.iter().take(32).cloned().collect();
            return Ok(Json(events));
        }

        Err(poem::Error::from_status(StatusCode::NOT_IMPLEMENTED))
    }

    /// /events/recent
    ///
    /// List recent events
    #[oai(path = "/events/recent", method = "get", tag = "ApiTags::Events")]
    async fn recent(&self, state: Data<&AppState>) -> Result<Json<Vec<CalendarEvent>>> {
        if let Some(ical) = &state.ical {
            let events = ical.fetch_recent(&state).await.unwrap();
            let events = events.iter().take(32).cloned().collect();
            return Ok(Json(events));
        }

        Err(poem::Error::from_status(StatusCode::NOT_IMPLEMENTED))
    }
}

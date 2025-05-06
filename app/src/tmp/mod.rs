use std::time::Duration;

use moka::future::Cache;

use crate::models::ical::CalendarEvent;
use crate::models::pm::PMData;

pub struct CacheService {
    pub ical_cache: Cache<String, Vec<CalendarEvent>>,
    pub pm_data_cache: Cache<String, PMData>,
}

impl Default for CacheService {
    fn default() -> Self {
        Self {
            ical_cache: Cache::builder().time_to_live(Duration::from_secs(60 * 60)).build(),
            pm_data_cache: Cache::builder().time_to_live(Duration::from_secs(60 * 60)).build(),
        }
    }
}

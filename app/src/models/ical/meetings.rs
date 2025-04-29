use anyhow::Result;
use icalendar::{Event, EventLike};
use poem_openapi::{Object, Union};
use regex::Regex;
use serde::{Deserialize, Serialize};
use tracing::info;

#[derive(Debug, Serialize, Deserialize, Union, Clone, PartialEq, Eq)]
#[oai(discriminator_name = "type")]
pub enum Meeting {
    Zoom(ZoomMeetingData),
}

#[derive(Debug, Serialize, Deserialize, Clone, Object, PartialEq, Eq)]
pub struct ZoomMeetingData {
    pub link: String,
    pub meeting_id: Option<String>,
    pub passcode: Option<String>,
}

pub fn try_parse_meeting(event: &Event, body: &str) -> Result<(String, Vec<Meeting>)> {
    let location = event.get_location();
    let mut meetings = vec![];
    let mut new_body = body.to_string();

    if let Some(location) = location {
        info!("location: {}", location);
        // https://ethereumfoundation.zoom.us/j/87569210985?pwd=3Cv1hDh7If4cq9IMXvNln1CtqQ72MR.1
        let eth_zoom_regex =
            Regex::new(r#"https://ethereumfoundation.zoom.us/j/(\d+)\?pwd=(\w+)"#).unwrap();

        if let Some(captures) = eth_zoom_regex.captures(location) {
            let meeting_id = captures[1].to_string();
            let passcode = captures[2].to_string();

            meetings.push(Meeting::Zoom(ZoomMeetingData {
                link: location.to_string(),
                meeting_id: Some(meeting_id),
                passcode: Some(passcode),
            }));
        }
    }

    // 'Join Zoom Meeting'
    // 'is inviting you to a scheduled Zoom meeting.'
    // 'is inviting you to a scheduled Zoom meeting.'

    let x = new_body.split_once("Join Zoom Meeting");
    if let Some((split_body, body)) = x {
        println!("left todo: {}", body);

        // match the first url in the body
        let link = regex::Regex::new(r#"href="([^"]+?)""#)
            .unwrap()
            .captures(body)
            .map(|m| m[1].to_string());
        let link = link.or(regex::Regex::new(r#"https?://[^\s<]+"#)
            .unwrap()
            .captures(body)
            .map(|m| {
                let url = m[0].to_string();
                if url.ends_with("<br/>") {
                    url[..url.len() - 5].to_string()
                } else {
                    url
                }
            }));

        let zoom_link_regex = Regex::new(r#"https://ethereumfoundation.zoom.us/j/(\d+)\?pwd=(\w+)"#).unwrap();
        
        let (meeting_id, passcode) = match zoom_link_regex.captures(link.as_deref().unwrap_or_default()) {
            Some(captures) => (Some(captures[1].to_string()), Some(captures[2].to_string())),
            None => (None, None),
        };

        new_body = split_body.to_string();
        meetings.push(Meeting::Zoom(ZoomMeetingData {
            link: link.unwrap(),
            meeting_id,
            passcode,
        }));

    }

    meetings.dedup_by(|a, b| a == b);

    if meetings.is_empty() {
        Err(anyhow::anyhow!("No meeting found"))
    } else {
        Ok((new_body, meetings))
    }
}

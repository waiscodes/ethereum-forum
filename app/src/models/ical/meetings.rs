use anyhow::Result;
use poem_openapi::{Object, Union};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Union, Clone)]
#[oai(discriminator_name = "type")]
pub enum Meeting {
    Zoom(ZoomMeetingData),
}

#[derive(Debug, Serialize, Deserialize, Clone, Object)]
pub struct ZoomMeetingData {
    pub link: String,
    pub meeting_id: Option<String>,
    pub passcode: Option<String>,
}

pub fn try_parse_meeting(body: &str) -> Result<(String, Meeting)> {

    // 'Join Zoom Meeting'
    // 'is inviting you to a scheduled Zoom meeting.'
    // 'is inviting you to a scheduled Zoom meeting.'

    let x = body.split_once("Join Zoom Meeting");
    if let Some((new_body, body)) = x {
        println!("left todo: {}", body);

        // match the first url in the body
        let link = regex::Regex::new(r#"href="([^"]+?)""#).unwrap().captures(body).map(|m| m[1].to_string());
        let link = link.or(regex::Regex::new(r#"https?://[^\s<]+"#).unwrap().captures(body).map(|m| {
            let url = m[0].to_string();
            if url.ends_with("<br/>") {
                url[..url.len() - 5].to_string()
            } else {
                url
            }
        }));

        Ok((new_body.to_string(), Meeting::Zoom(ZoomMeetingData {
            link: link.unwrap(),
            meeting_id: None,
            passcode: None,
        })))
    } else {
        Err(anyhow::anyhow!("No meeting found"))
    }
}

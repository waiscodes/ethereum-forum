use async_trait::async_trait;
use poem::IntoResponse;
use poem::web::Html;
use poem::{Endpoint, Request, Response, middleware::Middleware};
use regex::Regex;
use tracing::info;

use crate::models::topics::Topic;
use crate::state::AppState;

#[derive(Clone)]
pub struct OpenGraph {
    state: AppState,
}

impl OpenGraph {
    pub fn new(state: &AppState) -> Self {
        Self {
            state: state.clone(),
        }
    }
}

#[async_trait]
impl<E: Endpoint> Middleware<E> for OpenGraph {
    type Output = OpenGraphMiddlewareImpl<E>;

    fn transform(&self, ep: E) -> Self::Output {
        OpenGraphMiddlewareImpl {
            ep,
            state: self.state.clone(),
        }
    }
}

pub struct OpenGraphMiddlewareImpl<E> {
    ep: E,
    state: AppState,
}

impl<E: Endpoint> Endpoint for OpenGraphMiddlewareImpl<E>
where
    E: Endpoint,
{
    type Output = Response;

    async fn call(&self, req: Request) -> poem::Result<Self::Output> {
        let route = req.uri().to_string();

        info!("OpenGraph request to route: {}", route);

        let mut opengraph_title: Option<String> = None;
        let mut opengraph_description: Option<String> = None;

        if route.starts_with("/t/") {
            let topic_id = route.split("/").nth(2).unwrap_or_default();
            let topic_id = topic_id.parse::<i32>().ok();
            info!("Topic ID: {:?}", topic_id);
            if let Some(topic_id) = topic_id {
                let topic = Topic::get_by_topic_id(topic_id, &self.state).await;
                if let Ok(topic) = topic {
                    //
                    info!("OpenGraph request to topic: {}", topic.title);
                    opengraph_title = Some(topic.title);
                    // opengraph_description = Some(topic.);
                }
            }
        }

        // Process the request normally.
        let x = self.ep.call(req).await?;
        let mut response = x.into_response();

        if let Some(title) = opengraph_title {
            // modify the html in the body of the response such that it has opengraph head tags
            let body = response.take_body();
            let body = body.into_bytes().await.unwrap();
            let body = String::from_utf8(body.to_vec()).unwrap();

            let regex = Regex::new(r#"property="og:title" content="[^"]*?""#).unwrap();
            let body = regex.replace(
                &body,
                &format!("property=\"og:title\" content=\"{}\"", title),
            );

            let regex = Regex::new(r#"property="twitter:title" content="[^"]*?""#).unwrap();
            let body = regex.replace(
                &body,
                &format!("property=\"twitter:title\" content=\"{}\"", title),
            );

            let regex = Regex::new(r#"<title>[^<]*?</title>"#).unwrap();
            let body = regex.replace(&body, &format!("<title>{}</title>", title));

            response = Html(body).into_response();
        }

        Ok(response)
    }
}

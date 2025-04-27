# EIPKB

EIPKB is a lightweight rust tool that indexes the EIPs from the EIPs repository and ethereum-magician's discourse.

## Indexing Strategy

- hit `/latest.json?page=0` to get the latest active topics
  - for each topic in `topic_list.topics` hit the `/t/${topic.id}.json?page=0`
    - for each post index it
    - unsure yet when to stop incrementing the page number, currently until 404 is returned
- repeat until payload does not include `topic_list.more_topics_url`

do this every x amount of minutes
if the topic already exists in our database,
and `bumped_at` and `posted_at` and `posts_count` are the same as when we last index it then skip it.

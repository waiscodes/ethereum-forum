CREATE TABLE IF NOT EXISTS topics (
    topic_id INT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    post_count INT NOT NULL DEFAULT 0,
    view_count INT NOT NULL DEFAULT 0,
    like_count INT NOT NULL DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_post_at TIMESTAMPTZ,
    bumped_at TIMESTAMPTZ,
    extra JSON
);

CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY,
    username TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar_template TEXT,
    trust_level INT
);

CREATE TABLE IF NOT EXISTS posts (
    post_id INT PRIMARY KEY,
    topic_id INT NOT NULL,
    user_id INT NOT NULL,
    updated_at TIMESTAMPTZ,
    cooked TEXT,
    post_url TEXT
);

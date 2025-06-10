-- Add migration script here

-- Add discourse_id column to topics table
ALTER TABLE topics 
ADD COLUMN discourse_id TEXT NOT NULL DEFAULT 'magicians';

-- Add discourse_id column to posts table
ALTER TABLE posts 
ADD COLUMN discourse_id TEXT NOT NULL DEFAULT 'magicians';

-- Add discourse_id column to topic_summaries table
ALTER TABLE topic_summaries 
ADD COLUMN discourse_id TEXT NOT NULL DEFAULT 'magicians';

-- Remove the default values after setting them for existing records
ALTER TABLE topics ALTER COLUMN discourse_id DROP DEFAULT;
ALTER TABLE posts ALTER COLUMN discourse_id DROP DEFAULT;
ALTER TABLE topic_summaries ALTER COLUMN discourse_id DROP DEFAULT;

-- Create composite indexes for proper querying across discourse instances
CREATE INDEX IF NOT EXISTS idx_topics_discourse_topic_id ON topics (discourse_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_posts_discourse_topic_id ON posts (discourse_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_posts_discourse_post_id ON posts (discourse_id, post_id);

-- Drop the old topic_summaries index and create a new composite one
DROP INDEX IF EXISTS idx_topic_summaries_topic_id;
CREATE INDEX IF NOT EXISTS idx_topic_summaries_discourse_topic_id ON topic_summaries (discourse_id, topic_id);

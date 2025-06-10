-- Add unique constraints for ON CONFLICT clauses

-- First, remove any potential duplicates (in case they exist)
-- Delete duplicate topics keeping only the latest one
DELETE FROM topics t1 
USING topics t2 
WHERE t1.discourse_id = t2.discourse_id 
AND t1.topic_id = t2.topic_id 
AND t1.created_at < t2.created_at;

-- Delete duplicate posts keeping only the latest one
DELETE FROM posts p1 
USING posts p2 
WHERE p1.discourse_id = p2.discourse_id 
AND p1.post_id = p2.post_id 
AND p1.created_at < p2.created_at;

-- Add unique constraints to support ON CONFLICT clauses
ALTER TABLE topics ADD CONSTRAINT unique_discourse_topic_id UNIQUE (discourse_id, topic_id);
ALTER TABLE posts ADD CONSTRAINT unique_discourse_post_id UNIQUE (discourse_id, post_id); 
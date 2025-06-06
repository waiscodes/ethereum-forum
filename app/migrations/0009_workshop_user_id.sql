-- Rework workshop user_id to be a UUID
-- Delete existing data since we're changing the type and can't cast integer to UUID
-- First remove foreign key references to avoid constraint violations
UPDATE workshop_chats SET last_message_id = NULL;

-- Now delete data in correct order
DELETE FROM workshop_snapshots;
DELETE FROM workshop_messages;
DELETE FROM workshop_chats;

-- Drop and recreate the user_id columns as UUID type
ALTER TABLE workshop_chats
DROP COLUMN user_id,
ADD COLUMN user_id UUID NOT NULL;

ALTER TABLE workshop_snapshots
DROP COLUMN user_id,
ADD COLUMN user_id UUID NOT NULL;

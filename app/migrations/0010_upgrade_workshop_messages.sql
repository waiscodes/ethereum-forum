-- Add migration script here

-- Add streaming_events column to store rich interaction data from AI completions
ALTER TABLE workshop_messages 
ADD COLUMN streaming_events JSONB DEFAULT NULL;

-- Add index for efficient querying of streaming events
CREATE INDEX idx_workshop_messages_streaming_events ON workshop_messages USING GIN (streaming_events);

-- Add migration script here

-- Add token usage tracking for workshop messages
-- These columns will track the token consumption for AI requests

ALTER TABLE workshop_messages 
ADD COLUMN prompt_tokens INTEGER DEFAULT NULL,
ADD COLUMN completion_tokens INTEGER DEFAULT NULL,
ADD COLUMN total_tokens INTEGER DEFAULT NULL,
ADD COLUMN reasoning_tokens INTEGER DEFAULT NULL,
ADD COLUMN model_used TEXT DEFAULT NULL;

-- Add indexes for efficient querying of token usage
CREATE INDEX idx_workshop_messages_prompt_tokens ON workshop_messages (prompt_tokens) WHERE prompt_tokens IS NOT NULL;
CREATE INDEX idx_workshop_messages_total_tokens ON workshop_messages (total_tokens) WHERE total_tokens IS NOT NULL;
CREATE INDEX idx_workshop_messages_sender_role_tokens ON workshop_messages (sender_role, total_tokens) WHERE total_tokens IS NOT NULL;
CREATE INDEX idx_workshop_messages_model_used ON workshop_messages (model_used) WHERE model_used IS NOT NULL;
CREATE INDEX idx_workshop_messages_model_tokens ON workshop_messages (model_used, total_tokens) WHERE model_used IS NOT NULL AND total_tokens IS NOT NULL;

-- Add comments to document the columns
COMMENT ON COLUMN workshop_messages.prompt_tokens IS 'Number of input tokens used in the request that generated this message (only for assistant messages)';
COMMENT ON COLUMN workshop_messages.completion_tokens IS 'Number of output tokens generated for this message (only for assistant messages)';
COMMENT ON COLUMN workshop_messages.total_tokens IS 'Total tokens used (prompt + completion) for this message (only for assistant messages)';
COMMENT ON COLUMN workshop_messages.reasoning_tokens IS 'Number of reasoning tokens used by models like o1 (only for assistant messages)';
COMMENT ON COLUMN workshop_messages.model_used IS 'AI model name used to generate this message (e.g., "google/gemini-2.5-pro-preview", only for assistant messages)';

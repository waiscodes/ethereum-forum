-- Drop the old users table and create a new one with UUID support and SSO integration
DROP TABLE IF EXISTS users CASCADE;

-- Create the new users table with UUID primary key and SSO support
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core user info
    username TEXT,
    display_name TEXT,
    email TEXT,
    avatar_url TEXT,
    
    -- SSO information
    sso_provider TEXT NOT NULL,
    sso_user_id TEXT NOT NULL,
    
    -- Additional user data
    extras JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMPTZ,
    
    -- Ensure one user per SSO provider/user combination
    UNIQUE(sso_provider, sso_user_id)
);

-- Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create an index on SSO provider and user ID for faster SSO lookups
CREATE INDEX IF NOT EXISTS idx_users_sso ON users(sso_provider, sso_user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update the updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

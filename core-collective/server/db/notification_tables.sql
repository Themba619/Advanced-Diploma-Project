-- Create user_notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'warning', -- warning, info, alert, etc.
    post_title VARCHAR(255), -- related post title if applicable
    reason TEXT, -- reason for warning/notification
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_notifications_email ON user_notifications(user_email);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created ON user_notifications(created_at DESC);

-- Create composite index for user's unread notifications
CREATE INDEX IF NOT EXISTS idx_user_notifications_unread ON user_notifications(user_email, is_read) WHERE is_read = false;
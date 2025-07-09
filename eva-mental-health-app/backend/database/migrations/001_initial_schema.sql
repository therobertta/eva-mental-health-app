-- Eva Mental Health App - Simplified Schema
-- This is a simplified version for demonstration purposes

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP
);

-- Therapeutic profiles
CREATE TABLE therapeutic_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    therapeutic_preferences JSONB DEFAULT '{}',
    vulnerability_comfort_level INTEGER CHECK (vulnerability_comfort_level BETWEEN 1 AND 10),
    primary_framework VARCHAR(50), -- CBT, humanistic, mindfulness, psychodynamic
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    conversation_type VARCHAR(50), -- exploration, check_in, crisis, goal_setting
    primary_framework VARCHAR(50),
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    mood_before JSONB,
    mood_after JSONB,
    status VARCHAR(20) DEFAULT 'active' -- active, completed
);

-- Conversation messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    therapeutic_technique VARCHAR(100),
    emotional_markers JSONB
);

-- Life wheel assessments
CREATE TABLE life_wheel_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assessment_date DATE DEFAULT CURRENT_DATE,
    career_score INTEGER CHECK (career_score BETWEEN 1 AND 10),
    relationships_score INTEGER CHECK (relationships_score BETWEEN 1 AND 10),
    health_score INTEGER CHECK (health_score BETWEEN 1 AND 10),
    personal_growth_score INTEGER CHECK (personal_growth_score BETWEEN 1 AND 10),
    finances_score INTEGER CHECK (finances_score BETWEEN 1 AND 10),
    recreation_score INTEGER CHECK (recreation_score BETWEEN 1 AND 10),
    environment_score INTEGER CHECK (environment_score BETWEEN 1 AND 10),
    contribution_score INTEGER CHECK (contribution_score BETWEEN 1 AND 10),
    priority_areas JSONB
);

-- Feelings wheel entries
CREATE TABLE feelings_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT NOW(),
    primary_emotion VARCHAR(50),
    secondary_emotion VARCHAR(100),
    intensity INTEGER CHECK (intensity BETWEEN 1 AND 10),
    trigger_description TEXT,
    coping_strategy_used VARCHAR(100)
);

-- Goals
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    goal_text TEXT NOT NULL,
    goal_category VARCHAR(100),
    created_date DATE DEFAULT CURRENT_DATE,
    target_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
    progress_notes JSONB DEFAULT '[]'
);

-- Crisis assessments (simplified)
CREATE TABLE crisis_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assessment_timestamp TIMESTAMP DEFAULT NOW(),
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
    risk_factors JSONB,
    intervention_triggered BOOLEAN DEFAULT FALSE
);

-- Create indexes for performance
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_life_wheel_user_date ON life_wheel_assessments(user_id, assessment_date DESC);
CREATE INDEX idx_feelings_user_timestamp ON feelings_entries(user_id, timestamp DESC);
CREATE INDEX idx_crisis_assessments_user ON crisis_assessments(user_id, assessment_timestamp DESC);
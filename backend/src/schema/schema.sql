-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  organization VARCHAR(255),
  role VARCHAR(50) DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'PREMIUM_USER')),
  subscription_status VARCHAR(50) DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium', 'trial')),
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  ai_system_type VARCHAR(255),
  status VARCHAR(50) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessment answers table
CREATE TABLE IF NOT EXISTS assessment_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  domain_id VARCHAR(100) NOT NULL,
  practice_id VARCHAR(100) NOT NULL,
  level VARCHAR(10) NOT NULL CHECK (level IN ('1', '2', '3')),
  stream VARCHAR(10) NOT NULL CHECK (stream IN ('A', 'B')),
  question_index INTEGER NOT NULL,
  value DECIMAL(3,2) NOT NULL CHECK (value >= 0 AND value <= 1),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, domain_id, practice_id, level, stream, question_index)
);

-- AIMA domains table
CREATE TABLE IF NOT EXISTS aima_domains (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AIMA practices table
CREATE TABLE IF NOT EXISTS aima_practices (
  id VARCHAR(100) PRIMARY KEY,
  domain_id VARCHAR(100) NOT NULL REFERENCES aima_domains(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AIMA questions table
CREATE TABLE IF NOT EXISTS aima_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id VARCHAR(100) NOT NULL REFERENCES aima_practices(id) ON DELETE CASCADE,
  level VARCHAR(10) NOT NULL CHECK (level IN ('1', '2', '3')),
  stream VARCHAR(10) NOT NULL CHECK (stream IN ('A', 'B')),
  question_index INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(practice_id, level, stream, question_index)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assessment_answers_project_id ON assessment_answers(project_id);
CREATE INDEX IF NOT EXISTS idx_assessment_answers_domain_practice ON assessment_answers(domain_id, practice_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_aima_questions_practice ON aima_questions(practice_id);

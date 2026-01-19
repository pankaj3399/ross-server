import pool from "../config/database";

export const migrateDatabase = async () => {
  try {
    console.log("Starting database migration...");

    // Check if email_verified column exists
    const emailVerifiedCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'email_verified'
    `);

    if (emailVerifiedCheck.rows.length === 0) {
      console.log("Adding email_verified column to users table...");
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN email_verified BOOLEAN DEFAULT FALSE
      `);
    }

    // Check if mfa_enabled column exists
    const mfaEnabledCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'mfa_enabled'
    `);

    if (mfaEnabledCheck.rows.length === 0) {
      console.log("Adding mfa_enabled column to users table...");
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN mfa_enabled BOOLEAN DEFAULT FALSE
      `);
    }

    // Check if email_verification_tokens table exists
    const emailTokensCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'email_verification_tokens'
    `);

    if (emailTokensCheck.rows.length === 0) {
      await pool.query(`
        CREATE TABLE email_verification_tokens (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          otp VARCHAR(10) UNIQUE NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          used BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Check if password_reset_tokens table exists
    const passwordResetCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'password_reset_tokens'
    `);

    if (passwordResetCheck.rows.length === 0) {
      console.log("Creating password_reset_tokens table...");
      await pool.query(`
        CREATE TABLE password_reset_tokens (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token VARCHAR(255) UNIQUE NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          used BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Check if user_mfa table exists
    const userMfaCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'user_mfa'
    `);

    if (userMfaCheck.rows.length === 0) {
      console.log("Creating user_mfa table...");
      await pool.query(`
        CREATE TABLE user_mfa (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          secret VARCHAR(255),
          backup_codes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Check if temp_mfa_codes table exists
    const tempMfaCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'temp_mfa_codes'
    `);

    if (tempMfaCheck.rows.length === 0) {
      console.log("Creating temp_mfa_codes table...");
      await pool.query(`
        CREATE TABLE temp_mfa_codes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          code VARCHAR(10) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id)
        )
      `);
    }

    // Check if question_notes table exists
    const questionNotesCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'question_notes'
    `);

    if (questionNotesCheck.rows.length === 0) {
      console.log("Creating question_notes table...");
      await pool.query(`
        CREATE TABLE question_notes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          domain_id VARCHAR(100) NOT NULL,
          practice_id VARCHAR(100) NOT NULL,
          level VARCHAR(10) NOT NULL CHECK (level IN ('1', '2', '3')),
          stream VARCHAR(10) NOT NULL CHECK (stream IN ('A', 'B')),
          question_index INTEGER NOT NULL,
          note TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(project_id, domain_id, practice_id, level, stream, question_index)
        )
      `);
    }

    // Create indexes
    console.log("Creating indexes...");
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id)
    `);
    await pool.query(`
      DROP INDEX IF EXISTS idx_email_verification_tokens_token;
      CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_otp ON email_verification_tokens(otp)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_mfa_user_id ON user_mfa(user_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_temp_mfa_codes_user_id ON temp_mfa_codes(user_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_temp_mfa_codes_expires_at ON temp_mfa_codes(expires_at)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_question_notes_project_id ON question_notes(project_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_question_notes_domain_practice ON question_notes(domain_id, practice_id)
    `);

    console.log("✅ Database migration completed successfully!");
  } catch (error) {
    console.error("❌ Error during database migration:", error);
    throw error;
  }
};

// Run the migration if this file is executed directly
if (require.main === module) {
  migrateDatabase()
    .then(() => {
      console.log("Migration completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

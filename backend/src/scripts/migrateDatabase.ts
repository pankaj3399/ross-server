import pool from "../config/database";

// Interface for migration structure
interface Migration {
  version: string;
  name: string;
  up: () => Promise<void>;
}

// Define migrations
const migrations: Migration[] = [
  {
    version: "001",
    name: "initial_setup",
    up: async () => {
      console.log("Running migration 001: initial_setup...");

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

      // Migrate legacy email_verification_tokens schema if needed (token -> otp)
      const otpColumnCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'email_verification_tokens' AND column_name = 'otp'
      `);

      if (otpColumnCheck.rows.length === 0) {
        console.log("Migrating email_verification_tokens table from legacy schema (token -> otp)...");
        
        // Check if token column exists (legacy schema)
        const tokenColumnCheck = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'email_verification_tokens' AND column_name = 'token'
        `);

        if (tokenColumnCheck.rows.length > 0) {
          // Drop old index, rename column, and recreate constraints
          await pool.query(`DROP INDEX IF EXISTS idx_email_verification_tokens_token`);
          await pool.query(`ALTER TABLE email_verification_tokens RENAME COLUMN token TO otp`);
          await pool.query(`ALTER TABLE email_verification_tokens ALTER COLUMN otp TYPE VARCHAR(10)`);
          console.log("✅ Successfully migrated email_verification_tokens to new schema.");
        } else {
          // Table exists but has neither token nor otp column - add otp column
          console.log("Adding otp column to email_verification_tokens table...");
          await pool.query(`ALTER TABLE email_verification_tokens ADD COLUMN otp VARCHAR(10) UNIQUE NOT NULL DEFAULT ''`);
          // Remove default after adding (PostgreSQL requires default for NOT NULL on existing rows)
          await pool.query(`ALTER TABLE email_verification_tokens ALTER COLUMN otp DROP DEFAULT`);
        }
      }

      // Create indexes
      console.log("Creating indexes...");
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id)`);
      
      await pool.query(`DROP INDEX IF EXISTS idx_email_verification_tokens_token`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_otp ON email_verification_tokens(otp)`);
      
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token)`);
      
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_mfa_user_id ON user_mfa(user_id)`);
      
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_temp_mfa_codes_user_id ON temp_mfa_codes(user_id)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_temp_mfa_codes_expires_at ON temp_mfa_codes(expires_at)`);
      
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_question_notes_project_id ON question_notes(project_id)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_question_notes_domain_practice ON question_notes(domain_id, practice_id)`);
    }
  }
];

export const migrateDatabase = async () => {
  try {
    console.log("Starting database migration...");

    // 1. Create migrations tracking table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        version VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Get applied migrations
    const result = await pool.query('SELECT version FROM _migrations');
    const appliedVersions = new Set(result.rows.map(row => row.version));

    // 3. Run pending migrations
    let migrationCount = 0;
    for (const migration of migrations) {
      if (!appliedVersions.has(migration.version)) {
        console.log(`Applying migration ${migration.version}: ${migration.name}...`);
        
        await migration.up();

        await pool.query(
          'INSERT INTO _migrations (version, name) VALUES ($1, $2)',
          [migration.version, migration.name]
        );
        
        console.log(`✅ Migration ${migration.version} applied successfully.`);
        migrationCount++;
      }
    }

    if (migrationCount === 0) {
      console.log("Database is up to date. No new migrations to apply.");
    } else {
      console.log(`✅ Successfully applied ${migrationCount} migrations.`);
    }

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

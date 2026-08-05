/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async (pgm) => {
  await pgm.db.query(`
    CREATE TABLE IF NOT EXISTS password_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_password_history_user_created ON password_history(user_id, created_at DESC);
  `);
};

exports.down = async (pgm) => {
  await pgm.db.query(`
    DROP INDEX IF EXISTS idx_password_history_user_created;
    DROP INDEX IF EXISTS idx_password_history_user_id;
    DROP TABLE IF EXISTS password_history;
  `);
};

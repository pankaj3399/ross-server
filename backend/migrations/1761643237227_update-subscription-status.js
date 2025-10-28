/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // Drop the old check constraint if it exists
  pgm.sql(`
    ALTER TABLE users
    DROP CONSTRAINT IF EXISTS subscription_status_check;
  `);

  // Alter the column to match new enum values
  pgm.sql(`
    ALTER TABLE users
    ALTER COLUMN subscription_status TYPE VARCHAR(50) USING subscription_status::VARCHAR,
    ALTER COLUMN subscription_status SET DEFAULT 'free';
  `);

  // Add new check constraint
  pgm.sql(`
    ALTER TABLE users
    ADD CONSTRAINT subscription_status_check
    CHECK (subscription_status IN ('free', 'basic_premium', 'pro_premium', 'trial'));
  `);
};

exports.down = pgm => {
  // Revert back to the old structure (example: only 'free' and 'premium')
  pgm.sql(`
    ALTER TABLE users
    DROP CONSTRAINT IF EXISTS subscription_status_check;
  `);

  pgm.sql(`
    ALTER TABLE users
    ALTER COLUMN subscription_status TYPE VARCHAR(50) USING subscription_status::VARCHAR,
    ALTER COLUMN subscription_status SET DEFAULT 'free';
  `);

  pgm.sql(`
    ALTER TABLE users
    ADD CONSTRAINT subscription_status_check
    CHECK (subscription_status IN ('free', 'premium'));
  `);
};

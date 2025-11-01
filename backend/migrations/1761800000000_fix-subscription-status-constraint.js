/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // Drop any existing constraints (auto-named and custom-named)
  pgm.sql(`
    ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_subscription_status_check,
    DROP CONSTRAINT IF EXISTS subscription_status_check;
  `);

  // Ensure column type/default are correct (idempotent)
  pgm.sql(`
    ALTER TABLE users
    ALTER COLUMN subscription_status TYPE VARCHAR(50) USING subscription_status::VARCHAR,
    ALTER COLUMN subscription_status SET DEFAULT 'free';
  `);

  // Add a single, consistently named constraint
  pgm.sql(`
    ALTER TABLE users
    ADD CONSTRAINT users_subscription_status_check
    CHECK (subscription_status IN ('free', 'basic_premium', 'pro_premium', 'trial'));
  `);
};

exports.down = pgm => {
  // Revert to the older three-state constraint if needed
  pgm.sql(`
    ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_subscription_status_check,
    DROP CONSTRAINT IF EXISTS subscription_status_check;
  `);

  pgm.sql(`
    ALTER TABLE users
    ALTER COLUMN subscription_status TYPE VARCHAR(50) USING subscription_status::VARCHAR,
    ALTER COLUMN subscription_status SET DEFAULT 'free';
  `);

  pgm.sql(`
    ALTER TABLE users
    ADD CONSTRAINT users_subscription_status_check
    CHECK (subscription_status IN ('free', 'premium', 'trial'));
  `);
};



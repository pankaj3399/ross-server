/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT FALSE;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE users DROP COLUMN IF EXISTS trial_started_at;
    ALTER TABLE users DROP COLUMN IF EXISTS trial_ends_at;
    ALTER TABLE users DROP COLUMN IF EXISTS trial_used;
  `);
};

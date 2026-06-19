/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS free_path_chosen_at TIMESTAMP;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_followup_email_sent BOOLEAN DEFAULT FALSE;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE users DROP COLUMN IF EXISTS free_path_chosen_at;
    ALTER TABLE users DROP COLUMN IF EXISTS premium_followup_email_sent;
  `);
};

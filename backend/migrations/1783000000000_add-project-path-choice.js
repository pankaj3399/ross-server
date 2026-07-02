/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS path_choice VARCHAR(50) CHECK (path_choice IN ('aima', 'premium'));
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE projects DROP COLUMN IF EXISTS path_choice;
  `);
};

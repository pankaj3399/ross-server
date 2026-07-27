/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE crc_assessment_responses 
      ADD COLUMN IF NOT EXISTS evidence_analysis JSONB DEFAULT NULL;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE crc_assessment_responses 
      DROP COLUMN IF EXISTS evidence_analysis;
  `);
};

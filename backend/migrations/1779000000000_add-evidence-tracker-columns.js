/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE crc_assessment_responses 
      ADD COLUMN IF NOT EXISTS evidence_status VARCHAR(25) NOT NULL DEFAULT 'No Evidence',
      ADD COLUMN IF NOT EXISTS evidence_url TEXT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS audit_ready BOOLEAN NOT NULL DEFAULT FALSE;

    -- Drop constraint if exists to allow re-run/idempotency
    ALTER TABLE crc_assessment_responses DROP CONSTRAINT IF EXISTS crc_evidence_status_check;

    ALTER TABLE crc_assessment_responses 
      ADD CONSTRAINT crc_evidence_status_check
      CHECK (evidence_status IN ('No Evidence', 'Template Downloaded', 'Evidence in Progress', 'Evidence Complete'));
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE crc_assessment_responses DROP CONSTRAINT IF EXISTS crc_evidence_status_check;
    ALTER TABLE crc_assessment_responses DROP COLUMN IF EXISTS evidence_status;
    ALTER TABLE crc_assessment_responses DROP COLUMN IF EXISTS evidence_url;
    ALTER TABLE crc_assessment_responses DROP COLUMN IF EXISTS audit_ready;
  `);
};

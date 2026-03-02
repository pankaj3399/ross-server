/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE evaluation_status
    DROP CONSTRAINT IF EXISTS evaluation_status_job_type_check
  `);
  pgm.sql(`
    ALTER TABLE evaluation_status
    ADD CONSTRAINT evaluation_status_job_type_check
    CHECK (job_type IN ('AUTOMATED_API_TEST', 'MANUAL_PROMPT_TEST', 'SECURITY_SCAN'))
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE evaluation_status
    DROP CONSTRAINT IF EXISTS evaluation_status_job_type_check
  `);
  pgm.sql(`
    ALTER TABLE evaluation_status
    ADD CONSTRAINT evaluation_status_job_type_check
    CHECK (job_type IN ('AUTOMATED_API_TEST', 'MANUAL_PROMPT_TEST'))
  `);
};

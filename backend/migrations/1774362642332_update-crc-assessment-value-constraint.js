/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Update check constraint on value to allow 0, 0.5, 1, 2, 3
  // Use ifExists: true and wrapped in sql to be most robust
  pgm.sql(`
    ALTER TABLE "crc_assessment_responses" 
    DROP CONSTRAINT IF EXISTS "crc_assessment_responses_value_check";
    
    ALTER TABLE "crc_assessment_responses" 
    ADD CONSTRAINT "crc_assessment_responses_value_check" 
    CHECK (value IN (0, 0.5, 1, 2, 3));
  `);
};

exports.down = (pgm) => {
  // Revert back to 0, 0.5, 1
  pgm.dropConstraint("crc_assessment_responses", "crc_assessment_responses_value_check");
  pgm.addConstraint("crc_assessment_responses", "crc_assessment_responses_value_check", {
    check: "value IN (0, 0.5, 1)",
  });
};

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Update check constraint on value to allow up to 3.0
  pgm.sql(`
    ALTER TABLE "assessment_answers" 
    DROP CONSTRAINT IF EXISTS "assessment_answers_value_check";
    
    ALTER TABLE "assessment_answers" 
    ADD CONSTRAINT "assessment_answers_value_check" 
    CHECK (value >= 0 AND value <= 3);
  `);
};

exports.down = (pgm) => {
  // Revert back to 0-1 range
  pgm.dropConstraint("assessment_answers", "assessment_answers_value_check", { ifExists: true });
  
  // Delete any rows with values outside the original range (> 1) to prevent constraint violation on re-add
  pgm.sql(`DELETE FROM "assessment_answers" WHERE value > 1`);
  
  pgm.addConstraint("assessment_answers", "assessment_answers_value_check", {
    check: "value >= 0 AND value <= 1",
  });
};

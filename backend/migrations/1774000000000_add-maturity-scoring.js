exports.shorthands = undefined;

exports.up = (pgm) => {
  // Update the value column to allow 0-3 range (maturity scoring)
  // DECIMAL(3,1) allows for one decimal place (e.g., 2.5) if needed for averages, 
  // though individual answers should be 0, 1, 2, or 3.
  pgm.alterColumn('assessment_answers', 'value', {
    type: 'DECIMAL(3,1)',
  });

  // Remove the old constraint (it doesn't have a specific name in schema.sql, 
  // so we might need to be careful or just drop and recreate if we knew the name).
  // In PostgreSQL, we can use a raw SQL command to drop checking constraints if we don't know the name.
  pgm.sql(`
    ALTER TABLE assessment_answers 
    DROP CONSTRAINT IF EXISTS assessment_answers_value_check;
  `);

  // Add the new maturity score constraint
  pgm.addConstraint('assessment_answers', 'assessment_answers_value_check', {
    check: 'value >= 0 AND value <= 3',
  });
};

exports.down = (pgm) => {
  // NOTE: This rollback is destructive as it shrinks scores from [0,3] back to [0,1].
  // Data is normalized by dividing by 3 to preserve relative progress where possible.

  // 1. Remove the 0-3 constraint
  pgm.sql(`
    ALTER TABLE assessment_answers 
    DROP CONSTRAINT IF EXISTS assessment_answers_value_check;
  `);

  // 2. Normalize data back to 0-1 range
  pgm.sql(`
    UPDATE assessment_answers 
    SET value = LEAST(value / 3.0, 1.0);
  `);

  // 3. Revert column type
  pgm.alterColumn('assessment_answers', 'value', {
    type: 'DECIMAL(3,2)',
  });

  // 4. Re-add the original 0-1 constraint
  pgm.addConstraint('assessment_answers', 'assessment_answers_value_check', {
    check: 'value >= 0 AND value <= 1',
  });
};

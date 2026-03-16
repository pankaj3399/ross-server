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
  // Revert to 0-1 range
  pgm.sql(`
    ALTER TABLE assessment_answers 
    DROP CONSTRAINT IF EXISTS assessment_answers_value_check;
  `);

  pgm.addConstraint('assessment_answers', 'assessment_answers_value_check', {
    check: 'value >= 0 AND value <= 1',
  });

  pgm.alterColumn('assessment_answers', 'value', {
    type: 'DECIMAL(3,2)',
  });
};

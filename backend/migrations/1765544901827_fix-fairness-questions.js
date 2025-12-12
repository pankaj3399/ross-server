exports.up = pgm => {
  pgm.sql(`
    UPDATE fairness_questions
    SET prompt = REPLACE(prompt, '—', '-')
  `);
};

exports.down = pgm => {
  pgm.sql(`
    UPDATE fairness_questions
    SET prompt = REPLACE(prompt, '-', '—')
  `);
};

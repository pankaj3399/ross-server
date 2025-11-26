/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.addColumn('aima_questions', {
    description: {
      type: 'text',
      notNull: false
    }
  });
};

exports.down = pgm => {
  pgm.dropColumn('aima_questions', 'description');
};

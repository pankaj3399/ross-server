/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.addColumn('projects', {
    industry: {
      type: 'varchar(255)',
      notNull: false
    }
  });
};

exports.down = pgm => {
  pgm.dropColumn('projects', 'industry');
};

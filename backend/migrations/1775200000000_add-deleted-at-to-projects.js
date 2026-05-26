/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn('projects', {
    deleted_at: { type: 'timestamp', notNull: false },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('projects', 'deleted_at');
};

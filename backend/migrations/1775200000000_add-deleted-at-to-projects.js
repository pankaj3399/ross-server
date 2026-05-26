/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn('projects', {
    deleted_at: { type: 'timestamp', notNull: false },
  });
  pgm.createIndex('projects', 'deleted_at', {
    name: 'projects_deleted_at_not_null_idx',
    where: 'deleted_at IS NOT NULL',
  });
};

exports.down = (pgm) => {
  pgm.dropIndex('projects', 'projects_deleted_at_not_null_idx');
  pgm.dropColumn('projects', 'deleted_at');
};

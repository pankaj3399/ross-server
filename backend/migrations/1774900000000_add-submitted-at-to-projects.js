/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn('projects', {
    submitted_at: { type: 'timestamp', notNull: false },
  });

  // Backfill: existing completed projects use updated_at as their best
  // available submission timestamp so historical reports keep rendering a date.
  pgm.sql(
    `UPDATE projects SET submitted_at = updated_at WHERE status = 'completed' AND submitted_at IS NULL`,
  );
};

exports.down = (pgm) => {
  pgm.dropColumn('projects', 'submitted_at');
};

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Add a tracking column to safely revert only what we change.
  // NOTE: This column is temporary and should be dropped after verification.
  pgm.addColumns("users", {
    backfill_split: { type: "boolean", default: false },
  });

  pgm.sql(`
    UPDATE users 
    SET 
      last_name = TRIM(SUBSTRING(TRIM(name) FROM POSITION(' ' IN TRIM(name)) + 1)),
      name = SUBSTRING(TRIM(name) FROM 1 FOR POSITION(' ' IN TRIM(name)) - 1),
      backfill_split = TRUE
    WHERE last_name IS NULL AND TRIM(name) LIKE '% %';
  `);
};

exports.down = (pgm) => {
  // Revert only rows that were split by this migration
  pgm.sql(`
    UPDATE users 
    SET 
      name = name || ' ' || last_name,
      last_name = NULL
    WHERE backfill_split = TRUE;
  `);

  pgm.dropColumns("users", ["backfill_split"]);
};

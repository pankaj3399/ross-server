/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    UPDATE users 
    SET 
      last_name = SUBSTRING(name FROM POSITION(' ' IN name) + 1),
      name = SUBSTRING(name FROM 1 FOR POSITION(' ' IN name) - 1)
    WHERE last_name IS NULL AND name LIKE '% %';
  `);
};

exports.down = (pgm) => {
  // To reverse, we'd need to concatenate back, but only for those we split.
  // This is tricky without a flag. Since this is a data migration, 
  // we'll just leave it as is for down, or concatenate if both are present.
  pgm.sql(`
    UPDATE users 
    SET 
      name = name || ' ' || last_name,
      last_name = NULL
    WHERE last_name IS NOT NULL;
  `);
};

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async (pgm) => {
  // The original seed migration (1773000000000) inserted all CRC controls with status 'Draft'.
  // The frontend only displays controls with status 'Published', so seeded controls are invisible.
  // This migration publishes all Draft controls that were part of the original seed.
  const result = await pgm.db.query(
    "UPDATE crc_controls SET status = 'Published' WHERE status = 'Draft'"
  );
  const count = result.rowCount || 0;
  console.log(`Published ${count} Draft CRC controls.`);
};

exports.down = async (pgm) => {
  // Revert: set all Published controls back to Draft
  // Note: this is a best-effort revert - it will also affect controls that were manually Published
  const result = await pgm.db.query(
    "UPDATE crc_controls SET status = 'Draft' WHERE status = 'Published'"
  );
  const count = result.rowCount || 0;
  console.log(`Reverted ${count} Published CRC controls back to Draft.`);
};

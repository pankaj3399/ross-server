/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async (pgm) => {
  // The original seed migration (1773000000000) inserted all CRC controls with status 'Draft'
  // and did NOT set created_by. The frontend only displays 'Published' controls.
  // This migration targets ONLY seeded controls (created_by IS NULL) to avoid
  // publishing user-created drafts.

  // 1. Create a tracking table to record which controls this migration changed
  await pgm.db.query(`
    CREATE TABLE IF NOT EXISTS _migration_publish_tracking (
      control_id UUID PRIMARY KEY,
      previous_status VARCHAR(20) NOT NULL,
      migrated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Record the controls we are about to change
  await pgm.db.query(`
    INSERT INTO _migration_publish_tracking (control_id, previous_status)
    SELECT id, status FROM crc_controls
    WHERE status = 'Draft' AND created_by IS NULL
  `);

  // 3. Publish only seeded Draft controls
  const result = await pgm.db.query(
    "UPDATE crc_controls SET status = 'Published' WHERE status = 'Draft' AND created_by IS NULL"
  );
  const count = result.rowCount || 0;
  console.log(`Published ${count} seeded Draft CRC controls.`);
};

exports.down = async (pgm) => {
  // Revert only the controls that this migration specifically changed,
  // using the tracking table to avoid touching other controls.
  const trackingExists = await pgm.db.query(`
    SELECT 1 FROM information_schema.tables
    WHERE table_name = '_migration_publish_tracking'
  `);

  if (trackingExists.rows.length === 0) {
    console.log('Tracking table not found. No rows to revert. Skipping rollback.');
    return;
  }

  const result = await pgm.db.query(`
    UPDATE crc_controls c
    SET status = t.previous_status
    FROM _migration_publish_tracking t
    WHERE c.id = t.control_id
  `);
  const count = result.rowCount || 0;
  console.log(`Reverted ${count} CRC controls back to their previous status.`);

  await pgm.db.query('DROP TABLE IF EXISTS _migration_publish_tracking');
};

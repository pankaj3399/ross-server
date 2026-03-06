/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.sql(`
    DELETE FROM project_invitations a 
    USING project_invitations b 
    WHERE a.project_id = b.project_id 
      AND LOWER(a.email) = LOWER(b.email) 
      AND a.status IN ('pending', 'sent') 
      AND b.status IN ('pending', 'sent') 
      AND a.id < b.id;
  `);

  pgm.sql(`
    CREATE UNIQUE INDEX project_invitations_active_unique
    ON project_invitations (project_id, LOWER(email))
    WHERE status IN ('pending', 'sent')
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.sql(`DROP INDEX IF EXISTS project_invitations_active_unique`);
};

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Drop the old unique constraint that incorrectly blocks multiple manual risks
  // (control_id = NULL) per project due to PostgreSQL 15+ NULLS NOT DISTINCT behavior.
  pgm.dropConstraint("crc_risks", "unique_crc_risk_per_control", { ifExists: true });

  // Replace with a partial unique index that only enforces uniqueness
  // when control_id IS NOT NULL (automated risks). Manual risks (control_id = NULL)
  // are excluded and can have many per project.
  pgm.sql(`
    CREATE UNIQUE INDEX IF NOT EXISTS unique_crc_risk_per_control_partial
    ON crc_risks (project_id, control_id)
    WHERE control_id IS NOT NULL
  `);
};

exports.down = (pgm) => {
  pgm.sql("DROP INDEX IF EXISTS unique_crc_risk_per_control_partial");

  // Restore original constraint
  pgm.sql(`
    ALTER TABLE crc_risks
    ADD CONSTRAINT unique_crc_risk_per_control UNIQUE NULLS NOT DISTINCT (project_id, control_id)
  `);
};

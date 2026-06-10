/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("vendor_assessments", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    project_id: {
      type: "uuid",
      notNull: true,
      references: "projects(id)",
      onDelete: "CASCADE",
    },
    component_id: {
      type: "uuid",
      notNull: true,
      references: "component_inventory(id)",
      onDelete: "CASCADE",
    },
    vendor_name: {
      type: "varchar(255)",
      notNull: true,
    },
    answers: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'{}'::jsonb"),
    },
    score: {
      type: "integer",
      notNull: true,
      default: 0,
    },
    risk_tier: {
      type: "varchar(20)",
      notNull: true,
      default: "Low",
    },
    status: {
      type: "varchar(20)",
      notNull: true,
      default: "In Progress",
    },
    completed_at: {
      type: "timestamp with time zone",
      notNull: false,
    },
    created_at: {
      type: "timestamp with time zone",
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
    updated_at: {
      type: "timestamp with time zone",
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  // Unique constraint per component
  pgm.addConstraint("vendor_assessments", "unique_assessment_per_component", {
    unique: ["component_id"],
  });

  // Indexes for fast lookup
  pgm.createIndex("vendor_assessments", "project_id");
  pgm.createIndex("vendor_assessments", "component_id");

  // Trigger setup for updated_at
  pgm.sql(`
    CREATE OR REPLACE FUNCTION set_vendor_assessments_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  pgm.sql(`
    CREATE TRIGGER trg_set_updated_at_vendor_assessments
    BEFORE UPDATE ON vendor_assessments
    FOR EACH ROW
    EXECUTE PROCEDURE set_vendor_assessments_updated_at();
  `);
};

exports.down = (pgm) => {
  pgm.sql("DROP TRIGGER IF EXISTS trg_set_updated_at_vendor_assessments ON vendor_assessments");
  pgm.sql("DROP FUNCTION IF EXISTS set_vendor_assessments_updated_at()");
  pgm.dropTable("vendor_assessments");
};

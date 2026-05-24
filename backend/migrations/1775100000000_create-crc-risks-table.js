/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Create sequence for Risk ID (Feature 3)
  pgm.sql("CREATE SEQUENCE IF NOT EXISTS crc_risks_seq START WITH 1");

  pgm.createTable("crc_risks", {
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
    control_id: {
      type: "uuid",
      notNull: false, // Changed from true to false for manual risks
      references: "crc_controls(id)",
      onDelete: "CASCADE",
    },
    risk_code: { // New sequential Risk ID column (e.g. CRC-001)
      type: "varchar(20)",
      unique: true,
      notNull: true,
      default: pgm.func("'CRC-' || lpad(nextval('crc_risks_seq')::text, 3, '0')"),
    },
    title: {
      type: "varchar(300)",
      notNull: true,
    },
    category: {
      type: "varchar(100)",
      notNull: true,
    },
    rating: {
      type: "varchar(20)",
      notNull: true,
      check: "rating IN ('Critical', 'High', 'Medium', 'Low')",
    },
    status: {
      type: "varchar(20)",
      notNull: true,
      default: "Open",
      check: "status IN ('Open', 'Closed')",
    },
    description: {
      type: "text",
      default: "",
    },
    mitigation_plan: {
      type: "text",
      default: "",
    },
    owner: {
      type: "varchar(200)",
      default: "",
    },
    target_date: {
      type: "date",
    },
    review_frequency: {
      type: "varchar(50)",
      default: "Quarterly",
    },
    source: {
      type: "varchar(20)",
      notNull: true,
      default: "Automated",
      check: "source IN ('Automated', 'Manual')",
    },
    created_at: {
      type: "timestamp",
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
    updated_at: {
      type: "timestamp",
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  // Unique constraint: one risk per control per project
  pgm.addConstraint("crc_risks", "unique_crc_risk_per_control", {
    unique: ["project_id", "control_id"],
  });

  // Indexes for fast lookups
  pgm.createIndex("crc_risks", "project_id");
  pgm.createIndex("crc_risks", "control_id");
  pgm.createIndex("crc_risks", "rating");
  pgm.createIndex("crc_risks", "status");
  pgm.createIndex("crc_risks", ["project_id", "status"]);

  // Trigger for updated_at
  pgm.sql(`
    CREATE OR REPLACE FUNCTION set_crc_risks_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  pgm.sql(`
    CREATE TRIGGER trg_set_updated_at_crc_risks
    BEFORE UPDATE ON crc_risks
    FOR EACH ROW
    EXECUTE PROCEDURE set_crc_risks_updated_at();
  `);
};

exports.down = (pgm) => {
  pgm.sql("DROP TRIGGER IF EXISTS trg_set_updated_at_crc_risks ON crc_risks");
  pgm.sql("DROP FUNCTION IF EXISTS set_crc_risks_updated_at()");
  pgm.dropTable("crc_risks");
  pgm.sql("DROP SEQUENCE IF EXISTS crc_risks_seq");
};

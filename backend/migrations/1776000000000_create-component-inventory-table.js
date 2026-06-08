/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql("CREATE SEQUENCE IF NOT EXISTS component_inventory_seq START WITH 1");
  pgm.createTable("component_inventory", {
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
      type: "varchar(20)",
      notNull: true,
    },
    component_name: {
      type: "varchar(255)",
      notNull: true,
    },
    component_type: {
      type: "varchar(100)",
      notNull: true,
      check: "component_type IN (" +
        "'Internal Proprietary Model', " +
        "'Closed Foundation Model', " +
        "'Open Source Model', " +
        "'Vector Database', " +
        "'Embedding Model', " +
        "'Cloud AI Service', " +
        "'Agent Framework', " +
        "'Guardrail Tool', " +
        "'Inference Infrastructure', " +
        "'Training Dataset', " +
        "'Validation Dataset', " +
        "'API Service', " +
        "'AI Application UI', " +
        "'Evaluation / Monitoring Tool'" +
        ")",
    },
    provider: {
      type: "varchar(255)",
      notNull: true,
    },
    version: {
      type: "varchar(100)",
      notNull: false,
    },
    role_in_system: {
      type: "text",
      notNull: true,
    },
    data_categories_sent: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'[]'::jsonb"),
    },
    risk_tier: {
      type: "varchar(20)",
      notNull: true,
      check: "risk_tier IN ('Low', 'Medium', 'High', 'Critical')",
    },
    status: {
      type: "varchar(20)",
      notNull: true,
      check: "status IN ('Active', 'Evaluating', 'Deprecated')",
    },
    model_card_url: {
      type: "text",
      notNull: false,
    },
    vendor_compliance_url: {
      type: "text",
      notNull: false,
    },
    dpa_url: {
      type: "text",
      notNull: false,
    },
    notes: {
      type: "text",
      notNull: false,
    },
    vendor_assessment_status: {
      type: "varchar(50)",
      notNull: true,
      default: "Not Run",
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

  // Unique constraint: component_id must be unique per project
  pgm.addConstraint("component_inventory", "unique_component_per_project", {
    unique: ["project_id", "component_id"],
  });

  // Indexes for fast lookup
  pgm.createIndex("component_inventory", "project_id");
  pgm.createIndex("component_inventory", "component_type");
  pgm.createIndex("component_inventory", "provider");
  pgm.createIndex("component_inventory", "risk_tier");
  pgm.createIndex("component_inventory", "status");

  // Trigger for updated_at
  pgm.sql(`
    CREATE OR REPLACE FUNCTION set_component_inventory_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  pgm.sql(`
    CREATE TRIGGER trg_set_updated_at_component_inventory
    BEFORE UPDATE ON component_inventory
    FOR EACH ROW
    EXECUTE PROCEDURE set_component_inventory_updated_at();
  `);
};

exports.down = (pgm) => {
  pgm.sql("DROP TRIGGER IF EXISTS trg_set_updated_at_component_inventory ON component_inventory");
  pgm.sql("DROP FUNCTION IF EXISTS set_component_inventory_updated_at()");
  pgm.dropTable("component_inventory");
  pgm.sql("DROP SEQUENCE IF EXISTS component_inventory_seq");
};

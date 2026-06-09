/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // 1. Create wizard_profiles table
  pgm.createTable("wizard_profiles", {
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
    name: {
      type: "varchar(255)",
      notNull: false,
    },
    description: {
      type: "text",
      notNull: false,
    },
    governance_scope: {
      type: "varchar(50)",
      notNull: false, // nullable as form is completed section-by-section
    },
    use_case: {
      type: "varchar(100)",
      notNull: false,
    },
    regulatory_role: {
      type: "varchar(50)",
      notNull: false,
    },
    data_categories: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'[]'::jsonb"),
    },
    geographic_scope: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'[]'::jsonb"),
    },
    scale: {
      type: "varchar(50)",
      notNull: false,
    },
    uses_third_party_models: {
      type: "varchar(50)",
      notNull: false,
    },
    third_party_providers: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'[]'::jsonb"),
    },
    automation_level: {
      type: "varchar(50)",
      notNull: false,
    },
    existing_certifications: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'[]'::jsonb"),
    },
    annex_iii_domains: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'[]'::jsonb"),
    },
    biometric_use: {
      type: "varchar(100)",
      notNull: false,
    },
    affects_children: {
      type: "varchar(50)",
      notNull: false,
    },
    public_url: {
      type: "text",
      notNull: false,
    },
    wizard_status: {
      type: "varchar(50)",
      notNull: true,
      default: "in_progress",
    },
    wizard_step: {
      type: "integer",
      notNull: true,
      default: 1,
    },
    rules_engine_version: {
      type: "integer",
      notNull: true,
      default: 1,
    },
    completed_at: {
      type: "timestamp",
      notNull: false,
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

  // Make project_id unique in wizard_profiles (one active profile wizard session/config per project)
  pgm.addConstraint("wizard_profiles", "unique_wizard_profile_project", {
    unique: ["project_id"],
  });

  // 2. Create wizard_engine_outputs table
  pgm.createTable("wizard_engine_outputs", {
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
    eu_risk_tier: {
      type: "varchar(50)",
      notNull: false,
    },
    internal_risk_tier: {
      type: "varchar(50)",
      notNull: false,
    },
    eu_risk_reason: {
      type: "text",
      notNull: false,
    },
    applicable_frameworks: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'[]'::jsonb"),
    },
    control_flags: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'{}'::jsonb"),
    },
    suggested_risks: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'[]'::jsonb"),
    },
    suggested_components: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'[]'::jsonb"),
    },
    vulnerability_scope: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'[]'::jsonb"),
    },
    bias_scope: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'[]'::jsonb"),
    },
    template_variables: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'{}'::jsonb"),
    },
    copilot_context: {
      type: "text",
      notNull: false,
    },
    article5_warning: {
      type: "boolean",
      notNull: true,
      default: false,
    },
    article50_note: {
      type: "boolean",
      notNull: true,
      default: false,
    },
    gpai_warning: {
      type: "boolean",
      notNull: true,
      default: false,
    },
    informational_notes: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'[]'::jsonb"),
    },
    applied_at: {
      type: "timestamp",
      notNull: false,
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

  // Make project_id unique in wizard_engine_outputs
  pgm.addConstraint("wizard_engine_outputs", "unique_wizard_output_project", {
    unique: ["project_id"],
  });

  // 3. Create wizard_audit_log table
  pgm.createTable("wizard_audit_log", {
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
    actor_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "CASCADE",
    },
    action: {
      type: "varchar(100)",
      notNull: true,
    },
    diff: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'{}'::jsonb"),
    },
    created_at: {
      type: "timestamp",
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  // 4. Alter projects table to add wizard_completed and wizard_profile_id columns
  pgm.addColumn("projects", {
    wizard_completed: {
      type: "boolean",
      notNull: true,
      default: false,
    },
    wizard_profile_id: {
      type: "uuid",
      notNull: false,
      references: "wizard_profiles(id)",
      onDelete: "SET NULL",
    },
  });

  // Trigger setup for updated_at on wizard_profiles
  pgm.sql(`
    CREATE OR REPLACE FUNCTION set_wizard_profiles_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  pgm.sql(`
    CREATE TRIGGER trg_set_updated_at_wizard_profiles
    BEFORE UPDATE ON wizard_profiles
    FOR EACH ROW
    EXECUTE PROCEDURE set_wizard_profiles_updated_at();
  `);

  // Trigger setup for updated_at on wizard_engine_outputs
  pgm.sql(`
    CREATE OR REPLACE FUNCTION set_wizard_engine_outputs_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  pgm.sql(`
    CREATE TRIGGER trg_set_updated_at_wizard_engine_outputs
    BEFORE UPDATE ON wizard_engine_outputs
    FOR EACH ROW
    EXECUTE PROCEDURE set_wizard_engine_outputs_updated_at();
  `);
};

exports.down = (pgm) => {
  pgm.sql("DROP TRIGGER IF EXISTS trg_set_updated_at_wizard_engine_outputs ON wizard_engine_outputs");
  pgm.sql("DROP FUNCTION IF EXISTS set_wizard_engine_outputs_updated_at()");
  
  pgm.sql("DROP TRIGGER IF EXISTS trg_set_updated_at_wizard_profiles ON wizard_profiles");
  pgm.sql("DROP FUNCTION IF EXISTS set_wizard_profiles_updated_at()");

  pgm.dropColumn("projects", "wizard_profile_id");
  pgm.dropColumn("projects", "wizard_completed");

  pgm.dropTable("wizard_audit_log");
  pgm.dropTable("wizard_engine_outputs");
  pgm.dropTable("wizard_profiles");
};

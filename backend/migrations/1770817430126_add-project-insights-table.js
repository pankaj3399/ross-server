/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createExtension("pgcrypto", { ifNotExists: true });

  pgm.createTable("project_insights", {
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
    domain_id: {
      type: "text",
      notNull: true,
      // References aima_domains(id) logically, but enforcing FK might be tricky if ID is text/slug and not UUID.
      // We'll keep it as text to match usage.
    },
    insight_text: {
      type: "text",
      notNull: true,
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  // Unique constraint to prevent duplicate insights for same domain/project
  pgm.addConstraint("project_insights", "project_insights_project_domain_unique", {
    unique: ["project_id", "domain_id"],
  });

  // Index on project_id for fast lookups
  pgm.createIndex("project_insights", "project_id");
};

exports.down = (pgm) => {
  pgm.dropTable("project_insights");
};

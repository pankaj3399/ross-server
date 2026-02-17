/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createExtension("pgcrypto", { ifNotExists: true });

  // CRC Controls Table
  pgm.createTable("crc_controls", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    control_id: {
      type: "varchar(20)",
      notNull: true,
      unique: true,
    },
    control_title: {
      type: "varchar(200)",
      notNull: true,
    },
    category: {
      type: "varchar(100)",
      notNull: true,
    },
    priority: {
      type: "varchar(20)",
      notNull: true,
    },
    applicable_to: {
      type: "text[]",
      notNull: true,
      default: "{}",
    },
    status: {
      type: "varchar(20)",
      notNull: true,
      default: "Draft",
    },
    version: {
      type: "integer",
      notNull: true,
      default: 1,
    },
    control_statement: { type: "text" },
    control_objective: { type: "text" },
    risk_description: { type: "text" },
    implementation: {
      type: "jsonb",
      default: "{}",
    },
    evidence_requirements: {
      type: "jsonb",
      default: "[]",
    },
    compliance_mapping: {
      type: "jsonb",
      default: "{}",
    },
    aima_mapping: {
      type: "jsonb",
      default: "{}",
    },
    created_by: {
      type: "uuid",
      references: "users(id)",
      onDelete: "SET NULL",
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

  // Indexes for crc_controls
  pgm.createIndex("crc_controls", "category");
  pgm.createIndex("crc_controls", "priority");
  pgm.createIndex("crc_controls", "status");
  pgm.createIndex("crc_controls", "control_id");

  // CRC Control Versions Table
  pgm.createTable("crc_control_versions", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    control_id: {
      type: "uuid",
      notNull: true,
      references: "crc_controls(id)",
      onDelete: "CASCADE",
    },
    version: {
      type: "integer",
      notNull: true,
    },
    snapshot: {
      type: "jsonb",
      notNull: true,
    },
    status_from: { type: "varchar(20)" },
    status_to: { type: "varchar(20)" },
    changed_by: {
      type: "uuid",
      references: "users(id)",
      onDelete: "SET NULL",
    },
    change_note: { type: "text" },
    created_at: {
      type: "timestamp",
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  // Indexes for crc_control_versions
  pgm.createIndex("crc_control_versions", "control_id");
  pgm.createIndex("crc_control_versions", ["control_id", "version"], { unique: true });
};

exports.down = (pgm) => {
  pgm.dropTable("crc_control_versions");
  pgm.dropTable("crc_controls");
};

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("crc_assessment_responses", {
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
      notNull: true,
      references: "crc_controls(id)",
      onDelete: "CASCADE",
    },
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "CASCADE",
    },
    value: {
      type: "numeric(3,1)",
      notNull: true,
      // 0 = No, 0.5 = Partially, 1 = Yes
    },
    notes: {
      type: "text",
      default: "",
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

  // Unique constraint: one response per control per project per user
  pgm.addConstraint("crc_assessment_responses", "unique_crc_response", {
    unique: ["project_id", "control_id", "user_id"],
  });

  // Indexes for fast lookups
  pgm.createIndex("crc_assessment_responses", "project_id");
  pgm.createIndex("crc_assessment_responses", "control_id");
  pgm.createIndex("crc_assessment_responses", "user_id");
  pgm.createIndex("crc_assessment_responses", ["project_id", "user_id"]);
};

exports.down = (pgm) => {
  pgm.dropTable("crc_assessment_responses");
};

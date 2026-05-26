/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("crc_control_templates", {
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
    url: {
      type: "text",
      notNull: true,
    },
    file_key: {
      type: "text",
      notNull: true,
    },
    filename: {
      type: "text",
      notNull: true,
    },
    size: {
      type: "integer",
    },
    updated_at: {
      type: "timestamp",
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  pgm.createIndex("crc_control_templates", "control_id");
};

exports.down = (pgm) => {
  pgm.dropTable("crc_control_templates");
};

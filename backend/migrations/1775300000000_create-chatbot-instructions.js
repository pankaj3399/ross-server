/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("chatbot_instructions", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    title: {
      type: "varchar(255)",
      notNull: true,
    },
    content: {
      type: "text",
      notNull: true,
    },
    is_active: {
      type: "boolean",
      notNull: true,
      default: true,
    },
    category: {
      type: "varchar(100)",
      notNull: true,
      default: "General",
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

  pgm.createIndex("chatbot_instructions", "is_active");
};

exports.down = (pgm) => {
  pgm.dropTable("chatbot_instructions");
};

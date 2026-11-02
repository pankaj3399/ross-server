/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("user_daily_usage", {
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users",
      onDelete: "CASCADE",
    },
    usage_date: {
      type: "date",
      notNull: true,
      default: pgm.func("CURRENT_DATE"),
    },
    message_count: {
      type: "integer",
      notNull: true,
      default: 0,
    },
    created_at: {
      type: "timestamp",
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
    updated_at: {
      type: "timestamp",
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  }, {
    constraints: {
      primaryKey: ["user_id", "usage_date"],
    },
  });

  pgm.createIndex("user_daily_usage", ["usage_date"]);
};

exports.down = (pgm) => {
  pgm.dropTable("user_daily_usage");
};

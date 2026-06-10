/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Add timezone column to users table
  pgm.addColumn("users", {
    timezone: {
      type: "varchar(50)",
      notNull: true,
      default: "UTC",
    },
  });

  // Create notification_preferences table
  pgm.createTable("notification_preferences", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "CASCADE",
      unique: true,
    },
    weekly_digest: {
      type: "boolean",
      notNull: true,
      default: true,
    },
    critical_alerts: {
      type: "boolean",
      notNull: true,
      default: true,
    },
    vendor_reassessment: {
      type: "boolean",
      notNull: true,
      default: true,
    },
    email_undeliverable: {
      type: "boolean",
      notNull: true,
      default: false,
    },
    marketing_emails: {
      type: "boolean",
      notNull: true,
      default: true,
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

  // Create notification_log table
  pgm.createTable("notification_log", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "CASCADE",
    },
    project_id: {
      type: "uuid",
      notNull: false,
      references: "projects(id)",
      onDelete: "CASCADE",
    },
    notification_type: {
      type: "varchar(50)",
      notNull: true,
    },
    subject: {
      type: "varchar(500)",
      notNull: true,
    },
    status: {
      type: "varchar(20)",
      notNull: true,
    },
    metadata: {
      type: "jsonb",
      notNull: false,
    },
    sent_at: {
      type: "timestamp",
      notNull: false,
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  pgm.createIndex("notification_log", "user_id");
  pgm.createIndex("notification_log", ["user_id", "notification_type"]);
  pgm.createIndex("notification_log", ["project_id", "notification_type"]);

  // Create notification_queue table
  pgm.createTable("notification_queue", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "CASCADE",
    },
    project_id: {
      type: "uuid",
      notNull: false,
      references: "projects(id)",
      onDelete: "CASCADE",
    },
    notification_type: {
      type: "varchar(50)",
      notNull: true,
    },
    payload: {
      type: "jsonb",
      notNull: true,
    },
    attempts: {
      type: "integer",
      notNull: true,
      default: 0,
    },
    status: {
      type: "varchar(20)",
      notNull: true,
      default: "pending",
    },
    next_attempt_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  pgm.createIndex("notification_queue", "status");
  pgm.createIndex("notification_queue", "next_attempt_at");

  // Triggers for updated_at on notification_preferences
  pgm.sql(`
    CREATE OR REPLACE FUNCTION set_notification_preferences_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  pgm.sql(`
    CREATE TRIGGER trg_set_updated_at_notification_preferences
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE PROCEDURE set_notification_preferences_updated_at();
  `);
};

exports.down = (pgm) => {
  pgm.sql("DROP TRIGGER IF EXISTS trg_set_updated_at_notification_preferences ON notification_preferences");
  pgm.sql("DROP FUNCTION IF EXISTS set_notification_preferences_updated_at()");
  pgm.dropTable("notification_queue");
  pgm.dropTable("notification_log");
  pgm.dropTable("notification_preferences");
  pgm.dropColumn("users", "timezone");
};

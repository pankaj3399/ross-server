/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createExtension("pgcrypto", { ifNotExists: true });

  // Project members table
  pgm.createTable("project_members", {
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
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "CASCADE",
    },
    role: {
      type: "varchar(20)",
      notNull: true,
    },
    permissions: {
      type: "jsonb",
      notNull: true,
      default: "[]",
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

  pgm.addConstraint("project_members", "project_members_project_user_unique", {
    unique: ["project_id", "user_id"],
  });
  pgm.createIndex("project_members", "project_id");
  pgm.createIndex("project_members", "user_id");

  // Project invitations table
  pgm.createTable("project_invitations", {
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
    inviter_id: {
      type: "uuid",
      references: "users(id)",
      onDelete: "SET NULL",
    },
    email: {
      type: "varchar(255)",
      notNull: true,
    },
    role: {
      type: "varchar(20)",
      notNull: true,
    },
    permissions: {
      type: "jsonb",
      notNull: true,
      default: "[]",
    },
    token: {
      type: "varchar(255)",
      notNull: true,
      unique: true,
    },
    status: {
      type: "varchar(20)",
      notNull: true,
      default: "pending",
    },
    expires_at: {
      type: "timestamp",
      notNull: true,
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

  pgm.createIndex("project_invitations", "email");
  pgm.createIndex("project_invitations", "token");
  pgm.createIndex("project_invitations", "project_id");

  // Comments table
  pgm.createTable("comments", {
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
    author_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "CASCADE",
    },
    object_type: {
      type: "varchar(50)",
      notNull: true,
    },
    object_id: {
      type: "varchar(255)",
      notNull: true,
    },
    body: {
      type: "text",
      notNull: true,
    },
    parent_comment_id: {
      type: "uuid",
      references: "comments(id)",
      onDelete: "CASCADE",
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

  pgm.createIndex("comments", "project_id");
  pgm.createIndex("comments", "author_id");
  pgm.createIndex("comments", ["project_id", "object_type", "object_id"]);

  // Audit logs table
  pgm.createTable("audit_logs", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    project_id: {
      type: "uuid",
      references: "projects(id)",
      onDelete: "SET NULL",
    },
    actor_id: {
      type: "uuid",
      references: "users(id)",
      onDelete: "SET NULL",
    },
    action: {
      type: "varchar(100)",
      notNull: true,
    },
    object_type: {
      type: "varchar(50)",
      notNull: true,
    },
    object_id: {
      type: "varchar(255)",
      notNull: true,
    },
    metadata: {
      type: "jsonb",
      notNull: true,
      default: "{}",
    },
    created_at: {
      type: "timestamp",
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  pgm.createIndex("audit_logs", "project_id");
  pgm.createIndex("audit_logs", "actor_id");
  pgm.createIndex("audit_logs", "created_at");
  pgm.createIndex("audit_logs", ["object_type", "object_id"]);
};

exports.down = (pgm) => {
  pgm.dropTable("audit_logs");
  pgm.dropTable("comments");
  pgm.dropTable("project_invitations");
  pgm.dropTable("project_members");
};


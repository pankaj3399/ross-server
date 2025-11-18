exports.up = (pgm) => {
  pgm.createTable("evaluation_status", {
    id: "id",

    user_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "CASCADE",
    },
    project_id: {
      type: "uuid",
      notNull: true,
      references: "projects(id)",
      onDelete: "CASCADE",
    },

    job_id: { type: "text", notNull: true },
    payload: { type: "jsonb", notNull: true, default: pgm.func("'{}'::jsonb") },
    total_prompts: { type: "integer", notNull: false },

    status: { type: "text", notNull: true, default: "queued" }, // queued | running | completed | failed
    progress: { type: "text", notNull: false }, // e.g. '18/50'
    last_processed_prompt: { type: "text", notNull: false },
    percent: { type: "integer", notNull: true, default: 0 },

    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createIndex("evaluation_status", ["job_id"], { unique: true });
  
    // Auto-update updated_at column
    pgm.sql(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
  
    pgm.sql(`
      CREATE TRIGGER update_evaluation_status_updated_at
      BEFORE UPDATE ON evaluation_status
      FOR EACH ROW
      EXECUTE PROCEDURE update_updated_at_column();
    `);
  };
  
  exports.down = (pgm) => {
    pgm.sql(`DROP TRIGGER IF EXISTS update_evaluation_status_updated_at ON evaluation_status;`);
    pgm.sql(`DROP FUNCTION IF EXISTS update_updated_at_column;`);
    pgm.dropTable("evaluation_status");
  };
  
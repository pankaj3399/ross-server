/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createExtension("pgcrypto", { ifNotExists: true });
  pgm.createTable("api_test_reports", {
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
      notNull: true,
      references: "projects(id)",
      onDelete: "CASCADE",
    },
    job_id: {
      type: "text",
      notNull: true,
      unique: true,
    },
    
    // Test Statistics
    total_prompts: { type: "integer", notNull: true, default: 0 },
    success_count: { type: "integer", notNull: true, default: 0 },
    failure_count: { type: "integer", notNull: true, default: 0 },
    
    // Scores
    average_scores: { 
      type: "jsonb", 
      notNull: true, 
      default: pgm.func("'{}'::jsonb"),
    },
    
    // Detailed Results
    results: { 
      type: "jsonb", 
      notNull: true, 
      default: pgm.func("'[]'::jsonb"),
    },
    errors: { 
      type: "jsonb", 
      notNull: true, 
      default: pgm.func("'[]'::jsonb"),
    },
    
    // Configuration used for the test
    config: { 
      type: "jsonb", 
      notNull: true, 
      default: pgm.func("'{}'::jsonb"),
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

  // Create indexes for performance
  pgm.createIndex("api_test_reports", ["user_id"]);
  pgm.createIndex("api_test_reports", ["project_id"]);
  pgm.createIndex("api_test_reports", ["created_at"]);
  // job_id index is implicitly created by unique constraint, but we can keep explicit if we want specific naming or just rely on unique
  // pgm.createIndex("api_test_reports", ["job_id"]); // Unique constraint creates an index usually

  // Create function to update updated_at timestamp
  pgm.createFunction(
    "update_api_test_reports_updated_at_column",
    [],
    {
      returns: "trigger",
      language: "plpgsql",
    },
    `
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    `
  );

  // Create trigger to automatically update updated_at
  pgm.createTrigger("api_test_reports", "update_api_test_reports_updated_at", {
    when: "BEFORE",
    operation: "UPDATE",
    function: "update_api_test_reports_updated_at_column",
    level: "ROW",
  });

};

exports.down = (pgm) => {
  pgm.dropTrigger("api_test_reports", "update_api_test_reports_updated_at");
  pgm.dropFunction("update_api_test_reports_updated_at_column", []);
  pgm.dropTable("api_test_reports");
};

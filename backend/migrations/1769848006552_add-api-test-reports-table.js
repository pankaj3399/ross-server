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
  pgm.createIndex("api_test_reports", ["job_id"]);
};

exports.down = (pgm) => {
  pgm.dropTable("api_test_reports");
};

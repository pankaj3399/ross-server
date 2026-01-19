/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("dataset_fairness_reports", {
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
    
    // File metadata
    file_name: { type: "varchar(500)", notNull: true },
    file_size: { type: "integer", notNull: true },
    uploaded_at: { type: "timestamp", notNull: true },
    
    // Evaluation results (stored as JSONB for flexibility)
    fairness_data: { type: "jsonb", notNull: true },        // Complete fairness assessment
    fairness_result: { type: "jsonb", notNull: true },      // Score, label, explanation
    biasness_result: { type: "jsonb", notNull: true },      // Score, label, explanation
    toxicity_result: { type: "jsonb", notNull: true },      // Score, label, explanation
    relevance_result: { type: "jsonb", notNull: true },     // Score, label, explanation
    faithfulness_result: { type: "jsonb", notNull: true },  // Score, label, explanation
    
    // Optional: CSV preview data
    csv_preview: { type: "jsonb" },
    
    // Additional metadata
    selections: { type: "jsonb" },
    
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
  pgm.createIndex("dataset_fairness_reports", ["user_id"]);
  pgm.createIndex("dataset_fairness_reports", ["project_id"]);
  pgm.createIndex("dataset_fairness_reports", ["created_at"]);
};

exports.down = (pgm) => {
  pgm.dropTable("dataset_fairness_reports");
};

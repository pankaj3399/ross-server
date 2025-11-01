/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("fairness_evaluations", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    project_id: {
      type: "uuid",
      references: "projects(id)",
      onDelete: "CASCADE",
    },
    user_id: {
      type: "uuid",
      references: "users(id)",
      onDelete: "CASCADE",
      notNull: true,
    },
    version_id: {
      type: "uuid",
      references: "versions(id)",
      onDelete: "SET NULL",
    },

    category: { type: "varchar(100)" },
    question_text: { type: "text", notNull: true },
    user_response: { type: "text", notNull: true },

    bias_score: { type: "decimal(4,3)" },
    toxicity_score: { type: "decimal(4,3)" },
    relevancy_score: { type: "decimal(4,3)" },
    faithfulness_score: { type: "decimal(4,3)" },
    reasoning: { type: "text" },
    verdicts: { type: "jsonb" },

    overall_score: { type: "decimal(4,3)" },
    
    created_at: {
      type: "timestamp",
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  // Add unique constraint to prevent duplicate evaluations for same user, project, category, and question
  pgm.addConstraint("fairness_evaluations", "unique_user_project_category_question", {
    unique: ["project_id", "user_id", "category", "question_text"],
  });

  // Add index on user_id for faster queries
  pgm.createIndex("fairness_evaluations", ["user_id"]);
};

exports.down = (pgm) => {
  pgm.dropTable("fairness_evaluations");
};

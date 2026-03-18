/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // 1. Handle assessment_answers
  // Create backup table
  pgm.createTable("assessment_answers_backup", {
    id: "id",
    project_id: { type: "uuid", notNull: true },
    domain_id: { type: "varchar(255)", notNull: true },
    practice_id: { type: "varchar(255)", notNull: true },
    level: { type: "varchar(50)", notNull: true },
    stream: { type: "varchar(50)", notNull: true },
    question_index: { type: "integer", notNull: true },
    value: { type: "decimal", notNull: true },
    user_id: { type: "uuid", notNull: true },
    created_at: { type: "timestamp", notNull: true },
    updated_at: { type: "timestamp", notNull: true },
  });

  // Preflight report: Count duplicates to be archived
  pgm.sql(`
    DO $$
    DECLARE
      duplicate_count integer;
    BEGIN
      SELECT COUNT(*) INTO duplicate_count
      FROM assessment_answers a
      WHERE a.id NOT IN (
        SELECT id
        FROM (
          SELECT id,
                 ROW_NUMBER() OVER (
                   PARTITION BY project_id, domain_id, practice_id, level, stream, question_index
                   ORDER BY updated_at DESC, created_at DESC, id DESC
                 ) as row_num
          FROM assessment_answers
        ) sub
        WHERE sub.row_num = 1
      );
      RAISE NOTICE 'Archiving % duplicate assessment_answers rows...', duplicate_count;
    END $$;
  `);

  // Archive duplicates
  pgm.sql(`
    INSERT INTO assessment_answers_backup (id, project_id, domain_id, practice_id, level, stream, question_index, value, user_id, created_at, updated_at)
    SELECT id, project_id, domain_id, practice_id, level, stream, question_index, value, user_id, created_at, updated_at
    FROM assessment_answers a
    WHERE a.id NOT IN (
      SELECT id
      FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                 PARTITION BY project_id, domain_id, practice_id, level, stream, question_index
                 ORDER BY updated_at DESC, created_at DESC, id DESC
               ) as row_num
        FROM assessment_answers
      ) sub
      WHERE sub.row_num = 1
    );
  `);

  // Perform the DELETE
  pgm.sql(`
    DELETE FROM assessment_answers
    WHERE id IN (SELECT id FROM assessment_answers_backup);
  `);

  // Drop the old unique constraint (which includes user_id)
  pgm.dropConstraint("assessment_answers", "unique_user_project_question", { ifExists: true });

  // Add the new project-wide unique constraint
  pgm.addConstraint("assessment_answers", "unique_project_question", {
    unique: [
      "project_id",
      "domain_id",
      "practice_id",
      "level",
      "stream",
      "question_index",
    ],
  });

  // 2. Handle crc_assessment_responses
  // Create backup table
  pgm.createTable("crc_assessment_responses_backup", {
    id: "id",
    project_id: { type: "uuid", notNull: true },
    control_id: { type: "uuid", notNull: true },
    user_id: { type: "uuid", notNull: true },
    value: { type: "integer", notNull: true },
    notes: { type: "text" },
    created_at: { type: "timestamp", notNull: true },
    updated_at: { type: "timestamp", notNull: true },
  });

  // Preflight report: Count duplicates to be archived
  pgm.sql(`
    DO $$
    DECLARE
      duplicate_count integer;
    BEGIN
      SELECT COUNT(*) INTO duplicate_count
      FROM crc_assessment_responses r
      WHERE r.id NOT IN (
        SELECT id
        FROM (
          SELECT id,
                 ROW_NUMBER() OVER (
                   PARTITION BY project_id, control_id
                   ORDER BY updated_at DESC, created_at DESC, id DESC
                 ) as row_num
          FROM crc_assessment_responses
        ) sub
        WHERE sub.row_num = 1
      );
      RAISE NOTICE 'Archiving % duplicate crc_assessment_responses rows...', duplicate_count;
    END $$;
  `);

  // Archive duplicates
  pgm.sql(`
    INSERT INTO crc_assessment_responses_backup (id, project_id, control_id, user_id, value, notes, created_at, updated_at)
    SELECT id, project_id, control_id, user_id, value, notes, created_at, updated_at
    FROM crc_assessment_responses r
    WHERE r.id NOT IN (
      SELECT id
      FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                 PARTITION BY project_id, control_id
                 ORDER BY updated_at DESC, created_at DESC, id DESC
               ) as row_num
        FROM crc_assessment_responses
      ) sub
      WHERE sub.row_num = 1
    );
  `);

  // Perform the DELETE
  pgm.sql(`
    DELETE FROM crc_assessment_responses
    WHERE id IN (SELECT id FROM crc_assessment_responses_backup);
  `);

  // Drop the old unique constraint (which includes user_id)
  pgm.dropConstraint("crc_assessment_responses", "unique_crc_response", { ifExists: true });

  // Add the new project-wide unique constraint
  pgm.addConstraint("crc_assessment_responses", "unique_project_control", {
    unique: ["project_id", "control_id"],
  });
};

exports.down = (pgm) => {
  // Restore assessment_answers
  pgm.dropConstraint("assessment_answers", "unique_project_question", { ifExists: true });
  
  // Restore deleted rows from backup if table exists
  pgm.sql(`
    INSERT INTO assessment_answers (id, project_id, domain_id, practice_id, level, stream, question_index, value, user_id, created_at, updated_at)
    SELECT id, project_id, domain_id, practice_id, level, stream, question_index, value, user_id, created_at, updated_at
    FROM assessment_answers_backup
    ON CONFLICT (project_id, domain_id, practice_id, level, stream, question_index, user_id)
    DO UPDATE SET (id, value, created_at, updated_at) = (EXCLUDED.id, EXCLUDED.value, EXCLUDED.created_at, EXCLUDED.updated_at);
  `);

  pgm.addConstraint("assessment_answers", "unique_user_project_question", {
    unique: [
      "project_id",
      "domain_id",
      "practice_id",
      "level",
      "stream",
      "question_index",
      "user_id",
    ],
  });

  // Restore crc_assessment_responses
  pgm.dropConstraint("crc_assessment_responses", "unique_project_control", { ifExists: true });

  // Restore deleted rows from backup
  pgm.sql(`
    INSERT INTO crc_assessment_responses (id, project_id, control_id, user_id, value, notes, created_at, updated_at)
    SELECT id, project_id, control_id, user_id, value, notes, created_at, updated_at
    FROM crc_assessment_responses_backup
    ON CONFLICT (project_id, control_id, user_id)
    DO UPDATE SET (id, value, notes, created_at, updated_at) = (EXCLUDED.id, EXCLUDED.value, EXCLUDED.notes, EXCLUDED.created_at, EXCLUDED.updated_at);
  `);

  pgm.addConstraint("crc_assessment_responses", "unique_crc_response", {
    unique: ["project_id", "control_id", "user_id"],
  });

  // Drop backup tables
  pgm.dropTable("assessment_answers_backup", { ifExists: true });
  pgm.dropTable("crc_assessment_responses_backup", { ifExists: true });
};

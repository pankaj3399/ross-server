/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // 1. Handle assessment_answers
  // Deduplicate: Keep the most recent answer for each project/question
  pgm.sql(`
    DELETE FROM assessment_answers a
    WHERE a.id NOT IN (
      SELECT id
      FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                 PARTITION BY project_id, domain_id, practice_id, level, stream, question_index
                 ORDER BY updated_at DESC, created_at DESC
               ) as row_num
        FROM assessment_answers
      ) sub
      WHERE sub.row_num = 1
    );
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
  // Deduplicate: Keep the most recent response for each project/control
  pgm.sql(`
    DELETE FROM crc_assessment_responses r
    WHERE r.id NOT IN (
      SELECT id
      FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                 PARTITION BY project_id, control_id
                 ORDER BY updated_at DESC, created_at DESC
               ) as row_num
        FROM crc_assessment_responses
      ) sub
      WHERE sub.row_num = 1
    );
  `);

  // Drop the old unique constraint (which includes user_id)
  pgm.dropConstraint("crc_assessment_responses", "unique_crc_response", { ifExists: true });

  // Add the new project-wide unique constraint
  pgm.addConstraint("crc_assessment_responses", "unique_project_control", {
    unique: ["project_id", "control_id"],
  });
};

exports.down = (pgm) => {
  // assessment_answers
  pgm.dropConstraint("assessment_answers", "unique_project_question", { ifExists: true });
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

  // crc_assessment_responses
  pgm.dropConstraint("crc_assessment_responses", "unique_project_control", { ifExists: true });
  pgm.addConstraint("crc_assessment_responses", "unique_crc_response", {
    unique: ["project_id", "control_id", "user_id"],
  });
};

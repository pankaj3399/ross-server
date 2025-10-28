exports.up = (pgm) => {
    // Add user_id column
    pgm.addColumn('assessment_answers', {
        user_id: {
            type: 'uuid',
            notNull: true,
            references: 'users(id)',
            onDelete: 'CASCADE',
        },
    });

    // Drop the old unique constraint safely if it exists
    pgm.dropConstraint(
        'assessment_answers',
        'assessment_answers_project_id_domain_id_practice_id_level_stream_question_index_key',
        { ifExists: true }
    );

    // Create a new unique constraint including user_id
    pgm.addConstraint('assessment_answers', 'unique_user_project_question', {
        unique: [
            'project_id',
            'domain_id',
            'practice_id',
            'level',
            'stream',
            'question_index',
            'user_id'
        ],
    });

    // Add an index on user_id for faster queries
    pgm.createIndex('assessment_answers', ['user_id']);
};

exports.down = (pgm) => {
    // Drop the unique constraint including user_id
    pgm.dropConstraint('assessment_answers', 'unique_user_project_question');

    // Restore the old unique constraint without user_id
    pgm.addConstraint(
        'assessment_answers',
        'assessment_answers_project_id_domain_id_practice_id_level_stream_question_index_key',
        {
            unique: [
                'project_id',
                'domain_id',
                'practice_id',
                'level',
                'stream',
                'question_index'
            ],
        }
    );

    // Drop the user_id column
    pgm.dropColumn('assessment_answers', 'user_id', { ifExists: true });
};
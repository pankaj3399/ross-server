exports.up = (pgm) => {
    pgm.createTable('scores', {
        id: {
            type: 'uuid',
            primaryKey: true,
            default: pgm.func('gen_random_uuid()'),
        },
        user_id: {
            type: 'uuid',
            notNull: true,
            references: 'users(id)',
            onDelete: 'CASCADE',
        },
        project_id: {
            type: 'uuid',
            notNull: true,
            references: 'projects(id)',
            onDelete: 'CASCADE',
        },
        total_score: {
            type: 'numeric',
            notNull: true,
            default: 0,
        },
        created_at: {
            type: 'timestamp',
            default: pgm.func('CURRENT_TIMESTAMP'),
        },
        updated_at: {
            type: 'timestamp',
            default: pgm.func('CURRENT_TIMESTAMP'),
        },
    });

    // Ensure one score per (user, project)
    pgm.addConstraint('scores', 'unique_user_project', {
        unique: ['user_id', 'project_id'],
    });

    // Indexes for performance
    pgm.createIndex('scores', ['user_id']);
    pgm.createIndex('scores', ['project_id']);
};

exports.down = (pgm) => {
    pgm.dropTable('scores');
};

/* eslint-disable camelcase */
exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createTable('fairness_questions', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    label: {
      type: 'varchar(255)',
      notNull: true,
    },
    prompt: {
      type: 'text',
      notNull: true,
    },
    version_id: {
      type: 'uuid',
      references: '"versions"',
      onDelete: 'SET NULL',
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  pgm.createIndex('fairness_questions', 'label');
  pgm.createIndex('fairness_questions', 'version_id');
};

exports.down = pgm => {
  pgm.dropTable('fairness_questions');
};

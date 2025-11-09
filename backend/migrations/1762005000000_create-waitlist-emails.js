/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('waitlist_emails', {
    id: 'id',
    email: { type: 'text', notNull: true },
    source: { type: 'text' },
    user_agent: { type: 'text' },
    ip: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addConstraint('waitlist_emails', 'waitlist_emails_email_unique', {
    unique: ['email'],
  });
};

exports.down = (pgm) => {
  pgm.dropTable('waitlist_emails');
};


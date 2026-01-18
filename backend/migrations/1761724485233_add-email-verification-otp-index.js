/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // Create new index on otp column
  pgm.createIndex('email_verification_tokens', 'otp', {
    name: 'idx_email_verification_tokens_otp',
    ifNotExists: true
  });

  pgm.dropIndex('email_verification_tokens', 'token', { ifExists: true });
};

exports.down = pgm => {
  pgm.dropIndex('email_verification_tokens', 'otp', {
    ifExists: true,
    name: 'idx_email_verification_tokens_otp'
  });

  pgm.createIndex('email_verification_tokens', 'token', {
    name: 'idx_email_verification_tokens_token',
    ifNotExists: true
  });
};

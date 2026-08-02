exports.up = (pgm) => {
  // Fix timestamp columns to use TIMESTAMPTZ to prevent timezone mismatch
  // between Node.js (UTC) and PostgreSQL server timezone.
  pgm.alterColumn('email_verification_tokens', 'expires_at', {
    type: 'TIMESTAMPTZ',
    using: "expires_at AT TIME ZONE 'UTC'",
  });
  pgm.alterColumn('email_verification_tokens', 'created_at', {
    type: 'TIMESTAMPTZ',
    using: "created_at AT TIME ZONE 'UTC'",
  });
};

exports.down = (pgm) => {
  pgm.alterColumn('email_verification_tokens', 'expires_at', {
    type: 'TIMESTAMP',
    using: "expires_at AT TIME ZONE 'UTC'",
  });
  pgm.alterColumn('email_verification_tokens', 'created_at', {
    type: 'TIMESTAMP',
    using: "created_at AT TIME ZONE 'UTC'",
  });
};

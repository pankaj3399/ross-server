exports.up = (pgm) => {
  // Fix timestamp columns to use TIMESTAMPTZ to prevent timezone mismatch
  // between Node.js (UTC) and PostgreSQL server timezone.
  // This was causing OTPs to appear expired immediately on Vercel.
  pgm.alterColumn('email_verification_tokens', 'expires_at', {
    type: 'TIMESTAMPTZ',
  });
  pgm.alterColumn('email_verification_tokens', 'created_at', {
    type: 'TIMESTAMPTZ',
  });
};

exports.down = (pgm) => {
  pgm.alterColumn('email_verification_tokens', 'expires_at', {
    type: 'TIMESTAMP',
  });
  pgm.alterColumn('email_verification_tokens', 'created_at', {
    type: 'TIMESTAMP',
  });
};

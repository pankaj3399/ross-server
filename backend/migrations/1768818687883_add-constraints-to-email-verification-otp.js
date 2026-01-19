
export const shorthands = undefined;

export const up = (pgm) => {
  // First, delete any rows with null/empty otp values (cleanup)
  pgm.sql(`DELETE FROM email_verification_tokens WHERE otp IS NULL OR otp = ''`);

  // Remove duplicate OTPs per user (keep the newest row per user+otp combo)
  pgm.sql(`
    DELETE FROM email_verification_tokens t
    USING email_verification_tokens d
    WHERE t.id < d.id 
      AND t.user_id = d.user_id 
      AND t.otp = d.otp
  `);

  // Set NOT NULL constraint
  pgm.alterColumn('email_verification_tokens', 'otp', {
    notNull: true
  });

  // Add scoped UNIQUE constraint on (user_id, otp) to prevent OTP reuse per user
  // but allow same OTP across different users (which is fine for 6-digit codes)
  pgm.addConstraint('email_verification_tokens', 'email_verification_tokens_user_otp_unique', {
    unique: ['user_id', 'otp']
  });
};

export const down = (pgm) => {
  // Remove scoped constraint
  pgm.dropConstraint('email_verification_tokens', 'email_verification_tokens_user_otp_unique', {
    ifExists: true
  });

  // Remove NOT NULL constraint
  pgm.alterColumn('email_verification_tokens', 'otp', {
    notNull: false
  });
};

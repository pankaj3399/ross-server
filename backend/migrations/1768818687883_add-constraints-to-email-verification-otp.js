
export const shorthands = undefined;

export const up = (pgm) => {
  // Add NOT NULL constraint to otp column
  // First, delete any rows with null otp values (cleanup)
  pgm.sql(`DELETE FROM email_verification_tokens WHERE otp IS NULL OR otp = ''`);
  
  // Set NOT NULL constraint
  pgm.alterColumn('email_verification_tokens', 'otp', {
    notNull: true
  });
  
  // Add UNIQUE constraint
  pgm.addConstraint('email_verification_tokens', 'email_verification_tokens_otp_unique', {
    unique: 'otp'
  });
};

export const down = (pgm) => {
  // Remove UNIQUE constraint
  pgm.dropConstraint('email_verification_tokens', 'email_verification_tokens_otp_unique', {
    ifExists: true
  });
  
  // Remove NOT NULL constraint
  pgm.alterColumn('email_verification_tokens', 'otp', {
    notNull: false
  });
};

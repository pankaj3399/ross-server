export const up = (pgm) => {
    pgm.addColumn('email_verification_tokens', {
        otp: { type: 'varchar(10)', ifNotExists: true },
    });
    pgm.dropColumn('email_verification_tokens', 'token', { ifExists: true });
};

export const down = (pgm) => {
    pgm.dropColumn('email_verification_tokens', 'otp', { ifExists: true });
    pgm.addColumn('email_verification_tokens', {
        token: { type: 'varchar(255)', ifNotExists: true },
    });
};

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // lpad(..., 3, '0') truncates once the sequence exceeds 999
  // (e.g. 1000 -> "100" -> CRC-100 collision). Drop padding entirely.
  pgm.sql(`
    ALTER TABLE crc_risks
    ALTER COLUMN risk_code
    SET DEFAULT ('CRC-' || nextval('crc_risks_seq')::text)
  `);

  // Align sequence with the highest numeric risk_code so the next insert
  // continues from max+1 (avoids reusing truncated/colliding values).
  pgm.sql(`
    SELECT setval(
      'crc_risks_seq',
      GREATEST(
        1,
        COALESCE(
          (SELECT MAX(NULLIF(regexp_replace(risk_code, '[^0-9]', '', 'g'), '')::bigint)
           FROM crc_risks),
          0
        )
      ),
      true
    )
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE crc_risks
    ALTER COLUMN risk_code
    SET DEFAULT ('CRC-' || lpad(nextval('crc_risks_seq')::text, 3, '0'))
  `);
};

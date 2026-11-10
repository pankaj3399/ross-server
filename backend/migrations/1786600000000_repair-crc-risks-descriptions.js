/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // 1. Repair existing crc_risks records that inherited legacy 'Maps to:%' text
  pgm.sql(`
    UPDATE crc_risks r
    SET description = c.risk_description,
        category = COALESCE(cat.name, r.category),
        updated_at = CURRENT_TIMESTAMP
    FROM crc_controls c
    LEFT JOIN crc_categories cat ON c.category_id = cat.id
    WHERE r.control_id = c.id
      AND (
        r.description LIKE 'Maps to:%' 
        OR r.description IS NULL 
        OR r.description = ''
      );
  `);

  // 2. Refresh any remaining generic 'Maps to:' risks
  pgm.sql(`
    UPDATE crc_risks
    SET description = 'Failure to effectively implement control exposes the organization to compliance violations, operational vulnerability, and regulatory non-alignment.'
    WHERE description LIKE 'Maps to:%';
  `);

  pgm.sql(`NOTIFY pgrst, 'reload schema';`);
};

exports.down = (pgm) => {
  // Down migration leaves normalized risk descriptions in place
};

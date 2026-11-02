/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // 1. Where risk_description has 'Maps to:%' and aima_mapping is missing/empty, populate aima_mapping
  pgm.sql(`
    UPDATE crc_controls
    SET aima_mapping = jsonb_build_object(
      'domain', TRIM(COALESCE((regexp_match(risk_description, 'Maps to:\\s*([^-\\n]+)\\s*-\\s*([^\\.\\(\\n]+)'))[1], '')),
      'area', TRIM(COALESCE((regexp_match(risk_description, 'Maps to:\\s*([^-\\n]+)\\s*-\\s*([^\\.\\(\\n]+)'))[2], '')),
      'maturity_enhancement', TRIM(COALESCE((regexp_match(risk_description, 'Maturity Enhancement:\\s*([^\\n]+)'))[1], ''))
    )
    WHERE risk_description LIKE 'Maps to:%'
      AND (
        aima_mapping IS NULL 
        OR aima_mapping = '{}'::jsonb 
        OR COALESCE(aima_mapping->>'domain', '') = ''
      );
  `);

  // 2. Replace corrupted risk_description with meaningful contextual risk statement
  pgm.sql(`
    UPDATE crc_controls
    SET risk_description = 'Failure to effectively implement ' || control_title || ' exposes the organization to compliance violations, operational vulnerability, and regulatory non-alignment under EU AI Act, NIST AI RMF, and ISO 42001.'
    WHERE risk_description LIKE 'Maps to:%';
  `);

  pgm.sql(`NOTIFY pgrst, 'reload schema';`);
};

exports.down = (pgm) => {
  // Down migration leaves normalized risk descriptions in place
};

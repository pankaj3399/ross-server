exports.up = (pgm) => {
    pgm.addColumn("evaluation_status", {
      job_type: {
        type: "text",
        notNull: false,
      },
    });
  
    pgm.sql(`
      UPDATE evaluation_status
      SET job_type = 'AUTOMATED_API_TEST'
      WHERE job_type IS NULL
    `);
  
    pgm.alterColumn("evaluation_status", "job_type", {
      notNull: true,
    });
  
    pgm.sql(`
      ALTER TABLE evaluation_status
      ADD CONSTRAINT evaluation_status_job_type_check
      CHECK (job_type IN ('AUTOMATED_API_TEST', 'MANUAL_PROMPT_TEST'))
    `);
            
    pgm.createIndex("evaluation_status", ["job_type"]);
  };
  
  exports.down = (pgm) => {
    pgm.dropIndex("evaluation_status", ["job_type"]);
  
    pgm.sql(`
      ALTER TABLE evaluation_status
      DROP CONSTRAINT IF EXISTS evaluation_status_job_type_check
    `);
  
    pgm.dropColumn("evaluation_status", "job_type");
  };
  
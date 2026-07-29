/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createIndex("api_test_reports", ["job_id"], {
    name: "api_test_reports_job_id_unique",
    unique: true,
    ifNotExists: true,
  });
};

exports.down = (pgm) => {
  pgm.dropIndex("api_test_reports", ["job_id"], {
    name: "api_test_reports_job_id_unique",
    ifExists: true,
  });
};

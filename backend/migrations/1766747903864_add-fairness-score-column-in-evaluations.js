exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn("fairness_evaluations", {
    fairness_score: { type: "decimal(4,3)" },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn("fairness_evaluations", "fairness_score");
};
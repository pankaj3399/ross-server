exports.shorthands = undefined;

exports.up = pgm => {
  // Add stripe_subscription_id column
  pgm.addColumn("users", {
    stripe_subscription_id: {
      type: "varchar(255)",
      notNull: false,
    },
  });

  // Add unique index on stripe_customer_id
  pgm.createIndex("users", "stripe_customer_id", {
    unique: true,
    ifNotExists: true,
  });
};

exports.down = pgm => {
  // Remove index
  pgm.dropIndex("users", "stripe_customer_id", {
    ifExists: true,
  });

  // Remove column
  pgm.dropColumn("users", "stripe_subscription_id");
};

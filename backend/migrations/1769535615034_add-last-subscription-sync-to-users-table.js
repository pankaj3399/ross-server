exports.shorthands = undefined;

exports.up = pgm => {
  // Add last_subscription_sync column to track when subscription status was last synced with Stripe
  pgm.addColumn("users", {
    last_subscription_sync: {
      type: "timestamp",
      notNull: false,
    },
  });
};

exports.down = pgm => {
  // Remove column
  pgm.dropColumn("users", "last_subscription_sync");
};

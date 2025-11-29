exports.up = (pgm) => {
    pgm.addColumn("aima_domains", {
        is_premium: {
            type: "boolean",
            notNull: true,
            default: false,
        }
    });
};

exports.down = (pgm) => {
    pgm.dropColumn("aima_domains", "is_premium");
};

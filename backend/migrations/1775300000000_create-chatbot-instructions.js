/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("chatbot_instructions", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    title: {
      type: "varchar(255)",
      notNull: true,
    },
    content: {
      type: "text",
      notNull: true,
    },
    is_active: {
      type: "boolean",
      notNull: true,
      default: true,
    },
    category: {
      type: "varchar(100)",
      notNull: true,
      default: "General",
    },
    created_at: {
      type: "timestamp",
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
    updated_at: {
      type: "timestamp",
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  pgm.createIndex("chatbot_instructions", "is_active");

  // Create or replace helper function for updating timestamp
  pgm.sql(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Register trigger on chatbot_instructions table
  pgm.sql(`
    CREATE TRIGGER update_chatbot_instructions_updated_at
    BEFORE UPDATE ON chatbot_instructions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TRIGGER IF EXISTS update_chatbot_instructions_updated_at ON chatbot_instructions;`);
  pgm.dropTable("chatbot_instructions");
};

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

  // Create helper function for updating timestamp ONLY if it does not exist
  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_proc WHERE proname = 'update_updated_at_column' AND pronargs = 0
      ) THEN
        CREATE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $func$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
      END IF;
    END;
    $$;
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
  
  // Drop the shared helper function ONLY if no other triggers are referencing it
  pgm.sql(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_proc WHERE proname = 'update_updated_at_column'
      ) AND NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_trigger 
        WHERE tgfoid = 'update_updated_at_column'::regproc
      ) THEN
        DROP FUNCTION update_updated_at_column();
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        NULL;
    END;
    $$;
  `);

  pgm.dropTable("chatbot_instructions");
};

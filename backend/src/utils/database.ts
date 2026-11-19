import pool from "../config/database";
import fs from "fs";
import path from "path";

export const initializeDatabase = async () => {
  try {
    // Check if database is already initialized by checking if users table exists
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'users'
    `);

    if (tableCheck.rows.length > 0) {
      console.log("✅ Database already initialized, skipping schema setup");
      return;
    }

    // Read and execute schema
    const schemaPath = path.join(__dirname, "../schema/schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    await pool.query(schema);
    console.log("✅ Database schema initialized successfully");

    // Run migration to add missing columns
    const { migrateDatabase } = await import("../scripts/migrateDatabase");
    await migrateDatabase();
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    throw error;
  }
};

async function main() {
  await initializeDatabase();
  process.exit(0);
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
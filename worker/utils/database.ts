import pool from "../config/database";

export const initializeDatabase = async () => {
  try {
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'users'
    `);

    if (tableCheck.rows.length > 0) {
      console.log("Database already initialized");
      return;
    }
    console.log("Database connection verified");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
};


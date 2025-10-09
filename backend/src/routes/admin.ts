import { Router } from "express";
import pool from "../config/database";

const router = Router();

// Reset AIMA data (for development)
router.post("/reset-aima-data", async (req, res) => {
  try {
    // Clear existing data
    await pool.query("DELETE FROM aima_questions");
    await pool.query("DELETE FROM aima_practices");
    await pool.query("DELETE FROM aima_domains");

    console.log("🗑️ AIMA data cleared");
    res.json({ message: "AIMA data cleared successfully" });
  } catch (error) {
    console.error("Error clearing AIMA data:", error);
    res.status(500).json({ error: "Failed to clear AIMA data" });
  }
});

export default router;

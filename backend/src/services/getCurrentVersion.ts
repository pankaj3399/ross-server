import pool from "../config/database";
import { getNextVersion } from "./getNextVersion";
import type { PoolClient } from "pg";

type DbClient = PoolClient | typeof pool;

export async function getCurrentVersion(client?: DbClient) {
    const db = client ?? pool;
    try {
      const result = await db.query(`
        SELECT id, version_number
        FROM versions
        ORDER BY
          CAST(split_part(version_number, '.', 1) AS INT) DESC,
          CAST(split_part(version_number, '.', 2) AS INT) DESC
        LIMIT 1
      `);
  
      if (result.rows.length === 0) {
        const { nextVersion, versionId } = await getNextVersion(client);
        return { id: versionId, version_number: nextVersion };
      }
  
      return result.rows[0];
    } catch (error) {
      console.error("Error fetching current version:", error);
      throw error;
    }
  }
import pool from "../config/database";

async function getNextVersion() {
  try {
    const result = await pool.query(`
      SELECT version_number
      FROM versions
      ORDER BY
        CAST(split_part(version_number, '.', 1) AS INT) DESC,
        CAST(split_part(version_number, '.', 2) AS INT) DESC
      LIMIT 1
    `);

    let nextVersion = "1.0";
    if (result.rows.length > 0) {
      const currentVersion = result.rows[0].version_number;
      const [major, minor] = currentVersion.split('.').map(Number);

      if (minor < 9) {
        nextVersion = `${major}.${minor + 1}`;
      } else {
        nextVersion = `${major + 1}.0`;
      }
    }

    const versionResult = await pool.query(
      "INSERT INTO versions (version_number) VALUES ($1) RETURNING id",
      [nextVersion]
    );
    const versionId = versionResult.rows[0].id;

    return { nextVersion, versionId };
  } catch (error) {
    console.error("Error fetching next version:", error);
    throw error;
  }
}

export { getNextVersion };

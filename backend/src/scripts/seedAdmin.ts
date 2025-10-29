import pool from "../config/database";

export async function seedAdmin() {
  const adminEmail = "admin@maturai.com";
  const passwordHash =
    "$2a$10$Z2REmdbEkMmafFy2KRTNl.Sf6m2FzWGcFnZXn8Unz6vp4dYfq8lXW";

  try {
    // First, delete any existing admin user
    await pool.query("DELETE FROM users WHERE email = $1", [adminEmail]);

    // Then insert the new admin user
    await pool.query(
      `
      INSERT INTO users (email, password_hash, name, organization, role, email_verified)
      VALUES ($1, $2, 'Super Admin', 'System', 'ADMIN', true)
    `,
      [adminEmail, passwordHash],
    );
  } catch (err) {
    console.error("Error seeding admin:", err);
  }
}

// Execute the function when this script is run directly
if (require.main === module) {
  seedAdmin()
    .then(() => {
      console.log("Script completed successfully");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Script failed:", err);
      process.exit(1);
    });
}

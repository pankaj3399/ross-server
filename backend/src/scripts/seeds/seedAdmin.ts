import pool from "../../config/database";

export async function seedAdmin() {
  const adminEmail = "admin@maturai.com";
  const passwordHash =
    "$2a$10$Z2REmdbEkMmafFy2KRTNl.Sf6m2FzWGcFnZXn8Unz6vp4dYfq8lXW";

  try {
    // Check if admin user already exists
    const adminCheck = await pool.query(
      "SELECT COUNT(*) FROM users WHERE email = $1 AND role = 'ADMIN'",
      [adminEmail]
    );
    const adminCount = parseInt(adminCheck.rows[0].count);

    if (adminCount > 0) {
      console.log("✅ Admin user already exists, skipping seed...");
      return;
    }

    // Insert the admin user (with conflict handling)
    await pool.query(
      `
      INSERT INTO users (email, password_hash, name, organization, role, email_verified)
      VALUES ($1, $2, 'Super Admin', 'System', 'ADMIN', true)
      ON CONFLICT (email) DO NOTHING
    `,
      [adminEmail, passwordHash],
    );
    console.log("✅ Admin user seeded successfully!");
  } catch (err) {
    console.error("Error seeding admin:", err);
    throw err;
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
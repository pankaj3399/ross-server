import pool from "../config/database";

export async function seedAdmin() {
  const adminEmail = "admin@yourapp.com";
  const passwordHash =
    "$2b$10$7ZtVjRL6UpPCpN6NYXY8Ae8Fy1MbT1sO3YJ4aO1J/N7kFhghg7fhu"; 

  try {
    await pool.query(
      `
      INSERT INTO users (email, password_hash, name, organization, role, email_verified)
      VALUES ($1, $2, 'Super Admin', 'System', 'ADMIN', true)
      ON CONFLICT (email) DO NOTHING;
    `,
      [adminEmail, passwordHash]
    );

    console.log("✅ Admin user seeded successfully!");
  } catch (err) {
    console.error("Error seeding admin:", err);
  }
}

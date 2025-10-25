import dotenv from "dotenv";
dotenv.config();

export default {
  default: {
    driver: "pg",
    connectionString: process.env.DATABASE_URL,
    "migrations-dir": "migrations",
  },
};

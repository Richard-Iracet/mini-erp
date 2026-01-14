const { Pool } = require("pg");

const isProduction = process.env.NODE_ENV === "production";

const connectionString = process.env.DATABASE_URL;

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: isProduction
        ? { rejectUnauthorized: false }
        : false,
    })
  : new Pool({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "postgres",
      port: Number(process.env.DB_PORT) || 5432,
      ssl: isProduction
        ? { rejectUnauthorized: false }
        : false,
    });

module.exports = pool;

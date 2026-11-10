import "dotenv/config";
import { Pool } from "pg";

// Kalau DATABASE_URL diisi, pakai itu. Kalau tidak, pakai variabel DB_* satu per satu.
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD ?? "",
      database: process.env.DB_NAME || "pawcare_db",
    });

export default pool;

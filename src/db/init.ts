import fs from "fs";
import path from "path";
import pool from "./pool";

// Membaca schema.sql lalu menjalankannya di database.
async function initDatabase() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
    await pool.query(schema);
    console.log("Tabel database berhasil dibuat atau sudah ada.");
  } catch (error) {
    console.error("Gagal membuat tabel database:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

initDatabase();

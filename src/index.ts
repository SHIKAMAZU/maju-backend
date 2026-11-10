import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import pool from "./db/pool";
import authRouter from "./routes/auth";
import petRouter from "./routes/pet";
import productRouter from "./routes/product";

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "PawCare API berjalan." });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/pets", petRouter);
app.use("/api/v1/products", productRouter);

// Menangani error umum, termasuk file upload yang tidak sesuai.
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error:", err);

  if (err?.name === "MulterError") {
    return res.status(400).json({ message: "Upload gambar gagal: " + err.message });
  }

  if (err?.message === "File harus berupa gambar") {
    return res.status(400).json({ message: err.message });
  }

  return res.status(500).json({ message: "Terjadi kesalahan pada server." });
});

async function startServer() {
  // Jangan jalankan server kalau konfigurasi penting belum ada.
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET belum diisi di file .env");
    process.exit(1);
  }

  try {
    await pool.query("SELECT 1");
    console.log("PostgreSQL terhubung.");
  } catch (error) {
    console.error("Gagal terhubung ke PostgreSQL:", error);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`PawCare API berjalan di http://localhost:${PORT}`);
  });
}

startServer();

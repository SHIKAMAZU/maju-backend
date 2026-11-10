import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db/pool";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/v1/auth/register
export async function register(req: Request, res: Response) {
  const { username, email, password } = req.body || {};

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Username, email, dan password wajib diisi." });
  }

  if (typeof username !== "string" || username.trim().length < 3) {
    return res.status(400).json({ message: "Username minimal 3 karakter." });
  }

  if (typeof email !== "string" || !emailPattern.test(email.trim())) {
    return res.status(400).json({ message: "Format email tidak valid." });
  }

  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ message: "Password minimal 6 karakter." });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [cleanEmail]);

    if (existing.rowCount && existing.rowCount > 0) {
      return res.status(409).json({ message: "Email sudah terdaftar." });
    }

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await pool.query(
      `INSERT INTO users (username, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, created_at`,
      [username.trim(), cleanEmail, hashedPassword]
    );

    return res.status(201).json({
      message: "Registrasi berhasil. Silakan login.",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Gagal register:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
}

// POST /api/v1/auth/login
export async function login(req: Request, res: Response) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: "Email dan password wajib diisi." });
  }

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Format email atau password tidak valid." });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const result = await pool.query(
      "SELECT id, username, email, password FROM users WHERE email = $1",
      [cleanEmail]
    );

    const user = result.rows[0];

    // Pesan dibuat sama supaya tidak membocorkan email mana yang terdaftar.
    if (!user) {
      return res.status(401).json({ message: "Email atau password salah." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Email atau password salah." });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: (process.env.JWT_EXPIRES_IN || "1d") as jwt.SignOptions["expiresIn"] }
    );

    return res.json({
      message: "Login berhasil.",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Gagal login:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
}

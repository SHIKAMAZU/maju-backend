import { Request, Response } from "express";
import fs from "fs";
import pool from "../db/pool";
import { uploadImage, deleteImage } from "../utils/cloudinary";

// GET /api/v1/products
export async function getProducts(req: Request, res: Response) {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY created_at DESC");
    return res.json({ message: "Daftar produk berhasil diambil.", products: result.rows });
  } catch (error) {
    console.error("Gagal mengambil produk:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
}

// POST /api/v1/products
export async function createProduct(req: Request, res: Response) {
  const { name, category, price, stock, description } = req.body || {};

  if (!name || !category || price === undefined || stock === undefined || !description) {
    return res.status(400).json({ message: "Semua data produk wajib diisi." });
  }

  if (!req.file) {
    return res.status(400).json({ message: "Gambar produk wajib diunggah." });
  }

  const parsedPrice = Number(price);
  const parsedStock = Number(stock);

  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ message: "Harga harus berupa angka 0 atau lebih." });
  }

  if (!Number.isInteger(parsedStock) || parsedStock < 0) {
    return res.status(400).json({ message: "Stok harus berupa bilangan bulat 0 atau lebih." });
  }

  let newImage: { url: string; publicId: string } | null = null;

  try {
    newImage = await uploadImage(req.file.path, "pawcare/products");

    const result = await pool.query(
      `INSERT INTO products
        (name, category, price, stock, description, image_url, image_public_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        String(name).trim(),
        String(category).trim(),
        parsedPrice,
        parsedStock,
        String(description).trim(),
        newImage.url,
        newImage.publicId,
      ]
    );

    return res.status(201).json({
      message: "Produk berhasil ditambahkan.",
      product: result.rows[0],
    });
  } catch (error) {
    if (newImage) {
      await deleteImage(newImage.publicId).catch(() => undefined);
    }
    console.error("Gagal menambah produk:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server." });
  } finally {
    if (req.file?.path) {
      fs.unlink(req.file.path, () => undefined);
    }
  }
}

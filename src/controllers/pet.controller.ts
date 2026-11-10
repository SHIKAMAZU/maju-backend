import { Request, Response } from "express";
import pool from "../db/pool";
import { deleteImage } from "../utils/cloudinary";

type PetData = {
  name: string;
  species: string;
  breed: string | null;
  birth_date: string | null;
  weight: number | null;
  color: string | null;
  description: string | null;
  // undefined = tidak dikirim, null = dikosongkan, string = URL baru
  imageUrl?: string | null;
};

// Membaca dan memvalidasi data hewan dari form.
function parsePetData(body: any): { error?: string; data?: PetData } {
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const species = typeof body?.species === "string" ? body.species.trim() : "";

  if (!name || !species) {
    return { error: "Nama dan jenis hewan wajib diisi." };
  }

  const breed = typeof body?.breed === "string" ? body.breed.trim() : "";
  const color = typeof body?.color === "string" ? body.color.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";

  // Tanggal lahir boleh kosong, tapi kalau diisi harus format YYYY-MM-DD.
  let birthDate: string | null = null;
  if (body?.birth_date !== undefined && body?.birth_date !== null && String(body.birth_date).trim() !== "") {
    const value = String(body.birth_date).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return { error: "Format tanggal lahir harus YYYY-MM-DD." };
    }
    birthDate = value;
  }

  // Berat boleh kosong, tapi kalau diisi harus angka.
  let weight: number | null = null;
  if (body?.weight !== undefined && body?.weight !== null && String(body.weight).trim() !== "") {
    const value = Number(body.weight);
    if (!Number.isFinite(value) || value < 0) {
      return { error: "Berat harus berupa angka 0 atau lebih." };
    }
    weight = value;
  }

  // Foto hewan memakai URL Cloudinary yang ditempel pengguna.
  let imageUrl: string | null | undefined;
  if (body?.image_url !== undefined) {
    if (typeof body.image_url !== "string") {
      return { error: "URL foto tidak valid." };
    }

    const value = body.image_url.trim();
    if (value === "") {
      imageUrl = null;
    } else if (!/^https?:\/\//i.test(value)) {
      return { error: "URL foto harus diawali http:// atau https://." };
    } else {
      imageUrl = value;
    }
  }

  return {
    data: {
      name,
      species,
      breed: breed || null,
      birth_date: birthDate,
      weight,
      color: color || null,
      description: description || null,
      imageUrl,
    },
  };
}

function parseId(value: string | string[]) {
  const raw = Array.isArray(value) ? value[0] : value;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// GET /api/v1/pets
export async function getPets(req: Request, res: Response) {
  try {
    const result = await pool.query(
      "SELECT * FROM pets WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user!.userId]
    );

    return res.json({ message: "Daftar hewan berhasil diambil.", pets: result.rows });
  } catch (error) {
    console.error("Gagal mengambil hewan:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
}

// GET /api/v1/pets/:id
export async function getPetDetail(req: Request, res: Response) {
  const id = parseId(req.params.id);

  if (!id) {
    return res.status(400).json({ message: "ID hewan tidak valid." });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM pets WHERE id = $1 AND user_id = $2",
      [id, req.user!.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Hewan tidak ditemukan." });
    }

    return res.json({ message: "Detail hewan berhasil diambil.", pet: result.rows[0] });
  } catch (error) {
    console.error("Gagal mengambil detail hewan:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
}

// POST /api/v1/pets
export async function createPet(req: Request, res: Response) {
  const parsed = parsePetData(req.body);

  if (parsed.error || !parsed.data) {
    return res.status(400).json({ message: parsed.error });
  }

  const data = parsed.data;

  try {
    const result = await pool.query(
      `INSERT INTO pets
        (user_id, name, species, breed, birth_date, weight, color, description, image_url, image_public_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        req.user!.userId,
        data.name,
        data.species,
        data.breed,
        data.birth_date,
        data.weight,
        data.color,
        data.description,
        data.imageUrl ?? null,
        null,
      ]
    );

    return res.status(201).json({
      message: "Hewan berhasil ditambahkan.",
      pet: result.rows[0],
    });
  } catch (error) {
    console.error("Gagal menambah hewan:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
}

// PUT /api/v1/pets/:id
export async function updatePet(req: Request, res: Response) {
  const id = parseId(req.params.id);

  if (!id) {
    return res.status(400).json({ message: "ID hewan tidak valid." });
  }

  const parsed = parsePetData(req.body);

  if (parsed.error || !parsed.data) {
    return res.status(400).json({ message: parsed.error });
  }

  const data = parsed.data;

  try {
    const existing = await pool.query(
      "SELECT image_url, image_public_id FROM pets WHERE id = $1 AND user_id = $2",
      [id, req.user!.userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Hewan tidak ditemukan." });
    }

    const oldImagePublicId = existing.rows[0].image_public_id;

    // Kalau field image_url tidak dikirim, foto lama dipertahankan.
    const imageUrl =
      data.imageUrl === undefined ? existing.rows[0].image_url : data.imageUrl;

    // URL manual tidak punya public_id, jadi set null.
    const imagePublicId =
      data.imageUrl === undefined ? oldImagePublicId : null;

    const result = await pool.query(
      `UPDATE pets
       SET name = $1, species = $2, breed = $3, birth_date = $4,
           weight = $5, color = $6, description = $7,
           image_url = $8, image_public_id = $9
       WHERE id = $10 AND user_id = $11
       RETURNING *`,
      [
        data.name,
        data.species,
        data.breed,
        data.birth_date,
        data.weight,
        data.color,
        data.description,
        imageUrl,
        imagePublicId,
        id,
        req.user!.userId,
      ]
    );

    // Hapus foto lama di Cloudinary kalau sebelumnya berasal dari upload.
    if (data.imageUrl !== undefined && oldImagePublicId) {
      await deleteImage(oldImagePublicId).catch(() => undefined);
    }

    return res.json({
      message: "Data hewan berhasil diperbarui.",
      pet: result.rows[0],
    });
  } catch (error) {
    console.error("Gagal mengubah hewan:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
}

// DELETE /api/v1/pets/:id
export async function deletePet(req: Request, res: Response) {
  const id = parseId(req.params.id);

  if (!id) {
    return res.status(400).json({ message: "ID hewan tidak valid." });
  }

  try {
    const result = await pool.query(
      "DELETE FROM pets WHERE id = $1 AND user_id = $2 RETURNING image_public_id",
      [id, req.user!.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Hewan tidak ditemukan." });
    }

    const publicId = result.rows[0].image_public_id;
    if (publicId) {
      await deleteImage(publicId).catch(() => undefined);
    }

    return res.json({ message: "Hewan berhasil dihapus." });
  } catch (error) {
    console.error("Gagal menghapus hewan:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
}

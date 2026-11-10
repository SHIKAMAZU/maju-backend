import { v2 as cloudinary } from "cloudinary";

// Konfigurasi Cloudinary dari file .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Mengunggah satu gambar dan mengembalikan URL + public_id
export async function uploadImage(filePath: string, folder: string) {
  const result = await cloudinary.uploader.upload(filePath, { folder });
  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

// Menghapus gambar dari Cloudinary berdasarkan public_id
export async function deleteImage(publicId: string) {
  await cloudinary.uploader.destroy(publicId);
}

export default cloudinary;

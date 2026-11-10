-- Tabel pengguna aplikasi PawCare
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabel hewan peliharaan milik pengguna
CREATE TABLE IF NOT EXISTS pets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  species VARCHAR(50) NOT NULL,
  breed VARCHAR(100),
  birth_date DATE,
  weight NUMERIC(6, 2),
  color VARCHAR(50),
  description TEXT,
  image_url TEXT,
  image_public_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabel produk (memenuhi tugas backend manajemen produk)
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_public_id TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Mempercepat pencarian hewan berdasarkan pemiliknya
CREATE INDEX IF NOT EXISTS idx_pets_user_id ON pets(user_id);

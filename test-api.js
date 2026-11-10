require("dotenv").config();

const BASE_URL = `http://localhost:${process.env.PORT || 3000}/api/v1`;

async function request(path, method, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`${response.status} - ${data.message || "Request gagal"}`);
  }

  return data;
}

async function main() {
  const email = `siswa${Date.now()}@pawcare.test`;

  console.log("1. Register");
  const register = await request("/auth/register", "POST", {
    username: "Siswa Uji",
    email,
    password: "rahasia123",
  });
  console.log("   ", register.message);

  console.log("2. Login");
  const login = await request("/auth/login", "POST", {
    email,
    password: "rahasia123",
  });
  console.log("   ", login.message, "- token diterima");
  const token = login.token;

  console.log("3. Tambah hewan");
  const created = await request("/pets", "POST", {
    name: "Milo",
    species: "Kucing",
    breed: "Persia",
    birth_date: "2024-01-15",
    weight: 3.5,
    color: "Putih",
    description: "Hewan uji",
    image_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
  }, token);
  console.log("   ", created.message, "- id:", created.pet.id, "- foto:", created.pet.image_url || "kosong");

  console.log("4. Lihat daftar hewan");
  const list = await request("/pets", "GET", null, token);
  console.log("   ", list.message, "- jumlah:", list.pets.length);

  console.log("5. Ubah hewan");
  const updated = await request(`/pets/${created.pet.id}`, "PUT", {
    name: "Milo Edit",
    species: "Kucing",
    breed: "Anggora",
    birth_date: "2024-01-15",
    weight: 4,
    color: "Abu",
    description: "Sudah diubah",
    image_url: "https://res.cloudinary.com/demo/image/upload/dog.jpg",
  }, token);
  console.log("   ", updated.message, "- nama:", updated.pet.name, "- foto:", updated.pet.image_url || "kosong");

  console.log("6. Hapus hewan");
  const deleted = await request(`/pets/${created.pet.id}`, "DELETE", null, token);
  console.log("   ", deleted.message);

  console.log("Semua pengujian API selesai.");
}

main().catch((error) => {
  console.error("Pengujian gagal:", error.message);
  process.exit(1);
});

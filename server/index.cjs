const cors = require("cors");
const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const { randomUUID } = require("crypto");

const { pool } = require("./db.cjs");

const app = express();
const port = Number(process.env.API_PORT || 3001);
const uploadsDir = path.join(__dirname, "..", "uploads", "property-photos");

fs.mkdirSync(uploadsDir, { recursive: true });

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

const adminEmail = process.env.ADMIN_EMAIL || "admin@paradisebeach.com.br";
const adminPassword = process.env.ADMIN_PASSWORD || "Alexandre2026@@";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({ storage });

function mapProperty(row) {
  return {
    ...row,
    price: Number(row.price),
    area: Number(row.area),
    lat: row.lat === null ? null : Number(row.lat),
    lng: row.lng === null ? null : Number(row.lng),
    ocean_view: Boolean(row.ocean_view),
    featured: Boolean(row.featured),
    amenities: Array.isArray(row.amenities) ? row.amenities : JSON.parse(row.amenities || "[]"),
    address: row.address || null,
    cep: row.cep || null,
  };
}

function mapPhoto(row) {
  return {
    ...row,
    published: Boolean(row.published),
    cover: Boolean(row.cover),
    sort_order: Number(row.sort_order),
  };
}

function mapReservation(row) {
  return {
    ...row,
    total: Number(row.total),
  };
}

async function query(sql, params) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

function loginHandler(req, res) {
  const { email, password } = req.body || {};
  if (email !== adminEmail || password !== adminPassword) {
    return res.status(401).json({ message: "Credenciais inválidas." });
  }

  return res.json({
    user: { email: adminEmail },
    token: Buffer.from(`${adminEmail}:ok`).toString("base64"),
  });
}

async function listProperties(_req, res) {
  const rows = await query("SELECT * FROM properties ORDER BY created_at DESC");
  res.json(rows.map(mapProperty));
}

async function getProperty(req, res) {
  const id = req.params.id || req.query.id;
  const rows = await query("SELECT * FROM properties WHERE id = ?", [id]);
  if (!rows.length) {
    return res.status(404).json({ message: "Imóvel não encontrado." });
  }
  return res.json(mapProperty(rows[0]));
}

async function createProperty(req, res) {
  const payload = req.body || {};
  const id = randomUUID();
  await query(
      id, title, type, listing, price, price_label, location, city, state, description,
      bedrooms, bathrooms, area, ocean_view, featured, status, amenities, lat, lng, whatsapp, address, cep
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      payload.title,
      payload.type || "casa",
      payload.listing || "aluguel",
      Number(payload.price || 0),
      payload.price_label || null,
      payload.location || "",
      payload.city || "",
      payload.state || "",
      payload.description || "",
      Number(payload.bedrooms || 0),
      Number(payload.bathrooms || 0),
      Number(payload.area || 0),
      payload.ocean_view ? 1 : 0,
      payload.featured ? 1 : 0,
      payload.status || "disponivel",
      JSON.stringify(payload.amenities || []),
      payload.lat ?? null,
      payload.lng ?? null,
      payload.whatsapp || null,
      payload.address || null,
      payload.cep || null,
    ]
  );

  const created = await query("SELECT * FROM properties WHERE id = ?", [id]);
  res.status(201).json(mapProperty(created[0]));
}

async function updateProperty(req, res) {
  const id = req.params.id || req.query.id;
  const payload = req.body || {};
  const fields = Object.entries(payload);
  if (!fields.length) {
    return res.status(400).json({ message: "Nenhum campo para atualizar." });
  }

  const columns = [];
  const values = [];
  for (const [key, rawValue] of fields) {
    let value = rawValue;
    if (key === "amenities") value = JSON.stringify(rawValue || []);
    if (["ocean_view", "featured"].includes(key)) value = rawValue ? 1 : 0;
    columns.push(`${key} = ?`);
    values.push(value);
  }
  values.push(id);

  await query(`UPDATE properties SET ${columns.join(", ")} WHERE id = ?`, values);
  const updated = await query("SELECT * FROM properties WHERE id = ?", [id]);
  if (!updated.length) {
    return res.status(404).json({ message: "Imóvel não encontrado." });
  }
  return res.json(mapProperty(updated[0]));
}

async function removeProperty(req, res) {
  const id = req.params.id || req.query.id;
  await query("DELETE FROM properties WHERE id = ?", [id]);
  res.status(204).end();
}

async function listPhotos(_req, res) {
  const rows = await query("SELECT * FROM property_photos ORDER BY created_at DESC");
  res.json(rows.map(mapPhoto));
}

async function uploadPhotos(req, res) {
  const propertyId = req.body.property_id;
  const files = req.files || [];
  const created = [];

  for (const file of files) {
    const id = randomUUID();
    const photoUrl = `/uploads/property-photos/${file.filename}`;
    await query(
      `INSERT INTO property_photos (id, property_id, url, caption, published, cover, sort_order)
       VALUES (?, ?, ?, ?, 1, 0, 0)`,
      [id, propertyId, photoUrl, path.parse(file.originalname).name]
    );
    const rows = await query("SELECT * FROM property_photos WHERE id = ?", [id]);
    created.push(mapPhoto(rows[0]));
  }

  res.status(201).json(created);
}

async function updatePhoto(req, res) {
  const id = req.params.id || req.query.id;
  const payload = req.body || {};
  if (payload.cover) {
    const rows = await query("SELECT property_id FROM property_photos WHERE id = ?", [id]);
    if (rows.length) {
      await query("UPDATE property_photos SET cover = 0 WHERE property_id = ?", [rows[0].property_id]);
    }
  }

  const fields = Object.entries(payload);
  if (!fields.length) {
    return res.status(400).json({ message: "Nenhum campo para atualizar." });
  }

  const columns = [];
  const values = [];
  for (const [key, rawValue] of fields) {
    const value = ["published", "cover"].includes(key) ? (rawValue ? 1 : 0) : rawValue;
    columns.push(`${key} = ?`);
    values.push(value);
  }
  values.push(id);

  await query(`UPDATE property_photos SET ${columns.join(", ")} WHERE id = ?`, values);
  const updated = await query("SELECT * FROM property_photos WHERE id = ?", [id]);
  if (!updated.length) {
    return res.status(404).json({ message: "Foto não encontrada." });
  }
  return res.json(mapPhoto(updated[0]));
}

async function removePhoto(req, res) {
  const id = req.params.id || req.query.id;
  const rows = await query("SELECT * FROM property_photos WHERE id = ?", [id]);
  if (rows.length) {
    const filePath = path.join(__dirname, "..", rows[0].url.replace(/^\//, ""));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
  await query("DELETE FROM property_photos WHERE id = ?", [id]);
  res.status(204).end();
}

async function listReservations(_req, res) {
  const rows = await query("SELECT * FROM reservations ORDER BY created_at DESC");
  res.json(rows.map(mapReservation));
}

async function createReservation(req, res) {
  const payload = req.body || {};
  const id = randomUUID();
  await query(
    `INSERT INTO reservations (
      id, property_id, guest_name, email, check_in, check_out, status, total, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      payload.property_id,
      payload.guest_name,
      payload.email,
      payload.check_in,
      payload.check_out,
      payload.status || "pendente",
      Number(payload.total || 0),
      payload.notes || null,
    ]
  );
  const created = await query("SELECT * FROM reservations WHERE id = ?", [id]);
  res.status(201).json(mapReservation(created[0]));
}

async function updateReservation(req, res) {
  const id = req.params.id || req.query.id;
  const payload = req.body || {};
  const fields = Object.entries(payload);
  if (!fields.length) {
    return res.status(400).json({ message: "Nenhum campo para atualizar." });
  }

  const columns = fields.map(([key]) => `${key} = ?`);
  const values = fields.map(([, value]) => value);
  values.push(id);

  await query(`UPDATE reservations SET ${columns.join(", ")} WHERE id = ?`, values);
  const updated = await query("SELECT * FROM reservations WHERE id = ?", [id]);
  if (!updated.length) {
    return res.status(404).json({ message: "Reserva não encontrada." });
  }
  return res.json(mapReservation(updated[0]));
}

async function getSettings(_req, res) {
  const rows = await query("SELECT * FROM settings");
  const settings = {};
  rows.forEach((r) => (settings[r.id] = r.value));
  res.json(settings);
}

async function updateSettings(req, res) {
  const payload = req.body || {};
  for (const [key, value] of Object.entries(payload)) {
    await query("REPLACE INTO settings (id, value) VALUES (?, ?)", [key, value]);
  }
  res.json({ message: "Configurações atualizadas." });
}

app.post("/api/auth/login", loginHandler);
app.post("/api/auth/login.php", loginHandler);

app.get("/api/properties", listProperties);
app.get("/api/properties.php", listProperties);
app.post("/api/properties", createProperty);
app.post("/api/properties.php", createProperty);
app.get("/api/properties/:id", getProperty);
app.get("/api/property.php", getProperty);
app.patch("/api/properties/:id", updateProperty);
app.patch("/api/property.php", updateProperty);
app.delete("/api/properties/:id", removeProperty);
app.delete("/api/property.php", removeProperty);

app.get("/api/photos", listPhotos);
app.get("/api/photos.php", listPhotos);
app.post("/api/photos/upload", upload.array("photos"), uploadPhotos);
app.post("/api/upload-photos.php", upload.array("photos"), uploadPhotos);
app.patch("/api/photos/:id", updatePhoto);
app.patch("/api/photo.php", updatePhoto);
app.delete("/api/photos/:id", removePhoto);
app.delete("/api/photo.php", removePhoto);

app.get("/api/reservations", listReservations);
app.get("/api/reservations.php", listReservations);
app.post("/api/reservations", createReservation);
app.post("/api/reservations.php", createReservation);
app.patch("/api/reservations/:id", updateReservation);
app.patch("/api/reservation.php", updateReservation);

app.get("/api/settings", getSettings);
app.get("/api/settings.php", getSettings);
app.post("/api/settings", updateSettings);
app.post("/api/settings.php", updateSettings);

app.listen(port, () => {
  console.log(`API ready on http://localhost:${port}`);
});

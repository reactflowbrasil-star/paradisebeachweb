import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { ensureSchema } from "./schema.js";
import { query } from "./db.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const uploadDir = path.join(rootDir, "public", "uploads", "properties");
fs.mkdirSync(uploadDir, { recursive: true });

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");

function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Nao autenticado" });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Token invalido" });
  }
}

const app = express();
const port = Number(process.env.API_PORT || 3001);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 30 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype.startsWith("image/"));
  },
});

app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(path.join(rootDir, "public", "uploads")));

function normalizeProperty(row) {
  return {
    ...row,
    price: Number(row.price || 0),
    area: Number(row.area || 0),
    lat: row.lat === null ? null : Number(row.lat),
    lng: row.lng === null ? null : Number(row.lng),
    ocean_view: Boolean(row.ocean_view),
    featured: Boolean(row.featured),
    amenities: typeof row.amenities === "string" ? JSON.parse(row.amenities || "[]") : row.amenities || [],
  };
}

async function listPhotos(propertyId = null) {
  const sql = propertyId
    ? "SELECT * FROM property_photos WHERE property_id = :propertyId ORDER BY cover DESC, sort_order ASC, created_at ASC"
    : "SELECT * FROM property_photos ORDER BY created_at DESC";
  const rows = await query(sql, propertyId ? { propertyId } : {});
  return rows.map((row) => ({
    ...row,
    published: Boolean(row.published),
    cover: Boolean(row.cover),
  }));
}

app.get("/api/health", async (_req, res, next) => {
  try {
    await query("SELECT 1 AS ok");
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Informe e-mail e senha" });
    const rows = await query("SELECT * FROM admins WHERE email = :email LIMIT 1", { email });
    const admin = rows[0];
    if (!admin) return res.status(401).json({ error: "Credenciais invalidas" });
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) return res.status(401).json({ error: "Credenciais invalidas" });
    const token = jwt.sign({ id: admin.id, email: admin.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/me", authenticate, (req, res) => {
  res.json({ admin: { id: req.admin.id, email: req.admin.email } });
});

app.get("/api/properties", async (_req, res, next) => {
  try {
    const rows = await query("SELECT * FROM properties ORDER BY featured DESC, created_at DESC");
    const photos = await listPhotos();
    res.json({
      properties: rows.map(normalizeProperty),
      photos,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/properties/:id", async (req, res, next) => {
  try {
    const rows = await query("SELECT * FROM properties WHERE id = :id LIMIT 1", { id: req.params.id });
    if (!rows.length) return res.status(404).json({ error: "Imovel nao encontrado" });
    res.json({ property: normalizeProperty(rows[0]), photos: await listPhotos(req.params.id) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/properties", authenticate, async (req, res, next) => {
  try {
    const id = crypto.randomUUID();
    const body = req.body;
    await query(
      `INSERT INTO properties (
        id, title, type, listing, price, price_label, location, city, state, description,
        bedrooms, bathrooms, area, ocean_view, featured, status, amenities, lat, lng,
        whatsapp, booking_method, booking_url, booking_notes, min_nights, max_guests
      ) VALUES (
        :id, :title, :type, :listing, :price, :price_label, :location, :city, :state, :description,
        :bedrooms, :bathrooms, :area, :ocean_view, :featured, :status, :amenities, :lat, :lng,
        :whatsapp, :booking_method, :booking_url, :booking_notes, :min_nights, :max_guests
      )`,
      {
        id,
        title: body.title,
        type: body.type || "casa",
        listing: body.listing || "aluguel",
        price: Number(body.price || 0),
        price_label: body.price_label || null,
        location: body.location || "",
        city: body.city || "",
        state: body.state || "",
        description: body.description || "",
        bedrooms: Number(body.bedrooms || 0),
        bathrooms: Number(body.bathrooms || 0),
        area: Number(body.area || 0),
        ocean_view: Boolean(body.ocean_view),
        featured: Boolean(body.featured),
        status: body.status || "disponivel",
        amenities: JSON.stringify(body.amenities || []),
        lat: body.lat === "" || body.lat === undefined ? null : Number(body.lat),
        lng: body.lng === "" || body.lng === undefined ? null : Number(body.lng),
        whatsapp: body.whatsapp || null,
        booking_method: body.booking_method || "whatsapp",
        booking_url: body.booking_url || null,
        booking_notes: body.booking_notes || null,
        min_nights: Number(body.min_nights || 1),
        max_guests: Number(body.max_guests || 1),
      },
    );
    res.status(201).json({ id });
  } catch (error) {
    next(error);
  }
});

app.put("/api/properties/:id", authenticate, async (req, res, next) => {
  try {
    const body = req.body;
    await query(
      `UPDATE properties SET
        title = :title, type = :type, listing = :listing, price = :price, price_label = :price_label,
        location = :location, city = :city, state = :state, description = :description,
        bedrooms = :bedrooms, bathrooms = :bathrooms, area = :area, ocean_view = :ocean_view,
        featured = :featured, status = :status, amenities = :amenities, lat = :lat, lng = :lng,
        whatsapp = :whatsapp, booking_method = :booking_method, booking_url = :booking_url,
        booking_notes = :booking_notes, min_nights = :min_nights, max_guests = :max_guests
      WHERE id = :id`,
      {
        id: req.params.id,
        title: body.title,
        type: body.type || "casa",
        listing: body.listing || "aluguel",
        price: Number(body.price || 0),
        price_label: body.price_label || null,
        location: body.location || "",
        city: body.city || "",
        state: body.state || "",
        description: body.description || "",
        bedrooms: Number(body.bedrooms || 0),
        bathrooms: Number(body.bathrooms || 0),
        area: Number(body.area || 0),
        ocean_view: Boolean(body.ocean_view),
        featured: Boolean(body.featured),
        status: body.status || "disponivel",
        amenities: JSON.stringify(body.amenities || []),
        lat: body.lat === "" || body.lat === undefined ? null : Number(body.lat),
        lng: body.lng === "" || body.lng === undefined ? null : Number(body.lng),
        whatsapp: body.whatsapp || null,
        booking_method: body.booking_method || "whatsapp",
        booking_url: body.booking_url || null,
        booking_notes: body.booking_notes || null,
        min_nights: Number(body.min_nights || 1),
        max_guests: Number(body.max_guests || 1),
      },
    );
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/properties/:id", authenticate, async (req, res, next) => {
  try {
    await query("DELETE FROM properties WHERE id = :id", { id: req.params.id });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/properties/:id/photos", authenticate, upload.array("photos"), async (req, res, next) => {
  try {
    const existing = await query("SELECT COUNT(*) AS total FROM property_photos WHERE property_id = :propertyId", {
      propertyId: req.params.id,
    });
    let sort = Number(existing[0]?.total || 0);
    const inserted = [];
    for (const file of req.files || []) {
      const id = crypto.randomUUID();
      const publicUrl = `/uploads/properties/${file.filename}`;
      await query(
        `INSERT INTO property_photos (id, property_id, url, caption, cover, sort_order)
         VALUES (:id, :property_id, :url, :caption, :cover, :sort_order)`,
        {
          id,
          property_id: req.params.id,
          url: publicUrl,
          caption: file.originalname.replace(/\.[^.]+$/, ""),
          cover: sort === 0,
          sort_order: sort,
        },
      );
      inserted.push({ id, url: publicUrl });
      sort += 1;
    }
    res.status(201).json({ photos: inserted });
  } catch (error) {
    next(error);
  }
});

app.put("/api/photos/:id", authenticate, async (req, res, next) => {
  try {
    const body = req.body;
    if (body.cover) {
      const rows = await query("SELECT property_id FROM property_photos WHERE id = :id", { id: req.params.id });
      if (rows[0]) {
        await query("UPDATE property_photos SET cover = false WHERE property_id = :propertyId", {
          propertyId: rows[0].property_id,
        });
      }
    }
    await query(
      "UPDATE property_photos SET caption = :caption, published = :published, cover = :cover, sort_order = :sort_order WHERE id = :id",
      {
        id: req.params.id,
        caption: body.caption || "",
        published: body.published !== false,
        cover: Boolean(body.cover),
        sort_order: Number(body.sort_order || 0),
      },
    );
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/photos/:id", authenticate, async (req, res, next) => {
  try {
    const rows = await query("SELECT url FROM property_photos WHERE id = :id", { id: req.params.id });
    await query("DELETE FROM property_photos WHERE id = :id", { id: req.params.id });
    const url = rows[0]?.url;
    if (url?.startsWith("/uploads/properties/")) {
      fs.rm(path.join(rootDir, "public", url), { force: true }, () => {});
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/reservations", async (_req, res, next) => {
  try {
    const reservations = await query("SELECT * FROM reservations ORDER BY created_at DESC");
    res.json({ reservations });
  } catch (error) {
    next(error);
  }
});

app.post("/api/reservations", authenticate, async (req, res, next) => {
  try {
    const id = crypto.randomUUID();
    await query(
      `INSERT INTO reservations (id, property_id, guest_name, email, phone, check_in, check_out, status, total, notes)
       VALUES (:id, :property_id, :guest_name, :email, :phone, :check_in, :check_out, :status, :total, :notes)`,
      {
        id,
        property_id: req.body.property_id,
        guest_name: req.body.guest_name,
        email: req.body.email,
        phone: req.body.phone || null,
        check_in: req.body.check_in,
        check_out: req.body.check_out,
        status: req.body.status || "pendente",
        total: Number(req.body.total || 0),
        notes: req.body.notes || null,
      },
    );
    res.status(201).json({ id });
  } catch (error) {
    next(error);
  }
});

app.put("/api/reservations/:id", authenticate, async (req, res, next) => {
  try {
    await query("UPDATE reservations SET status = :status, notes = :notes WHERE id = :id", {
      id: req.params.id,
      status: req.body.status || "pendente",
      notes: req.body.notes || null,
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/reservations/:id", authenticate, async (req, res, next) => {
  try {
    await query("DELETE FROM reservations WHERE id = :id", { id: req.params.id });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: error.message || "Erro interno" });
});

ensureSchema()
  .then(() => {
    app.listen(port, "127.0.0.1", () => {
      console.log(`API ready on http://127.0.0.1:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database schema", error);
    process.exit(1);
  });


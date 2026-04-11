const cors = require("cors");
const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const { randomUUID } = require("crypto");

const { pool } = require("./db.cjs");
const { bootstrapCms } = require("./cms/schema.cjs");
const { createCmsRepository } = require("./cms/repository.cjs");
const { createCmsService } = require("./cms/service.cjs");
const { createCmsController } = require("./cms/controller.cjs");
const { createCmsRouters } = require("./cms/routes.cjs");

const app = express();
const port = Number(process.env.API_PORT || 3001);

const uploadsRootDir = path.join(__dirname, "..", "uploads");
const propertyPhotosDir = path.join(uploadsRootDir, "property-photos");
const siteUploadsDir = path.join(uploadsRootDir, "site");
const clientProfilesDir = path.join(uploadsRootDir, "client-profiles");

[propertyPhotosDir, siteUploadsDir, clientProfilesDir].forEach((dir) => {
  fs.mkdirSync(dir, { recursive: true });
});

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(uploadsRootDir));

const adminEmail = process.env.ADMIN_EMAIL || "admin@paradisebeach.com.br";
const adminPassword = process.env.ADMIN_PASSWORD || "Alexandre2026@@";

function createStorage(destinationDir) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, destinationDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "");
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  });
}

const uploadPropertyPhotos = multer({ storage: createStorage(propertyPhotosDir) });
const uploadSite = multer({ storage: createStorage(siteUploadsDir) });
const uploadClient = multer({ storage: createStorage(clientProfilesDir) });
const cmsRepository = createCmsRepository(pool);
const cmsService = createCmsService(cmsRepository);
const cmsController = createCmsController(cmsService);
const { adminRouter: adminCmsRouter, publicRouter: publicCmsRouter } = createCmsRouters(cmsController);

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
    booking_code: row.booking_code || null,
    total: Number(row.total),
    paid_amount: Number(row.paid_amount || 0),
    client_id: row.client_id || null,
    adults_count: Number(row.adults_count || 1),
    children_count: Number(row.children_count || 0),
    infants_count: Number(row.infants_count || 0),
    special_requests: row.special_requests || null,
    payment_method: row.payment_method || null,
    payment_status: row.payment_status || "pendente",
    payment_due_date: row.payment_due_date || null,
    payment_reference: row.payment_reference || null,
    payment_installments: Number(row.payment_installments || 1),
    payment_receipt_url: row.payment_receipt_url || null,
    payment_gateway: row.payment_gateway || null,
    payment_metadata: row.payment_metadata ? JSON.parse(row.payment_metadata) : null,
    payment_notes: row.payment_notes || null,
    pre_checkin_status: row.pre_checkin_status || "pendente",
    pre_checkin_confirmed_at: row.pre_checkin_confirmed_at || null,
    pre_checkin_due_at: row.pre_checkin_due_at || null,
    pre_checkin_notes: row.pre_checkin_notes || null,
    notes: row.notes || null,
    guests: row.guests || [],
    payments: row.payments || [],
  };
}

function mapClient(row) {
  return {
    ...row,
    phone: row.phone || null,
    document: row.document || null,
    document_type: row.document_type || null,
    birth_date: row.birth_date || null,
    nationality: row.nationality || null,
    address_line1: row.address_line1 || null,
    address_line2: row.address_line2 || null,
    city: row.city || null,
    state: row.state || null,
    country: row.country || null,
    zip_code: row.zip_code || null,
    emergency_contact_name: row.emergency_contact_name || null,
    emergency_contact_phone: row.emergency_contact_phone || null,
    vip_status: Boolean(row.vip_status),
    tags_json: Array.isArray(row.tags_json) ? row.tags_json : JSON.parse(row.tags_json || "null"),
    profile_photo_url: row.profile_photo_url || null,
    preferred_payment_method: row.preferred_payment_method || null,
    notes: row.notes || null,
  };
}

async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function fetchById(table, id) {
  const rows = await query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
  return rows[0] || null;
}

function createBookingCode() {
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PB-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${randomPart}`;
}

function defaultPreCheckinDueAt(checkIn) {
  const date = new Date(`${checkIn}T12:00:00`);
  date.setDate(date.getDate() - 2);
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function mapReservationGuest(row) {
  return {
    ...row,
    client_id: row.client_id || null,
    email: row.email || null,
    phone: row.phone || null,
    document: row.document || null,
    birth_date: row.birth_date || null,
    guest_type: row.guest_type || "adulto",
    is_primary: Boolean(row.is_primary),
    notes: row.notes || null,
  };
}

function mapReservationPayment(row) {
  return {
    ...row,
    amount: Number(row.amount || 0),
    currency: row.currency || "BRL",
    reference_code: row.reference_code || null,
    external_transaction_id: row.external_transaction_id || null,
    installments: Number(row.installments || 1),
    due_at: row.due_at || null,
    paid_at: row.paid_at || null,
    pix_qr_code: row.pix_qr_code || null,
    pix_copy_paste: row.pix_copy_paste || null,
    card_brand: row.card_brand || null,
    card_last4: row.card_last4 || null,
    receipt_url: row.receipt_url || null,
    notes: row.notes || null,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
  };
}

async function attachReservationRelations(rows) {
  if (!rows.length) return [];
  const ids = rows.map((row) => row.id);
  const placeholders = ids.map(() => "?").join(", ");
  const [guestRows, paymentRows] = await Promise.all([
    query(`SELECT * FROM reservation_guests WHERE reservation_id IN (${placeholders}) ORDER BY is_primary DESC, created_at ASC`, ids),
    query(`SELECT * FROM reservation_payments WHERE reservation_id IN (${placeholders}) ORDER BY created_at ASC`, ids),
  ]);

  const guestsByReservationId = guestRows.reduce((acc, row) => {
    const mapped = mapReservationGuest(row);
    if (!acc[mapped.reservation_id]) acc[mapped.reservation_id] = [];
    acc[mapped.reservation_id].push(mapped);
    return acc;
  }, {});

  const paymentsByReservationId = paymentRows.reduce((acc, row) => {
    const mapped = mapReservationPayment(row);
    if (!acc[mapped.reservation_id]) acc[mapped.reservation_id] = [];
    acc[mapped.reservation_id].push(mapped);
    return acc;
  }, {});

  return rows.map((row) =>
    mapReservation({
      ...row,
      guests: guestsByReservationId[row.id] || [],
      payments: paymentsByReservationId[row.id] || [],
    })
  );
}

async function fetchReservationById(id) {
  const row = await fetchById("reservations", id);
  if (!row) return null;
  const [hydrated] = await attachReservationRelations([row]);
  return hydrated || null;
}

async function syncReservationGuests(reservationId, guests, clientId = null) {
  await query("DELETE FROM reservation_guests WHERE reservation_id = ?", [reservationId]);

  for (const [index, guest] of (guests || []).entries()) {
    await query(
      `INSERT INTO reservation_guests (
        id, reservation_id, client_id, full_name, email, phone, document, birth_date, guest_type, is_primary, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        reservationId,
        guest.client_id || (index === 0 ? clientId : null),
        guest.full_name || "",
        guest.email || null,
        guest.phone || null,
        guest.document || null,
        guest.birth_date || null,
        guest.guest_type || "adulto",
        guest.is_primary ? 1 : 0,
        guest.notes || null,
      ]
    );
  }
}

async function syncReservationPayments(reservationId, payments) {
  await query("DELETE FROM reservation_payments WHERE reservation_id = ?", [reservationId]);

  for (const payment of payments || []) {
    await query(
      `INSERT INTO reservation_payments (
        id, reservation_id, method, status, amount, currency, reference_code, external_transaction_id,
        installments, due_at, paid_at, pix_qr_code, pix_copy_paste, card_brand, card_last4, receipt_url, notes, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        reservationId,
        payment.method || "pix",
        payment.status || "pendente",
        Number(payment.amount || 0),
        payment.currency || "BRL",
        payment.reference_code || null,
        payment.external_transaction_id || null,
        Number(payment.installments || 1),
        payment.due_at || null,
        payment.paid_at || null,
        payment.pix_qr_code || null,
        payment.pix_copy_paste || null,
        payment.card_brand || null,
        payment.card_last4 || null,
        payment.receipt_url || null,
        payment.notes || null,
        payment.metadata ? JSON.stringify(payment.metadata) : null,
      ]
    );
  }
}

async function bootstrapBooking() {
  const statements = [
    "ALTER TABLE clients ADD COLUMN document_type VARCHAR(30) NULL AFTER document",
    "ALTER TABLE clients ADD COLUMN nationality VARCHAR(80) NULL AFTER birth_date",
    "ALTER TABLE clients ADD COLUMN address_line1 VARCHAR(180) NULL AFTER nationality",
    "ALTER TABLE clients ADD COLUMN address_line2 VARCHAR(180) NULL AFTER address_line1",
    "ALTER TABLE clients ADD COLUMN city VARCHAR(120) NULL AFTER address_line2",
    "ALTER TABLE clients ADD COLUMN state VARCHAR(120) NULL AFTER city",
    "ALTER TABLE clients ADD COLUMN country VARCHAR(120) NULL AFTER state",
    "ALTER TABLE clients ADD COLUMN zip_code VARCHAR(20) NULL AFTER country",
    "ALTER TABLE clients ADD COLUMN emergency_contact_name VARCHAR(180) NULL AFTER zip_code",
    "ALTER TABLE clients ADD COLUMN emergency_contact_phone VARCHAR(40) NULL AFTER emergency_contact_name",
    "ALTER TABLE clients ADD COLUMN vip_status BOOLEAN NOT NULL DEFAULT FALSE AFTER emergency_contact_phone",
    "ALTER TABLE clients ADD COLUMN tags_json JSON NULL AFTER vip_status",
    "ALTER TABLE reservations ADD COLUMN booking_code VARCHAR(40) NULL AFTER client_id",
    "ALTER TABLE reservations ADD COLUMN adults_count INT NOT NULL DEFAULT 1 AFTER status",
    "ALTER TABLE reservations ADD COLUMN children_count INT NOT NULL DEFAULT 0 AFTER adults_count",
    "ALTER TABLE reservations ADD COLUMN infants_count INT NOT NULL DEFAULT 0 AFTER children_count",
    "ALTER TABLE reservations ADD COLUMN special_requests TEXT NULL AFTER infants_count",
    "ALTER TABLE reservations ADD COLUMN payment_due_date DATE NULL AFTER total",
    "ALTER TABLE reservations ADD COLUMN payment_reference VARCHAR(120) NULL AFTER payment_due_date",
    "ALTER TABLE reservations ADD COLUMN payment_installments INT NOT NULL DEFAULT 1 AFTER payment_reference",
    "ALTER TABLE reservations ADD COLUMN payment_receipt_url TEXT NULL AFTER payment_installments",
    "ALTER TABLE reservations ADD COLUMN payment_gateway VARCHAR(80) NULL AFTER payment_receipt_url",
    "ALTER TABLE reservations ADD COLUMN payment_metadata JSON NULL AFTER payment_gateway",
    "ALTER TABLE reservations ADD COLUMN pre_checkin_status ENUM('pendente', 'confirmado', 'atrasado', 'dispensado') NOT NULL DEFAULT 'pendente' AFTER payment_notes",
    "ALTER TABLE reservations ADD COLUMN pre_checkin_confirmed_at DATETIME NULL AFTER pre_checkin_status",
    "ALTER TABLE reservations ADD COLUMN pre_checkin_due_at DATETIME NULL AFTER pre_checkin_confirmed_at",
    "ALTER TABLE reservations ADD COLUMN pre_checkin_notes TEXT NULL AFTER pre_checkin_due_at",
    "CREATE TABLE IF NOT EXISTS reservation_guests (id CHAR(36) NOT NULL PRIMARY KEY, reservation_id CHAR(36) NOT NULL, client_id CHAR(36) NULL, full_name VARCHAR(180) NOT NULL, email VARCHAR(180) NULL, phone VARCHAR(40) NULL, document VARCHAR(40) NULL, birth_date DATE NULL, guest_type ENUM('adulto','crianca','bebe') NOT NULL DEFAULT 'adulto', is_primary BOOLEAN NOT NULL DEFAULT FALSE, notes TEXT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT fk_reservation_guests_reservation FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE, CONSTRAINT fk_reservation_guests_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL)",
    "CREATE TABLE IF NOT EXISTS reservation_payments (id CHAR(36) NOT NULL PRIMARY KEY, reservation_id CHAR(36) NOT NULL, method ENUM('pix','cartao_credito','cartao_debito','transferencia','boleto','dinheiro') NOT NULL, status ENUM('pendente','parcial','pago','reembolsado','cancelado') NOT NULL DEFAULT 'pendente', amount DECIMAL(12,2) NOT NULL DEFAULT 0, currency CHAR(3) NOT NULL DEFAULT 'BRL', reference_code VARCHAR(120) NULL, external_transaction_id VARCHAR(120) NULL, installments INT NOT NULL DEFAULT 1, due_at DATETIME NULL, paid_at DATETIME NULL, pix_qr_code TEXT NULL, pix_copy_paste TEXT NULL, card_brand VARCHAR(40) NULL, card_last4 VARCHAR(4) NULL, receipt_url TEXT NULL, notes TEXT NULL, metadata JSON NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT fk_reservation_payments_reservation FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE)",
    "CREATE UNIQUE INDEX uq_reservations_booking_code ON reservations (booking_code)",
    "CREATE INDEX idx_reservations_pre_checkin_status ON reservations (pre_checkin_status)",
    "CREATE INDEX idx_reservations_check_in ON reservations (check_in)",
    "CREATE INDEX idx_reservation_guests_reservation_id ON reservation_guests (reservation_id)",
    "CREATE INDEX idx_reservation_payments_reservation_id ON reservation_payments (reservation_id)",
  ];

  for (const statement of statements) {
    try {
      await query(statement);
    } catch (error) {
      if (!/Duplicate column name|already exists|Duplicate key name|1061|1060/i.test(String(error.message || error))) {
        throw error;
      }
    }
  }
}

function loginHandler(req, res) {
  const { email, password } = req.body || {};
  if (email !== adminEmail || password !== adminPassword) {
    return res.status(401).json({ message: "Credenciais invalidas." });
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
  const row = await fetchById("properties", id);
  if (!row) {
    return res.status(404).json({ message: "Imovel nao encontrado." });
  }
  return res.json(mapProperty(row));
}

async function createProperty(req, res) {
  const payload = req.body || {};
  const id = randomUUID();

  await query(
    `INSERT INTO properties (
      id, title, type, listing, price, price_label, location, city, state, description,
      bedrooms, bathrooms, area, ocean_view, featured, status, amenities, lat, lng, whatsapp, address, cep
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      payload.title || "",
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

  const created = await fetchById("properties", id);
  res.status(201).json(mapProperty(created));
}

async function updateProperty(req, res) {
  const id = req.params.id || req.query.id;
  const payload = req.body || {};
  const allowed = [
    "title",
    "type",
    "listing",
    "price",
    "price_label",
    "location",
    "city",
    "state",
    "description",
    "bedrooms",
    "bathrooms",
    "area",
    "ocean_view",
    "featured",
    "status",
    "amenities",
    "lat",
    "lng",
    "whatsapp",
    "address",
    "cep",
  ];

  const entries = Object.entries(payload).filter(([key]) => allowed.includes(key));
  if (!entries.length) {
    return res.status(400).json({ message: "Nenhum campo para atualizar." });
  }

  const columns = [];
  const values = [];
  for (const [key, rawValue] of entries) {
    let value = rawValue;
    if (key === "amenities") value = JSON.stringify(rawValue || []);
    if (["ocean_view", "featured"].includes(key)) value = rawValue ? 1 : 0;
    columns.push(`${key} = ?`);
    values.push(value);
  }
  values.push(id);

  await query(`UPDATE properties SET ${columns.join(", ")} WHERE id = ?`, values);
  const updated = await fetchById("properties", id);
  if (!updated) {
    return res.status(404).json({ message: "Imovel nao encontrado." });
  }
  return res.json(mapProperty(updated));
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
    const row = await fetchById("property_photos", id);
    created.push(mapPhoto(row));
  }

  res.status(201).json(created);
}

async function updatePhoto(req, res) {
  const id = req.params.id || req.query.id;
  const payload = req.body || {};
  const allowed = ["caption", "published", "cover", "sort_order"];
  const entries = Object.entries(payload).filter(([key]) => allowed.includes(key));
  if (!entries.length) {
    return res.status(400).json({ message: "Nenhum campo para atualizar." });
  }

  if (payload.cover) {
    const rows = await query("SELECT property_id FROM property_photos WHERE id = ?", [id]);
    if (rows.length) {
      await query("UPDATE property_photos SET cover = 0 WHERE property_id = ?", [rows[0].property_id]);
    }
  }

  const columns = [];
  const values = [];
  for (const [key, rawValue] of entries) {
    const value = ["published", "cover"].includes(key) ? (rawValue ? 1 : 0) : rawValue;
    columns.push(`${key} = ?`);
    values.push(value);
  }
  values.push(id);

  await query(`UPDATE property_photos SET ${columns.join(", ")} WHERE id = ?`, values);
  const updated = await fetchById("property_photos", id);
  if (!updated) {
    return res.status(404).json({ message: "Foto nao encontrada." });
  }
  return res.json(mapPhoto(updated));
}

async function removePhoto(req, res) {
  const id = req.params.id || req.query.id;
  const row = await fetchById("property_photos", id);
  if (row?.url) {
    const filePath = path.join(__dirname, "..", row.url.replace(/^\//, ""));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
  await query("DELETE FROM property_photos WHERE id = ?", [id]);
  res.status(204).end();
}

async function listClients(_req, res) {
  const rows = await query("SELECT * FROM clients ORDER BY created_at DESC");
  res.json(rows.map(mapClient));
}

async function getClient(req, res) {
  const id = req.params.id || req.query.id;
  const row = await fetchById("clients", id);
  if (!row) {
    return res.status(404).json({ message: "Cliente nao encontrado." });
  }
  return res.json(mapClient(row));
}

async function createClient(req, res) {
  const payload = req.body || {};
  if (!payload.full_name || !payload.email) {
    return res.status(400).json({ message: "Nome e e-mail sao obrigatorios." });
  }

  const id = randomUUID();
  await query(
    `INSERT INTO clients (
      id, full_name, email, phone, document, document_type, birth_date, nationality,
      address_line1, address_line2, city, state, country, zip_code,
      emergency_contact_name, emergency_contact_phone, vip_status, tags_json,
      profile_photo_url, preferred_payment_method, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      payload.full_name,
      payload.email,
      payload.phone || null,
      payload.document || null,
      payload.document_type || null,
      payload.birth_date || null,
      payload.nationality || null,
      payload.address_line1 || null,
      payload.address_line2 || null,
      payload.city || null,
      payload.state || null,
      payload.country || null,
      payload.zip_code || null,
      payload.emergency_contact_name || null,
      payload.emergency_contact_phone || null,
      payload.vip_status ? 1 : 0,
      payload.tags_json ? JSON.stringify(payload.tags_json) : null,
      payload.profile_photo_url || null,
      payload.preferred_payment_method || null,
      payload.notes || null,
    ]
  );

  const created = await fetchById("clients", id);
  res.status(201).json(mapClient(created));
}

async function updateClient(req, res) {
  const id = req.params.id || req.query.id;
  const payload = req.body || {};
  const allowed = [
    "full_name",
    "email",
    "phone",
    "document",
    "document_type",
    "birth_date",
    "nationality",
    "address_line1",
    "address_line2",
    "city",
    "state",
    "country",
    "zip_code",
    "emergency_contact_name",
    "emergency_contact_phone",
    "vip_status",
    "tags_json",
    "profile_photo_url",
    "preferred_payment_method",
    "notes",
  ];
  const entries = Object.entries(payload).filter(([key]) => allowed.includes(key));
  if (!entries.length) {
    return res.status(400).json({ message: "Nenhum campo para atualizar." });
  }

  const columns = entries.map(([key]) => `${key} = ?`);
  const values = entries.map(([key, value]) => {
    if (key === "vip_status") return value ? 1 : 0;
    if (key === "tags_json") return value ? JSON.stringify(value) : null;
    return value;
  });
  values.push(id);

  await query(`UPDATE clients SET ${columns.join(", ")} WHERE id = ?`, values);
  const updated = await fetchById("clients", id);
  if (!updated) {
    return res.status(404).json({ message: "Cliente nao encontrado." });
  }
  return res.json(mapClient(updated));
}

async function removeClient(req, res) {
  const id = req.params.id || req.query.id;
  await query("DELETE FROM clients WHERE id = ?", [id]);
  res.status(204).end();
}

async function listReservations(req, res) {
  const clientId = (req.query.client_id || "").toString().trim();
  if (clientId) {
    const rows = await query("SELECT * FROM reservations WHERE client_id = ? ORDER BY created_at DESC", [clientId]);
    return res.json(await attachReservationRelations(rows));
  }

  const rows = await query("SELECT * FROM reservations ORDER BY created_at DESC");
  res.json(await attachReservationRelations(rows));
}

async function createReservation(req, res) {
  const payload = req.body || {};
  if (!payload.property_id) {
    return res.status(400).json({ message: "Imovel e obrigatorio." });
  }
  if (!payload.check_in || !payload.check_out) {
    return res.status(400).json({ message: "Check-in e check-out sao obrigatorios." });
  }
  if (new Date(payload.check_out).getTime() <= new Date(payload.check_in).getTime()) {
    return res.status(400).json({ message: "Check-out deve ser posterior ao check-in." });
  }

  let guestName = payload.guest_name || "";
  let guestEmail = payload.email || "";
  if (payload.client_id && (!guestName || !guestEmail)) {
    const client = await fetchById("clients", payload.client_id);
    if (client) {
      guestName = guestName || client.full_name;
      guestEmail = guestEmail || client.email;
    }
  }
  if (!guestName || !guestEmail) {
    return res.status(400).json({ message: "Hospede principal e e-mail sao obrigatorios." });
  }

  const id = randomUUID();
  await query(
    `INSERT INTO reservations (
      id, property_id, client_id, booking_code, guest_name, email, check_in, check_out, status,
      adults_count, children_count, infants_count, special_requests,
      payment_method, payment_status, paid_amount, total, payment_due_date, payment_reference,
      payment_installments, payment_receipt_url, payment_gateway, payment_metadata, payment_notes,
      pre_checkin_status, pre_checkin_confirmed_at, pre_checkin_due_at, pre_checkin_notes, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      payload.property_id,
      payload.client_id || null,
      payload.booking_code || createBookingCode(),
      guestName,
      guestEmail,
      payload.check_in,
      payload.check_out,
      payload.status || "pendente",
      Number(payload.adults_count || 1),
      Number(payload.children_count || 0),
      Number(payload.infants_count || 0),
      payload.special_requests || null,
      payload.payment_method || null,
      payload.payment_status || "pendente",
      Number(payload.paid_amount || 0),
      Number(payload.total || 0),
      payload.payment_due_date || null,
      payload.payment_reference || null,
      Number(payload.payment_installments || 1),
      payload.payment_receipt_url || null,
      payload.payment_gateway || null,
      payload.payment_metadata ? JSON.stringify(payload.payment_metadata) : null,
      payload.payment_notes || null,
      payload.pre_checkin_status || "pendente",
      payload.pre_checkin_confirmed_at || null,
      payload.pre_checkin_due_at || defaultPreCheckinDueAt(payload.check_in),
      payload.pre_checkin_notes || null,
      payload.notes || null,
    ]
  );

  const guests = Array.isArray(payload.guests) && payload.guests.length
    ? payload.guests
    : [
        {
          client_id: payload.client_id || null,
          full_name: guestName,
          email: guestEmail,
          guest_type: "adulto",
          is_primary: true,
        },
      ];
  await syncReservationGuests(id, guests, payload.client_id || null);

  const payments = Array.isArray(payload.payments)
    ? payload.payments
    : payload.payment_method
      ? [
          {
            method: payload.payment_method,
            status: payload.payment_status || "pendente",
            amount: Number(payload.total || 0),
            installments: Number(payload.payment_installments || 1),
            reference_code: payload.payment_reference || null,
            receipt_url: payload.payment_receipt_url || null,
            due_at: payload.payment_due_date || null,
            notes: payload.payment_notes || null,
          },
        ]
      : [];
  await syncReservationPayments(id, payments);

  const created = await fetchReservationById(id);
  res.status(201).json(created);
}

async function updateReservation(req, res) {
  const id = req.params.id || req.query.id;
  const payload = req.body || {};
  const allowed = [
    "property_id",
    "client_id",
    "booking_code",
    "guest_name",
    "email",
    "check_in",
    "check_out",
    "status",
    "adults_count",
    "children_count",
    "infants_count",
    "special_requests",
    "payment_method",
    "payment_status",
    "paid_amount",
    "total",
    "payment_due_date",
    "payment_reference",
    "payment_installments",
    "payment_receipt_url",
    "payment_gateway",
    "payment_metadata",
    "payment_notes",
    "pre_checkin_status",
    "pre_checkin_confirmed_at",
    "pre_checkin_due_at",
    "pre_checkin_notes",
    "notes",
  ];
  const entries = Object.entries(payload).filter(([key]) => allowed.includes(key));
  const hasRelations = Array.isArray(payload.guests) || Array.isArray(payload.payments);
  if (!entries.length && !hasRelations) {
    return res.status(400).json({ message: "Nenhum campo para atualizar." });
  }
  if (payload.check_in && payload.check_out && new Date(payload.check_out).getTime() <= new Date(payload.check_in).getTime()) {
    return res.status(400).json({ message: "Check-out deve ser posterior ao check-in." });
  }

  const columns = entries.map(([key]) => `${key} = ?`);
  const values = entries.map(([key, value]) => {
    if (key === "payment_metadata") return value ? JSON.stringify(value) : null;
    return value;
  });

  if (columns.length) {
    values.push(id);
    await query(`UPDATE reservations SET ${columns.join(", ")} WHERE id = ?`, values);
  }
  const current = await fetchById("reservations", id);
  if (!current) {
    return res.status(404).json({ message: "Reserva nao encontrada." });
  }

  if (Array.isArray(payload.guests)) {
    await syncReservationGuests(id, payload.guests, payload.client_id ?? current.client_id ?? null);
  }
  if (Array.isArray(payload.payments)) {
    await syncReservationPayments(id, payload.payments);
  }

  const updated = await fetchReservationById(id);
  return res.json(updated);
}

async function getSettings(_req, res) {
  const rows = await query("SELECT * FROM settings");
  const settings = {};
  rows.forEach((row) => {
    settings[row.id] = row.value;
  });
  res.json(settings);
}

async function updateSettings(req, res) {
  const payload = req.body || {};
  for (const [key, value] of Object.entries(payload)) {
    await query("REPLACE INTO settings (id, value) VALUES (?, ?)", [key, value]);
  }
  res.json({ message: "Configuracoes atualizadas." });
}

function uploadSinglePhoto(req, res, folderName) {
  if (!req.file) {
    return res.status(400).json({ message: "Nenhum arquivo enviado." });
  }
  res.status(201).json({ url: `/uploads/${folderName}/${req.file.filename}` });
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
app.post("/api/photos/upload", uploadPropertyPhotos.array("photos"), uploadPhotos);
app.post("/api/upload-photos.php", uploadPropertyPhotos.array("photos"), uploadPhotos);
app.patch("/api/photos/:id", updatePhoto);
app.patch("/api/photo.php", updatePhoto);
app.delete("/api/photos/:id", removePhoto);
app.delete("/api/photo.php", removePhoto);

app.get("/api/clients", listClients);
app.get("/api/clients.php", listClients);
app.post("/api/clients", createClient);
app.post("/api/clients.php", createClient);
app.get("/api/clients/:id", getClient);
app.get("/api/client.php", getClient);
app.patch("/api/clients/:id", updateClient);
app.patch("/api/client.php", updateClient);
app.delete("/api/clients/:id", removeClient);
app.delete("/api/client.php", removeClient);

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

app.post("/api/upload-site.php", uploadSite.single("photo"), (req, res) => uploadSinglePhoto(req, res, "site"));
app.post("/api/upload-client-photo.php", uploadClient.single("photo"), (req, res) => uploadSinglePhoto(req, res, "client-profiles"));

app.use("/api/admin", adminCmsRouter);
app.use("/api/public", publicCmsRouter);

app.use((error, _req, res, _next) => {
  console.error(error);
  const message = error?.message || "Erro interno no servidor.";
  const status = /nao encontrada|invalido|obrigatorio|pertence/i.test(message) ? 400 : 500;
  res.status(status).json({ message });
});

async function start() {
  await bootstrapBooking();
  await bootstrapCms(pool);
  app.listen(port, () => {
    console.log(`API ready on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error("Failed to bootstrap API", error);
  process.exit(1);
});

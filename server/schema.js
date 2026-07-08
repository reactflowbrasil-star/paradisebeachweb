import { query } from "./db.js";

export async function ensureSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS properties (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      title VARCHAR(255) NOT NULL,
      type ENUM('casa','villa','apartamento','terreno') NOT NULL DEFAULT 'casa',
      listing ENUM('venda','aluguel') NOT NULL DEFAULT 'aluguel',
      price DECIMAL(12,2) NOT NULL DEFAULT 0,
      price_label VARCHAR(80) NULL,
      location VARCHAR(255) NOT NULL DEFAULT '',
      city VARCHAR(120) NOT NULL DEFAULT '',
      state VARCHAR(2) NOT NULL DEFAULT '',
      description TEXT NOT NULL,
      bedrooms INT NOT NULL DEFAULT 0,
      bathrooms INT NOT NULL DEFAULT 0,
      area DECIMAL(12,2) NOT NULL DEFAULT 0,
      ocean_view BOOLEAN NOT NULL DEFAULT false,
      featured BOOLEAN NOT NULL DEFAULT false,
      status ENUM('disponivel','vendido','alugado') NOT NULL DEFAULT 'disponivel',
      amenities JSON NULL,
      lat DECIMAL(10,7) NULL,
      lng DECIMAL(10,7) NULL,
      whatsapp VARCHAR(32) NULL,
      booking_method ENUM('whatsapp','email','phone','manual','external') NOT NULL DEFAULT 'whatsapp',
      booking_url VARCHAR(500) NULL,
      booking_notes TEXT NULL,
      min_nights INT NOT NULL DEFAULT 1,
      max_guests INT NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS property_photos (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      property_id CHAR(36) NOT NULL,
      url VARCHAR(700) NOT NULL,
      caption VARCHAR(255) NOT NULL DEFAULT '',
      published BOOLEAN NOT NULL DEFAULT true,
      cover BOOLEAN NOT NULL DEFAULT false,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT property_photos_property_id_fk
        FOREIGN KEY (property_id) REFERENCES properties(id)
        ON DELETE CASCADE
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS reservations (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      property_id CHAR(36) NOT NULL,
      guest_name VARCHAR(160) NOT NULL,
      email VARCHAR(180) NOT NULL,
      phone VARCHAR(40) NULL,
      check_in DATE NOT NULL,
      check_out DATE NOT NULL,
      status ENUM('confirmada','pendente','cancelada') NOT NULL DEFAULT 'pendente',
      total DECIMAL(12,2) NOT NULL DEFAULT 0,
      notes TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT reservations_property_id_fk
        FOREIGN KEY (property_id) REFERENCES properties(id)
        ON DELETE CASCADE
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS admins (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      email VARCHAR(180) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY admins_email_uniq (email)
    )
  `);
}


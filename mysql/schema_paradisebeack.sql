CREATE TABLE IF NOT EXISTS properties (
  id CHAR(36) NOT NULL PRIMARY KEY,
  title TEXT NOT NULL,
  type ENUM('casa', 'villa', 'apartamento', 'terreno') NOT NULL DEFAULT 'casa',
  listing ENUM('venda', 'aluguel') NOT NULL DEFAULT 'venda',
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  price_label TEXT NULL,
  location TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  description LONGTEXT NOT NULL,
  bedrooms INT NOT NULL DEFAULT 0,
  bathrooms INT NOT NULL DEFAULT 0,
  area DECIMAL(12,2) NOT NULL DEFAULT 0,
  ocean_view BOOLEAN NOT NULL DEFAULT FALSE,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  status ENUM('disponivel', 'vendido', 'alugado') NOT NULL DEFAULT 'disponivel',
  amenities JSON NOT NULL,
  lat DECIMAL(10,7) NULL,
  lng DECIMAL(10,7) NULL,
  whatsapp TEXT NULL DEFAULT NULL,
  address TEXT NULL DEFAULT NULL,
  cep TEXT NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS property_photos (
  id CHAR(36) NOT NULL PRIMARY KEY,
  property_id CHAR(36) NOT NULL,
  url TEXT NOT NULL,
  caption TEXT NOT NULL,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  cover BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_property_photos_property
    FOREIGN KEY (property_id) REFERENCES properties(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS clients (
  id CHAR(36) NOT NULL PRIMARY KEY,
  full_name VARCHAR(180) NOT NULL,
  email VARCHAR(180) NOT NULL,
  phone VARCHAR(40) NULL,
  document VARCHAR(40) NULL,
  document_type VARCHAR(30) NULL,
  birth_date DATE NULL,
  nationality VARCHAR(80) NULL,
  address_line1 VARCHAR(180) NULL,
  address_line2 VARCHAR(180) NULL,
  city VARCHAR(120) NULL,
  state VARCHAR(120) NULL,
  country VARCHAR(120) NULL,
  zip_code VARCHAR(20) NULL,
  emergency_contact_name VARCHAR(180) NULL,
  emergency_contact_phone VARCHAR(40) NULL,
  vip_status BOOLEAN NOT NULL DEFAULT FALSE,
  tags_json JSON NULL,
  profile_photo_url TEXT NULL,
  preferred_payment_method ENUM('pix', 'cartao_credito', 'cartao_debito', 'transferencia', 'boleto', 'dinheiro') NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_clients_email (email)
);

CREATE TABLE IF NOT EXISTS reservations (
  id CHAR(36) NOT NULL PRIMARY KEY,
  property_id CHAR(36) NOT NULL,
  client_id CHAR(36) NULL,
  booking_code VARCHAR(40) NULL,
  guest_name TEXT NOT NULL,
  email TEXT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  status ENUM('confirmada', 'pendente', 'cancelada') NOT NULL DEFAULT 'pendente',
  adults_count INT NOT NULL DEFAULT 1,
  children_count INT NOT NULL DEFAULT 0,
  infants_count INT NOT NULL DEFAULT 0,
  special_requests TEXT NULL,
  payment_method ENUM('pix', 'cartao_credito', 'cartao_debito', 'transferencia', 'boleto', 'dinheiro') NULL,
  payment_status ENUM('pendente', 'parcial', 'pago', 'reembolsado', 'cancelado') NOT NULL DEFAULT 'pendente',
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_due_date DATE NULL,
  payment_reference VARCHAR(120) NULL,
  payment_installments INT NOT NULL DEFAULT 1,
  payment_receipt_url TEXT NULL,
  payment_gateway VARCHAR(80) NULL,
  payment_metadata JSON NULL,
  payment_notes TEXT NULL,
  pre_checkin_status ENUM('pendente', 'confirmado', 'atrasado', 'dispensado') NOT NULL DEFAULT 'pendente',
  pre_checkin_confirmed_at DATETIME NULL,
  pre_checkin_due_at DATETIME NULL,
  pre_checkin_notes TEXT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_reservations_property
    FOREIGN KEY (property_id) REFERENCES properties(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_reservations_client
    FOREIGN KEY (client_id) REFERENCES clients(id)
    ON DELETE SET NULL,
  UNIQUE KEY uq_reservations_booking_code (booking_code)
);

CREATE TABLE IF NOT EXISTS reservation_guests (
  id CHAR(36) NOT NULL PRIMARY KEY,
  reservation_id CHAR(36) NOT NULL,
  client_id CHAR(36) NULL,
  full_name VARCHAR(180) NOT NULL,
  email VARCHAR(180) NULL,
  phone VARCHAR(40) NULL,
  document VARCHAR(40) NULL,
  birth_date DATE NULL,
  guest_type ENUM('adulto', 'crianca', 'bebe') NOT NULL DEFAULT 'adulto',
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_reservation_guests_reservation
    FOREIGN KEY (reservation_id) REFERENCES reservations(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_reservation_guests_client
    FOREIGN KEY (client_id) REFERENCES clients(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS reservation_payments (
  id CHAR(36) NOT NULL PRIMARY KEY,
  reservation_id CHAR(36) NOT NULL,
  method ENUM('pix', 'cartao_credito', 'cartao_debito', 'transferencia', 'boleto', 'dinheiro') NOT NULL,
  status ENUM('pendente', 'parcial', 'pago', 'reembolsado', 'cancelado') NOT NULL DEFAULT 'pendente',
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'BRL',
  reference_code VARCHAR(120) NULL,
  external_transaction_id VARCHAR(120) NULL,
  installments INT NOT NULL DEFAULT 1,
  due_at DATETIME NULL,
  paid_at DATETIME NULL,
  pix_qr_code TEXT NULL,
  pix_copy_paste TEXT NULL,
  card_brand VARCHAR(40) NULL,
  card_last4 VARCHAR(4) NULL,
  receipt_url TEXT NULL,
  notes TEXT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_reservation_payments_reservation
    FOREIGN KEY (reservation_id) REFERENCES reservations(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_reservations_client_id ON reservations (client_id);
CREATE INDEX idx_reservations_payment_status ON reservations (payment_status);
CREATE INDEX idx_reservations_pre_checkin_status ON reservations (pre_checkin_status);
CREATE INDEX idx_reservations_check_in ON reservations (check_in);
CREATE INDEX idx_clients_full_name ON clients (full_name);
CREATE INDEX idx_reservation_guests_reservation_id ON reservation_guests (reservation_id);
CREATE INDEX idx_reservation_payments_reservation_id ON reservation_payments (reservation_id);

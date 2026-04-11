<?php
require_once __DIR__ . "/common.php";

$pdo = db();

$statements = [
    "CREATE TABLE IF NOT EXISTS clients (\n      id CHAR(36) NOT NULL PRIMARY KEY,\n      full_name VARCHAR(180) NOT NULL,\n      email VARCHAR(180) NOT NULL,\n      phone VARCHAR(40) NULL,\n      document VARCHAR(40) NULL,\n      birth_date DATE NULL,\n      profile_photo_url TEXT NULL,\n      preferred_payment_method ENUM('pix', 'cartao_credito', 'cartao_debito', 'transferencia', 'boleto', 'dinheiro') NULL,\n      notes TEXT NULL,\n      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,\n      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n      UNIQUE KEY uq_clients_email (email)\n    )",
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
    "ALTER TABLE clients ADD COLUMN vip_status TINYINT(1) NOT NULL DEFAULT 0 AFTER emergency_contact_phone",
    "ALTER TABLE clients ADD COLUMN tags_json JSON NULL AFTER vip_status",
    "ALTER TABLE properties ADD COLUMN lat DECIMAL(10,8) DEFAULT NULL",
    "ALTER TABLE properties ADD COLUMN lng DECIMAL(11,8) DEFAULT NULL",
    "ALTER TABLE properties ADD COLUMN whatsapp VARCHAR(20) DEFAULT NULL",
    "ALTER TABLE properties ADD COLUMN address VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE properties ADD COLUMN cep VARCHAR(20) DEFAULT NULL",
    "ALTER TABLE reservations ADD COLUMN client_id CHAR(36) NULL AFTER property_id",
    "ALTER TABLE reservations ADD COLUMN booking_code VARCHAR(40) NULL AFTER client_id",
    "ALTER TABLE reservations ADD COLUMN adults_count INT NOT NULL DEFAULT 1 AFTER status",
    "ALTER TABLE reservations ADD COLUMN children_count INT NOT NULL DEFAULT 0 AFTER adults_count",
    "ALTER TABLE reservations ADD COLUMN infants_count INT NOT NULL DEFAULT 0 AFTER children_count",
    "ALTER TABLE reservations ADD COLUMN special_requests TEXT NULL AFTER infants_count",
    "ALTER TABLE reservations ADD COLUMN payment_method ENUM('pix', 'cartao_credito', 'cartao_debito', 'transferencia', 'boleto', 'dinheiro') NULL AFTER special_requests",
    "ALTER TABLE reservations ADD COLUMN payment_status ENUM('pendente', 'parcial', 'pago', 'reembolsado', 'cancelado') NOT NULL DEFAULT 'pendente' AFTER payment_method",
    "ALTER TABLE reservations ADD COLUMN paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER payment_status",
    "ALTER TABLE reservations ADD COLUMN payment_due_date DATE NULL AFTER total",
    "ALTER TABLE reservations ADD COLUMN payment_reference VARCHAR(120) NULL AFTER payment_due_date",
    "ALTER TABLE reservations ADD COLUMN payment_installments INT NOT NULL DEFAULT 1 AFTER payment_reference",
    "ALTER TABLE reservations ADD COLUMN payment_receipt_url TEXT NULL AFTER payment_installments",
    "ALTER TABLE reservations ADD COLUMN payment_gateway VARCHAR(80) NULL AFTER payment_receipt_url",
    "ALTER TABLE reservations ADD COLUMN payment_metadata JSON NULL AFTER payment_gateway",
    "ALTER TABLE reservations ADD COLUMN payment_notes TEXT NULL AFTER payment_metadata",
    "ALTER TABLE reservations ADD COLUMN pre_checkin_status ENUM('pendente', 'confirmado', 'atrasado', 'dispensado') NOT NULL DEFAULT 'pendente' AFTER payment_notes",
    "ALTER TABLE reservations ADD COLUMN pre_checkin_confirmed_at DATETIME NULL AFTER pre_checkin_status",
    "ALTER TABLE reservations ADD COLUMN pre_checkin_due_at DATETIME NULL AFTER pre_checkin_confirmed_at",
    "ALTER TABLE reservations ADD COLUMN pre_checkin_notes TEXT NULL AFTER pre_checkin_due_at",
    "CREATE TABLE IF NOT EXISTS reservation_guests (\n      id CHAR(36) NOT NULL PRIMARY KEY,\n      reservation_id CHAR(36) NOT NULL,\n      client_id CHAR(36) NULL,\n      full_name VARCHAR(180) NOT NULL,\n      email VARCHAR(180) NULL,\n      phone VARCHAR(40) NULL,\n      document VARCHAR(40) NULL,\n      birth_date DATE NULL,\n      guest_type ENUM('adulto', 'crianca', 'bebe') NOT NULL DEFAULT 'adulto',\n      is_primary TINYINT(1) NOT NULL DEFAULT 0,\n      notes TEXT NULL,\n      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,\n      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n      CONSTRAINT fk_reservation_guests_reservation FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,\n      CONSTRAINT fk_reservation_guests_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL\n    )",
    "CREATE TABLE IF NOT EXISTS reservation_payments (\n      id CHAR(36) NOT NULL PRIMARY KEY,\n      reservation_id CHAR(36) NOT NULL,\n      method ENUM('pix', 'cartao_credito', 'cartao_debito', 'transferencia', 'boleto', 'dinheiro') NOT NULL,\n      status ENUM('pendente', 'parcial', 'pago', 'reembolsado', 'cancelado') NOT NULL DEFAULT 'pendente',\n      amount DECIMAL(12,2) NOT NULL DEFAULT 0,\n      currency CHAR(3) NOT NULL DEFAULT 'BRL',\n      reference_code VARCHAR(120) NULL,\n      external_transaction_id VARCHAR(120) NULL,\n      installments INT NOT NULL DEFAULT 1,\n      due_at DATETIME NULL,\n      paid_at DATETIME NULL,\n      pix_qr_code TEXT NULL,\n      pix_copy_paste TEXT NULL,\n      card_brand VARCHAR(40) NULL,\n      card_last4 VARCHAR(4) NULL,\n      receipt_url TEXT NULL,\n      notes TEXT NULL,\n      metadata JSON NULL,\n      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,\n      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n      CONSTRAINT fk_reservation_payments_reservation FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE\n    )",
    "CREATE UNIQUE INDEX uq_reservations_booking_code ON reservations (booking_code)",
    "CREATE INDEX idx_reservations_client_id ON reservations (client_id)",
    "CREATE INDEX idx_reservations_payment_status ON reservations (payment_status)",
    "CREATE INDEX idx_reservations_pre_checkin_status ON reservations (pre_checkin_status)",
    "CREATE INDEX idx_reservations_check_in ON reservations (check_in)",
    "CREATE INDEX idx_clients_full_name ON clients (full_name)",
    "CREATE INDEX idx_reservation_guests_reservation_id ON reservation_guests (reservation_id)",
    "CREATE INDEX idx_reservation_payments_reservation_id ON reservation_payments (reservation_id)",
    "ALTER TABLE reservations ADD CONSTRAINT fk_reservations_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL",
    "CREATE TABLE IF NOT EXISTS users (
      id CHAR(36) NOT NULL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_users_email (email)
    )"
];

$results = [];
foreach ($statements as $sql) {
    try {
        $pdo->exec($sql);
        $results[] = ["sql" => $sql, "status" => "success"];
    } catch (Throwable $e) {
        $results[] = ["sql" => $sql, "status" => "error", "message" => $e->getMessage()];
    }
}

respond(["migration" => "done", "details" => $results]);

-- Internal CMS schema for frontend content management
-- Works alongside the existing Paradise Beach schema.

CREATE TABLE IF NOT EXISTS pages (
  id CHAR(36) NOT NULL PRIMARY KEY,
  slug VARCHAR(120) NOT NULL,
  page_key VARCHAR(120) NOT NULL,
  name VARCHAR(180) NOT NULL,
  title VARCHAR(255) NULL,
  description TEXT NULL,
  template VARCHAR(120) NOT NULL DEFAULT 'default',
  status ENUM('draft', 'published', 'inactive') NOT NULL DEFAULT 'draft',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  UNIQUE KEY uq_pages_slug (slug),
  UNIQUE KEY uq_pages_key (page_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS media (
  id CHAR(36) NOT NULL PRIMARY KEY,
  media_key VARCHAR(120) NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  mime_type VARCHAR(120) NULL,
  alt_text VARCHAR(255) NULL,
  caption TEXT NULL,
  size_bytes BIGINT NULL,
  status ENUM('draft', 'published', 'inactive') NOT NULL DEFAULT 'published',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  UNIQUE KEY uq_media_key (media_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS page_sections (
  id CHAR(36) NOT NULL PRIMARY KEY,
  page_id CHAR(36) NOT NULL,
  section_key VARCHAR(120) NOT NULL,
  name VARCHAR(180) NOT NULL,
  section_type VARCHAR(120) NOT NULL DEFAULT 'content',
  title VARCHAR(255) NULL,
  subtitle VARCHAR(255) NULL,
  description TEXT NULL,
  text_content LONGTEXT NULL,
  image_url TEXT NULL,
  link_url TEXT NULL,
  button_label VARCHAR(180) NULL,
  media_id CHAR(36) NULL,
  config_json LONGTEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status ENUM('draft', 'published', 'inactive') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  UNIQUE KEY uq_page_section_key (page_id, section_key),
  KEY idx_page_sections_page (page_id),
  CONSTRAINT fk_page_sections_page FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
  CONSTRAINT fk_page_sections_media FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS content_items (
  id CHAR(36) NOT NULL PRIMARY KEY,
  page_id CHAR(36) NOT NULL,
  section_id CHAR(36) NULL,
  item_type VARCHAR(120) NOT NULL DEFAULT 'text',
  category VARCHAR(120) NULL,
  content_key VARCHAR(120) NOT NULL,
  title VARCHAR(255) NULL,
  subtitle VARCHAR(255) NULL,
  description TEXT NULL,
  text_content LONGTEXT NULL,
  image_url TEXT NULL,
  icon_name VARCHAR(120) NULL,
  link_url TEXT NULL,
  button_label VARCHAR(180) NULL,
  media_id CHAR(36) NULL,
  meta_json LONGTEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status ENUM('draft', 'published', 'inactive') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  UNIQUE KEY uq_content_items_key (page_id, content_key),
  KEY idx_content_items_page (page_id),
  KEY idx_content_items_section (section_id),
  CONSTRAINT fk_content_items_page FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
  CONSTRAINT fk_content_items_section FOREIGN KEY (section_id) REFERENCES page_sections(id) ON DELETE CASCADE,
  CONSTRAINT fk_content_items_media FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menus (
  id CHAR(36) NOT NULL PRIMARY KEY,
  menu_key VARCHAR(120) NOT NULL,
  label VARCHAR(180) NOT NULL,
  url VARCHAR(255) NOT NULL,
  page_id CHAR(36) NULL,
  parent_id CHAR(36) NULL,
  target VARCHAR(30) NOT NULL DEFAULT '_self',
  css_class VARCHAR(120) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status ENUM('draft', 'published', 'inactive') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  KEY idx_menus_key (menu_key),
  CONSTRAINT fk_menus_page FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE SET NULL,
  CONSTRAINT fk_menus_parent FOREIGN KEY (parent_id) REFERENCES menus(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS site_settings (
  id CHAR(36) NOT NULL PRIMARY KEY,
  setting_group VARCHAR(120) NOT NULL DEFAULT 'general',
  setting_key VARCHAR(120) NOT NULL,
  label VARCHAR(180) NOT NULL,
  value_type ENUM('text', 'textarea', 'number', 'boolean', 'json', 'url', 'email', 'phone') NOT NULL DEFAULT 'text',
  setting_value LONGTEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status ENUM('draft', 'published', 'inactive') NOT NULL DEFAULT 'published',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  UNIQUE KEY uq_site_settings_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seo_metadata (
  id CHAR(36) NOT NULL PRIMARY KEY,
  page_id CHAR(36) NULL,
  route_path VARCHAR(255) NOT NULL,
  seo_title VARCHAR(255) NULL,
  seo_description TEXT NULL,
  canonical_url VARCHAR(255) NULL,
  og_image_url TEXT NULL,
  robots VARCHAR(120) NULL,
  schema_json LONGTEXT NULL,
  status ENUM('draft', 'published', 'inactive') NOT NULL DEFAULT 'published',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  UNIQUE KEY uq_seo_route (route_path),
  UNIQUE KEY uq_seo_page (page_id),
  CONSTRAINT fk_seo_page FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Example seed data
INSERT INTO pages (id, slug, page_key, name, title, description, template, status, sort_order)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'home', 'home', 'Home', 'Seu Paraiso a Beira-Mar', 'Landing page principal', 'landing', 'published', 1),
  ('22222222-2222-2222-2222-222222222222', 'sobre', 'about', 'Sobre', 'Sobre a Paradise Beach', 'Apresentacao institucional', 'institutional', 'published', 2),
  ('33333333-3333-3333-3333-333333333333', 'contato', 'contact', 'Contato', 'Fale Conosco', 'Contato e formulario', 'contact', 'published', 3)
ON DUPLICATE KEY UPDATE name = VALUES(name), title = VALUES(title), updated_at = CURRENT_TIMESTAMP;

INSERT INTO page_sections (id, page_id, section_key, name, section_type, title, subtitle, button_label, link_url, sort_order, status)
VALUES
  ('aaaaaaa1-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'hero', 'Hero Principal', 'hero', 'Seu Paraiso a Beira-Mar', 'Imoveis exclusivos de alto padrao para viver e investir no litoral brasileiro.', 'Reservar Imovel', '/aluguel', 1, 'published'),
  ('aaaaaaa2-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'benefits', 'Beneficios', 'grid', 'Por que Paradise Beach?', 'Mais de uma decada de expertise em imoveis de alto padrao.', NULL, NULL, 2, 'published'),
  ('bbbbbbb1-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'story', 'Historia', 'rich-text', 'Nossa Missao', NULL, NULL, NULL, 1, 'published'),
  ('ccccccc1-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'info', 'Informacoes', 'cards', 'Informacoes de Contato', NULL, NULL, NULL, 1, 'published')
ON DUPLICATE KEY UPDATE title = VALUES(title), subtitle = VALUES(subtitle), updated_at = CURRENT_TIMESTAMP;

INSERT INTO content_items (id, page_id, section_id, item_type, category, content_key, title, description, icon_name, sort_order, status)
VALUES
  ('ddddddd1-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'aaaaaaa2-1111-1111-1111-111111111111', 'benefit', 'home-benefits', 'home-benefit-1', 'Exclusividade', 'Imoveis selecionados e curados para os mais exigentes.', 'Gem', 1, 'published'),
  ('ddddddd2-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'aaaaaaa2-1111-1111-1111-111111111111', 'benefit', 'home-benefits', 'home-benefit-2', 'Seguranca', 'Transacoes seguras com assessoria juridica completa.', 'Shield', 2, 'published'),
  ('eeeeeee1-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'ccccccc1-3333-3333-3333-333333333333', 'contact-card', 'contact-info', 'contact-phone', 'Telefone', '(81) 9229-2821', 'Phone', 1, 'published')
ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), updated_at = CURRENT_TIMESTAMP;

INSERT INTO menus (id, menu_key, label, url, page_id, sort_order, status)
VALUES
  ('f1111111-1111-1111-1111-111111111111', 'main', 'Home', '/', '11111111-1111-1111-1111-111111111111', 1, 'published'),
  ('f2222222-2222-2222-2222-222222222222', 'main', 'Sobre Nos', '/sobre', '22222222-2222-2222-2222-222222222222', 2, 'published'),
  ('f3333333-3333-3333-3333-333333333333', 'footer', 'Contato', '/contato', '33333333-3333-3333-3333-333333333333', 1, 'published')
ON DUPLICATE KEY UPDATE label = VALUES(label), url = VALUES(url), updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_settings (id, setting_group, setting_key, label, value_type, setting_value, sort_order, status)
VALUES
  ('s1111111-1111-1111-1111-111111111111', 'branding', 'brand_name', 'Nome da Marca', 'text', 'Paradise Beach', 1, 'published'),
  ('s2222222-2222-2222-2222-222222222222', 'contact', 'contact_email', 'E-mail', 'email', 'reservaparadisebeach@gmail.com', 2, 'published'),
  ('s3333333-3333-3333-3333-333333333333', 'contact', 'contact_phone', 'Telefone', 'phone', '(81) 9229-2821', 3, 'published')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP;

INSERT INTO seo_metadata (id, page_id, route_path, seo_title, seo_description, robots, status)
VALUES
  ('seo11111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '/', 'Seu Paraiso a Beira-Mar | Paradise Beach', 'Imoveis exclusivos de alto padrao para viver e investir no litoral brasileiro.', 'index,follow', 'published'),
  ('seo22222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '/sobre', 'Sobre a Paradise Beach', 'Mais de uma decada conectando pessoas aos seus sonhos a beira-mar.', 'index,follow', 'published')
ON DUPLICATE KEY UPDATE seo_title = VALUES(seo_title), seo_description = VALUES(seo_description), updated_at = CURRENT_TIMESTAMP;

-- Example soft delete
-- UPDATE content_items SET status = 'inactive', deleted_at = CURRENT_TIMESTAMP WHERE id = 'ddddddd1-1111-1111-1111-111111111111';
-- UPDATE page_sections SET status = 'inactive', deleted_at = CURRENT_TIMESTAMP WHERE id = 'aaaaaaa2-1111-1111-1111-111111111111';

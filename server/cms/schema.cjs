const { randomUUID } = require("crypto");

const CMS_TABLES = [
  `CREATE TABLE IF NOT EXISTS pages (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS media (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS page_sections (
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
    KEY idx_page_sections_status (status),
    CONSTRAINT fk_page_sections_page FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    CONSTRAINT fk_page_sections_media FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS content_items (
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
    KEY idx_content_items_status (status),
    CONSTRAINT fk_content_items_page FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    CONSTRAINT fk_content_items_section FOREIGN KEY (section_id) REFERENCES page_sections(id) ON DELETE CASCADE,
    CONSTRAINT fk_content_items_media FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS menus (
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
    KEY idx_menus_parent (parent_id),
    CONSTRAINT fk_menus_page FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE SET NULL,
    CONSTRAINT fk_menus_parent FOREIGN KEY (parent_id) REFERENCES menus(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS site_settings (
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
    UNIQUE KEY uq_site_settings_key (setting_key),
    KEY idx_site_settings_group (setting_group)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS seo_metadata (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

function parseJsonSafe(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function ensurePage(pool, page) {
  const [rows] = await pool.query("SELECT id FROM pages WHERE page_key = ? LIMIT 1", [page.page_key]);
  if (rows.length) return rows[0].id;

  const id = randomUUID();
  await pool.query(
    `INSERT INTO pages (id, slug, page_key, name, title, description, template, status, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, page.slug, page.page_key, page.name, page.title || null, page.description || null, page.template || "default", page.status || "published", page.sort_order || 0]
  );
  return id;
}

async function ensureSection(pool, section) {
  const [rows] = await pool.query(
    "SELECT id FROM page_sections WHERE page_id = ? AND section_key = ? LIMIT 1",
    [section.page_id, section.section_key]
  );
  if (rows.length) return rows[0].id;

  const id = randomUUID();
  await pool.query(
    `INSERT INTO page_sections (
      id, page_id, section_key, name, section_type, title, subtitle, description, text_content,
      image_url, link_url, button_label, config_json, sort_order, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      section.page_id,
      section.section_key,
      section.name,
      section.section_type || "content",
      section.title || null,
      section.subtitle || null,
      section.description || null,
      section.text_content || null,
      section.image_url || null,
      section.link_url || null,
      section.button_label || null,
      section.config_json ? JSON.stringify(section.config_json) : null,
      section.sort_order || 0,
      section.status || "published",
    ]
  );
  return id;
}

async function ensureContentItem(pool, item) {
  const [rows] = await pool.query(
    "SELECT id FROM content_items WHERE page_id = ? AND content_key = ? LIMIT 1",
    [item.page_id, item.content_key]
  );
  if (rows.length) return rows[0].id;

  const id = randomUUID();
  await pool.query(
    `INSERT INTO content_items (
      id, page_id, section_id, item_type, category, content_key, title, subtitle, description,
      text_content, image_url, icon_name, link_url, button_label, meta_json, sort_order, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      item.page_id,
      item.section_id || null,
      item.item_type || "text",
      item.category || null,
      item.content_key,
      item.title || null,
      item.subtitle || null,
      item.description || null,
      item.text_content || null,
      item.image_url || null,
      item.icon_name || null,
      item.link_url || null,
      item.button_label || null,
      item.meta_json ? JSON.stringify(item.meta_json) : null,
      item.sort_order || 0,
      item.status || "published",
    ]
  );
  return id;
}

async function ensureMenuItem(pool, item) {
  const [rows] = await pool.query(
    "SELECT id FROM menus WHERE menu_key = ? AND label = ? AND deleted_at IS NULL LIMIT 1",
    [item.menu_key, item.label]
  );
  if (rows.length) return rows[0].id;

  const id = randomUUID();
  await pool.query(
    `INSERT INTO menus (id, menu_key, label, url, page_id, target, css_class, sort_order, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, item.menu_key, item.label, item.url, item.page_id || null, item.target || "_self", item.css_class || null, item.sort_order || 0, item.status || "published"]
  );
  return id;
}

async function ensureSetting(pool, setting) {
  const [rows] = await pool.query(
    "SELECT id FROM site_settings WHERE setting_key = ? LIMIT 1",
    [setting.setting_key]
  );
  if (rows.length) return rows[0].id;

  const id = randomUUID();
  await pool.query(
    `INSERT INTO site_settings (id, setting_group, setting_key, label, value_type, setting_value, sort_order, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      setting.setting_group || "general",
      setting.setting_key,
      setting.label,
      setting.value_type || "text",
      setting.setting_value ?? null,
      setting.sort_order || 0,
      setting.status || "published",
    ]
  );
  return id;
}

async function ensureSeo(pool, seo) {
  const [rows] = await pool.query("SELECT id FROM seo_metadata WHERE route_path = ? LIMIT 1", [seo.route_path]);
  if (rows.length) return rows[0].id;

  const id = randomUUID();
  await pool.query(
    `INSERT INTO seo_metadata (
      id, page_id, route_path, seo_title, seo_description, canonical_url, og_image_url, robots, schema_json, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      seo.page_id || null,
      seo.route_path,
      seo.seo_title || null,
      seo.seo_description || null,
      seo.canonical_url || null,
      seo.og_image_url || null,
      seo.robots || null,
      seo.schema_json ? JSON.stringify(seo.schema_json) : null,
      seo.status || "published",
    ]
  );
  return id;
}
async function seedCms(pool) {
  const homePageId = await ensurePage(pool, {
    page_key: "home",
    slug: "home",
    name: "Home",
    title: "Seu Paraiso a Beira-Mar",
    description: "Landing page principal do site.",
    template: "landing",
    sort_order: 1,
  });
  const aboutPageId = await ensurePage(pool, {
    page_key: "about",
    slug: "sobre",
    name: "Sobre",
    title: "Sobre a Paradise Beach",
    description: "Apresentacao institucional da empresa.",
    template: "institutional",
    sort_order: 2,
  });
  const contactPageId = await ensurePage(pool, {
    page_key: "contact",
    slug: "contato",
    name: "Contato",
    title: "Fale Conosco",
    description: "Informacoes de contato e formulario.",
    template: "contact",
    sort_order: 3,
  });
  const rentPageId = await ensurePage(pool, {
    page_key: "rentals",
    slug: "aluguel",
    name: "Imoveis para Aluguel",
    title: "Imoveis para Aluguel",
    description: "Catalogo de imoveis para aluguel.",
    template: "listing",
    sort_order: 4,
  });

  const homeHeroId = await ensureSection(pool, {
    page_id: homePageId,
    section_key: "hero",
    name: "Hero Principal",
    section_type: "hero",
    title: "Seu Paraiso a Beira-Mar",
    subtitle: "Imoveis exclusivos de alto padrao para viver e investir no litoral brasileiro.",
    button_label: "Reservar Imovel",
    link_url: "/aluguel",
    sort_order: 1,
    config_json: {
      secondaryButtonLabel: "Fale Conosco",
      secondaryButtonUrl: "/contato",
      heroSlides: [],
      typewriterPhrases: [
        "Seu Paraiso a Beira-Mar",
        "Imoveis exclusivos a Beira-Mar",
        "Sua villa de luxo te espera",
        "Descubra o litoral Brasileiro",
        "Onde o luxo encontra a natureza"
      ]
    }
  });
  const homeBenefitsId = await ensureSection(pool, {
    page_id: homePageId,
    section_key: "benefits",
    name: "Beneficios",
    section_type: "grid",
    title: "Por que Paradise Beach?",
    subtitle: "Mais de uma decada de expertise em imoveis de alto padrao no litoral brasileiro.",
    sort_order: 2,
  });
  const homeTestimonialsId = await ensureSection(pool, {
    page_id: homePageId,
    section_key: "testimonials",
    name: "Depoimentos",
    section_type: "cards",
    title: "O Que Nossos Clientes Dizem",
    subtitle: "A satisfacao dos nossos clientes e o nosso maior patrimonio.",
    sort_order: 3,
  });
  const homeNewsletterId = await ensureSection(pool, {
    page_id: homePageId,
    section_key: "newsletter",
    name: "Newsletter",
    section_type: "cta",
    title: "Receba Novidades Exclusivas",
    subtitle: "Cadastre-se e seja o primeiro a conhecer nossos lancamentos e oportunidades unicas.",
    button_label: "Inscrever-se",
    sort_order: 4,
  });
  const homeCtaId = await ensureSection(pool, {
    page_id: homePageId,
    section_key: "cta",
    name: "CTA Final",
    section_type: "cta",
    title: "Pronto para Encontrar seu Paraiso?",
    subtitle: "Nossa equipe de especialistas esta pronta para ajuda-lo a encontrar a propriedade dos seus sonhos.",
    button_label: "Entre em Contato",
    link_url: "/contato",
    sort_order: 5,
  });

  const aboutHeroId = await ensureSection(pool, {
    page_id: aboutPageId,
    section_key: "hero",
    name: "Hero Sobre",
    section_type: "hero",
    title: "Sobre a Paradise Beach",
    subtitle: "Mais de uma decada conectando pessoas aos seus sonhos a beira-mar.",
    sort_order: 1,
  });
  const aboutStoryId = await ensureSection(pool, {
    page_id: aboutPageId,
    section_key: "story",
    name: "Historia",
    section_type: "rich-text",
    title: "Nossa Missao",
    text_content: "Fundada em 2010 em Trancoso, Bahia, a Paradise Beach nasceu da paixao por unir pessoas extraordinarias a propriedades excepcionais. Acreditamos que cada cliente merece um lar que reflita seus sonhos e que esse lar deve estar nos cenarios mais deslumbrantes do litoral brasileiro.\n\nNossa equipe de consultores imobiliarios e formada por profissionais apaixonados pelo mercado de luxo, com profundo conhecimento das regioes litoraneas mais desejadas do Brasil. Oferecemos um servico personalizado, discreto e de excelencia em cada etapa da jornada.",
    sort_order: 2,
  });
  const aboutValuesId = await ensureSection(pool, {
    page_id: aboutPageId,
    section_key: "values",
    name: "Valores",
    section_type: "list",
    title: "Nossos Valores",
    sort_order: 3,
  });
  const aboutStatsId = await ensureSection(pool, {
    page_id: aboutPageId,
    section_key: "stats",
    name: "Estatisticas",
    section_type: "stats",
    sort_order: 4,
  });

  const contactHeroId = await ensureSection(pool, {
    page_id: contactPageId,
    section_key: "hero",
    name: "Hero Contato",
    section_type: "hero",
    title: "Fale Conosco",
    subtitle: "Estamos prontos para ajuda-lo a encontrar o imovel dos seus sonhos.",
    sort_order: 1,
  });
  const contactInfoId = await ensureSection(pool, {
    page_id: contactPageId,
    section_key: "info",
    name: "Informacoes",
    section_type: "cards",
    title: "Informacoes de Contato",
    sort_order: 2,
  });
  const contactHoursId = await ensureSection(pool, {
    page_id: contactPageId,
    section_key: "hours",
    name: "Horarios",
    section_type: "list",
    title: "Horario de Atendimento",
    sort_order: 3,
  });

  const rentHeroId = await ensureSection(pool, {
    page_id: rentPageId,
    section_key: "hero",
    name: "Hero Catalogo",
    section_type: "hero",
    title: "Imoveis para Aluguel",
    subtitle: "Viva experiencias inesqueciveis nas melhores praias do Brasil.",
    sort_order: 1,
  });

  const homeBenefitItems = [
    { title: "Exclusividade", description: "Imoveis selecionados e curados para os mais exigentes.", icon_name: "Gem" },
    { title: "Seguranca", description: "Transacoes seguras com assessoria juridica completa.", icon_name: "Shield" },
    { title: "Rentabilidade", description: "Alto potencial de valorizacao em localizacoes premium.", icon_name: "TrendingUp" },
    { title: "Localizacao", description: "As praias mais paradisiacas do litoral brasileiro.", icon_name: "MapPin" },
  ];
  for (const [index, item] of homeBenefitItems.entries()) {
    await ensureContentItem(pool, {
      page_id: homePageId,
      section_id: homeBenefitsId,
      item_type: "benefit",
      category: "home-benefits",
      content_key: `home-benefit-${index + 1}`,
      title: item.title,
      description: item.description,
      icon_name: item.icon_name,
      sort_order: index + 1,
    });
  }

  const testimonials = [
    {
      title: "Marina Oliveira",
      subtitle: "Empresaria",
      text_content: "A Paradise Beach transformou meu sonho em realidade. O atendimento foi impecavel do inicio ao fim.",
      meta_json: { rating: 5 }
    },
    {
      title: "Carlos Mendes",
      subtitle: "Investidor",
      text_content: "Profissionalismo e exclusividade. Encontraram a villa perfeita em Trancoso para minha familia.",
      meta_json: { rating: 5 }
    },
    {
      title: "Fernanda Costa",
      subtitle: "Arquiteta",
      text_content: "Uma curadoria excepcional de propriedades. Cada imovel e uma obra de arte a beira-mar.",
      meta_json: { rating: 5 }
    }
  ];
  for (const [index, item] of testimonials.entries()) {
    await ensureContentItem(pool, {
      page_id: homePageId,
      section_id: homeTestimonialsId,
      item_type: "testimonial",
      category: "home-testimonials",
      content_key: `home-testimonial-${index + 1}`,
      title: item.title,
      subtitle: item.subtitle,
      text_content: item.text_content,
      meta_json: item.meta_json,
      sort_order: index + 1,
    });
  }

  const values = [
    "Excelencia: Cada detalhe importa. Buscamos a perfeicao em tudo que fazemos.",
    "Confianca: Relacoes transparentes e eticas sao a base do nosso trabalho.",
    "Exclusividade: Selecionamos apenas as melhores propriedades para nossos clientes.",
    "Paixao: Amamos o que fazemos e isso se reflete em cada atendimento.",
  ];
  for (const [index, text] of values.entries()) {
    const [title, description] = text.split(": ");
    await ensureContentItem(pool, {
      page_id: aboutPageId,
      section_id: aboutValuesId,
      item_type: "value",
      category: "about-values",
      content_key: `about-value-${index + 1}`,
      title,
      description,
      sort_order: index + 1,
    });
  }

  const stats = [
    { title: "500+", subtitle: "Propriedades vendidas", icon_name: "Home" },
    { title: "1.200+", subtitle: "Clientes satisfeitos", icon_name: "Users" },
    { title: "15+", subtitle: "Regioes atendidas", icon_name: "Globe" },
    { title: "14", subtitle: "Anos de experiencia", icon_name: "Award" },
  ];
  for (const [index, item] of stats.entries()) {
    await ensureContentItem(pool, {
      page_id: aboutPageId,
      section_id: aboutStatsId,
      item_type: "stat",
      category: "about-stats",
      content_key: `about-stat-${index + 1}`,
      title: item.title,
      subtitle: item.subtitle,
      icon_name: item.icon_name,
      sort_order: index + 1,
    });
  }

  const contactCards = [
    { title: "Telefone", description: "(81) 9229-2821", icon_name: "Phone" },
    { title: "WhatsApp", description: "+55 81 9652-0169", icon_name: "MessageCircle" },
    { title: "E-mail", description: "reservaparadisebeach@gmail.com", icon_name: "Mail" },
    { title: "Endereco", description: "Av. Fernando Luiz Henrique\nJoao Pessoa, PB - CEP 58037-051", icon_name: "MapPin" },
  ];
  for (const [index, item] of contactCards.entries()) {
    await ensureContentItem(pool, {
      page_id: contactPageId,
      section_id: contactInfoId,
      item_type: "contact-card",
      category: "contact-info",
      content_key: `contact-card-${index + 1}`,
      title: item.title,
      description: item.description,
      icon_name: item.icon_name,
      sort_order: index + 1,
    });
  }

  await ensureContentItem(pool, {
    page_id: contactPageId,
    section_id: contactHoursId,
    item_type: "text",
    category: "contact-hours",
    content_key: "contact-hours-week",
    title: "Horario",
    description: "Seg - Sex: 9h as 18h\nSab: 9h as 13h",
    icon_name: "Clock",
    sort_order: 1,
  });

  await ensureContentItem(pool, {
    page_id: homePageId,
    section_id: homeHeroId,
    item_type: "hero",
    category: "hero",
    content_key: "home-hero-primary",
    title: "Seu Paraiso a Beira-Mar",
    subtitle: "Imoveis exclusivos de alto padrao para viver e investir no litoral brasileiro.",
    button_label: "Reservar Imovel",
    link_url: "/aluguel",
    meta_json: {
      secondaryButtonLabel: "Fale Conosco",
      secondaryButtonUrl: "/contato",
      heroSlides: [],
      typewriterPhrases: [
        "Seu Paraiso a Beira-Mar",
        "Imoveis exclusivos a Beira-Mar",
        "Sua villa de luxo te espera",
        "Descubra o litoral Brasileiro",
        "Onde o luxo encontra a natureza"
      ]
    },
    sort_order: 1,
  });

  await ensureMenuItem(pool, { menu_key: "main", label: "Home", url: "/", page_id: homePageId, sort_order: 1 });
  await ensureMenuItem(pool, { menu_key: "main", label: "Imoveis", url: "/aluguel", page_id: rentPageId, sort_order: 2 });
  await ensureMenuItem(pool, { menu_key: "main", label: "Sobre Nos", url: "/sobre", page_id: aboutPageId, sort_order: 3 });
  await ensureMenuItem(pool, { menu_key: "main", label: "Contato", url: "/contato", page_id: contactPageId, sort_order: 4 });
  await ensureMenuItem(pool, { menu_key: "footer", label: "Imoveis a Venda", url: "/venda", sort_order: 1 });
  await ensureMenuItem(pool, { menu_key: "footer", label: "Imoveis para Aluguel", url: "/aluguel", page_id: rentPageId, sort_order: 2 });
  await ensureMenuItem(pool, { menu_key: "footer", label: "Sobre Nos", url: "/sobre", page_id: aboutPageId, sort_order: 3 });
  await ensureMenuItem(pool, { menu_key: "footer", label: "Contato", url: "/contato", page_id: contactPageId, sort_order: 4 });

  const defaultSettings = [
    ["branding", "brand_name", "Nome da marca", "text", "Paradise Beach"],
    ["branding", "brand_tagline", "Slogan", "text", "Seu paraiso a beira-mar."],
    ["branding", "footer_description", "Descricao do rodape", "textarea", "Seu paraiso a beira-mar. Especialistas em reservas e imoveis de luxo no litoral brasileiro."],
    ["contact", "contact_phone", "Telefone", "phone", "(81) 9229-2821"],
    ["contact", "contact_whatsapp", "WhatsApp", "phone", "+55 81 9652-0169"],
    ["contact", "contact_email", "E-mail", "email", "reservaparadisebeach@gmail.com"],
    ["contact", "contact_address", "Endereco", "textarea", "Av. Fernando Luiz Henrique, Joao Pessoa - PB"],
    ["social", "social_instagram", "Instagram", "url", "#"],
    ["social", "social_facebook", "Facebook", "url", "#"],
    ["media", "intro_img", "Imagem de introducao", "url", ""],
    ["media", "hero_slider", "Slider Hero", "json", "[]"],
    ["media", "site_gallery", "Galeria do site", "json", "[]"],
    ["branding", "site_title", "Titulo principal", "text", "Seu Paraiso a Beira-Mar"],
    ["branding", "site_subtitle", "Subtitulo principal", "textarea", "Imoveis exclusivos de alto padrao para viver e investir no litoral brasileiro."],
    ["branding", "site_about", "Texto sobre", "textarea", "Fundada em 2010 em Trancoso, Bahia, a Paradise Beach nasceu da paixao por unir pessoas extraordinarias a propriedades excepcionais."],
  ];
  for (const [index, setting] of defaultSettings.entries()) {
    await ensureSetting(pool, {
      setting_group: setting[0],
      setting_key: setting[1],
      label: setting[2],
      value_type: setting[3],
      setting_value: setting[4],
      sort_order: index + 1,
    });
  }

  await ensureSeo(pool, {
    page_id: homePageId,
    route_path: "/",
    seo_title: "Seu Paraiso a Beira-Mar | Paradise Beach",
    seo_description: "Imoveis exclusivos de alto padrao para viver e investir no litoral brasileiro.",
    robots: "index,follow",
  });
  await ensureSeo(pool, {
    page_id: aboutPageId,
    route_path: "/sobre",
    seo_title: "Sobre a Paradise Beach",
    seo_description: "Mais de uma decada conectando pessoas aos seus sonhos a beira-mar.",
    robots: "index,follow",
  });
  await ensureSeo(pool, {
    page_id: contactPageId,
    route_path: "/contato",
    seo_title: "Fale Conosco | Paradise Beach",
    seo_description: "Entre em contato com a equipe da Paradise Beach.",
    robots: "index,follow",
  });
  await ensureSeo(pool, {
    page_id: rentPageId,
    route_path: "/aluguel",
    seo_title: "Imoveis para Aluguel | Paradise Beach",
    seo_description: "Viva experiencias inesqueciveis nas melhores praias do Brasil.",
    robots: "index,follow",
  });
}

async function bootstrapCms(pool) {
  for (const statement of CMS_TABLES) {
    await pool.query(statement);
  }
  await seedCms(pool);
}

function mapSection(sectionRow, items) {
  return {
    ...sectionRow,
    config_json: parseJsonSafe(sectionRow.config_json, null),
    items: items
      .filter((item) => item.section_id === sectionRow.id)
      .map((item) => ({
        ...item,
        meta_json: parseJsonSafe(item.meta_json, null),
      })),
  };
}

module.exports = {
  bootstrapCms,
  mapSection,
  parseJsonSafe,
};

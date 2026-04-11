const { randomUUID } = require("crypto");
const { mapSection, parseJsonSafe } = require("./schema.cjs");

function mapPage(row) {
  return row ? { ...row, sort_order: Number(row.sort_order) } : null;
}

function mapSectionRow(row) {
  return row ? { ...row, sort_order: Number(row.sort_order) } : null;
}

function mapContentItem(row) {
  return row
    ? {
        ...row,
        sort_order: Number(row.sort_order),
        meta_json: parseJsonSafe(row.meta_json, null),
      }
    : null;
}

function mapMenuItem(row) {
  return { ...row, sort_order: Number(row.sort_order) };
}

function mapSetting(row) {
  return { ...row, sort_order: Number(row.sort_order) };
}

function mapSeo(row) {
  return row ? { ...row, schema_json: parseJsonSafe(row.schema_json, null) } : null;
}

function buildUpdate(fields) {
  const keys = Object.keys(fields).filter((key) => fields[key] !== undefined);
  if (!keys.length) {
    throw new Error("Nenhum campo valido para atualizar.");
  }
  return {
    sql: keys.map((key) => `${key} = ?`).join(", "),
    values: keys.map((key) => fields[key]),
  };
}

function createCmsRepository(pool) {
  async function query(sql, params = []) {
    const [rows] = await pool.query(sql, params);
    return rows;
  }

  return {
    async listPages() {
      const rows = await query(
        `SELECT p.*, COUNT(DISTINCT s.id) AS section_count, COUNT(DISTINCT c.id) AS content_count
         FROM pages p
         LEFT JOIN page_sections s ON s.page_id = p.id AND s.deleted_at IS NULL
         LEFT JOIN content_items c ON c.page_id = p.id AND c.deleted_at IS NULL
         WHERE p.deleted_at IS NULL
         GROUP BY p.id
         ORDER BY p.sort_order ASC, p.name ASC`
      );
      return rows.map((row) => ({
        ...mapPage(row),
        section_count: Number(row.section_count),
        content_count: Number(row.content_count),
      }));
    },

    async getPageById(pageId) {
      const rows = await query("SELECT * FROM pages WHERE id = ? AND deleted_at IS NULL LIMIT 1", [pageId]);
      return mapPage(rows[0]);
    },

    async getPageBySlug(slug) {
      const rows = await query(
        "SELECT * FROM pages WHERE slug = ? AND deleted_at IS NULL AND status = 'published' LIMIT 1",
        [slug]
      );
      return mapPage(rows[0]);
    },

    async getSeoByPageId(pageId) {
      const rows = await query(
        "SELECT * FROM seo_metadata WHERE page_id = ? AND deleted_at IS NULL AND status = 'published' LIMIT 1",
        [pageId]
      );
      return mapSeo(rows[0]);
    },

    async getSectionsByPageId(pageId, { onlyPublished = false } = {}) {
      const rows = await query(
        `SELECT s.*, COUNT(c.id) AS item_count
         FROM page_sections s
         LEFT JOIN content_items c ON c.section_id = s.id AND c.deleted_at IS NULL
         WHERE s.page_id = ? AND s.deleted_at IS NULL ${onlyPublished ? "AND s.status = 'published'" : ""}
         GROUP BY s.id
         ORDER BY s.sort_order ASC, s.created_at ASC`,
        [pageId]
      );
      return rows.map((row) => ({
        ...mapSectionRow(row),
        item_count: Number(row.item_count),
        config_json: parseJsonSafe(row.config_json, null),
      }));
    },

    async getSectionById(sectionId) {
      const rows = await query("SELECT * FROM page_sections WHERE id = ? AND deleted_at IS NULL LIMIT 1", [sectionId]);
      const row = rows[0];
      return row ? { ...mapSectionRow(row), config_json: parseJsonSafe(row.config_json, null) } : null;
    },

    async updateSection(sectionId, payload) {
      const update = buildUpdate(payload);
      await query(`UPDATE page_sections SET ${update.sql} WHERE id = ? AND deleted_at IS NULL`, [...update.values, sectionId]);
      return this.getSectionById(sectionId);
    },

    async listContent(filters = {}) {
      const clauses = ["c.deleted_at IS NULL"];
      const params = [];
      if (filters.page_id) {
        clauses.push("c.page_id = ?");
        params.push(filters.page_id);
      }
      if (filters.section_id) {
        clauses.push("c.section_id = ?");
        params.push(filters.section_id);
      }
      if (filters.status) {
        clauses.push("c.status = ?");
        params.push(filters.status);
      }
      if (filters.item_type) {
        clauses.push("c.item_type = ?");
        params.push(filters.item_type);
      }

      const rows = await query(
        `SELECT c.*, p.name AS page_name, p.slug AS page_slug, s.name AS section_name, s.section_key
         FROM content_items c
         LEFT JOIN pages p ON p.id = c.page_id
         LEFT JOIN page_sections s ON s.id = c.section_id
         WHERE ${clauses.join(" AND ")}
         ORDER BY c.sort_order ASC, c.updated_at DESC`,
        params
      );
      return rows.map(mapContentItem);
    },

    async getContentById(contentId) {
      const rows = await query(
        `SELECT c.*, p.name AS page_name, p.slug AS page_slug, s.name AS section_name, s.section_key
         FROM content_items c
         LEFT JOIN pages p ON p.id = c.page_id
         LEFT JOIN page_sections s ON s.id = c.section_id
         WHERE c.id = ? AND c.deleted_at IS NULL
         LIMIT 1`,
        [contentId]
      );
      return mapContentItem(rows[0]);
    },

    async createContent(payload) {
      const id = randomUUID();
      await query(
        `INSERT INTO content_items (
          id, page_id, section_id, item_type, category, content_key, title, subtitle, description,
          text_content, image_url, icon_name, link_url, button_label, media_id, meta_json, sort_order, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          payload.page_id,
          payload.section_id || null,
          payload.item_type || "text",
          payload.category || null,
          payload.content_key,
          payload.title || null,
          payload.subtitle || null,
          payload.description || null,
          payload.text_content || null,
          payload.image_url || null,
          payload.icon_name || null,
          payload.link_url || null,
          payload.button_label || null,
          payload.media_id || null,
          payload.meta_json || null,
          payload.sort_order || 0,
          payload.status || "draft",
        ]
      );
      return this.getContentById(id);
    },

    async updateContent(contentId, payload) {
      const update = buildUpdate(payload);
      await query(`UPDATE content_items SET ${update.sql} WHERE id = ? AND deleted_at IS NULL`, [...update.values, contentId]);
      return this.getContentById(contentId);
    },

    async softDeleteContent(contentId) {
      await query(
        "UPDATE content_items SET status = 'inactive', deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL",
        [contentId]
      );
    },

    async listMenus(menuKey) {
      const rows = await query(
        `SELECT m.*, p.slug AS page_slug
         FROM menus m
         LEFT JOIN pages p ON p.id = m.page_id
         WHERE m.deleted_at IS NULL ${menuKey ? "AND m.menu_key = ?" : ""}
         ORDER BY m.menu_key ASC, m.sort_order ASC, m.created_at ASC`,
        menuKey ? [menuKey] : []
      );
      return rows.map(mapMenuItem);
    },

    async updateMenu(menuId, payload) {
      const update = buildUpdate(payload);
      await query(`UPDATE menus SET ${update.sql} WHERE id = ? AND deleted_at IS NULL`, [...update.values, menuId]);
      const rows = await query("SELECT * FROM menus WHERE id = ? AND deleted_at IS NULL LIMIT 1", [menuId]);
      return rows[0] ? mapMenuItem(rows[0]) : null;
    },

    async listSiteSettings() {
      const rows = await query(
        "SELECT * FROM site_settings WHERE deleted_at IS NULL ORDER BY setting_group ASC, sort_order ASC, label ASC"
      );
      return rows.map(mapSetting);
    },

    async updateSiteSetting(settingId, payload) {
      const update = buildUpdate(payload);
      await query(`UPDATE site_settings SET ${update.sql} WHERE id = ? AND deleted_at IS NULL`, [...update.values, settingId]);
      const rows = await query("SELECT * FROM site_settings WHERE id = ? AND deleted_at IS NULL LIMIT 1", [settingId]);
      return rows[0] ? mapSetting(rows[0]) : null;
    },

    async getPublishedSettingsMap() {
      const rows = await query(
        "SELECT setting_key, setting_value, value_type FROM site_settings WHERE deleted_at IS NULL AND status = 'published' ORDER BY sort_order ASC"
      );
      return rows.reduce((acc, row) => {
        acc[row.setting_key] = row.value_type === "json" ? parseJsonSafe(row.setting_value, []) : row.setting_value;
        return acc;
      }, {});
    },

    async getPublishedMenuTree(menuKey) {
      const rows = await query(
        `SELECT m.*, p.slug AS page_slug
         FROM menus m
         LEFT JOIN pages p ON p.id = m.page_id
         WHERE m.deleted_at IS NULL AND m.status = 'published' AND m.menu_key = ?
         ORDER BY m.sort_order ASC, m.created_at ASC`,
        [menuKey]
      );
      const items = rows.map(mapMenuItem);
      const childrenByParent = new Map();
      for (const item of items) {
        const parentKey = item.parent_id || "root";
        if (!childrenByParent.has(parentKey)) childrenByParent.set(parentKey, []);
        childrenByParent.get(parentKey).push(item);
      }
      const attachChildren = (item) => ({
        ...item,
        children: (childrenByParent.get(item.id) || []).map(attachChildren),
      });
      return (childrenByParent.get("root") || []).map(attachChildren);
    },

    async getPublicPagePayload(slug) {
      const page = await this.getPageBySlug(slug);
      if (!page) return null;
      const [seo, sections, items] = await Promise.all([
        this.getSeoByPageId(page.id),
        this.getSectionsByPageId(page.id, { onlyPublished: true }),
        this.listContent({ page_id: page.id, status: "published" }),
      ]);
      return {
        page,
        seo,
        sections: sections.map((section) => mapSection(section, items)),
      };
    },
  };
}

module.exports = { createCmsRepository };

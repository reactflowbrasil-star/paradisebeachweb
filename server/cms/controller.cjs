const {
  ensureStatus,
  validateContentPayload,
  validateMenuPayload,
  validateSectionPayload,
  validateSettingPayload,
} = require("./validators.cjs");

function createCmsController(service) {
  return {
    listPages: async (_req, res) => {
      res.json(await service.listPages());
    },
    getPageSections: async (req, res) => {
      res.json(await service.getPageSections(req.params.id));
    },
    updateSection: async (req, res) => {
      const payload = validateSectionPayload(req.body || {});
      res.json(await service.updateSection(req.params.id, payload));
    },
    listContent: async (req, res) => {
      const filters = {
        page_id: req.query.page_id || undefined,
        section_id: req.query.section_id || undefined,
        status: req.query.status || undefined,
        item_type: req.query.item_type || undefined,
      };
      res.json(await service.listContent(filters));
    },
    getContentById: async (req, res) => {
      res.json(await service.getContentById(req.params.id));
    },
    createContent: async (req, res) => {
      const payload = validateContentPayload(req.body || {});
      res.status(201).json(await service.createContent(payload));
    },
    updateContent: async (req, res) => {
      const payload = validateContentPayload(req.body || {}, { partial: true });
      res.json(await service.updateContent(req.params.id, payload));
    },
    updateContentStatus: async (req, res) => {
      const status = ensureStatus(req.body?.status);
      res.json(await service.updateContentStatus(req.params.id, status));
    },
    deleteContent: async (req, res) => {
      await service.deleteContent(req.params.id);
      res.status(204).end();
    },
    listMenus: async (req, res) => {
      res.json(await service.listMenus(req.query.menu_key || undefined));
    },
    updateMenu: async (req, res) => {
      const payload = validateMenuPayload(req.body || {});
      res.json(await service.updateMenu(req.params.id, payload));
    },
    listSiteSettings: async (_req, res) => {
      res.json(await service.listSiteSettings());
    },
    updateSiteSetting: async (req, res) => {
      const payload = validateSettingPayload(req.body || {});
      res.json(await service.updateSiteSetting(req.params.id, payload));
    },
    getPublicPage: async (req, res) => {
      res.json(await service.getPublicPagePayload(req.params.slug));
    },
    getPublicSiteSettings: async (_req, res) => {
      res.json(await service.getPublishedSettingsMap());
    },
    getPublicMenu: async (req, res) => {
      const menuKey = typeof req.query.menu_key === "string" && req.query.menu_key.trim() ? req.query.menu_key : "main";
      res.json(await service.getPublishedMenuTree(menuKey));
    },
  };
}

module.exports = { createCmsController };

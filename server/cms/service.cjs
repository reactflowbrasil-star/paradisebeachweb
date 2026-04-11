function createCmsService(repository) {
  return {
    listPages: () => repository.listPages(),
    getPageSections: async (pageId) => {
      const page = await repository.getPageById(pageId);
      if (!page) throw new Error("Pagina nao encontrada.");
      const sections = await repository.getSectionsByPageId(pageId);
      return { page, sections };
    },
    listContent: (filters) => repository.listContent(filters),
    getContentById: async (contentId) => {
      const item = await repository.getContentById(contentId);
      if (!item) throw new Error("Conteudo nao encontrado.");
      return item;
    },
    createContent: async (payload) => {
      const page = await repository.getPageById(payload.page_id);
      if (!page) throw new Error("page_id invalido.");
      if (payload.section_id) {
        const section = await repository.getSectionById(payload.section_id);
        if (!section) throw new Error("section_id invalido.");
        if (section.page_id !== payload.page_id) {
          throw new Error("A secao informada nao pertence a pagina selecionada.");
        }
      }
      return repository.createContent(payload);
    },
    updateContent: async (contentId, payload) => {
      const existing = await repository.getContentById(contentId);
      if (!existing) throw new Error("Conteudo nao encontrado.");
      const pageId = payload.page_id || existing.page_id;
      const sectionId = payload.section_id === undefined ? existing.section_id : payload.section_id;
      const page = await repository.getPageById(pageId);
      if (!page) throw new Error("page_id invalido.");
      if (sectionId) {
        const section = await repository.getSectionById(sectionId);
        if (!section) throw new Error("section_id invalido.");
        if (section.page_id !== pageId) {
          throw new Error("A secao informada nao pertence a pagina selecionada.");
        }
      }
      const updated = await repository.updateContent(contentId, payload);
      if (!updated) throw new Error("Conteudo nao encontrado.");
      return updated;
    },
    updateContentStatus: async (contentId, status) => {
      const updated = await repository.updateContent(contentId, { status });
      if (!updated) throw new Error("Conteudo nao encontrado.");
      return updated;
    },
    deleteContent: async (contentId) => {
      const existing = await repository.getContentById(contentId);
      if (!existing) throw new Error("Conteudo nao encontrado.");
      await repository.softDeleteContent(contentId);
    },
    updateSection: async (sectionId, payload) => {
      const section = await repository.getSectionById(sectionId);
      if (!section) throw new Error("Secao nao encontrada.");
      const updated = await repository.updateSection(sectionId, payload);
      if (!updated) throw new Error("Secao nao encontrada.");
      return updated;
    },
    listMenus: (menuKey) => repository.listMenus(menuKey),
    updateMenu: async (menuId, payload) => {
      const updated = await repository.updateMenu(menuId, payload);
      if (!updated) throw new Error("Menu nao encontrado.");
      return updated;
    },
    listSiteSettings: () => repository.listSiteSettings(),
    updateSiteSetting: async (settingId, payload) => {
      const updated = await repository.updateSiteSetting(settingId, payload);
      if (!updated) throw new Error("Configuracao nao encontrada.");
      return updated;
    },
    getPublicPagePayload: async (slug) => {
      const page = await repository.getPublicPagePayload(slug);
      if (!page) throw new Error("Pagina publica nao encontrada.");
      return page;
    },
    getPublishedSettingsMap: () => repository.getPublishedSettingsMap(),
    getPublishedMenuTree: (menuKey) => repository.getPublishedMenuTree(menuKey || "main"),
  };
}

module.exports = { createCmsService };

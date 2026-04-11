const express = require("express");

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function createCmsRouters(controller) {
  const adminRouter = express.Router();
  const publicRouter = express.Router();

  adminRouter.get("/pages", asyncHandler(controller.listPages));
  adminRouter.get("/pages/:id/sections", asyncHandler(controller.getPageSections));
  adminRouter.put("/sections/:id", asyncHandler(controller.updateSection));

  adminRouter.get("/content", asyncHandler(controller.listContent));
  adminRouter.get("/content/:id", asyncHandler(controller.getContentById));
  adminRouter.post("/content", asyncHandler(controller.createContent));
  adminRouter.put("/content/:id", asyncHandler(controller.updateContent));
  adminRouter.patch("/content/:id/status", asyncHandler(controller.updateContentStatus));
  adminRouter.delete("/content/:id", asyncHandler(controller.deleteContent));

  adminRouter.get("/menus", asyncHandler(controller.listMenus));
  adminRouter.put("/menus/:id", asyncHandler(controller.updateMenu));

  adminRouter.get("/site-settings", asyncHandler(controller.listSiteSettings));
  adminRouter.put("/site-settings/:id", asyncHandler(controller.updateSiteSetting));

  publicRouter.get("/pages/:slug", asyncHandler(controller.getPublicPage));
  publicRouter.get("/site-settings", asyncHandler(controller.getPublicSiteSettings));
  publicRouter.get("/menu", asyncHandler(controller.getPublicMenu));

  return { adminRouter, publicRouter };
}

module.exports = { createCmsRouters };

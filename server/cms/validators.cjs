const VALID_STATUSES = ["draft", "published", "inactive"];
const VALID_SETTING_TYPES = ["text", "textarea", "number", "boolean", "json", "url", "email", "phone"];

function toNullableString(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

function toInteger(value, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function ensureStatus(status) {
  const normalized = String(status || "draft").trim().toLowerCase();
  if (!VALID_STATUSES.includes(normalized)) {
    throw new Error("Status invalido. Use draft, published ou inactive.");
  }
  return normalized;
}

function parseJsonField(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value === "object") return JSON.stringify(value);
  const raw = String(value);
  JSON.parse(raw);
  return raw;
}

function validateContentPayload(payload, { partial = false } = {}) {
  const data = payload || {};
  const result = {};

  if (!partial || data.page_id !== undefined) {
    if (!toNullableString(data.page_id)) throw new Error("page_id e obrigatorio.");
    result.page_id = toNullableString(data.page_id);
  }

  if (!partial || data.content_key !== undefined) {
    if (!toNullableString(data.content_key)) throw new Error("content_key e obrigatorio.");
    result.content_key = toNullableString(data.content_key);
  }

  if (!partial || data.item_type !== undefined) {
    result.item_type = toNullableString(data.item_type) || "text";
  }

  if (data.section_id !== undefined) result.section_id = toNullableString(data.section_id);
  if (data.category !== undefined) result.category = toNullableString(data.category);
  if (data.title !== undefined) result.title = toNullableString(data.title);
  if (data.subtitle !== undefined) result.subtitle = toNullableString(data.subtitle);
  if (data.description !== undefined) result.description = toNullableString(data.description);
  if (data.text_content !== undefined) result.text_content = toNullableString(data.text_content);
  if (data.image_url !== undefined) result.image_url = toNullableString(data.image_url);
  if (data.icon_name !== undefined) result.icon_name = toNullableString(data.icon_name);
  if (data.link_url !== undefined) result.link_url = toNullableString(data.link_url);
  if (data.button_label !== undefined) result.button_label = toNullableString(data.button_label);
  if (data.media_id !== undefined) result.media_id = toNullableString(data.media_id);
  if (data.sort_order !== undefined) result.sort_order = toInteger(data.sort_order, 0);
  if (!partial || data.status !== undefined) result.status = ensureStatus(data.status || "draft");
  if (data.meta_json !== undefined) result.meta_json = parseJsonField(data.meta_json);

  return result;
}

function validateSectionPayload(payload) {
  const data = payload || {};
  const result = {};
  if (data.name !== undefined) result.name = toNullableString(data.name);
  if (data.section_type !== undefined) result.section_type = toNullableString(data.section_type) || "content";
  if (data.title !== undefined) result.title = toNullableString(data.title);
  if (data.subtitle !== undefined) result.subtitle = toNullableString(data.subtitle);
  if (data.description !== undefined) result.description = toNullableString(data.description);
  if (data.text_content !== undefined) result.text_content = toNullableString(data.text_content);
  if (data.image_url !== undefined) result.image_url = toNullableString(data.image_url);
  if (data.link_url !== undefined) result.link_url = toNullableString(data.link_url);
  if (data.button_label !== undefined) result.button_label = toNullableString(data.button_label);
  if (data.media_id !== undefined) result.media_id = toNullableString(data.media_id);
  if (data.config_json !== undefined) result.config_json = parseJsonField(data.config_json);
  if (data.sort_order !== undefined) result.sort_order = toInteger(data.sort_order, 0);
  if (data.status !== undefined) result.status = ensureStatus(data.status);
  return result;
}

function validateMenuPayload(payload) {
  const data = payload || {};
  const result = {};
  if (data.label !== undefined) result.label = toNullableString(data.label);
  if (data.url !== undefined) result.url = toNullableString(data.url);
  if (data.target !== undefined) result.target = toNullableString(data.target) || "_self";
  if (data.css_class !== undefined) result.css_class = toNullableString(data.css_class);
  if (data.page_id !== undefined) result.page_id = toNullableString(data.page_id);
  if (data.parent_id !== undefined) result.parent_id = toNullableString(data.parent_id);
  if (data.sort_order !== undefined) result.sort_order = toInteger(data.sort_order, 0);
  if (data.status !== undefined) result.status = ensureStatus(data.status);
  return result;
}

function validateSettingPayload(payload) {
  const data = payload || {};
  const result = {};
  if (data.label !== undefined) result.label = toNullableString(data.label);
  if (data.setting_group !== undefined) result.setting_group = toNullableString(data.setting_group) || "general";
  if (data.value_type !== undefined) {
    const valueType = String(data.value_type).trim().toLowerCase();
    if (!VALID_SETTING_TYPES.includes(valueType)) {
      throw new Error("value_type invalido.");
    }
    result.value_type = valueType;
  }
  if (data.setting_value !== undefined) {
    if (data.value_type === "json") {
      result.setting_value = parseJsonField(data.setting_value);
    } else if (typeof data.setting_value === "object") {
      result.setting_value = JSON.stringify(data.setting_value);
    } else {
      result.setting_value = data.setting_value === null ? null : String(data.setting_value);
    }
  }
  if (data.sort_order !== undefined) result.sort_order = toInteger(data.sort_order, 0);
  if (data.status !== undefined) result.status = ensureStatus(data.status);
  return result;
}

module.exports = {
  ensureStatus,
  toInteger,
  validateContentPayload,
  validateSectionPayload,
  validateMenuPayload,
  validateSettingPayload,
};

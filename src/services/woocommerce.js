const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
const env = require("../config/env");

const api = new WooCommerceRestApi({
  url: env.woo.url,
  consumerKey: env.woo.key,
  consumerSecret: env.woo.secret,
  version: "wc/v3",
});

const ORDERBY_MAP = {
  price: "price",
  date: "date",
  title: "title",
  id: "id",
  menu_order: "menu_order",
};

const ORDER_MAP = {
  asc: "asc",
  desc: "desc",
};

function stripHtml(html = "") {
  return String(html).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(text = "") {
  return String(text)
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function normalizeText(text = "") {
  return decodeHtmlEntities(String(text))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/\band\b/gi, " and ")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeProduct(product) {
  return {
    id: product.id,
    name: decodeHtmlEntities(product.name || ""),
    slug: product.slug || "",
    permalink: product.permalink || "",
    type: product.type || "",
    status: product.status || "",
    featured: Boolean(product.featured),
    catalog_visibility: product.catalog_visibility || "",
    short_description: stripHtml(product.short_description || ""),
    description: stripHtml(product.description || ""),
    sku: product.sku || "",
    price: product.price || "",
    regular_price: product.regular_price || "",
    sale_price: product.sale_price || "",
    on_sale: Boolean(product.on_sale),
    stock_status: product.stock_status || "",
    stock_quantity: product.stock_quantity,
    categories: Array.isArray(product.categories)
      ? product.categories.map((category) => ({
          id: category.id,
          name: decodeHtmlEntities(category.name || ""),
          slug: category.slug || "",
        }))
      : [],
    images: Array.isArray(product.images)
      ? product.images.map((image) => ({
          id: image.id,
          src: image.src,
          name: image.name || "",
          alt: image.alt || "",
        }))
      : [],
  };
}

function normalizeCategory(category) {
  return {
    id: category.id,
    name: decodeHtmlEntities(category.name || ""),
    slug: category.slug || "",
    count: category.count || 0,
    parent: category.parent || 0,
    description: stripHtml(category.description || ""),
  };
}

function parsePositiveInt(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;

  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    const error = new Error(`Invalid value: ${value}`);
    error.statusCode = 400;
    throw error;
  }

  return parsed;
}

function parsePrice(value, fieldName) {
  if (value === undefined || value === null || value === "") return undefined;

  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed < 0) {
    const error = new Error(`${fieldName} must be a valid number >= 0`);
    error.statusCode = 400;
    throw error;
  }

  return parsed;
}

function parseOrderby(value) {
  if (value === undefined || value === null || value === "") return undefined;

  const normalized = String(value).trim().toLowerCase();

  if (!ORDERBY_MAP[normalized]) {
    const error = new Error(
      "orderby must be one of: price, date, title, id, menu_order"
    );
    error.statusCode = 400;
    throw error;
  }

  return ORDERBY_MAP[normalized];
}

function parseOrder(value) {
  if (value === undefined || value === null || value === "") return undefined;

  const normalized = String(value).trim().toLowerCase();

  if (!ORDER_MAP[normalized]) {
    const error = new Error("order must be one of: asc, desc");
    error.statusCode = 400;
    throw error;
  }

  return ORDER_MAP[normalized];
}

async function getAllCategories() {
  const categories = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await api.get("products/categories", {
      per_page: 100,
      page,
    });

    categories.push(...response.data);
    totalPages = Number(response.headers["x-wp-totalpages"] || 1);
    page += 1;
  } while (page <= totalPages);

  return categories;
}

async function resolveCategoryIds(categoryInput) {
  if (!categoryInput) return [];

  const rawValues = Array.isArray(categoryInput)
    ? categoryInput
    : String(categoryInput)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

  if (!rawValues.length) return [];

  const allCategories = await getAllCategories();
  const resolvedIds = new Set();

  for (const rawValue of rawValues) {
    if (/^\d+$/.test(rawValue)) {
      resolvedIds.add(Number(rawValue));
      continue;
    }

    const normalizedSearch = normalizeText(rawValue);

    const exactMatch = allCategories.find(
      (category) =>
        normalizeText(category.name) === normalizedSearch ||
        normalizeText(category.slug) === normalizedSearch
    );

    if (exactMatch) {
      resolvedIds.add(exactMatch.id);
      continue;
    }

    const partialMatches = allCategories.filter((category) => {
      const normalizedName = normalizeText(category.name);
      const normalizedSlug = normalizeText(category.slug);

      return (
        normalizedName.includes(normalizedSearch) ||
        normalizedSlug.includes(normalizedSearch) ||
        normalizedSearch.includes(normalizedName)
      );
    });

    for (const match of partialMatches) {
      resolvedIds.add(match.id);
    }
  }

  return Array.from(resolvedIds);
}

async function listProducts(query = {}) {
  const page = parsePositiveInt(query.page, 1);
  const limit = parsePositiveInt(query.limit, 10);
  const search = query.search ? String(query.search).trim() : undefined;

  const minPrice = parsePrice(query.min_price, "min_price");
  const maxPrice = parsePrice(query.max_price, "max_price");

  if (
    minPrice !== undefined &&
    maxPrice !== undefined &&
    minPrice > maxPrice
  ) {
    const error = new Error("min_price cannot be greater than max_price");
    error.statusCode = 400;
    throw error;
  }

  const orderby = parseOrderby(query.orderby);
  const order = parseOrder(query.order);

  const categoryIds = await resolveCategoryIds(query.category);

  const params = {
    page,
    per_page: limit,
  };

  if (search) params.search = search;
  if (categoryIds.length > 0) params.category = categoryIds.join(",");
  if (minPrice !== undefined) params.min_price = String(minPrice);
  if (maxPrice !== undefined) params.max_price = String(maxPrice);
  if (orderby) params.orderby = orderby;
  if (order) params.order = order;

  const response = await api.get("products", params);

  return {
    page,
    limit,
    total: Number(response.headers["x-wp-total"] || 0),
    total_pages: Number(response.headers["x-wp-totalpages"] || 0),
    filters: {
      search: search || null,
      category_ids: categoryIds,
      min_price: minPrice ?? null,
      max_price: maxPrice ?? null,
      orderby: orderby || null,
      order: order || null,
    },
    items: response.data.map(normalizeProduct),
  };
}

async function getProductById(id) {
  const productId = parsePositiveInt(id);
  const response = await api.get(`products/${productId}`);
  return normalizeProduct(response.data);
}

async function listCategories() {
  const categories = await getAllCategories();
  return categories.map(normalizeCategory);
}

module.exports = {
  listProducts,
  getProductById,
  listCategories,
};

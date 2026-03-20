const axios = require("axios");
const config = require("../config/env");

// --------------------
// AXIOS CLIENT
// --------------------
const woo = axios.create({
  baseURL: `${config.woo.url}/wp-json/wc/v3`,
  auth: {
    username: config.woo.key,
    password: config.woo.secret
  },
  timeout: 15000
});

// --------------------
// CACHE (TTL)
// --------------------
const CACHE_TTL = 60 * 1000;
const cache = new Map();

function getCacheKey(query) {
  return JSON.stringify(query);
}

function getFromCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

function setCache(key, data) {
  cache.set(key, {
    data,
    expiry: Date.now() + CACHE_TTL
  });
}

// --------------------
// HELPERS
// --------------------
function stripHtml(html = "") {
  return String(html).replace(/<[^>]*>/g, "").trim();
}

function decodeHtmlEntities(text = "") {
  return String(text)
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function normalizeText(text = "") {
  return decodeHtmlEntities(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isNumeric(value) {
  return /^\d+$/.test(String(value));
}

// --------------------
// ORDER VALIDATION
// --------------------
const ORDERBY_MAP = {
  price: "price",
  date: "date",
  title: "title",
  id: "id",
  menu_order: "menu_order",
  popularity: "popularity"
};

const ORDER_MAP = {
  asc: "asc",
  desc: "desc"
};

function parseOrderby(value) {
  if (!value) return undefined;

  const normalized = String(value).toLowerCase();

  if (!ORDERBY_MAP[normalized]) {
    const error = new Error(
      "orderby must be one of: price, date, title, id, menu_order, popularity"
    );
    error.statusCode = 400;
    throw error;
  }

  return ORDERBY_MAP[normalized];
}

function parseOrder(value) {
  if (!value) return undefined;

  const normalized = String(value).toLowerCase();

  if (!ORDER_MAP[normalized]) {
    const error = new Error("order must be one of: asc, desc");
    error.statusCode = 400;
    throw error;
  }

  return ORDER_MAP[normalized];
}

// --------------------
// NORMALIZERS
// --------------------
function normalizeCategory(category) {
  return {
    id: category.id,
    name: decodeHtmlEntities(category.name)
  };
}

function normalizeProduct(product) {
  return {
    id: product.id,
    name: decodeHtmlEntities(product.name),
    slug: product.slug,
    permalink: product.permalink,
    sku: product.sku,

    price: product.price,
    regular_price: product.regular_price,
    sale_price: product.sale_price,
    on_sale: Boolean(product.on_sale),

    total_sales: product.total_sales || 0,

    stock_status: product.stock_status,
    featured: product.featured,

    image: product.images?.[0]?.src || null,

    categories: Array.isArray(product.categories)
      ? product.categories.map((cat) => ({
          id: cat.id,
          name: decodeHtmlEntities(cat.name),
          slug: cat.slug
        }))
      : []
  };
}

// --------------------
// CATEGORY RESOLUTION
// --------------------
async function getAllCategories() {
  let page = 1;
  const perPage = 100;
  let all = [];
  let totalPages = 1;

  do {
    const res = await woo.get("/products/categories", {
      params: { page, per_page: perPage, hide_empty: false }
    });

    all = all.concat(res.data);
    totalPages = Number(res.headers["x-wp-totalpages"] || 1);
    page++;
  } while (page <= totalPages);

  return all.map(normalizeCategory);
}

async function findCategoryIdByName(name) {
  const normalizedInput = normalizeText(name);
  const categories = await getAllCategories();

  const exact = categories.find(
    (c) => normalizeText(c.name) === normalizedInput
  );
  if (exact) return exact.id;

  const partial = categories.find((c) =>
    normalizeText(c.name).includes(normalizedInput)
  );

  return partial?.id || null;
}

function parseCategoryInput(category) {
  if (!category) return [];

  return String(category)
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

async function resolveCategories(category) {
  const list = parseCategoryInput(category);
  if (!list.length) return undefined;

  const resolved = [];

  for (const item of list) {
    if (isNumeric(item)) {
      resolved.push(item);
      continue;
    }

    const id = await findCategoryIdByName(item);
    if (!id) {
      const err = new Error(`Category not found: ${item}`);
      err.statusCode = 404;
      throw err;
    }

    resolved.push(id);
  }

  return [...new Set(resolved)].join(",");
}

// --------------------
// PRICE VALIDATION
// --------------------
function parsePrice(value, fieldName) {
  if (!value) return undefined;

  const normalized = String(value);

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    const err = new Error(`Invalid ${fieldName}: ${value}`);
    err.statusCode = 400;
    throw err;
  }

  return normalized;
}

// --------------------
// FALLBACK POPULARITY
// --------------------
function fallbackSortByPopularity(items, order) {
  return items.sort((a, b) => {
    return order === "asc"
      ? a.total_sales - b.total_sales
      : b.total_sales - a.total_sales;
  });
}

// --------------------
// MAIN: LIST PRODUCTS
// --------------------
async function listProducts(query = {}) {
  const cacheKey = getCacheKey(query);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;

  const orderby = parseOrderby(query.orderby);
  const order = parseOrder(query.order) || "desc";

  const category = await resolveCategories(query.category);
  const min_price = parsePrice(query.min_price, "min_price");
  const max_price = parsePrice(query.max_price, "max_price");

  if (min_price && max_price && Number(min_price) > Number(max_price)) {
    const err = new Error("min_price cannot be greater than max_price");
    err.statusCode = 400;
    throw err;
  }

  const params = {
    page,
    per_page: limit
  };

  if (query.search) params.search = query.search;
  if (category) params.category = category;
  if (min_price) params.min_price = min_price;
  if (max_price) params.max_price = max_price;
  if (orderby) params.orderby = orderby;
  if (order) params.order = order;

  const res = await woo.get("/products", { params });

  let items = res.data.map(normalizeProduct);

  // fallback popularity
  if (orderby === "popularity") {
    const sorted = items.every((item, i, arr) => {
      if (i === 0) return true;
      return arr[i - 1].total_sales >= item.total_sales;
    });

    if (!sorted) {
      items = fallbackSortByPopularity(items, order);
    }
  }

  const result = {
    page,
    limit,
    total: Number(res.headers["x-wp-total"] || 0),
    total_pages: Number(res.headers["x-wp-totalpages"] || 0),
    filters: {
      search: query.search || null,
      category: category || null,
      min_price: min_price || null,
      max_price: max_price || null,
      orderby: orderby || null,
      order: order || null
    },
    items
  };

  setCache(cacheKey, result);

  return result;
}

// --------------------
// SINGLE PRODUCT
// --------------------
async function getProductById(id) {
  const res = await woo.get(`/products/${id}`);
  return normalizeProduct(res.data);
}

// --------------------
// LIST CATEGORIES
// --------------------
async function listCategories() {
  const categories = await getAllCategories();
  return categories;
}

module.exports = {
  listProducts,
  getProductById,
  listCategories
};

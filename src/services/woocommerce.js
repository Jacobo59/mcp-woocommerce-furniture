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
  popularity: "popularity",
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

function normalizeProduct(product) {
  const mainImage = product.images?.[0]?.src || null;

  return {
    id: product.id,
    name: decodeHtmlEntities(product.name || ""),
    slug: product.slug || "",
    permalink: product.permalink || "",

    price: product.price || "",
    regular_price: product.regular_price || "",
    sale_price: product.sale_price || "",
    on_sale: Boolean(product.on_sale),

    total_sales: product.total_sales || 0,

    stock_status: product.stock_status || "",

    image: mainImage,

    categories: Array.isArray(product.categories)
      ? product.categories.map((c) => ({
          id: c.id,
          name: decodeHtmlEntities(c.name || ""),
          slug: c.slug || "",
        }))
      : [],
  };
}

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

function fallbackSortByPopularity(items, order) {
  return items.sort((a, b) => {
    const aSales = a.total_sales || 0;
    const bSales = b.total_sales || 0;

    return order === "asc"
      ? aSales - bSales
      : bSales - aSales;
  });
}

async function listProducts(query = {}) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;

  const orderby = parseOrderby(query.orderby);
  const order = parseOrder(query.order) || "desc";

  const params = {
    page,
    per_page: limit,
  };

  if (orderby) params.orderby = orderby;
  if (order) params.order = order;

  const response = await api.get("products", params);

  let items = response.data.map(normalizeProduct);

  // 🔥 Fallback inteligente si Woo falla con popularity
  if (orderby === "popularity") {
    const isSorted = items.every((item, i, arr) => {
      if (i === 0) return true;
      return arr[i - 1].total_sales >= item.total_sales;
    });

    if (!isSorted) {
      items = fallbackSortByPopularity(items, order);
    }
  }

  return {
    page,
    limit,
    total: Number(response.headers["x-wp-total"] || 0),
    total_pages: Number(response.headers["x-wp-totalpages"] || 0),
    filters: {
      orderby: orderby || null,
      order: order || null,
    },
    items,
  };
}

async function getProductById(id) {
  const response = await api.get(`products/${id}`);
  return normalizeProduct(response.data);
}

async function listCategories() {
  const response = await api.get("products/categories");
  return response.data;
}

module.exports = {
  listProducts,
  getProductById,
  listCategories,
};

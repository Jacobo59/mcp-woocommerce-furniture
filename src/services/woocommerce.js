const axios = require('axios');
const config = require('../config/env');

const woo = axios.create({
  baseURL: `${config.woo.url}/wp-json/wc/v3`,
  auth: {
    username: config.woo.key,
    password: config.woo.secret
  },
  timeout: 15000
});

function stripHtml(html = '') {
  return String(html).replace(/<[^>]*>/g, '').trim();
}

function normalizeProduct(product) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    permalink: product.permalink,
    sku: product.sku,
    price: product.price,
    regular_price: product.regular_price,
    sale_price: product.sale_price,
    stock_status: product.stock_status,
    featured: product.featured,
    categories: Array.isArray(product.categories)
      ? product.categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug
        }))
      : [],
    images: Array.isArray(product.images)
      ? product.images.map((img) => ({
          id: img.id,
          src: img.src,
          alt: img.alt
        }))
      : [],
    short_description: stripHtml(product.short_description),
    description: stripHtml(product.description)
  };
}

function normalizeCategory(category) {
  return {
    id: category.id,
    name: category.name
  };
}

async function listProducts({ page = 1, limit = 10, search, category }) {
  const params = {
    page,
    per_page: limit
  };

  if (search) params.search = search;
  if (category) params.category = category;

  const response = await woo.get('/products', { params });

  return {
    items: response.data.map(normalizeProduct),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: Number(response.headers['x-wp-total'] || 0),
      totalPages: Number(response.headers['x-wp-totalpages'] || 0)
    }
  };
}

async function getProductById(id) {
  const response = await woo.get(`/products/${id}`);
  return normalizeProduct(response.data);
}

async function listCategories({ page = 1, limit = 100, search } = {}) {
  const params = {
    page,
    per_page: limit,
    hide_empty: false
  };

  if (search) params.search = search;

  const response = await woo.get('/products/categories', { params });

  return {
    items: response.data.map(normalizeCategory),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: Number(response.headers['x-wp-total'] || 0),
      totalPages: Number(response.headers['x-wp-totalpages'] || 0)
    }
  };
}

module.exports = {
  listProducts,
  getProductById,
  listCategories
};

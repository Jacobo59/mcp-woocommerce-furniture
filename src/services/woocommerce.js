const axios = require('axios');
const { wcUrl, wcConsumerKey, wcConsumerSecret } = require('../config/env');

const woo = axios.create({
  baseURL: `${wcUrl}/wp-json/wc/v3`,
  auth: {
    username: wcConsumerKey,
    password: wcConsumerSecret,
  },
  timeout: 15000,
});

function cleanHtml(text = '') {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function listProducts({ page = 1, limit = 10, search = '', category = null }) {
  const response = await woo.get('/products', {
    params: {
      per_page: limit,
      page,
      search: search || undefined,
      category: category || undefined, // 👈 Woo espera ID de categoría
    },
  });

  const total = Number(response.headers['x-wp-total'] || 0);
  const totalPages = Number(response.headers['x-wp-totalpages'] || 0);

  const products = response.data.map((product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    stock: product.stock_quantity ?? null,
    description: cleanHtml(product.description),
  }));

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

module.exports = {
  listProducts,
};

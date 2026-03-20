const axios = require("axios");
const { woo } = require("../config/env");

const wooApi = axios.create({
  baseURL: `${woo.url}/wp-json/wc/v3`,
  auth: {
    username: woo.key,
    password: woo.secret
  },
  timeout: 10000
});

// Obtener productos
async function getProducts() {
  try {
    const response = await wooApi.get("/products", {
      params: {
        per_page: 5
      }
    });

    return response.data;
  } catch (error) {
    console.error("WooCommerce error:", error.response?.data || error.message);
    throw new Error("Error fetching products from WooCommerce");
  }
}

module.exports = {
  getProducts
};

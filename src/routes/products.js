const express = require("express");
const router = express.Router();

const { getProducts } = require("../services/woocommerce");

// Normalizar producto
function normalizeProduct(p) {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    stock: p.stock_quantity,
    description: p.description?.replace(/<[^>]*>?/gm, "")
  };
}

router.get("/tools/list-products", async (req, res) => {
  try {
    const products = await getProducts();

    const normalized = products.map(normalizeProduct);

    res.json({
      ok: true,
      count: normalized.length,
      products: normalized
    });
  } catch (error) {
    console.error("Endpoint error:", error.message);

    res.status(500).json({
      ok: false,
      error: "Failed to fetch products"
    });
  }
});

module.exports = router;

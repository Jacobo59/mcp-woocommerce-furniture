const express = require("express");
const router = express.Router();

const {
  listProducts,
  getProductById,
  listCategories,
} = require("../services/woocommerce");

// LIST PRODUCTS
router.get("/list-products", async (req, res) => {
  try {
    const result = await listProducts(req.query);

    res.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    const status = error.statusCode || 500;

    res.status(status).json({
      ok: false,
      error: error.message || "Internal server error",
    });
  }
});

// GET PRODUCT
router.get("/get-product/:id", async (req, res) => {
  try {
    const product = await getProductById(req.params.id);

    res.json({
      ok: true,
      item: product,
    });
  } catch (error) {
    const status = error.statusCode || 500;

    res.status(status).json({
      ok: false,
      error: error.message || "Internal server error",
    });
  }
});

// LIST CATEGORIES
router.get("/list-categories", async (req, res) => {
  try {
    const categories = await listCategories();

    res.json({
      ok: true,
      items: categories,
    });
  } catch (error) {
    const status = error.statusCode || 500;

    res.status(status).json({
      ok: false,
      error: error.message || "Internal server error",
    });
  }
});

module.exports = router;

const express = require("express");
const {
  listProducts,
  getProductById,
  listCategories
} = require("../services/woocommerce");

const router = express.Router();

router.get("/list-products", async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const search = req.query.search;
    const category = req.query.category;

    const data = await listProducts({
      page,
      limit,
      search,
      category
    });

    return res.json({
      ok: true,
      ...data
    });
  } catch (error) {
    return res.status(error.status || error.response?.status || 500).json({
      ok: false,
      message: error.message || "Error fetching products",
      error: error.response?.data || undefined
    });
  }
});

router.get("/get-product/:id", async (req, res) => {
  try {
    const item = await getProductById(req.params.id);

    return res.json({
      ok: true,
      item
    });
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      ok: false,
      message: "Error fetching product",
      error: error.response?.data || error.message
    });
  }
});

router.get("/list-categories", async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 100);
    const search = req.query.search;

    const data = await listCategories({
      page,
      limit,
      search
    });

    return res.json({
      ok: true,
      ...data
    });
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      ok: false,
      message: "Error fetching categories",
      error: error.response?.data || error.message
    });
  }
});

module.exports = router;

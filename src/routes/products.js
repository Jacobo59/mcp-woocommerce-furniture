const express = require("express");
const {
  listProducts,
  getProductById,
  listCategories,
  findCategoryIdByName
} = require("../services/woocommerce");

const router = express.Router();

function isNumeric(value) {
  return /^\d+$/.test(String(value));
}

router.get("/list-products", async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const search = req.query.search;
    let category = req.query.category;

    if (category && !isNumeric(category)) {
      const resolvedCategoryId = await findCategoryIdByName(category);

      if (!resolvedCategoryId) {
        return res.status(404).json({
          ok: false,
          message: `Category not found: ${category}`
        });
      }

      category = resolvedCategoryId;
    }

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
    return res.status(error.response?.status || 500).json({
      ok: false,
      message: "Error fetching products",
      error: error.response?.data || error.message
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

const express = require('express');
const router = express.Router();

const { listProducts, getProductById } = require('../services/woocommerce');

router.get('/list-products', async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 10;
    const search = (req.query.search || '').toString().trim();

    const category = req.query.category
      ? Number.parseInt(req.query.category, 10)
      : null;

    const result = await listProducts({ page, limit, search, category });

    return res.json({
      ok: true,
      count: result.products.length,
      pagination: result.pagination,
      products: result.products,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      ok: false,
      error: 'Failed to fetch products',
    });
  }
});

router.get('/get-product/:id', async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);

    const product = await getProductById(id);

    return res.json({
      ok: true,
      product,
    });
  } catch (error) {
    console.error(error.message);

    return res.status(500).json({
      ok: false,
      error: 'Failed to fetch product',
    });
  }
});

module.exports = router;

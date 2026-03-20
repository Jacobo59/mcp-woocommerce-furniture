const express = require('express');
const router = express.Router();
const { listProducts } = require('../services/woocommerce');

router.get('/list-products', async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 10;
    const search = (req.query.search || '').toString().trim();

    const category = req.query.category
      ? Number.parseInt(req.query.category, 10)
      : null;

    if (page < 1) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid page. Must be >= 1',
      });
    }

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid limit. Must be between 1 and 100',
      });
    }

    if (category !== null && Number.isNaN(category)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid category. Must be a number (category ID)',
      });
    }

    const result = await listProducts({ page, limit, search, category });

    return res.json({
      ok: true,
      count: result.products.length,
      pagination: result.pagination,
      products: result.products,
    });
  } catch (error) {
    console.error(
      'Error in /tools/list-products:',
      error.response?.data || error.message
    );

    return res.status(500).json({
      ok: false,
      error: 'Failed to fetch products',
    });
  }
});

module.exports = router;

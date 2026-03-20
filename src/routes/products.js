const express = require('express');
const {
  listProducts,
  getProductById,
  listCategories
} = require('../services/woocommerce');

const router = express.Router();

router.get('/list-products', async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const search = req.query.search;
    const category = req.query.category;

    const data = await listProducts({ page, limit, search, category });

    return res.json({
      success: true,
      ...data
    });
  } catch (error) {
    const status = error.response?.status || 500;

    return res.status(status).json({
      success: false,
      message: 'Error fetching products',
      error: error.response?.data || error.message
    });
  }
});

router.get('/get-product/:id', async (req, res) => {
  try {
    const product = await getProductById(req.params.id);

    return res.json({
      success: true,
      item: product
    });
  } catch (error) {
    const status = error.response?.status || 500;

    return res.status(status).json({
      success: false,
      message: 'Error fetching product',
      error: error.response?.data || error.message
    });
  }
});

router.get('/list-categories', async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 100);
    const search = req.query.search;

    const data = await listCategories({ page, limit, search });

    return res.json({
      success: true,
      ...data
    });
  } catch (error) {
    const status = error.response?.status || 500;

    return res.status(status).json({
      success: false,
      message: 'Error fetching categories',
      error: error.response?.data || error.message
    });
  }
});

module.exports = router;

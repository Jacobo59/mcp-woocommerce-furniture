require("dotenv").config();

const express = require("express");
const { port } = require("./src/config/env");
const productsRoutes = require("./src/routes/products");

const app = express();

app.use(express.json());

app.use(productsRoutes);

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "mcp-woocommerce-furniture",
    timestamp: new Date().toISOString()
  });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`MCP escuchando en puerto ${port}`);
});

import {
  createProduct,
  createProductInputSchema,
  getProduct,
  getProductInputSchema,
  listProducts,
  listProductsInputSchema,
  updateProductPrice,
  updateProductPriceInputSchema,
  updateProductStock,
  updateProductStockInputSchema
} from "../../domain/woocommerce/products";
import { listCategories } from "../../domain/woocommerce/categories";

type ToolDef = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: any) => Promise<any>;
};

export const toolsRegistry: ToolDef[] = [
  {
    name: "wc_products_list",
    description: "Lista productos de WooCommerce con filtros básicos.",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string" },
        category: { type: "integer" },
        min_price: { type: "string" },
        max_price: { type: "string" },
        per_page: { type: "integer", minimum: 1, maximum: 100, default: 10 }
      },
      additionalProperties: false
    },
    execute: listProducts
  },
  {
    name: "wc_product_get",
    description: "Obtiene un producto por ID.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "integer", minimum: 1 }
      },
      additionalProperties: false
    },
    execute: getProduct
  },
  {
    name: "wc_categories_list",
    description: "Lista categorías de productos.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false
    },
    execute: async () => listCategories()
  },
  {
    name: "wc_product_create",
    description: "Crea un producto simple en WooCommerce y lo deja en draft por defecto.",
    inputSchema: {
      type: "object",
      required: ["name", "regular_price"],
      properties: {
        name: { type: "string", minLength: 1 },
        regular_price: { type: "string" },
        sale_price: { type: "string" },
        description: { type: "string" },
        short_description: { type: "string" },
        sku: { type: "string" },
        stock_quantity: { type: "integer", minimum: 0 },
        manage_stock: { type: "boolean" },
        categories: {
          type: "array",
          items: {
            type: "object",
            required: ["id"],
            properties: {
              id: { type: "integer", minimum: 1 }
            },
            additionalProperties: false
          }
        },
        images: {
          type: "array",
          items: {
            type: "object",
            required: ["src"],
            properties: {
              src: { type: "string", format: "uri" }
            },
            additionalProperties: false
          }
        }
      },
      additionalProperties: false
    },
    execute: createProduct
  },
  {
    name: "wc_product_update_price",
    description: "Actualiza el precio regular y opcionalmente el precio rebajado de un producto.",
    inputSchema: {
      type: "object",
      required: ["id", "regular_price"],
      properties: {
        id: { type: "integer", minimum: 1 },
        regular_price: { type: "string" },
        sale_price: { type: "string" }
      },
      additionalProperties: false
    },
    execute: updateProductPrice
  },
  {
    name: "wc_product_update_stock",
    description: "Actualiza el stock de un producto y activa manage_stock.",
    inputSchema: {
      type: "object",
      required: ["id", "stock_quantity"],
      properties: {
        id: { type: "integer", minimum: 1 },
        stock_quantity: { type: "integer", minimum: 0 }
      },
      additionalProperties: false
    },
    execute: updateProductStock
  }
];

export function getToolByName(name: string) {
  return toolsRegistry.find((tool) => tool.name === name);
}

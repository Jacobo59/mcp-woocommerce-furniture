import { z } from "zod";
import { wooClient } from "./client";
import { AppError } from "../../shared/errors";

const decimalString = z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a positive decimal string");

export const listProductsInputSchema = z.object({
  search: z.string().min(1).optional(),
  category: z.number().int().positive().optional(),
  min_price: decimalString.optional(),
  max_price: decimalString.optional(),
  per_page: z.number().int().min(1).max(100).default(10)
});

export const getProductInputSchema = z.object({
  id: z.number().int().positive()
});

export const createProductInputSchema = z.object({
  name: z.string().min(1),
  regular_price: decimalString,
  sale_price: decimalString.optional(),
  description: z.string().optional(),
  short_description: z.string().optional(),
  sku: z.string().optional(),
  stock_quantity: z.number().int().min(0).optional(),
  manage_stock: z.boolean().optional(),
  categories: z.array(z.object({ id: z.number().int().positive() })).optional(),
  images: z.array(z.object({ src: z.string().url() })).optional()
});

export const updateProductPriceInputSchema = z.object({
  id: z.number().int().positive(),
  regular_price: decimalString,
  sale_price: decimalString.optional()
});

export const updateProductStockInputSchema = z.object({
  id: z.number().int().positive(),
  stock_quantity: z.number().int().min(0)
});

function normalizeProduct(product: any) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    status: product.status,
    type: product.type,
    sku: product.sku,
    regular_price: product.regular_price,
    sale_price: product.sale_price,
    price: product.price,
    stock_quantity: product.stock_quantity,
    stock_status: product.stock_status,
    manage_stock: product.manage_stock,
    permalink: product.permalink,
    image: product.images?.[0]
      ? {
          id: product.images[0].id,
          src: product.images[0].src,
          alt: product.images[0].alt
        }
      : null,
    categories: Array.isArray(product.categories)
      ? product.categories.map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug
        }))
      : []
  };
}

export async function listProducts(input: z.infer<typeof listProductsInputSchema>) {
  const params = listProductsInputSchema.parse(input);
  const response = await wooClient.get("/products", { params });

  return {
    items: response.data.map(normalizeProduct),
    total: response.data.length
  };
}

export async function getProduct(input: z.infer<typeof getProductInputSchema>) {
  const { id } = getProductInputSchema.parse(input);
  const response = await wooClient.get(`/products/${id}`);

  return normalizeProduct(response.data);
}

export async function createProduct(input: z.infer<typeof createProductInputSchema>) {
  const parsed = createProductInputSchema.parse(input);

  const payload = {
    ...parsed,
    type: "simple",
    status: "draft",
    manage_stock: parsed.stock_quantity !== undefined ? true : (parsed.manage_stock ?? false)
  };

  const response = await wooClient.post("/products", payload);
  return normalizeProduct(response.data);
}

export async function updateProductPrice(input: z.infer<typeof updateProductPriceInputSchema>) {
  const { id, ...payload } = updateProductPriceInputSchema.parse(input);
  const response = await wooClient.put(`/products/${id}`, payload);
  return normalizeProduct(response.data);
}

export async function updateProductStock(input: z.infer<typeof updateProductStockInputSchema>) {
  const { id, stock_quantity } = updateProductStockInputSchema.parse(input);

  if (stock_quantity < 0) {
    throw new AppError("VALIDATION_ERROR", "stock_quantity must be >= 0", 400, {
      field: "stock_quantity"
    });
  }

  const response = await wooClient.put(`/products/${id}`, {
    stock_quantity,
    manage_stock: true
  });

  return normalizeProduct(response.data);
}

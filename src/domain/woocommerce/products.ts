import { wcClient } from "./client";

export type WooProduct = {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  stock_quantity: number | null;
  stock_status: string;
  manage_stock: boolean;
  categories?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
};

export async function listProducts(
  page = 1,
  perPage = 10
): Promise<WooProduct[]> {
  return wcClient.get<WooProduct[]>(
    `/products?page=${page}&per_page=${perPage}`
  );
}

export async function getProduct(id: number): Promise<WooProduct> {
  return wcClient.get<WooProduct>(`/products/${id}`);
}

export async function createProduct(input: {
  name: string;
  type?: string;
  regular_price?: string;
  description?: string;
  short_description?: string;
  sku?: string;
  manage_stock?: boolean;
  stock_quantity?: number;
  categories?: Array<{ id: number }>;
}): Promise<WooProduct> {
  return wcClient.post<WooProduct>("/products", input);
}

export async function updateProductPrice(
  id: number,
  regular_price: string,
  sale_price?: string
): Promise<WooProduct> {
  return wcClient.put<WooProduct>(`/products/${id}`, {
    regular_price,
    ...(sale_price !== undefined ? { sale_price } : {}),
  });
}

export async function updateProductStock(
  id: number,
  stock_quantity: number
): Promise<WooProduct> {
  return wcClient.put<WooProduct>(`/products/${id}`, {
    manage_stock: true,
    stock_quantity,
  });
}

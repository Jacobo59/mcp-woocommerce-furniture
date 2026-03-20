import { createProduct } from "../../domain/woocommerce/products";

export async function wcProductCreate(params: {
  name: string;
  type?: string;
  regular_price?: string;
  description?: string;
  short_description?: string;
  sku?: string;
  manage_stock?: boolean;
  stock_quantity?: number;
  categories?: Array<{ id: number }>;
}) {
  if (!params?.name) {
    throw new Error("Missing product name");
  }

  return createProduct(params);
}

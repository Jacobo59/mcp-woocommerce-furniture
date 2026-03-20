import { updateProductStock } from "../../domain/woocommerce/products";

export async function wcProductUpdateStock(params?: {
  id?: number;
  stock_quantity?: number;
}) {
  if (!params?.id || params?.stock_quantity === undefined) {
    throw new Error("Missing id or stock_quantity");
  }

  return updateProductStock(
    Number(params.id),
    Number(params.stock_quantity)
  );
}

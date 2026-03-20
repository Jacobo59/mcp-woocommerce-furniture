import { updateProductPrice } from "../../domain/woocommerce/products";

export async function wcProductUpdatePrice(params?: {
  id?: number;
  regular_price?: string;
  sale_price?: string;
}) {
  if (!params?.id || !params?.regular_price) {
    throw new Error("Missing id or regular_price");
  }

  return updateProductPrice(
    Number(params.id),
    params.regular_price,
    params.sale_price
  );
}

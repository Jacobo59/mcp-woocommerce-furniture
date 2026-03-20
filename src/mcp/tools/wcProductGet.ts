import { getProduct } from "../../domain/woocommerce/products";

export async function wcProductGet(params?: { id?: number }) {
  if (!params?.id) {
    throw new Error("Missing product id");
  }

  return getProduct(Number(params.id));
}

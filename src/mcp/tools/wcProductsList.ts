import { listProducts } from "../../domain/woocommerce/products";

export async function wcProductsList(params?: {
  page?: number;
  perPage?: number;
}) {
  const page = params?.page ?? 1;
  const perPage = params?.perPage ?? 10;

  return listProducts(page, perPage);
}

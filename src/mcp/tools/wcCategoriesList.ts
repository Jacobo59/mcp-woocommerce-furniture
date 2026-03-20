import { listCategories } from "../../domain/woocommerce/categories";

export async function wcCategoriesList(params?: {
  page?: number;
  perPage?: number;
}) {
  const page = params?.page ?? 1;
  const perPage = params?.perPage ?? 20;

  return listCategories(page, perPage);
}

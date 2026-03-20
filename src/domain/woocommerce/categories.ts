import { wcClient } from "./client";

export type WooCategory = {
  id: number;
  name: string;
  slug: string;
  parent: number;
  count: number;
};

export async function listCategories(
  page = 1,
  perPage = 20
): Promise<WooCategory[]> {
  return wcClient.get<WooCategory[]>(
    `/products/categories?page=${page}&per_page=${perPage}`
  );
}

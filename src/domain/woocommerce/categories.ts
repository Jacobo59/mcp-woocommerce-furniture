import { wooClient } from "./client";

export async function listCategories() {
  const response = await wooClient.get("/products/categories", {
    params: { per_page: 100 }
  });

  return response.data.map((category: any) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    count: category.count
  }));
}

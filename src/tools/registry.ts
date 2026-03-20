import { listProducts, getProduct, createProduct, updateProductPrice, updateProductStock } from "../../domain/woocommerce/products";
import { listCategories } from "../../domain/woocommerce/categories";

type ToolFn = (params?: any) => Promise<any>;

export const toolsRegistry: Record<string, ToolFn> = {
  "wc.products.list": async (params) => {
    const page = params?.page ?? 1;
    const perPage = params?.perPage ?? 10;
    return listProducts(page, perPage);
  },

  "wc.products.get": async (params) => {
    if (!params?.id) {
      throw new Error("Missing product id");
    }
    return getProduct(Number(params.id));
  },

  "wc.products.create": async (params) => {
    return createProduct(params);
  },

  "wc.products.updatePrice": async (params) => {
    if (!params?.id || !params?.regular_price) {
      throw new Error("Missing id or regular_price");
    }
    return updateProductPrice(
      Number(params.id),
      params.regular_price,
      params.sale_price
    );
  },

  "wc.products.updateStock": async (params) => {
    if (!params?.id || params?.stock_quantity === undefined) {
      throw new Error("Missing id or stock_quantity");
    }
    return updateProductStock(
      Number(params.id),
      Number(params.stock_quantity)
    );
  },

  "wc.categories.list": async (params) => {
    const page = params?.page ?? 1;
    const perPage = params?.perPage ?? 20;
    return listCategories(page, perPage);
  },
};

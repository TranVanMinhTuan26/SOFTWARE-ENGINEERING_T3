import { ProductRecipe, ProductSummary, RecipeLine, TxClient } from './kieu-ton-kho';

/** Cổng truy cập dữ liệu công thức món (abstract class = token DI). */
export abstract class RecipeRepository {
  abstract withTx(tx: TxClient): RecipeRepository;

  /**
   * Công thức của các sản phẩm. Sản phẩm không tồn tại sẽ không có trong kết quả;
   * sản phẩm tồn tại nhưng chưa có công thức có `items = []`.
   */
  abstract findByProductIds(productIds: ReadonlyArray<string>): Promise<ProductRecipe[]>;

  /**
   * Thay toàn bộ công thức của sản phẩm bằng `items`.
   * Gồm nhiều câu lệnh (xóa + tạo) nên caller nên gọi trên repository đã gắn transaction.
   */
  abstract replaceRecipe(productId: string, items: ReadonlyArray<RecipeLine>): Promise<RecipeLine[]>;

  /** Các sản phẩm có công thức đang dùng nguyên liệu này. */
  abstract findProductsUsing(ingredientId: string): Promise<ProductSummary[]>;
}


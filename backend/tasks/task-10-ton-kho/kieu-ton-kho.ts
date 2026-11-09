import { Prisma } from '@prisma/client';

/**
 * Client dùng bên trong một transaction Prisma (hoặc chính PrismaClient gốc — PrismaClient
 * tương thích kiểu với TransactionClient). Mọi repository nhận kiểu này thay cho `any`.
 */
export type TxClient = Prisma.TransactionClient;

/** Bản ghi nguyên liệu dùng trong tầng domain (tách khỏi kiểu sinh bởi Prisma). */
export interface IngredientRecord {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  costPrice: number;
  lowStockThreshold: number;
  version?: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Dữ liệu tạo nguyên liệu mới. */
export interface IngredientCreateData {
  name: string;
  unit: string;
  quantity: number;
  costPrice?: number;
  lowStockThreshold: number;
}

/** Dữ liệu cập nhật nguyên liệu (mọi trường tùy chọn). */
export type IngredientUpdateData = Partial<IngredientCreateData>;

/** Một dòng công thức: lượng nguyên liệu cho 1 ly size M. */
export interface RecipeLine {
  ingredientId: string;
  quantity: number;
}

/** Công thức đầy đủ của một sản phẩm (items rỗng = chưa có công thức). */
export interface ProductRecipe {
  productId: string;
  productName: string;
  items: ReadonlyArray<RecipeLine>;
}

/** Thông tin rút gọn của sản phẩm (dùng khi báo "món nào đang dùng nguyên liệu"). */
export interface ProductSummary {
  id: string;
  name: string;
}

/**
 * Một dòng đơn/giỏ ở dạng đầu vào cho module kho.
 * `toppings` chấp nhận cả mảng lẫn chuỗi "a, b" (định dạng đang lưu ở OrderItem/CartItem).
 */
export interface InventoryLineInput {
  productId: string;
  size: string;
  qty: number;
  toppings?: ReadonlyArray<string> | string | null;
}

/** Một dòng đơn đã được gắn công thức — đầu vào thuần cho RecipeCalculator. */
export interface OrderItemWithRecipe {
  productId: string;
  size: string;
  qty: number;
  toppings: ReadonlyArray<string>;
  recipe: ReadonlyArray<RecipeLine>;
}

/** Đơn hàng tối thiểu mà IngredientStockService cần. */
export interface OrderForInventory {
  id: string;
  items?: ReadonlyArray<InventoryLineInput>;
}

/** Chi tiết một nguyên liệu bị thiếu, đủ để UI hiển thị "thiếu gì, cần bao nhiêu, còn bao nhiêu". */
export interface IngredientShortage {
  ingredientId: string;
  ingredientName: string;
  unit: string;
  need: number;
  have: number;
}

/** Món không bán được vì chưa có công thức (hoặc không còn tồn tại). */
export interface MissingRecipe {
  productId: string;
  productName: string;
}

/** Kết quả trừ kho cho một đơn. Không ném lỗi để caller tự chọn cách xử lý theo đường thanh toán. */
export type DeductResult =
  | { ok: true; alreadyDeducted: boolean }
  | { ok: false; shortages: IngredientShortage[]; missingRecipes: MissingRecipe[] };


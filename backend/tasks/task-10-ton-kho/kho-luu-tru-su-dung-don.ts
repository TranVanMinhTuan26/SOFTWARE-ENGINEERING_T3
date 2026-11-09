import { IngredientDemand } from './nhu-cau-nguyen-lieu';
import { TxClient } from './kieu-ton-kho';

/**
 * Cổng đọc/ghi `Order.ingredientUsage` — lượng nguyên liệu đã trừ cho đơn.
 * Tách riêng khỏi IngredientRepository để mỗi repository chỉ lo một bảng (SRP).
 */
export abstract class OrderUsageRepository {
  abstract withTx(tx: TxClient): OrderUsageRepository;

  /**
   * Khóa hàng Order (FOR UPDATE) rồi đọc `ingredientUsage`.
   * Khóa này tuần tự hóa các lần trừ/hoàn của CÙNG một đơn (vd. callback VNPay bắn 2 lần),
   * là nền tảng cho tính idempotent.
   * @returns `undefined` nếu đơn không tồn tại, `null` nếu chưa trừ, ngược lại là lượng đã trừ.
   */
  abstract lockAndGetUsage(orderId: string): Promise<IngredientDemand | null | undefined>;

  /** Ghi lượng đã trừ (hoặc `null` sau khi hoàn). */
  abstract saveUsage(orderId: string, usage: IngredientDemand | null): Promise<void>;
}


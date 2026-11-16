import { IngredientCreateData, IngredientRecord, IngredientUpdateData, TxClient } from './kieu-ton-kho';

/**
 * Cổng truy cập dữ liệu nguyên liệu (abstract class để dùng luôn làm token DI của NestJS).
 * Tầng domain chỉ phụ thuộc vào lớp trừu tượng này, không phụ thuộc Prisma.
 */
export abstract class IngredientRepository {
  /** Trả về một repository gắn với transaction `tx` (các thao tác sau đó chạy trong tx). */
  abstract withTx(tx: TxClient): IngredientRepository;

  /**
   * Khóa bi quan (SELECT ... FOR UPDATE) các nguyên liệu theo id TĂNG DẦN.
   * Mọi transaction đều khóa theo cùng một thứ tự nên không thể xảy ra vòng chờ (deadlock).
   * Chỉ có ý nghĩa khi repository đang gắn với một transaction.
   */
  abstract lockByIds(ids: ReadonlyArray<string>): Promise<IngredientRecord[]>;

  /** Đọc nguyên liệu theo id, KHÔNG khóa. */
  abstract findByIds(ids: ReadonlyArray<string>): Promise<IngredientRecord[]>;

  /**
   * Trừ `qty` nếu còn đủ và khớp `expectedVersion` (Optimistic Locking Compare-And-Swap).
   * Điều kiện `quantity >= qty` và `version = expectedVersion` nằm ngay trong câu UPDATE nguyên tử,
   * đồng thời tự động tăng `version` thêm 1.
   * @returns true nếu đã trừ, false nếu không đủ hoặc xung đột version (CAS conflict).
   */
  abstract decrementIfEnough(id: string, qty: number, expectedVersion?: number): Promise<boolean>;

  /** Cộng thêm `qty`. @returns false nếu nguyên liệu không còn tồn tại. */
  abstract increment(id: string, qty: number): Promise<boolean>;

  abstract findAll(): Promise<IngredientRecord[]>;
  abstract findById(id: string): Promise<IngredientRecord | null>;
  abstract create(data: IngredientCreateData): Promise<IngredientRecord>;
  abstract update(id: string, data: IngredientUpdateData): Promise<IngredientRecord>;
  abstract delete(id: string): Promise<void>;

  /** Các nguyên liệu sắp hết: quantity <= lowStockThreshold. */
  abstract findLowStock(): Promise<IngredientRecord[]>;
}


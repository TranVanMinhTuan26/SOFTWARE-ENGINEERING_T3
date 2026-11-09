import { prisma } from '../task-01-khoi-tao/ket-noi-prisma';
import { IngredientStockService } from './ton-kho-nguyen-lieu.service';
import { TxClient } from './kieu-ton-kho';
import { PrismaIngredientRepository } from './prisma-nguyen-lieu.repository';
import { PrismaOrderUsageRepository } from './prisma-su-dung-don.repository';
import { PrismaRecipeRepository } from './prisma-cong-thuc.repository';
import { RecipeCalculator } from './bo-tinh-cong-thuc';
import { SizeScalingPolicy } from './quy-tac-he-so-kich-co';

/**
 * Composition root nhỏ cho các HÀM TỰ DO cũ (vd. `settleSuccessfulPaymentAndLoyalty`) vốn không
 * đi qua DI của NestJS. Cách dùng trong hàm tự do:
 *
 * ```ts
 * export async function foo(tx: TxClient, ..., inventory = getInventoryService()) { ... }
 * ```
 *
 * Test có thể truyền mock trực tiếp qua tham số, hoặc gọi `setInventoryService(mock)`.
 * Khi chạy trong NestJS, InventoryModule đăng ký chính instance của nó vào đây để
 * cả hai thế giới dùng chung một đối tượng.
 */
let instance: IngredientStockService | null = null;

/** Lắp ráp IngredientStockService với các cài đặt Prisma trên `db`. */
export function buildIngredientStockService(db: TxClient): IngredientStockService {
  return new IngredientStockService(
    new RecipeCalculator(new SizeScalingPolicy()),
    new PrismaIngredientRepository(db),
    new PrismaRecipeRepository(db),
    new PrismaOrderUsageRepository(db),
  );
}

/** Lấy instance dùng chung (khởi tạo lười trên singleton `prisma` nếu chưa có). */
export function getInventoryService(): IngredientStockService {
  if (!instance) instance = buildIngredientStockService(prisma);
  return instance;
}

/** Thay instance dùng chung (NestJS module hoặc test). Truyền `null` để reset. */
export function setInventoryService(service: IngredientStockService | null): void {
  instance = service;
}


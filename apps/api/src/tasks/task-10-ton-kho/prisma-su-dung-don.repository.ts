import { Prisma } from '@prisma/client';
import { IngredientDemand } from './nhu-cau-nguyen-lieu';
import { TxClient } from './kieu-ton-kho';
import { OrderUsageRepository } from './kho-luu-tru-su-dung-don';

/** Cài đặt OrderUsageRepository bằng Prisma; client được tiêm qua constructor. */
export class PrismaOrderUsageRepository extends OrderUsageRepository {
  constructor(private readonly db: TxClient) {
    super();
  }

  withTx(tx: TxClient): OrderUsageRepository {
    return new PrismaOrderUsageRepository(tx);
  }

  async lockAndGetUsage(orderId: string): Promise<IngredientDemand | null | undefined> {
    // Hỗ trợ cả môi trường test mock (không có $queryRaw)
    if (typeof (this.db as any).$queryRaw !== 'function') {
      if (typeof (this.db as any).order?.findUnique === 'function') {
        const order = await (this.db as any).order.findUnique({
          where: { id: orderId },
          select: { ingredientUsage: true },
        });
        if (!order) return undefined;
        const usage = order.ingredientUsage;
        return usage === null || usage === undefined ? null : IngredientDemand.fromJSON(usage);
      }
      return null;
    }

    // Thứ tự khóa toàn hệ thống: hàng Order TRƯỚC, sau đó các hàng Ingredient theo id tăng dần.
    // Luồng thanh toán vốn đã khóa Order trước nên khóa lại ở đây không gây vòng chờ.
    const rows = await this.db.$queryRaw<Array<{ ingredientUsage: Prisma.JsonValue }>>(Prisma.sql`
      SELECT "ingredientUsage" FROM "Order" WHERE "id" = ${orderId} FOR UPDATE
    `);
    if (rows.length === 0) return undefined;
    const usage = rows[0].ingredientUsage;
    return usage === null || usage === undefined ? null : IngredientDemand.fromJSON(usage);
  }

  async saveUsage(orderId: string, usage: IngredientDemand | null): Promise<void> {
    await this.db.order.update({
      where: { id: orderId },
      data: { ingredientUsage: usage === null ? Prisma.DbNull : usage.toJSON() },
    });
  }
}


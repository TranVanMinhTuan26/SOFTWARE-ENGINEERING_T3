import { Prisma } from '@prisma/client';
import { IngredientRepository } from './kho-luu-tru-nguyen-lieu';
import { IngredientCreateData, IngredientRecord, IngredientUpdateData, TxClient } from './kieu-ton-kho';

/**
 * Cài đặt IngredientRepository bằng Prisma. Client (PrismaClient gốc hoặc TransactionClient)
 * được tiêm qua constructor; lớp này KHÔNG import singleton `prisma`.
 */
export class PrismaIngredientRepository extends IngredientRepository {
  constructor(private readonly db: TxClient) {
    super();
  }

  withTx(tx: TxClient): IngredientRepository {
    return new PrismaIngredientRepository(tx);
  }

  async lockByIds(ids: ReadonlyArray<string>): Promise<IngredientRecord[]> {
    // Loại trùng + sắp xếp tăng dần: thứ tự đọc/cập nhật cố định giữa mọi transaction.
    // Sử dụng Optimistic Locking thông qua cột `version` (Compare-And-Swap lúc UPDATE) thay vì khóa bi quan FOR UPDATE.
    const sorted = Array.from(new Set(ids)).sort();
    if (sorted.length === 0) return [];

    // Hỗ trợ môi trường mock không có $queryRaw
    if (typeof (this.db as any).$queryRaw !== 'function') {
      return this.findByIds(sorted);
    }

    return this.db.$queryRaw<IngredientRecord[]>(Prisma.sql`
      SELECT "id", "name", "unit", "quantity", "costPrice", "lowStockThreshold", "version", "createdAt", "updatedAt"
      FROM "Ingredient"
      WHERE "id" IN (${Prisma.join(sorted)})
      ORDER BY "id" ASC
    `);
  }

  async findByIds(ids: ReadonlyArray<string>): Promise<IngredientRecord[]> {
    if (ids.length === 0) return [];
    return this.db.ingredient.findMany({ where: { id: { in: Array.from(new Set(ids)) } }, orderBy: { id: 'asc' } });
  }

  async decrementIfEnough(id: string, qty: number, expectedVersion?: number): Promise<boolean> {
    // Optimistic Locking (Compare-And-Swap theo version) kết hợp điều kiện "quantity >= qty" trong WHERE:
    // Nếu không đủ tồn kho hoặc version đã bị giao dịch đồng thời thay đổi thì UPDATE trả count = 0.
    const whereClause: Prisma.IngredientWhereInput = {
      id,
      quantity: { gte: qty },
      ...(expectedVersion !== undefined ? { version: expectedVersion } : {}),
    };
    const res = await this.db.ingredient.updateMany({
      where: whereClause,
      data: {
        quantity: { decrement: qty },
        version: { increment: 1 },
      },
    });
    return res.count === 1;
  }

  async increment(id: string, qty: number): Promise<boolean> {
    const res = await this.db.ingredient.updateMany({
      where: { id },
      data: {
        quantity: { increment: qty },
        version: { increment: 1 },
      },
    });
    return res.count === 1;
  }

  findAll(): Promise<IngredientRecord[]> {
    return this.db.ingredient.findMany({ orderBy: { name: 'asc' } });
  }

  findById(id: string): Promise<IngredientRecord | null> {
    return this.db.ingredient.findUnique({ where: { id } });
  }

  create(data: IngredientCreateData): Promise<IngredientRecord> {
    return this.db.ingredient.create({ data });
  }

  update(id: string, data: IngredientUpdateData): Promise<IngredientRecord> {
    return this.db.ingredient.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.ingredient.delete({ where: { id } });
  }

  findLowStock(): Promise<IngredientRecord[]> {
    // So sánh hai cột trong cùng hàng bằng field reference của Prisma.
    return this.db.ingredient.findMany({
      where: { quantity: { lte: this.db.ingredient.fields.lowStockThreshold } },
      orderBy: { name: 'asc' },
    });
  }
}


import { Injectable } from '@nestjs/common';
import { IngredientDemand } from './nhu-cau-nguyen-lieu';
import { IngredientRepository } from './kho-luu-tru-nguyen-lieu';
import { InsufficientIngredientError } from './loi-thieu-nguyen-lieu';
import {
  DeductResult,
  IngredientRecord,
  IngredientShortage,
  InventoryLineInput,
  MissingRecipe,
  OrderForInventory,
  OrderItemWithRecipe,
  TxClient,
} from './kieu-ton-kho';
import { OrderUsageRepository } from './kho-luu-tru-su-dung-don';
import { RecipeCalculator } from './bo-tinh-cong-thuc';
import { RecipeRepository } from './kho-luu-tru-cong-thuc';

/** Size dùng để xét "món còn bán được": đủ nguyên liệu cho ít nhất 1 ly size này. */
export const AVAILABILITY_REFERENCE_SIZE = 'M';
export const REFERENCE_SIZE = AVAILABILITY_REFERENCE_SIZE;

@Injectable()
export class IngredientStockService {
  constructor(
    private readonly calculator: RecipeCalculator,
    private readonly ingredients: IngredientRepository,
    private readonly recipes: RecipeRepository,
    private readonly orderUsage: OrderUsageRepository,
  ) { }

  /**
   * Trừ nguyên liệu cho đơn khi đơn chuyển sang PAID.
   */
  async truNguyenLieuChoDonHang(tx: TxClient, order: OrderForInventory): Promise<DeductResult> {
    const usageRepo = this.orderUsage.withTx(tx);
    const existing = await usageRepo.lockAndGetUsage(order.id);
    if (existing === undefined) {
      throw new Error(`Không tìm thấy đơn hàng ${order.id}`);
    }
    if (existing !== null) {
      return { ok: true, alreadyDeducted: true };
    }

    const { withRecipe, missing } = await this.ganCongThucChoCacMon(this.recipes.withTx(tx), order.items ?? []);
    if (missing.length > 0) {
      return { ok: false, shortages: [], missingRecipes: missing };
    }

    const demand = this.calculator.compute(withRecipe);
    const ingredientRepo = this.ingredients.withTx(tx);
    const MAX_OPTIMISTIC_RETRIES = 5;

    for (let attempt = 0; attempt < MAX_OPTIMISTIC_RETRIES; attempt++) {
      // Đọc bản ghi nguyên liệu (theo thứ tự id tăng dần) kèm version hiện tại phục vụ Optimistic Locking.
      const locked = await ingredientRepo.lockByIds(demand.ingredientIds());
      const shortages = this.timNguyenLieuThieu(demand, locked);
      if (shortages.length > 0) {
        return { ok: false, shortages, missingRecipes: [] };
      }

      const versionById = new Map<string, number | undefined>(locked.map((r) => [r.id, r.version]));

      // Trừ theo đúng thứ tự id tăng dần với Compare-And-Swap theo `version` và `quantity >= qty`.
      const applied: Array<[string, number]> = [];
      let retryOnVersionConflict = false;

      for (const [id, qty] of demand.entries()) {
        const expectedVersion = versionById.get(id);
        const ok = await ingredientRepo.decrementIfEnough(id, qty, expectedVersion);
        if (!ok) {
          // Bù trừ phần đã trừ để không để lại trạng thái dở dang.
          for (const [doneId, doneQty] of applied) {
            await ingredientRepo.increment(doneId, doneQty);
          }
          const fresh = await ingredientRepo.findByIds([id]);
          const freshRow = fresh[0];
          const isVersionConflictOnly =
            freshRow !== undefined &&
            expectedVersion !== undefined &&
            freshRow.version !== expectedVersion &&
            freshRow.quantity >= qty;

          if (isVersionConflictOnly && attempt < MAX_OPTIMISTIC_RETRIES - 1) {
            retryOnVersionConflict = true;
            break;
          }

          const allFresh = await ingredientRepo.findByIds(demand.ingredientIds());
          const allShortages = this.timNguyenLieuThieu(demand, allFresh);
          return {
            ok: false,
            shortages:
              allShortages.length > 0
                ? allShortages
                : this.timNguyenLieuThieu(IngredientDemand.empty().add(id, qty), fresh),
            missingRecipes: [],
          };
        }
        applied.push([id, qty]);
      }

      if (retryOnVersionConflict) {
        continue;
      }

      await usageRepo.saveUsage(order.id, demand);
      return { ok: true, alreadyDeducted: false };
    }

    const finalSnap = await ingredientRepo.findByIds(demand.ingredientIds());
    return { ok: false, shortages: this.timNguyenLieuThieu(demand, finalSnap), missingRecipes: [] };
  }

  async deductForOrder(tx: TxClient, order: OrderForInventory): Promise<DeductResult> {
    return this.truNguyenLieuChoDonHang(tx, order);
  }

  /**
   * Hoàn nguyên liệu khi hủy đơn: chỉ khi `ingredientUsage` khác null, hoàn ĐÚNG lượng đã lưu
   * (không tính lại theo công thức hiện tại), rồi đặt `ingredientUsage = null` để không hoàn hai lần.
   */
  async hoanNguyenLieuChoDonHang(tx: TxClient, order: Pick<OrderForInventory, 'id'>): Promise<void> {
    const usageRepo = this.orderUsage.withTx(tx);
    const usage = await usageRepo.lockAndGetUsage(order.id);
    if (!usage) return;

    const ingredientRepo = this.ingredients.withTx(tx);
    // Cập nhật theo id tăng dần — cùng thứ tự với lúc trừ để tránh deadlock.
    for (const [id, qty] of usage.entries()) {
      // Nguyên liệu đã bị xóa (sau khi bỏ khỏi mọi công thức) thì không còn chỗ để hoàn: bỏ qua.
      await ingredientRepo.increment(id, qty);
    }
    await usageRepo.saveUsage(order.id, null);
  }

  async restoreForOrder(tx: TxClient, order: Pick<OrderForInventory, 'id'>): Promise<void> {
    return this.hoanNguyenLieuChoDonHang(tx, order);
  }

  /**
   * Kiểm tra sớm (KHÔNG khóa) xem toàn bộ các dòng có đủ nguyên liệu không.
   * Dùng ở tạo đơn và giỏ hàng để báo lỗi sớm; kết quả chỉ mang tính tham khảo,
   * quyết định cuối cùng vẫn là `deductForOrder` lúc PAID.
   * @throws InsufficientIngredientError (409) nếu thiếu nguyên liệu hoặc có món chưa có công thức.
   */
  async kiemTraKhaNangDapUng(items: ReadonlyArray<InventoryLineInput>): Promise<void> {
    if (items.length === 0) return;
    const { withRecipe, missing } = await this.ganCongThucChoCacMon(this.recipes, items);
    if (missing.length > 0) {
      throw new InsufficientIngredientError([], missing);
    }
    const demand = this.calculator.compute(withRecipe);
    const records = await this.ingredients.findByIds(demand.ingredientIds());
    const shortages = this.timNguyenLieuThieu(demand, records);
    if (shortages.length > 0) {
      throw new InsufficientIngredientError(shortages);
    }
  }

  async checkFulfillable(items: ReadonlyArray<InventoryLineInput>): Promise<void> {
    return this.kiemTraKhaNangDapUng(items);
  }

  /**
   * Trạng thái còn bán được của từng món: có công thức VÀ mọi nguyên liệu đủ cho ít nhất
   * 1 ly size M. Món không tồn tại / chưa có công thức → false.
   */
  async kiemTraMonConBanDuoc(productIds: ReadonlyArray<string>): Promise<Map<string, boolean>> {
    const result = new Map<string, boolean>();
    for (const id of productIds) result.set(id, false);
    if (productIds.length === 0) return result;

    const recipes = await this.recipes.findByProductIds(productIds);
    const allIngredientIds = new Set<string>();
    for (const r of recipes) for (const line of r.items) allIngredientIds.add(line.ingredientId);
    const stock = new Map((await this.ingredients.findByIds(Array.from(allIngredientIds))).map((i) => [i.id, i.quantity]));

    for (const recipe of recipes) {
      if (recipe.items.length === 0) continue;
      const oneCup = this.calculator.computeLine({
        productId: recipe.productId,
        size: AVAILABILITY_REFERENCE_SIZE,
        qty: 1,
        toppings: [],
        recipe: recipe.items,
      });
      result.set(recipe.productId, oneCup.entries().every(([id, need]) => (stock.get(id) ?? 0) >= need));
    }
    return result;
  }

  async getProductAvailability(productIds: ReadonlyArray<string>): Promise<Map<string, boolean>> {
    return this.kiemTraMonConBanDuoc(productIds);
  }

  /** Gắn công thức vào từng dòng; tách riêng các món không có công thức. */
  private async ganCongThucChoCacMon(
    recipeRepo: RecipeRepository,
    items: ReadonlyArray<InventoryLineInput>,
  ): Promise<{ withRecipe: OrderItemWithRecipe[]; missing: MissingRecipe[] }> {
    const recipes = await recipeRepo.findByProductIds(items.map((i) => i.productId));
    const byProduct = new Map(recipes.map((r) => [r.productId, r]));
    const withRecipe: OrderItemWithRecipe[] = [];
    const missing = new Map<string, MissingRecipe>();

    for (const item of items) {
      const recipe = byProduct.get(item.productId);
      if (!recipe || recipe.items.length === 0) {
        missing.set(item.productId, { productId: item.productId, productName: recipe?.productName ?? item.productId });
        continue;
      }
      withRecipe.push({
        productId: item.productId,
        size: item.size,
        qty: item.qty,
        toppings: IngredientStockService.chuanHoaDanhSachTopping(item.toppings),
        recipe: recipe.items,
      });
    }
    return { withRecipe, missing: Array.from(missing.values()) };
  }

  /** So nhu cầu với tồn hiện có; nguyên liệu không còn tồn tại được coi như còn 0. */
  private timNguyenLieuThieu(demand: IngredientDemand, records: ReadonlyArray<IngredientRecord>): IngredientShortage[] {
    const byId = new Map(records.map((r) => [r.id, r]));
    const shortages: IngredientShortage[] = [];
    for (const [id, need] of demand.entries()) {
      const rec = byId.get(id);
      const have = rec?.quantity ?? 0;
      if (have < need) {
        shortages.push({ ingredientId: id, ingredientName: rec?.name ?? id, unit: rec?.unit ?? '', need, have });
      }
    }
    return shortages;
  }

  /** Chuẩn hóa topping: chấp nhận mảng hoặc chuỗi "a, b" (định dạng lưu trong DB). */
  private static chuanHoaDanhSachTopping(toppings: InventoryLineInput['toppings']): string[] {
    if (!toppings) return [];
    const list = typeof toppings === 'string' ? toppings.split(',') : Array.from(toppings);
    return list.map((t) => t.trim()).filter(Boolean);
  }
}

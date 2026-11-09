import { ConflictException } from '@nestjs/common';
import { IngredientShortage, MissingRecipe } from './kieu-ton-kho';

/**
 * Lỗi 409 khi không đủ nguyên liệu (hoặc có món chưa có công thức).
 * Mang danh sách chi tiết để UI hiển thị rõ thiếu gì; body trả về client có dạng:
 * `{ statusCode: 409, error: 'Conflict', code: 'INSUFFICIENT_INGREDIENT', message, shortages, missingRecipes }`.
 */
export class InsufficientIngredientError extends ConflictException {
  readonly shortages: ReadonlyArray<IngredientShortage>;
  readonly missingRecipes: ReadonlyArray<MissingRecipe>;

  constructor(shortages: ReadonlyArray<IngredientShortage>, missingRecipes: ReadonlyArray<MissingRecipe> = []) {
    const message = InsufficientIngredientError.buildMessage(shortages, missingRecipes);
    super({
      statusCode: 409,
      error: 'Conflict',
      code: 'INSUFFICIENT_INGREDIENT',
      message,
      shortages,
      missingRecipes,
    });
    this.shortages = shortages;
    this.missingRecipes = missingRecipes;
  }

  /** Thông điệp tiếng Việt, vd: "Không đủ nguyên liệu: Sữa tươi (cần 300ml, còn 100ml)". */
  static buildMessage(shortages: ReadonlyArray<IngredientShortage>, missingRecipes: ReadonlyArray<MissingRecipe>): string {
    const parts: string[] = [];
    if (missingRecipes.length > 0) {
      parts.push(`Món tạm ngừng bán: ${missingRecipes.map((m) => m.productName).join(', ')}`);
    }
    if (shortages.length > 0) {
      const detail = shortages.map((s) => `${s.ingredientName} (cần ${s.need}${s.unit}, còn ${s.have}${s.unit})`).join(', ');
      parts.push(`Không đủ nguyên liệu: ${detail}`);
    }
    return parts.join('. ') || 'Không đủ nguyên liệu';
  }
}


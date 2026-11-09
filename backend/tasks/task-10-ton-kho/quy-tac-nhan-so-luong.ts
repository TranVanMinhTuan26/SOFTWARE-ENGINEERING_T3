/** Ngữ cảnh của một dòng đơn dùng để quy đổi lượng nguyên liệu. */
export interface ScalingContext {
  size: string;
  toppings: ReadonlyArray<string>;
}

/**
 * Chính sách (Strategy) quy đổi lượng nguyên liệu của công thức gốc (size M, 1 ly)
 * sang lượng cho 1 ly theo ngữ cảnh dòng đơn. Trả về số thực CHƯA làm tròn;
 * việc nhân số ly và làm tròn lên do RecipeCalculator đảm nhiệm.
 */
export interface QuantityScalingPolicy {
  scale(baseQty: number, ctx: ScalingContext): number;
}


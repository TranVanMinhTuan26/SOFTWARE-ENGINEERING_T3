import { QuantityScalingPolicy, ScalingContext } from './quy-tac-nhan-so-luong';

/** Hệ số mặc định theo quy tắc nghiệp vụ: S = 0.8, M = 1.0, L = 1.3. */
export const DEFAULT_SIZE_FACTORS: Readonly<Record<string, number>> = Object.freeze({ S: 0.8, M: 1.0, L: 1.3 });

/**
 * Chính sách quy đổi theo size. Hệ số được truyền qua constructor (mặc định DEFAULT_SIZE_FACTORS),
 * muốn đổi hệ số chỉ cần khởi tạo với cấu hình khác — không sửa logic ở nơi khác.
 */
export class SizeScalingPolicy implements QuantityScalingPolicy {
  private readonly factors: ReadonlyMap<string, number>;

  constructor(factors: Readonly<Record<string, number>> = DEFAULT_SIZE_FACTORS) {
    const map = new Map<string, number>();
    for (const [size, factor] of Object.entries(factors)) {
      if (!Number.isFinite(factor) || factor <= 0) {
        throw new RangeError(`Hệ số size ${size} phải là số dương`);
      }
      map.set(size, factor);
    }
    this.factors = map;
  }

  /** Hệ số của một size; ném RangeError nếu size không được cấu hình. */
  factorOf(size: string): number {
    const factor = this.factors.get(size);
    if (factor === undefined) throw new RangeError(`Size không hợp lệ: ${size}`);
    return factor;
  }

  scale(baseQty: number, ctx: ScalingContext): number {
    return baseQty * this.factorOf(ctx.size);
  }
}


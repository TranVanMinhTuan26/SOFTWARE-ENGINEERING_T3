import { IngredientDemand } from './nhu-cau-nguyen-lieu';
import { OrderItemWithRecipe } from './kieu-ton-kho';
import { LineDemandContributor } from './dong-gop-nhu-cau-mon';
import { QuantityScalingPolicy } from './quy-tac-nhan-so-luong';

/**
 * Làm tròn lên an toàn với sai số dấu phẩy động.
 * Ví dụ 150 × 1.3 = 195.00000000000003 trong JS; nếu ceil trực tiếp sẽ thành 196 (sai).
 * Ta làm tròn về 6 chữ số thập phân trước rồi mới ceil.
 */
export function lamTronLenAnToan(giaTri: number): number {
  return Math.ceil(Math.round(giaTri * 1e6) / 1e6);
}

export const safeCeil = lamTronLenAnToan;

/**
 * Tính tổng nhu cầu nguyên liệu của một tập dòng đơn (toàn đơn / toàn giỏ).
 *
 * - Thuần tính toán, KHÔNG truy cập DB.
 * - Chính sách quy đổi (size...) được tiêm qua constructor (Dependency Injection).
 * - Công thức mỗi dòng: ceil(lượngCôngThức × hệSố × soLy), làm tròn LÊN theo TỪNG dòng đơn,
 *   sau đó cộng dồn theo nguyên liệu để các món dùng chung (sữa, đường...) được gom lại.
 * - `contributors` là điểm mở rộng cho nhu cầu phụ (topping...). Mặc định rỗng.
 */
export class RecipeCalculator {
  constructor(
    private readonly chieuCheQuyDoi: QuantityScalingPolicy,
    private readonly nguonPhu: ReadonlyArray<LineDemandContributor> = [],
  ) {}

  tinhToanTongNhuCau(danhSachDongDonHang: ReadonlyArray<OrderItemWithRecipe>): IngredientDemand {
    let tongNhuCau = IngredientDemand.khoiTaoRong();
    for (const dongDonHang of danhSachDongDonHang) {
      tongNhuCau = tongNhuCau.gop(this.tinhToanDongDonHang(dongDonHang));
    }
    return tongNhuCau;
  }

  compute(items: ReadonlyArray<OrderItemWithRecipe>): IngredientDemand {
    return this.tinhToanTongNhuCau(items);
  }

  /** Nhu cầu của một dòng đơn. */
  tinhToanDongDonHang(dongDonHang: OrderItemWithRecipe): IngredientDemand {
    if (!Number.isInteger(dongDonHang.qty) || dongDonHang.qty < 1) {
      throw new RangeError(`Số lượng ly không hợp lệ: ${dongDonHang.qty}`);
    }
    let tongNhuCau = IngredientDemand.khoiTaoRong();
    for (const dongCongThuc of dongDonHang.recipe) {
      const luongMoiLy = this.chieuCheQuyDoi.scale(dongCongThuc.quantity, {
        size: dongDonHang.size,
        toppings: dongDonHang.toppings,
      });
      tongNhuCau = tongNhuCau.them(dongCongThuc.ingredientId, lamTronLenAnToan(luongMoiLy * dongDonHang.qty));
    }
    for (const nguonNhuCauPhu of this.nguonPhu) {
      tongNhuCau = tongNhuCau.gop(nguonNhuCauPhu.contribute(dongDonHang));
    }
    return tongNhuCau;
  }

  computeLine(item: OrderItemWithRecipe): IngredientDemand {
    return this.tinhToanDongDonHang(item);
  }
}

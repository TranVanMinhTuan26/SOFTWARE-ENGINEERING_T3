/**
 * Task 10.4: Khuyến mãi & Điểm thưởng (Loyalty Points & Promotions)
 * Xử lý:
 * - Áp dụng mã giảm giá (Voucher) hợp lệ
 * - Tích lũy điểm thưởng khi hoàn thành đơn (Loyalty Earning)
 * - Khấu trừ điểm thưởng đổi giảm giá an toàn (Loyalty Redemption)
 */

import { BadRequestException } from '@nestjs/common';

export interface PromotionRule {
  code: string;
  percentOff?: number;
  discountAmount?: number;
  active: boolean;
  expiresAt?: Date | string | null;
}

export function kiemTraMaKhuyenMai(quyTacKhuyenMai: PromotionRule | null | undefined): number {
  if (!quyTacKhuyenMai) {
    throw new BadRequestException('Mã khuyến mãi không tồn tại');
  }
  if (!quyTacKhuyenMai.active) {
    throw new BadRequestException('Mã khuyến mãi hiện không hoạt động');
  }
  if (quyTacKhuyenMai.expiresAt) {
    const thoiDiemHetHan =
      quyTacKhuyenMai.expiresAt instanceof Date
        ? quyTacKhuyenMai.expiresAt
        : new Date(quyTacKhuyenMai.expiresAt);
    if (isNaN(thoiDiemHetHan.getTime()) || thoiDiemHetHan.getTime() <= Date.now()) {
      throw new BadRequestException('Mã khuyến mãi đã hết hạn');
    }
  }
  return quyTacKhuyenMai.percentOff || 0;
}

export const validatePromotionCode = kiemTraMaKhuyenMai;

/**
 * Tỷ lệ tích điểm chuẩn hóa: 1.000 VNĐ chi tiêu hợp lệ = 1 điểm thưởng
 */
export const DEFAULT_EARNED_POINT_RATE = 1000;

/**
 * Tỷ lệ đổi điểm chuẩn hóa: 1 điểm = 100 VNĐ giảm giá (100 điểm = 10.000 VNĐ)
 */
export const DEFAULT_POINT_REDEEM_RATE = 100;

/**
 * Mức điểm tối thiểu để quy đổi điểm thưởng
 */
export const DEFAULT_MIN_POINT_REDEEM = 100;

/**
 * Tính số điểm tích lũy từ giá trị đơn hàng.
 * Quy tắc: Mỗi 1.000 VNĐ được 1 điểm (làm tròn xuống). Đơn < 1.000 VNĐ được 0 điểm.
 */
export function tinhDiemTichLuy(
  tongGiaTriDonHang: number,
  tiLeTichDiem: number = DEFAULT_EARNED_POINT_RATE,
): number {
  if (tongGiaTriDonHang <= 0 || tiLeTichDiem <= 0) return 0;
  return Math.floor(tongGiaTriDonHang / tiLeTichDiem);
}

export const calculateEarnedPoints = tinhDiemTichLuy;

/**
 * Tính số tiền giảm giá tương ứng với số điểm sử dụng.
 * Quy tắc: 100 điểm = 10.000 VNĐ (1 điểm = 100 VNĐ).
 */
export function tinhGiamGiaTuDiem(
  soDiemDoi: number,
  tiLeDoiDiem: number = DEFAULT_POINT_REDEEM_RATE,
): number {
  if (soDiemDoi <= 0 || tiLeDoiDiem <= 0) return 0;
  return Math.floor(soDiemDoi) * tiLeDoiDiem;
}

export const calculatePointsDiscount = tinhGiamGiaTuDiem;

/**
 * Tính số điểm tối đa có thể sử dụng cho đơn hàng:
 * Không vượt quá số dư hiện có của khách hàng và không vượt quá tổng tiền phải trả của đơn hàng.
 */
export function tinhDiemToiDaCoTheDoi(
  soDiemCuaKhach: number,
  soTienPhaiTra: number,
  tiLeDoiDiem: number = DEFAULT_POINT_REDEEM_RATE,
): number {
  if (soDiemCuaKhach <= 0 || soTienPhaiTra <= 0 || tiLeDoiDiem <= 0) return 0;
  const soDiemToiDaTheoTien = Math.floor(soTienPhaiTra / tiLeDoiDiem);
  return Math.max(0, Math.min(Math.floor(soDiemCuaKhach), soDiemToiDaTheoTien));
}

export const calculateMaxRedeemablePoints = tinhDiemToiDaCoTheDoi;

/**
 * Xác thực và tính toán số điểm sử dụng thực tế cùng số tiền giảm.
 */
export function kiemTraVaTinhDiemDoi(
  soDiemYeuCau: number,
  soDiemCuaKhach: number,
  soTienPhaiTra: number,
  mucDoiToiThieu: number = DEFAULT_MIN_POINT_REDEEM,
  tiLeDoiDiem: number = DEFAULT_POINT_REDEEM_RATE,
): { valid: boolean; actualPoints: number; discountAmount: number; error?: string } {
  const soDiemLamTron = Math.floor(soDiemYeuCau);
  if (soDiemLamTron <= 0) {
    return { valid: true, actualPoints: 0, discountAmount: 0 };
  }
  if (soDiemCuaKhach < mucDoiToiThieu) {
    return {
      valid: false,
      actualPoints: 0,
      discountAmount: 0,
      error: `Tài khoản cần tối thiểu ${mucDoiToiThieu} điểm để đổi mã giảm giá`,
    };
  }
  if (soDiemLamTron < mucDoiToiThieu) {
    return {
      valid: false,
      actualPoints: 0,
      discountAmount: 0,
      error: `Mức điểm quy đổi tối thiểu là ${mucDoiToiThieu} điểm`,
    };
  }
  if (soDiemLamTron > soDiemCuaKhach) {
    return {
      valid: false,
      actualPoints: 0,
      discountAmount: 0,
      error: 'Số điểm sử dụng không thể vượt quá số dư điểm hiện có',
    };
  }
  const soDiemToiDaDuocDoi = tinhDiemToiDaCoTheDoi(soDiemCuaKhach, soTienPhaiTra, tiLeDoiDiem);
  const soDiemThucTeDoi = Math.min(soDiemLamTron, soDiemToiDaDuocDoi);
  const soTienGiamGia = tinhGiamGiaTuDiem(soDiemThucTeDoi, tiLeDoiDiem);
  return { valid: true, actualPoints: soDiemThucTeDoi, discountAmount: soTienGiamGia };
}

export const validateRedeemPoints = kiemTraVaTinhDiemDoi;

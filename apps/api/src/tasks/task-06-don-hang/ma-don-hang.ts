import { randomInt } from 'crypto';

/** Bảng ký tự không gây nhầm lẫn (bỏ I, O, 0, 1 khỏi hiển thị để khách dễ đọc). */
const BANG_KY_TU_MA_DON = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const DO_DAI_MA_NGAU_NHIEN = 8;

/**
 * Sinh mã đơn hiển thị riêng, lưu trong DB (Order.code), dạng `BL` + 8 ký tự ngẫu nhiên.
 * Không suy ra từ CUID của Order.id nên không phụ thuộc vào định dạng khóa chính.
 */
export function taoMaDonHang(): string {
  let chuoiNgauNhien = '';
  for (let i = 0; i < DO_DAI_MA_NGAU_NHIEN; i++) {
    chuoiNgauNhien += BANG_KY_TU_MA_DON[randomInt(BANG_KY_TU_MA_DON.length)];
  }
  return `BL${chuoiNgauNhien}`;
}

/** Mã hiển thị cho người dùng: thêm tiền tố `#`. */
export function dinhDangMaDonHang(maDonHang: string): string {
  return maDonHang.startsWith('#') ? maDonHang : `#${maDonHang}`;
}

/** Chuẩn hóa mã người dùng nhập/URL (`#blabcd1234` -> `BLABCD1234`). */
export function chuanHoaMaDonHang(chuoiDauVao: string): string {
  return String(chuoiDauVao || '').trim().replace(/^#/, '').toUpperCase();
}

/**
 * Tra cứu đơn của một người dùng theo tham chiếu bất kỳ: id, mã hiển thị (Order.code, có/không `#`),
 * hoặc hậu tố id (tương thích đơn cũ từng hiển thị `#BL` + 6 ký tự cuối của id).
 */
export async function timDonHangTheoThamChieu(
  coSoDuLieu: any,
  maNguoiDung: string,
  thamChieuDonHang: string,
  quanHeKemTheo?: any,
) {
  const chuoiThamChieuTho = String(thamChieuDonHang || '').trim();
  if (!chuoiThamChieuTho) return null;

  let donHang = await coSoDuLieu.order.findFirst({
    where: { id: chuoiThamChieuTho, userId: maNguoiDung },
    include: quanHeKemTheo,
  });
  if (donHang) return donHang;

  const maDonChuanHoa = chuanHoaMaDonHang(chuoiThamChieuTho);
  donHang = await coSoDuLieu.order.findFirst({
    where: { code: maDonChuanHoa, userId: maNguoiDung },
    include: quanHeKemTheo,
  });
  if (donHang) return donHang;

  const hauToDonCu = maDonChuanHoa.replace(/^BL-?/, '').toLowerCase();
  if (hauToDonCu.length >= 4) {
    donHang = await coSoDuLieu.order.findFirst({
      where: { userId: maNguoiDung, id: { endsWith: hauToDonCu, mode: 'insensitive' } },
      include: quanHeKemTheo,
    });
  }
  return donHang || null;
}

// Aliases duy trì tính tương thích
export const generateOrderCode = taoMaDonHang;
export const formatOrderCode = dinhDangMaDonHang;
export const normalizeOrderCodeInput = chuanHoaMaDonHang;
export const findUserOrderByRef = timDonHangTheoThamChieu;
export const ORDER_CODE_ALPHABET = BANG_KY_TU_MA_DON;
export const ORDER_CODE_RANDOM_LENGTH = DO_DAI_MA_NGAU_NHIEN;

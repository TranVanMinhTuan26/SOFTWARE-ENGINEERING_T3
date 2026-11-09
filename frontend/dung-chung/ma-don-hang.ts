/**
 * Mã đơn hiển thị: ưu tiên mã lưu trong DB (Order.code, vd. `BLK7M2QX9P`).
 * Hỗ trợ fallback an toàn cho cả CUID, mã rút gọn, hoặc chuỗi mã truyền trực tiếp.
 */
export function hienThiMaDonHang(
  thongTinDonHang?: { id: string; code?: string | null } | string | null,
): string {
  if (!thongTinDonHang) return '#---';
  if (typeof thongTinDonHang === 'string') {
    const chuoiMa = thongTinDonHang.trim();
    if (!chuoiMa) return '#---';
    if (chuoiMa.startsWith('#')) return chuoiMa;
    if (chuoiMa.startsWith('BL')) return `#${chuoiMa}`;
    return `#BL${chuoiMa.length > 8 ? chuoiMa.slice(-6).toUpperCase() : chuoiMa.toUpperCase()}`;
  }
  if (thongTinDonHang.code) {
    return thongTinDonHang.code.startsWith('#') ? thongTinDonHang.code : `#${thongTinDonHang.code}`;
  }
  const maDinhDanhId = String(thongTinDonHang.id || '').trim();
  if (!maDinhDanhId) return '#---';
  if (maDinhDanhId.startsWith('#')) return maDinhDanhId;
  if (maDinhDanhId.startsWith('BL')) return `#${maDinhDanhId}`;
  return `#BL${maDinhDanhId.slice(-6).toUpperCase()}`;
}

// Alias tương thích
export const displayOrderCode = hienThiMaDonHang;

export const SIZE_SURCHARGE: Record<'S' | 'M' | 'L', number> = { S: 0, M: 5000, L: 10000 };
export const ALLOWED_TOPPINGS = ['Trân châu', 'Shot espresso', 'Kem cheese'] as const;
export const TOPPING_PRICE = 10000;

export function tinhTongTienDongSanPham(
  donGia: number,
  kichCo: string,
  danhSachTopping: string[],
  soLuong: number,
  bangGiaTopping?: Record<string, number>
): number {
  if (!Number.isInteger(donGia) || donGia < 0) throw new Error('Giá sản phẩm không hợp lệ');
  if (!(kichCo in SIZE_SURCHARGE)) throw new Error('Size không hợp lệ');
  if (!Number.isInteger(soLuong) || soLuong < 1) throw new Error('Số lượng phải từ 1 trở lên');

  let tongTienTopping = 0;
  for (const tenTopping of danhSachTopping) {
    if (bangGiaTopping && tenTopping in bangGiaTopping) {
      tongTienTopping += bangGiaTopping[tenTopping];
    } else if (ALLOWED_TOPPINGS.includes(tenTopping as typeof ALLOWED_TOPPINGS[number])) {
      tongTienTopping += TOPPING_PRICE;
    } else {
      throw new Error('Topping không hợp lệ');
    }
  }

  return (donGia + SIZE_SURCHARGE[kichCo as keyof typeof SIZE_SURCHARGE] + tongTienTopping) * soLuong;
}

export interface PromotionDiscountSpec {
  percentOff?: number | null;
  discountAmount?: number | null;
  fixedAmount?: number | null;
  expiresAt?: Date | string | null;
}

export function apDungKhuyenMai(
  tongTien: number,
  phanTramHoacThongTin: number | PromotionDiscountSpec,
  tienGiamThamSo?: number,
): number {
  if (typeof tongTien !== 'number' || !Number.isFinite(tongTien) || tongTien < 0) {
    throw new Error('Tổng tiền đơn hàng không hợp lệ');
  }
  let phanTramGiam = 0;
  let soTienGiamCoDinh = 0;

  if (typeof phanTramHoacThongTin === 'object' && phanTramHoacThongTin !== null) {
    phanTramGiam =
      phanTramHoacThongTin.percentOff !== undefined && phanTramHoacThongTin.percentOff !== null
        ? kiemTraPhanTramKhuyenMai(phanTramHoacThongTin.percentOff)
        : 0;
    const soTienGiamTho =
      phanTramHoacThongTin.discountAmount !== undefined && phanTramHoacThongTin.discountAmount !== null
        ? phanTramHoacThongTin.discountAmount
        : phanTramHoacThongTin.fixedAmount !== undefined && phanTramHoacThongTin.fixedAmount !== null
        ? phanTramHoacThongTin.fixedAmount
        : 0;
    soTienGiamCoDinh = kiemTraSoTienGiamGia(soTienGiamTho);
  } else {
    phanTramGiam = kiemTraPhanTramKhuyenMai(phanTramHoacThongTin);
    soTienGiamCoDinh = tienGiamThamSo !== undefined ? kiemTraSoTienGiamGia(tienGiamThamSo) : 0;
  }

  const tienSauGiamPhanTram = Math.round((tongTien * (100 - phanTramGiam)) / 100);
  return Math.max(0, tienSauGiamPhanTram - soTienGiamCoDinh);
}

export function kiemTraPhanTramKhuyenMai(giaTriPhanTram: any): number {
  if (giaTriPhanTram === null || giaTriPhanTram === undefined || typeof giaTriPhanTram === 'boolean' || giaTriPhanTram === '') {
    throw new Error('Phần trăm khuyến mãi không hợp lệ');
  }
  const soPhanTram = Number(giaTriPhanTram);
  if (!Number.isInteger(soPhanTram) || soPhanTram < 0 || soPhanTram > 100) {
    throw new Error('Phần trăm khuyến mãi phải là số nguyên từ 0 đến 100');
  }
  return soPhanTram;
}

export function kiemTraSoTienGiamGia(giaTriSoTienGiam: any): number {
  if (giaTriSoTienGiam === null || giaTriSoTienGiam === undefined || giaTriSoTienGiam === '') {
    return 0;
  }
  if (typeof giaTriSoTienGiam === 'boolean') {
    throw new Error('Số tiền giảm giá cố định không hợp lệ');
  }
  const soTienGiam = Number(giaTriSoTienGiam);
  if (!Number.isInteger(soTienGiam) || soTienGiam < 0) {
    throw new Error('Số tiền giảm giá cố định phải là số nguyên không âm');
  }
  return soTienGiam;
}

export function kiemTraKhuyenMaiHetHan(
  thongTinKhuyenMai: { expiresAt?: Date | string | null } | null | undefined,
  thoiDiemHienTai: Date = new Date(),
): boolean {
  if (!thongTinKhuyenMai || !thongTinKhuyenMai.expiresAt) return false;
  const ngayHetHan =
    thongTinKhuyenMai.expiresAt instanceof Date
      ? thongTinKhuyenMai.expiresAt
      : new Date(thongTinKhuyenMai.expiresAt);
  if (isNaN(ngayHetHan.getTime())) return true;
  return ngayHetHan.getTime() <= thoiDiemHienTai.getTime();
}

// Aliases duy trì tính tương thích
export const calculateLineTotal = tinhTongTienDongSanPham;
export const applyPromotion = apDungKhuyenMai;
export const validatePromotionPercent = kiemTraPhanTramKhuyenMai;
export const validatePromotionDiscountAmount = kiemTraSoTienGiamGia;
export const isPromotionExpired = kiemTraKhuyenMaiHetHan;

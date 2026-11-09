/**
 * VNPay Sandbox integration — ported from demo vnpay.js
 * Uses only Node.js built-in `crypto` (no npm packages).
 * Reference: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
 */
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export function taiBienMoiTruong(): void {
  if (process.env.VNPAY_TMN_CODE && process.env.VNPAY_HASH_SECRET) return;
  const cacTepTin = [
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), 'backend/.env'),
    path.join(process.cwd(), '../.env'),
    path.join(__dirname, '.env'),
    path.join(__dirname, '../../../.env'),
    path.join(__dirname, '../../../../.env'),
    path.join(__dirname, '../../../../../.env'),
  ];
  for (const tepTin of cacTepTin) {
    if (fs.existsSync(tepTin)) {
      try {
        const noiDung = fs.readFileSync(tepTin, 'utf8');
        for (const dong of noiDung.split(/\r?\n/)) {
          const khop = dong.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
          if (khop && !khop[1].startsWith('#')) {
            const giaTri = khop[2].replace(/^(['"])(.*)\1$/, '$2').trim();
            if (!process.env[khop[1]] || process.env[khop[1]] === '') {
              process.env[khop[1]] = giaTri;
            }
          }
        }
      } catch {}
    }
  }
}

export const tryLoadEnv = taiBienMoiTruong;

export const VNPAY_GATEWAY = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

export interface VnpayConfig {
  tmnCode: string;
  hashSecret: string;
  returnUrl: string;
}

/** Sort object keys alphabetically (required by VNPay signing spec). */
export function sapXepThuocTinhDoiTuong(doiTuong: Record<string, string>): Record<string, string> {
  const doiTuongSapXep: Record<string, string> = {};
  for (const khoa of Object.keys(doiTuong).sort()) doiTuongSapXep[khoa] = doiTuong[khoa];
  return doiTuongSapXep;
}

export const sortObject = sapXepThuocTinhDoiTuong;

/** Build the URL-encoded signing string from sorted params, skipping empty values. */
export function taoChuoiKyDuLieu(cacThamSo: Record<string, string>): string {
  const sapXep = sapXepThuocTinhDoiTuong(cacThamSo);
  const thamSoMaHoa = new URLSearchParams();
  for (const khoa of Object.keys(sapXep)) {
    const giaTri = sapXep[khoa];
    if (giaTri !== undefined && giaTri !== null && giaTri !== '') {
      thamSoMaHoa.append(khoa, String(giaTri));
    }
  }
  return thamSoMaHoa.toString();
}

export const signingString = taoChuoiKyDuLieu;

/** HMAC-SHA512 signature over the signing string. */
export function kyDuLieuHmacSha512(cacThamSo: Record<string, string>, khoaBiMat: string): string {
  return crypto.createHmac('sha512', khoaBiMat).update(taoChuoiKyDuLieu(cacThamSo), 'utf8').digest('hex');
}

export const sign = kyDuLieuHmacSha512;

/** Timing-safe hex comparison (prevent timing attacks). */
export function soSanhChuoiHexAnToan(chuoiHex1: string, chuoiHex2: string): boolean {
  if (typeof chuoiHex1 !== 'string' || typeof chuoiHex2 !== 'string' || chuoiHex1.length !== chuoiHex2.length) return false;
  if (!/^[a-f\d]+$/i.test(chuoiHex1) || !/^[a-f\d]+$/i.test(chuoiHex2)) return false;
  return crypto.timingSafeEqual(Buffer.from(chuoiHex1, 'hex'), Buffer.from(chuoiHex2, 'hex'));
}

export const safeEqualHex = soSanhChuoiHexAnToan;

/**
 * Verify a VNPay callback (return URL or IPN).
 * Strips vnp_SecureHash / vnp_SecureHashType before re-signing.
 */
export function xacThucCallbackVnpay(
  cacThamSo: Record<string, string>,
  khoaBiMat: string,
): boolean {
  if (!cacThamSo || !khoaBiMat || !cacThamSo.vnp_SecureHash) return false;
  const banSao = { ...cacThamSo };
  const chuKyNhanDuoc = banSao.vnp_SecureHash;
  delete banSao.vnp_SecureHash;
  delete banSao.vnp_SecureHashType;
  return soSanhChuoiHexAnToan(kyDuLieuHmacSha512(banSao, khoaBiMat), String(chuKyNhanDuoc));
}

export const verifyVnpayCallback = xacThucCallbackVnpay;

/** VNPay timestamp format: YYYYMMDDHHmmss in GMT+7. */
export function dinhDangNgayGioVnpay(ngayGio: Date): string {
  const d = new Date(ngayGio.getTime() + 7 * 60 * 60 * 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`;
}

export const formatDate = dinhDangNgayGioVnpay;

/** Normalize IP for VNPay (strips IPv6 prefix, takes first in X-Forwarded-For). */
export function chuanHoaDiaChiIp(diaChiIp: string): string {
  if (!diaChiIp) return '127.0.0.1';
  if (diaChiIp.startsWith('::ffff:')) return diaChiIp.slice(7);
  if (diaChiIp === '::1') return '127.0.0.1';
  return diaChiIp.split(',')[0].trim().slice(0, 45) || '127.0.0.1';
}

export const normalizeIp = chuanHoaDiaChiIp;

/** Read VNPay config from environment variables. */
export function layCauHinhVnpayTuEnv(): VnpayConfig {
  taiBienMoiTruong();
  return {
    tmnCode: process.env.VNPAY_TMN_CODE || '',
    hashSecret: process.env.VNPAY_HASH_SECRET || '',
    returnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:4000/payments/vnpay/return',
  };
}

export const vnpayConfigFromEnv = layCauHinhVnpayTuEnv;

/** Check if VNPay credentials are properly configured (not placeholder values). */
export function kiemTraDaCauHinhVnpay(cauHinh?: VnpayConfig): boolean {
  const c = cauHinh || layCauHinhVnpayTuEnv();
  return Boolean(
    c.tmnCode &&
      c.hashSecret &&
      c.tmnCode !== 'YOUR_TMN_CODE' &&
      c.hashSecret !== 'YOUR_HASH_SECRET',
  );
}

export const isVnpayConfigured = kiemTraDaCauHinhVnpay;

export interface BuildVnpayUrlParams {
  order: { id: string; totalAmount: number };
  config: VnpayConfig;
  clientIp?: string;
  now?: Date;
}

/**
 * Build the signed VNPay payment redirect URL.
 * - amount is sent as totalAmount × 100 (VNPay convention)
 * - uses order.id as vnp_TxnRef
 */
export function taoDuongDanThanhToanVnpay({
  order: donHang,
  config: cauHinh,
  clientIp: diaChiIpClient = '127.0.0.1',
  now: thoiGianHienTai = new Date(),
}: BuildVnpayUrlParams): string {
  if (!kiemTraDaCauHinhVnpay(cauHinh)) {
    throw new Error('Chưa cấu hình VNPAY_TMN_CODE và VNPAY_HASH_SECRET trong file .env');
  }
  if (!donHang || !donHang.id || !Number.isSafeInteger(donHang.totalAmount) || donHang.totalAmount < 1) {
    throw new Error('Đơn hàng không hợp lệ');
  }
  const cacThamSo: Record<string, string> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: cauHinh.tmnCode,
    vnp_Amount: String(donHang.totalAmount * 100),
    vnp_CurrCode: 'VND',
    vnp_TxnRef: donHang.id,
    vnp_OrderInfo: `Thanh toan don hang ${donHang.id}`,
    vnp_OrderType: 'other',
    vnp_Locale: 'vn',
    vnp_ReturnUrl: cauHinh.returnUrl,
    vnp_IpAddr: chuanHoaDiaChiIp(diaChiIpClient),
    vnp_CreateDate: dinhDangNgayGioVnpay(thoiGianHienTai),
  };
  const chuKyBaoMat = kyDuLieuHmacSha512(cacThamSo, cauHinh.hashSecret);
  const chuoiTruyVan = new URLSearchParams();
  for (const khoa of Object.keys(sapXepThuocTinhDoiTuong(cacThamSo))) chuoiTruyVan.append(khoa, cacThamSo[khoa]);
  chuoiTruyVan.append('vnp_SecureHash', chuKyBaoMat);
  return `${VNPAY_GATEWAY}?${chuoiTruyVan.toString()}`;
}

export const buildVnpayUrl = taoDuongDanThanhToanVnpay;

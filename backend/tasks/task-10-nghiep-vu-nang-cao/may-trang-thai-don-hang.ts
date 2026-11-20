/**
 * Task 10.1: Order State Machine
 * Quản lý vòng đời trạng thái đơn hàng nghiêm ngặt:
 * PENDING -> PAID -> PREPARING -> READY -> COMPLETED
 * hoặc PENDING / PAID / PREPARING -> CANCELLED
 */

export const ORDER_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'],
  PAYMENT_FAILED: ['PENDING', 'CANCELLED'],
  PAID: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function coTheChuyenTrangThai(trangThaiHienTai: string, trangThaiDich: string): boolean {
  return ORDER_TRANSITIONS[trangThaiHienTai]?.includes(trangThaiDich) ?? false;
}

export function xacNhanChuyenTrangThai(trangThaiHienTai: string, trangThaiDich: string): void {
  if (!coTheChuyenTrangThai(trangThaiHienTai, trangThaiDich)) {
    throw new Error(`Không thể chuyển trạng thái từ ${trangThaiHienTai} sang ${trangThaiDich}`);
  }
}

// Aliases duy trì tính tương thích
export const canTransition = coTheChuyenTrangThai;
export const assertTransition = xacNhanChuyenTrangThai;

/**
 * Task 10.2: Thanh toán Idempotent (Idempotent Payment)
 * Đảm bảo các yêu cầu thanh toán cùng một mã giao dịch / Idempotency Key
 * không bị trừ tiền hoặc xử lý 2 lần (chống duplicate payment).
 */

import { ConflictException } from '@nestjs/common';
import { PrismaClient, OrderStatus } from '@prisma/client';

export interface IdempotencyCheckResult {
  isDuplicate: boolean;
  existingPaymentId?: string;
  orderStatus?: OrderStatus;
}

export async function kiemTraIdempotencyThanhToan(
  prisma: any,
  maDonHang: string,
  maGiaoDich?: string
): Promise<IdempotencyCheckResult> {
  const donHangHienCo = typeof prisma.order?.findUnique === 'function'
    ? await prisma.order.findUnique({
        where: { id: maDonHang },
        include: { payment: true },
      })
    : typeof prisma.order?.findFirst === 'function'
      ? await prisma.order.findFirst({
          where: { id: maDonHang },
          include: { payment: true },
        })
      : null;

  if (!donHangHienCo) {
    return { isDuplicate: false };
  }

  // Nếu đơn đã được đánh dấu thanh toán thành công trước đó
  if (donHangHienCo.status === OrderStatus.PAID || donHangHienCo.status === OrderStatus.COMPLETED) {
    return {
      isDuplicate: true,
      existingPaymentId: donHangHienCo.payment?.id,
      orderStatus: donHangHienCo.status,
    };
  }

  // Kiểm tra idempotencyKey hoặc transactionRef nếu có
  if (maGiaoDich && (donHangHienCo.payment?.transactionRef === maGiaoDich || donHangHienCo.payment?.idempotencyKey === maGiaoDich)) {
    return {
      isDuplicate: true,
      existingPaymentId: donHangHienCo.payment?.id,
      orderStatus: donHangHienCo.status,
    };
  }

  return { isDuplicate: false };
}

export const checkPaymentIdempotency = kiemTraIdempotencyThanhToan;

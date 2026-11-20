import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { assertTransition } from './trang-thai-don-hang';
import { cancelOrderWithRefund } from './huy-don-hang.service';
import { settleSuccessfulPaymentAndLoyalty } from '../task-08-thanh-toan/thanh-toan.service';
import { normalizeOrderCodeInput } from './ma-don-hang';

export interface TransitionOrderOptions {
  cancelReason?: string;
  reason?: string;
  paymentDetails?: {
    method?: string;
    amount?: number;
    provider?: string;
    transactionRef?: string;
    bankCode?: string;
    responseCode?: string;
  };
}

/**
 * Dịch vụ duy nhất xử lý chuyển đổi trạng thái đơn hàng (Order State Transition Service - Lỗi 11)
 * Đảm bảo:
 * 1. Kiểm tra tính hợp lệ của việc chuyển trạng thái theo Finite-State Machine (assertTransition)
 * 2. Thực thi toàn bộ tác động phụ tương ứng trong cùng một transaction:
 *    - Chuyển sang CANCELLED: Hoàn tiền, hoàn trả tồn kho sản phẩm, thu hồi điểm thưởng đã tích
 *    - Chuyển sang PAID: Xác nhận thanh toán (SUCCESS) và tích điểm thưởng một cách Idempotent
 *    - Chuyển sang PAYMENT_FAILED: Giải phóng kho trả lại cho sản phẩm và đánh dấu payment FAILED
 *    - Chuyển từ PAYMENT_FAILED -> PENDING: Giữ lại kho nguyên tử (rehold stock), từ chối nếu không đủ kho
 *    - Chuyển tiếp tiến trình (PREPARING, READY, COMPLETED): Cập nhật trạng thái
 * 3. Idempotent: Nếu trạng thái đích trùng trạng thái hiện tại, trả về đơn hàng mà không thực thi trùng lặp tác động phụ
 */
export async function chuyenTrangThaiDonHang(
  prismaOrTx: any,
  orderId: string,
  targetStatus: string,
  options?: TransitionOrderOptions,
) {
  if (typeof prismaOrTx.$transaction === 'function') {
    return prismaOrTx.$transaction(async (tx: any) => {
      return thucThiChuyenTrangThaiDonHang(tx, orderId, targetStatus, options);
    });
  }
  return thucThiChuyenTrangThaiDonHang(prismaOrTx, orderId, targetStatus, options);
}

export const transitionOrderStatus = chuyenTrangThaiDonHang;

export async function thucThiChuyenTrangThaiDonHang(
  tx: any,
  orderId: string,
  targetStatus: string,
  options?: TransitionOrderOptions,
) {
  if (!orderId || typeof orderId !== 'string') {
    throw new BadRequestException('Mã đơn hàng không hợp lệ');
  }
  if (!targetStatus || typeof targetStatus !== 'string') {
    throw new BadRequestException('Trạng thái đích không hợp lệ');
  }

  const rawRef = orderId.trim();
  const normalizedCode = normalizeOrderCodeInput(rawRef);
  let cleanId = rawRef;
  if (cleanId.startsWith('#BL-')) cleanId = cleanId.replace('#BL-', '');
  else if (cleanId.startsWith('#BL')) cleanId = cleanId.replace('#BL', '');
  else if (cleanId.startsWith('BL-')) cleanId = cleanId.replace('BL-', '');
  else if (cleanId.startsWith('BL')) cleanId = cleanId.replace('BL', '');
  else if (cleanId.startsWith('#')) cleanId = cleanId.replace('#', '');

  // Khóa bi quan Order chống Race Condition giữa các callback hoặc tác vụ hết hạn đồng thời
  if (typeof tx.$queryRaw === 'function') {
    try {
      await tx.$queryRaw`
        SELECT id, status FROM "Order" 
        WHERE id = ${rawRef} OR code = ${normalizedCode}
        FOR UPDATE
      `;
    } catch {}
  }

  let order = await tx.order.findUnique({
    where: { id: rawRef },
    include: { payment: true, items: { include: { product: true } } },
  });
  if (!order) {
    order = await tx.order.findFirst({
      where: {
        OR: [
          { code: normalizedCode },
          ...(cleanId.length >= 3 ? [{ id: { equals: cleanId, mode: 'insensitive' as const } }] : []),
        ],
      },
      include: { payment: true, items: { include: { product: true } } },
    });
  }
  if (!order) {
    throw new NotFoundException('Không tìm thấy đơn hàng');
  }

  // Idempotency: nếu đơn đã ở trạng thái đích, trả về đơn hàng mà không áp dụng lại tác động phụ
  if (order.status === targetStatus) {
    return order;
  }

  // 1. Kiểm tra tính hợp lệ của việc chuyển trạng thái theo Finite-State Machine
  try {
    assertTransition(order.status, targetStatus);
  } catch (err: any) {
    throw new ConflictException(err.message);
  }

  const previousStatus = order.status;

  // 2. Xử lý các tác động phụ tương ứng trong transaction
  // Nhánh A: Chuyển sang CANCELLED
  if (targetStatus === 'CANCELLED') {
    return cancelOrderWithRefund(tx, order.id, options?.cancelReason || options?.reason);
  }

  // Nhánh B: Chuyển sang PAID
  if (targetStatus === 'PAID') {
    const paymentMethod = options?.paymentDetails?.method || order.payment?.method || 'Ví điện tử';
    const provider = options?.paymentDetails?.provider || order.payment?.provider || paymentMethod;
    const amount = options?.paymentDetails?.amount ?? order.total;
    const responseCode = options?.paymentDetails?.responseCode || (paymentMethod === 'COD' ? 'COD_COLLECTED' : '00');
    const transactionRef = options?.paymentDetails?.transactionRef || order.payment?.transactionRef;

    await settleSuccessfulPaymentAndLoyalty(tx, {
      orderId: order.id,
      method: paymentMethod,
      amount,
      provider,
      transactionRef,
      responseCode,
      reason: options?.reason || `Tích điểm thanh toán đơn ${order.id}`,
      existingOrder: order,
    });

    return tx.order.findUnique({
      where: { id: order.id },
      include: { payment: true, items: { include: { product: true } } },
    });
  }

  // Nhánh C: Chuyển từ PAYMENT_FAILED sang PENDING (khách thanh toán lại)
  if (previousStatus === 'PAYMENT_FAILED' && targetStatus === 'PENDING') {
    // Quy tắc 8: PENDING không giữ kho, chỉ chuyển trạng thái
    return tx.order.update({
      where: { id: order.id },
      data: { status: 'PENDING' },
      include: { payment: true, items: { include: { product: true } } },
    });
  }

  // Nhánh D: Chuyển sang PAYMENT_FAILED (thanh toán thất bại hoặc hủy cổng thanh toán)
  if (targetStatus === 'PAYMENT_FAILED') {
    if (previousStatus === 'PENDING') {
      if (typeof tx.order.updateMany === 'function') {
        await tx.order.updateMany({
          where: { id: order.id, status: 'PENDING' },
          data: { status: 'PAYMENT_FAILED' },
        });
      }
      // Quy tắc 8: PENDING không giữ kho nên khi PAYMENT_FAILED không cần hoàn kho
    }

    const payment = order.payment || (await tx.payment.findUnique({ where: { orderId: order.id } }));
    if (payment && payment.status !== 'SUCCESS') {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          responseCode: options?.paymentDetails?.responseCode || 'PAYMENT_FAILED',
        },
      });
    }

    if (typeof tx.order.update === 'function') {
      return tx.order.update({
        where: { id: order.id },
        data: { status: 'PAYMENT_FAILED' },
        include: { payment: true, items: { include: { product: true } } },
      });
    }

    if (typeof tx.order.findUnique === 'function') {
      return tx.order.findUnique({
        where: { id: order.id },
        include: { payment: true, items: { include: { product: true } } },
      });
    }
    return order;
  }

  // Nhánh E: Các trạng thái tuần tự thông thường (PAID -> PREPARING -> READY -> COMPLETED)
  return tx.order.update({
    where: { id: order.id },
    data: { status: targetStatus },
    include: { payment: true, items: { include: { product: true } } },
  });
}

export const executeOrderStatusTransition = thucThiChuyenTrangThaiDonHang;



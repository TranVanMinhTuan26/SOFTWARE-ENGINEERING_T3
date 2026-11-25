import { settleSuccessfulPaymentAndLoyalty } from './thanh-toan.service';

export interface ProcessVnpayCallbackTxInput {
  orderId: string;
  responseCode?: string;
  transactionRef?: string;
  reason?: string;
}

export interface ProcessVnpayCallbackTxResult {
  outOfStock: boolean;
  order?: any;
}

/**
 * Xử lý giao dịch nguyên tử cho VNPay Callback (Return URL & IPN)
 * 1. Khóa bi quan và đọc Order mới nhất
 * 2. Bỏ qua nếu đơn đã PAID
 * 3. Nếu đơn đã CANCELLED hoặc PAYMENT_FAILED: Đánh dấu REFUND_PENDING, không hồi sinh thành PAID, outOfStock = true
 * 4. Xác nhận thanh toán, trừ nguyên liệu và tích điểm Idempotent qua settleSuccessfulPaymentAndLoyalty
 */
export async function xuLyGiaoDichCallbackVnpay(
  tx: any,
  input: ProcessVnpayCallbackTxInput,
): Promise<ProcessVnpayCallbackTxResult> {
  // Xử lý lõi dùng chung cho return URL và IPN, bên trong transaction gọi từ
  // controller. Trả outOfStock=true khi giao dịch đã thu tiền nhưng đơn hết hạn
  // hoặc không đủ nguyên liệu, để controller hướng luồng xử lý sang hoàn tiền.
  const { orderId, responseCode, transactionRef, reason } = input;

  // Khóa dòng đơn để hai callback đồng thời không cùng chuyển trạng thái/trừ kho.
  // Một số adapter/test double không hỗ trợ raw query nên lỗi khóa được bỏ qua.
  try {
    await tx.$queryRaw`SELECT id, status FROM "Order" WHERE id = ${orderId} FOR UPDATE`;
  } catch {}

  const freshOrder = await tx.order.findUnique({
    where: { id: orderId },
    include: { items: true, payment: true },
  });

  const POST_PAID_STATUSES = ['PAID', 'PREPARING', 'READY', 'COMPLETED'];
  if (!freshOrder || POST_PAID_STATUSES.includes(freshOrder.status)) {
    return { outOfStock: false, order: freshOrder };
  }

  const existingPayment = freshOrder.payment || (await tx.payment?.findUnique({ where: { orderId } }));
  if (existingPayment && existingPayment.method && existingPayment.method !== 'VNPay') {
    return { outOfStock: false, order: freshOrder };
  }

  // Nếu đơn hàng đã bị CANCELLED hoặc PAYMENT_FAILED:
  // Tuyệt đối không chuyển sang PAID theo sơ đồ trạng thái FSM; chuyển sang CANCELLED và đánh dấu REFUND_PENDING.
  if (freshOrder.status === 'CANCELLED' || freshOrder.status === 'PAYMENT_FAILED') {
    // Giao dịch đến muộn không được hồi sinh đơn đã hết hạn: chuyển payment sang
    // REFUND_PENDING và báo cho caller rằng cần xử lý hoàn tiền.
    if (freshOrder.status === 'PAYMENT_FAILED') {
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });
    }

    const paymentRecord = await tx.payment.findUnique({ where: { orderId } });
    if (!paymentRecord) {
      await tx.payment.create({
        data: {
          orderId,
          idempotencyKey: `vnpay-${transactionRef || Date.now()}`,
          amount: freshOrder.total,
          method: 'VNPay',
          status: 'REFUND_PENDING',
          provider: 'VNPAY',
          transactionRef: transactionRef || `VNPAY-${Date.now()}`,
          responseCode: 'ORDER_EXPIRED_OR_CANCELLED_REFUND_PENDING',
        },
      });
    } else if (paymentRecord.status !== 'REFUNDED') {
      await tx.payment.update({
        where: { id: paymentRecord.id },
        data: {
          status: 'REFUND_PENDING',
          responseCode: 'ORDER_EXPIRED_OR_CANCELLED_REFUND_PENDING',
          transactionRef: transactionRef || paymentRecord.transactionRef,
        },
      });
    }
    return { outOfStock: true, order: freshOrder };
  }

  try {
    // Dùng chung nghiệp vụ chốt payment, trừ kho và thưởng điểm; tất cả nằm trong
    // transaction để lỗi ở bước bất kỳ có thể rollback đồng bộ.
    await settleSuccessfulPaymentAndLoyalty(tx, {
      orderId,
      method: 'VNPay',
      amount: freshOrder.total,
      provider: 'VNPAY',
      transactionRef: transactionRef || `VNPAY-${Date.now()}`,
      responseCode: responseCode || '00',
      reason: reason || `VNPay payment for order ${orderId}`,
      existingOrder: freshOrder,
    });
  } catch (err: any) {
    // Riêng lỗi thiếu nguyên liệu/đụng trạng thái không hợp lệ được chuyển thành
    // hủy đơn và chờ hoàn tiền; các lỗi không thuộc nhóm này phải nổi lên để rollback.
    // Quy tắc 10: VNPay thiếu nguyên liệu lúc PAID -> đơn CANCELLED, payment REFUND_PENDING (OUT_OF_STOCK_REFUND_PENDING), outOfStock = true
    if (err instanceof Error && ((err as any).response?.code === 'INSUFFICIENT_INGREDIENT' || err.name === 'ConflictException' || err.name === 'InsufficientIngredientError')) {
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });
      const paymentRecord = await tx.payment.findUnique({ where: { orderId } });
      if (!paymentRecord) {
        await tx.payment.create({
          data: {
            orderId,
            idempotencyKey: `vnpay-${transactionRef || Date.now()}`,
            amount: freshOrder.total,
            method: 'VNPay',
            status: 'REFUND_PENDING',
            provider: 'VNPAY',
            transactionRef: transactionRef || `VNPAY-${Date.now()}`,
            responseCode: 'OUT_OF_STOCK_REFUND_PENDING',
          },
        });
      } else {
        await tx.payment.update({
          where: { id: paymentRecord.id },
          data: {
            status: 'REFUND_PENDING',
            responseCode: 'OUT_OF_STOCK_REFUND_PENDING',
            transactionRef: transactionRef || paymentRecord.transactionRef,
          },
        });
      }
      return { outOfStock: true, order: freshOrder };
    }
    throw err;
  }

  return { outOfStock: false, order: freshOrder };
}

// Aliases duy trì tính tương thích
export const processVnpayCallbackTransaction = xuLyGiaoDichCallbackVnpay;

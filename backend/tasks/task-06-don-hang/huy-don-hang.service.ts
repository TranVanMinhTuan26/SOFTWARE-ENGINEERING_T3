import { NotFoundException } from '@nestjs/common';
import { assertTransition } from './trang-thai-don-hang';
import { getInventoryService } from '../task-10-ton-kho/khoi-tao-ton-kho';
import { IngredientStockService } from '../task-10-ton-kho/ton-kho-nguyen-lieu.service';

/**
 * Xử lý hủy đơn hàng toàn diện:
 * 1. Kiểm tra tính hợp lệ của việc hủy theo finite-state machine (assertTransition)
 * 2. Hoàn tiền theo phương thức thanh toán (VNPay / COD):
 *    - Nếu payment đang SUCCESS hoặc đơn đang PAID: Cập nhật status = 'REFUND_PENDING' (chưa gọi API hoàn tiền VNPay)
 *    - Nếu payment đang PENDING: Cập nhật status = 'CANCELLED'
 * 3. Hoàn trả nguyên liệu kho:
 *    - Chỉ hoàn nguyên liệu nếu Order.ingredientUsage khác null, hoàn ĐÚNG lượng đã lưu
 *      (không tính lại theo công thức hiện tại), rồi đặt ingredientUsage = null
 * 4. Điều chỉnh điểm thưởng trung thực:
 *    - Nếu đơn đã từng thanh toán (PAID), thu hồi số điểm đã tích (Math.floor(total / 1000))
 *    - Ghi nhận lịch sử giao dịch điểm trong LoyaltyTransaction
 * 5. Cập nhật trạng thái đơn hàng sang CANCELLED trong Transaction
 */
export async function huyDonHangVaHoanTien(
  tx: any,
  orderId: string,
  cancelReason?: string,
  inventoryService?: IngredientStockService,
) {
  const inventory = inventoryService || getInventoryService();
  // 1. Khóa bi quan và tìm đơn hàng
  if (typeof tx.$queryRaw === 'function') {
    try {
      await tx.$queryRaw`SELECT id, status FROM "Order" WHERE id = ${orderId} FOR UPDATE`;
    } catch {}
  }

  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { payment: true, items: true },
  });
  if (!order) {
    throw new NotFoundException('Không tìm thấy đơn hàng');
  }

  // Idempotency: nếu đơn đã ở trạng thái CANCELLED, trả về đơn hàng mà không thực thi trùng lặp tác động phụ
  if (order.status === 'CANCELLED') {
    return order;
  }

  // 1. Kiểm tra chuyển trạng thái theo finite state machine
  assertTransition(order.status, 'CANCELLED');

  const previousStatus = order.status;

  // 2. Chuyển trạng thái Order sang CANCELLED nguyên tử (ngăn chặn race condition giữa 2 tiến trình hủy đồng thời)
  let transitioned = true;
  if (typeof tx.order?.updateMany === 'function') {
    const res = await tx.order.updateMany({
      where: {
        id: order.id,
        status: { in: ['PENDING', 'PAID', 'PAYMENT_FAILED'] },
      },
      data: { status: 'CANCELLED' },
    });
    transitioned = (res?.count ?? 1) === 1;
  }

  if (!transitioned) {
    return (await tx.order.findUnique({ where: { id: order.id } })) || { ...order, status: 'CANCELLED' };
  }

  // 3. Xử lý hoàn tiền & cập nhật bản ghi thanh toán
  const payment = order.payment || (await tx.payment?.findUnique({ where: { orderId: order.id } }));
  if (payment) {
    if (payment.status === 'SUCCESS' || previousStatus === 'PAID') {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: order.total > 0 ? 'REFUND_PENDING' : 'CANCELLED',
          responseCode: order.total > 0 ? 'REFUND_AWAITING_PROCESSING' : 'ZERO_TOTAL_CANCELLED',
        },
      });
    } else if (payment.status === 'PENDING') {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'CANCELLED' },
      });
    }
  }

  // 4. Hoàn trả nguyên liệu kho đúng một lần
  // Quy tắc 9: Hủy đơn: chỉ hoàn nguyên liệu nếu Order.ingredientUsage khác null,
  // hoàn ĐÚNG lượng đã lưu (không tính lại theo công thức hiện tại), rồi đặt ingredientUsage = null.
  await inventory.restoreForOrder(tx, { id: order.id });

  // 5. Điều chỉnh điểm thưởng có ghi nhận lịch sử nếu đơn đã thanh toán (PAID)
  if (previousStatus === 'PAID') {
    let pointRate = 1000;
    try {
      const settings = await tx.storeSettings.findFirst();
      if (settings?.pointRate) {
        const parsed = parseInt(settings.pointRate, 10);
        if (!isNaN(parsed) && parsed > 0) pointRate = parsed;
      }
    } catch {}
    // Tỷ lệ chuẩn hóa: pointRate VNĐ = 1 điểm thưởng
    const pointsAwarded = Math.floor(order.total / pointRate);
    if (pointsAwarded > 0) {
      let alreadyClawedBack = false;
      if (typeof tx.loyaltyTransaction?.findFirst === 'function') {
        try {
          const existing = await tx.loyaltyTransaction.findFirst({
            where: {
              userId: order.userId,
              points: -pointsAwarded,
              reason: {
                startsWith: 'Thu hồi',
                contains: order.id,
              },
            },
          });
          if (existing) alreadyClawedBack = true;
        } catch {}
      }

      if (!alreadyClawedBack) {
        const user = await tx.user.findUnique({ where: { id: order.userId } });
        if (user) {
          // Thu hồi đầy đủ số điểm đã thưởng (chống trục lợi Loyalty Arbitrage)
          await tx.user.update({
            where: { id: order.userId },
            data: { loyaltyPoints: { decrement: pointsAwarded } },
          });
          await tx.loyaltyTransaction.create({
            data: {
              userId: order.userId,
              points: -pointsAwarded,
              reason: cancelReason
                ? `Thu hồi ${pointsAwarded} điểm do hủy đơn hàng ${order.id}: ${cancelReason}`
                : `Thu hồi ${pointsAwarded} điểm do hủy đơn hàng đã thanh toán ${order.id}`,
            },
          });
        }
      }
    }
  }

  // 6. Hoàn lại số điểm đã dùng (pointsUsed) cho khách khi đơn bị hủy (chống hoàn lặp)
  if (order.pointsUsed && order.pointsUsed > 0) {
    let alreadyRefunded = false;
    if (typeof tx.loyaltyTransaction?.findFirst === 'function') {
      try {
        const existing = await tx.loyaltyTransaction.findFirst({
          where: {
            userId: order.userId,
            points: order.pointsUsed,
            reason: {
              startsWith: 'Hoàn lại',
              contains: order.id,
            },
          },
        });
        if (existing) alreadyRefunded = true;
      } catch {}
    }

    if (!alreadyRefunded) {
      if (typeof tx.user?.update === 'function') {
        await tx.user.update({
          where: { id: order.userId },
          data: { loyaltyPoints: { increment: order.pointsUsed } },
        });
      }
      if (typeof tx.loyaltyTransaction?.create === 'function') {
        await tx.loyaltyTransaction.create({
          data: {
            userId: order.userId,
            points: order.pointsUsed,
            reason: cancelReason
              ? `Hoàn lại ${order.pointsUsed} điểm do hủy đơn hàng ${order.id}: ${cancelReason}`
              : `Hoàn lại ${order.pointsUsed} điểm do hủy đơn hàng ${order.id}`,
          },
        });
      }
    }
  }

  // 7. Cập nhật và trả về đơn hàng trạng thái CANCELLED
  if (typeof tx.order?.update === 'function') {
    return tx.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED' },
      include: { payment: true, items: { include: { product: true } } },
    });
  }
  return { ...order, status: 'CANCELLED' };
}

export const cancelOrderWithRefund = huyDonHangVaHoanTien;



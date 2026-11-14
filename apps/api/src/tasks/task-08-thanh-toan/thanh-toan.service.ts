import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { getInventoryService } from '../task-10-ton-kho/khoi-tao-ton-kho';
import { IngredientStockService } from '../task-10-ton-kho/ton-kho-nguyen-lieu.service';
import { InsufficientIngredientError } from '../task-10-ton-kho/loi-thieu-nguyen-lieu';
import { checkPaymentIdempotency } from '../task-10-nghiep-vu-nang-cao/thanh-toan-bat-bien';
import { calculateEarnedPoints } from '../task-10-nghiep-vu-nang-cao/tich-diem-khuyen-mai';

export interface ProcessPaymentInput {
  userId: string;
  orderId: string;
  method: string;
  idempotencyKey: string;
  simulateFailure?: boolean;
}

function laLoiRangBuocDuyNhat(err: any): boolean {
  if (!err) return false;
  if (err.code === 'P2002') return true;
  const msg = String(err.message || '').toLowerCase();
  return msg.includes('unique constraint') || msg.includes('duplicate key');
}

const isUniqueConstraintError = laLoiRangBuocDuyNhat;

async function timThanhToanTheoKhoaIdempotency(
  client: any,
  idempotencyKey: string,
  userId: string,
  orderId?: string,
) {
  if (typeof client.payment?.findUnique !== 'function') return null;
  const existing = await client.payment.findUnique({
    where: { idempotencyKey },
    include: { order: { select: { userId: true } } },
  });
  if (!existing) return null;

  let ownerUserId = existing.order?.userId;
  if (!ownerUserId && existing.orderId) {
    if (typeof client.order?.findUnique === 'function') {
      const ownerOrder = await client.order.findUnique({ where: { id: existing.orderId } });
      ownerUserId = ownerOrder?.userId;
    } else if (typeof client.order?.findFirst === 'function') {
      const ownerOrder = await client.order.findFirst({ where: { id: existing.orderId } });
      ownerUserId = ownerOrder?.userId;
    }
  }
  if (ownerUserId && ownerUserId !== userId) {
    throw new UnauthorizedException('Idempotency-Key không hợp lệ');
  }
  if (orderId && existing.orderId && existing.orderId !== orderId) {
    throw new ConflictException('Idempotency-Key đã được sử dụng cho đơn hàng khác');
  }
  const { order: _order, ...safePayment } = existing;
  return safePayment;
}

const findExistingPaymentByIdempotencyKey = timThanhToanTheoKhoaIdempotency;

export async function xuLyGiaoDichThanhToan(client: any, input: ProcessPaymentInput) {
  const { userId, orderId, method, idempotencyKey, simulateFailure } = input;

  if (!idempotencyKey || idempotencyKey.length < 8) {
    throw new BadRequestException('Idempotency-Key phải có ít nhất 8 ký tự');
  }

  if (method?.toUpperCase() === 'COD' && process.env.ENABLE_COD_PAYMENT !== 'true') {
    throw new BadRequestException('Phương thức thanh toán tiền mặt (COD) đã bị tắt. Hệ thống chỉ hỗ trợ thanh toán không tiền mặt (Ví điện tử, Thẻ ngân hàng, VNPay).');
  }

  if (method === 'VNPay') {
    throw new BadRequestException('Phương thức VNPay không được xác nhận qua API thanh toán mô phỏng. Vui lòng thanh toán qua cổng VNPay.');
  }

  if (!['Ví điện tử', 'Thẻ ngân hàng', 'COD'].includes(method)) {
    throw new BadRequestException(`Phương thức thanh toán "${method}" không hợp lệ`);
  }

  // Idempotency check: Gửi 2 lần cùng Idempotency-Key chỉ tạo 1 lần thanh toán / đơn
  const existing = await findExistingPaymentByIdempotencyKey(client, idempotencyKey, userId, orderId);
  if (existing) {
    return existing;
  }

  // Task 10.2: Tích hợp bộ kiểm tra Idempotent Payment
  const idempCheck = await checkPaymentIdempotency(client, orderId, idempotencyKey);
  if (idempCheck.isDuplicate) {
    const pastPayment = await client.payment.findFirst({ where: { orderId } });
    if (pastPayment) return pastPayment;
  }

  const order = await client.order.findFirst({
    where: { id: orderId, userId },
    include: { payment: true },
  });

  if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
  let failedPreviousPaymentId: string | null = null;
  if (order.payment) {
    if (order.payment.status === 'FAILED') {
      // Cho phép thử lại thanh toán cho đơn PAYMENT_FAILED theo sơ đồ State Machine
      failedPreviousPaymentId = order.payment.id;
    } else {
      return order.payment;
    }
  }

  if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PAYMENT_FAILED) {
    throw new ConflictException('Trạng thái đơn không cho phép thanh toán');
  }

  const initialOrderSnapshot = { ...order, status: order.status };
  const failed = !!simulateFailure;
  try {
    const result = await client.$transaction(async (tx: any) => {
      if (failedPreviousPaymentId) {
        if (typeof tx.payment?.deleteMany === 'function') {
          await tx.payment.deleteMany({ where: { id: failedPreviousPaymentId, status: 'FAILED' } });
        } else if (typeof tx.payment?.delete === 'function') {
          try {
            await tx.payment.delete({ where: { id: failedPreviousPaymentId } });
          } catch {}
        } else if (typeof client.payment?.deleteMany === 'function') {
          await client.payment.deleteMany({ where: { id: failedPreviousPaymentId, status: 'FAILED' } });
        } else if (typeof client.payment?.delete === 'function') {
          try {
            await client.payment.delete({ where: { id: failedPreviousPaymentId } });
          } catch {}
        }
      }

      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          idempotencyKey,
          amount: order.total,
          method,
          status: failed ? 'FAILED' : 'SUCCESS',
        },
      });

      if (failed) {
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.PAYMENT_FAILED },
        });
      } else {
        await settleSuccessfulPaymentAndLoyalty(tx, {
          orderId: order.id,
          method,
          amount: order.total,
          provider: 'MOCK',
          responseCode: 'MOCK_SUCCESS',
          reason: `Tích điểm đơn ${order.id}`,
          existingOrder: initialOrderSnapshot,
          existingPayment: payment,
        });
      }

      return payment;
    });

    return result;
  } catch (err: any) {
    // Nếu 2 request cùng Idempotency-Key (hoặc cùng orderId) đến đồng thời và gặp Unique Constraint (P2002),
    // đọc lại giao dịch đã tồn tại và trả kết quả cũ thay vì để request thứ hai lỗi.
    if (isUniqueConstraintError(err)) {
      for (let retry = 0; retry < 3; retry++) {
        const concurrentByKey = await findExistingPaymentByIdempotencyKey(
          client,
          idempotencyKey,
          userId,
          orderId,
        );
        if (concurrentByKey) {
          return concurrentByKey;
        }
        if (typeof client.order?.findFirst === 'function') {
          const refreshedOrder = await client.order.findFirst({
            where: { id: orderId, userId },
            include: { payment: true },
          });
          if (refreshedOrder?.payment) {
            return refreshedOrder.payment;
          }
        }
        if (retry < 2) {
          await new Promise((resolve) => setTimeout(resolve, 15 * (retry + 1)));
        }
      }
    }
    throw err;
  }
}

export interface RecordSuccessfulPaymentAndLoyaltyInput {
  orderId: string;
  method?: string;
  amount?: number;
  provider?: string;
  transactionRef?: string;
  responseCode?: string;
  reason?: string;
  existingOrder?: any;
  existingPayment?: any;
  inventoryService?: IngredientStockService;
}

/**
 * Hàm nghiệp vụ thống nhất ghi nhận thanh toán thành công và tích lũy điểm thưởng trong cùng Transaction.
 * Đảm bảo cơ chế chống ghi nhận trùng lặp điểm thưởng (Idempotent Loyalty Settlement):
 * 1. Khóa Order và kiểm tra trạng thái thanh toán mới nhất
 * 2. Cập nhật Order sang PAID (nếu chưa PAID)
 * 3. Tạo hoặc cập nhật Payment record sang SUCCESS
 * 4. Kiểm tra khóa duy nhất sự kiện thưởng theo orderId (trong LoyaltyRewardEvent & LoyaltyTransaction)
 * 5. Chỉ cộng điểm thưởng đúng 1 lần duy nhất ngay cả khi callback VNPay / webhook gửi lặp lại
 */
export async function quyetToanThanhToanVaTichDiem(
  tx: any,
  input: RecordSuccessfulPaymentAndLoyaltyInput
): Promise<{ order: any; payment: any; pointsAwarded: number; wasAlreadySettled: boolean }> {
  const { orderId, method, amount, provider, transactionRef, responseCode, reason, existingOrder, existingPayment, inventoryService } = input;
  const inventory = inventoryService || getInventoryService();

  // 1. Nạp thông tin Order mới nhất
  let order = existingOrder;
  if (!order && typeof tx.order?.findUnique === 'function') {
    order = await tx.order.findUnique({
      where: { id: orderId },
      include: { payment: true, user: true, items: true },
    });
  }
  if (!order) {
    throw new NotFoundException('Không tìm thấy đơn hàng');
  }

  // Chặn xác nhận thanh toán nếu đơn hàng đã bị hủy hoặc hết hạn
  if (order.status === 'CANCELLED') {
    throw new ConflictException('Đơn hàng đã bị hủy hoặc hết hạn, không thể xác nhận thanh toán');
  }

  const finalAmount = amount !== undefined ? amount : order.total;
  const POST_PAID_STATUSES = ['PAID', 'PREPARING', 'READY', 'COMPLETED'];
  const isAlreadyPaid = POST_PAID_STATUSES.includes(order.status);

  // 1.5. Trừ nguyên liệu kho: CHỈ trừ nguyên liệu đúng 1 lần, khi đơn lần đầu chuyển sang PAID
  // (mọi đường: COD, VNPay, mock, chuyển trạng thái tay). Chuyển PAID -> PREPARING KHÔNG trừ lại.
  if (!isAlreadyPaid && (order.status === 'PENDING' || order.status === 'PAYMENT_FAILED')) {
    // Đảm bảo items được nạp đầy đủ để trừ nguyên liệu
    let orderItems = order.items;
    if ((!orderItems || orderItems.length === 0) && typeof tx.orderItem?.findMany === 'function') {
      orderItems = await tx.orderItem.findMany({ where: { orderId: order.id } });
    }

    const deductResult = await inventory.deductForOrder(tx, {
      id: order.id,
      items: (orderItems || []).map((it: any) => ({
        productId: it.productId,
        size: it.size,
        qty: it.qty,
        toppings: it.toppings,
      })),
    });

    if (deductResult.ok === false) {
      throw new InsufficientIngredientError(deductResult.shortages, deductResult.missingRecipes);
    }
  }

  // 2. Tạo hoặc cập nhật Payment record sang trạng thái SUCCESS
  let payment = existingPayment || order.payment;
  if (!payment && typeof tx.payment?.findUnique === 'function') {
    payment = await tx.payment.findUnique({ where: { orderId } });
  }

  if (payment) {
    // 2a. Kiểm tra tính tương ứng của phương thức thanh toán
    if (payment.method && method && payment.method !== method) {
      throw new BadRequestException(
        `Phương thức thanh toán không khớp: đơn hàng là ${payment.method}, không thể xác nhận bằng ${method}`,
      );
    }

    // 2b. Kiểm tra trạng thái: không thể xác nhận thành công nếu giao dịch đã REFUNDED hoặc CANCELLED
    if (payment.status === 'REFUNDED' || payment.status === 'CANCELLED') {
      throw new ConflictException(
        `Giao dịch thanh toán đã ở trạng thái ${payment.status}, không thể chuyển đơn sang PAID`,
      );
    }

    // 2c. Cập nhật bản ghi thanh toán sang SUCCESS
    if (typeof tx.payment?.update === 'function') {
      payment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
          method: method || payment.method,
          amount: finalAmount,
          provider: provider || payment.provider || method || 'VNPAY',
          transactionRef: transactionRef || payment.transactionRef,
          responseCode: responseCode || payment.responseCode || 'SUCCESS',
        },
      });
    } else {
      payment.status = 'SUCCESS';
      payment.method = method || payment.method;
      payment.amount = finalAmount;
      payment.provider = provider || payment.provider || method || 'VNPAY';
      payment.transactionRef = transactionRef || payment.transactionRef;
      payment.responseCode = responseCode || payment.responseCode || 'SUCCESS';
    }
  } else if (typeof tx.payment?.create === 'function') {
    payment = await tx.payment.create({
      data: {
        orderId,
        idempotencyKey: `pay-${orderId}-${Date.now()}`,
        amount: finalAmount,
        method: method || 'VNPay',
        status: 'SUCCESS',
        provider: provider || method || 'VNPAY',
        transactionRef: transactionRef || `TXN-${Date.now()}`,
        responseCode: responseCode || 'SUCCESS',
      },
    });
  }

  // 2d. TUYỆT ĐỐI không chuyển đơn sang PAID nếu bản ghi thanh toán chưa thành công (status !== SUCCESS)
  if (!payment || payment.status !== 'SUCCESS') {
    throw new BadRequestException(
      'Không thể đánh dấu đơn đã thanh toán: bản ghi thanh toán chưa thành công',
    );
  }

  // 3. Cập nhật Order sang PAID nếu chưa phải PAID và đang ở trạng thái PENDING hoặc PAYMENT_FAILED
  if (!isAlreadyPaid && (order.status === 'PENDING' || order.status === 'PAYMENT_FAILED') && typeof tx.order?.update === 'function') {
    order = await tx.order.update({
      where: { id: orderId },
      data: { status: 'PAID' },
      include: { payment: true, items: true },
    });
  }

  // 3b. Dọn sạch giỏ hàng trong Database ngay khi đơn hàng thanh toán thành công (PAID)
  if (order.userId && typeof tx.cart?.findUnique === 'function') {
    try {
      const userCart = await tx.cart.findUnique({ where: { userId: order.userId } });
      if (userCart) {
        if (typeof tx.cartItem?.deleteMany === 'function') {
          await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });
        }
        if (typeof tx.cart?.update === 'function') {
          await tx.cart.update({
            where: { id: userCart.id },
            data: { voucherCode: null },
          });
        }
      }
    } catch {}
  }

  // 4. Cơ chế chống cộng điểm thưởng trùng lặp (Idempotent Loyalty Reward Check)
  let alreadyAwarded = false;

  // 4a. Kiểm tra bảng LoyaltyRewardEvent với khóa duy nhất theo orderId
  if (typeof tx.loyaltyRewardEvent?.findUnique === 'function') {
    try {
      const existingEvent = await tx.loyaltyRewardEvent.findUnique({ where: { orderId } });
      if (existingEvent) alreadyAwarded = true;
    } catch {}
  }

  // 4b. Kiểm tra bảng LoyaltyTransaction xem đã có bản ghi tích điểm cho đơn hàng này chưa (lọc points > 0 để không nhầm với bản ghi đổi điểm âm)
  if (!alreadyAwarded && typeof tx.loyaltyTransaction?.findFirst === 'function') {
    try {
      const existingTx = await tx.loyaltyTransaction.findFirst({
        where: {
          points: { gt: 0 },
          OR: [
            { reason: { contains: orderId } },
            { reason: `Tích điểm đơn ${orderId}` },
            { reason: `Tích điểm thanh toán COD đơn ${orderId}` },
            { reason: `Thu tiền COD tại quầy đơn ${orderId}` },
            { reason: `VNPay payment for order ${orderId}` },
            { reason: `VNPay IPN for order ${orderId}` },
          ],
        },
      });
      if (existingTx) {
        alreadyAwarded = true;
      }
    } catch {}
  }

  let pointsAwarded = 0;
  if (!alreadyAwarded) {
    let pointRate = 1000;
    try {
      const settings = await tx.storeSettings.findFirst();
      if (settings?.pointRate) {
        const parsed = parseInt(settings.pointRate, 10);
        if (!isNaN(parsed) && parsed > 0) pointRate = parsed;
      }
    } catch {}
    // Tỷ lệ chuẩn hóa: pointRate VNĐ chi tiêu hợp lệ = 1 điểm thưởng (mặc định: 1000 VNĐ)
    const points = calculateEarnedPoints(finalAmount, pointRate);

    // Ghi nhận khóa duy nhất vào bảng LoyaltyRewardEvent TRƯỚC khi cộng điểm
    let eventCreated = true;
    if (typeof tx.loyaltyRewardEvent?.createMany === 'function') {
      try {
        const res = await tx.loyaltyRewardEvent.createMany({
          data: [{ orderId, userId: order.userId, points }],
          skipDuplicates: true,
        });
        if (res && typeof res.count === 'number' && res.count === 0) {
          eventCreated = false;
        }
      } catch {
        eventCreated = false;
      }
    } else if (typeof tx.loyaltyRewardEvent?.create === 'function') {
      try {
        await tx.loyaltyRewardEvent.create({
          data: {
            orderId,
            userId: order.userId,
            points,
          },
        });
      } catch {
        // Bắt lỗi Unique constraint (P2002) nếu có transaction đồng thời đã tạo trước đó
        eventCreated = false;
      }
    }

    if (eventCreated) {
      pointsAwarded = points;

      // Cộng điểm thưởng vào tài khoản User nếu points > 0
      if (points > 0 && typeof tx.user?.update === 'function') {
        await tx.user.update({
          where: { id: order.userId },
          data: { loyaltyPoints: { increment: points } },
        });
      }

      // Tạo bản ghi lịch sử LoyaltyTransaction (kể cả khi points === 0)
      if (typeof tx.loyaltyTransaction?.create === 'function') {
        const defaultReason = method === 'COD'
          ? `Tích điểm thanh toán COD đơn ${orderId}`
          : method === 'VNPay' || provider === 'VNPAY'
          ? `VNPay payment for order ${orderId}`
          : `Tích điểm đơn ${orderId}`;

        await tx.loyaltyTransaction.create({
          data: {
            userId: order.userId,
            points,
            reason: reason || defaultReason,
          },
        });
      }
    } else {
      alreadyAwarded = true;
    }
  }

  return {
    order,
    payment,
    pointsAwarded,
    wasAlreadySettled: isAlreadyPaid && alreadyAwarded,
  };
}

export const settleSuccessfulPaymentAndLoyalty = quyetToanThanhToanVaTichDiem;
export const recordSuccessfulPaymentAndLoyalty = quyetToanThanhToanVaTichDiem;
export const processPaymentTransaction = xuLyGiaoDichThanhToan;

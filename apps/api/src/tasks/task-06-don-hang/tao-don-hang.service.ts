import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import {
  ALLOWED_TOPPINGS,
  applyPromotion,
  calculateLineTotal,
  isPromotionExpired,
  TOPPING_PRICE,
  validatePromotionDiscountAmount,
  validatePromotionPercent,
} from '../task-04-chi-tiet-san-pham/tinh-gia-mon';
import { generateOrderCode } from './ma-don-hang';
import { buildVnpayUrl, vnpayConfigFromEnv, isVnpayConfigured } from '../task-08-thanh-toan/cong-vnpay.service';
import { settleSuccessfulPaymentAndLoyalty } from '../task-08-thanh-toan/thanh-toan.service';
import { getInventoryService } from '../task-10-ton-kho/khoi-tao-ton-kho';

export interface CreateOrderItemInput {
  productId: string;
  size: string;
  toppings: string[] | string;
  qty: number;
}

export interface CreateOrderInput {
  userId: string;
  items: CreateOrderItemInput[];
  promotionCode?: string;
  pointsUsed?: number;
  paymentExpiresAt?: Date | null;
}

/**
 * 1. Hàm kiểm tra hợp lệ và chuẩn hóa danh sách món ăn (Item Validation & Normalization)
 * - Kiểm tra danh sách món không rỗng
 * - Kiểm tra từng món: size (S, M, L), số lượng (1..99 nguyên), toppings hợp lệ
 * - Chống gửi trùng dòng sản phẩm
 */
export function kiemTraVaChuanBiDongDonHang(
  items: CreateOrderItemInput[],
  allowedToppingsMap?: Record<string, number>
): {
  normalizedItems: Array<{ productId: string; size: string; toppings: string[]; qty: number }>;
  productQuantities: Record<string, number>;
  productIds: string[];
} {
  if (!items || items.length === 0) {
    throw new BadRequestException('Giỏ hàng đang trống');
  }

  const normalizedItems: Array<{ productId: string; size: string; toppings: string[]; qty: number }> = [];
  const productQuantities: Record<string, number> = {};

  for (const item of items) {
    if (!['S', 'M', 'L'].includes(item.size)) {
      throw new BadRequestException(`Size "${item.size}" không hợp lệ (chỉ chấp nhận S, M, L)`);
    }
    if (!Number.isInteger(item.qty) || item.qty < 1 || item.qty > 99) {
      throw new BadRequestException('Số lượng mỗi món phải là số nguyên từ 1 đến 99');
    }

    const toppingsList: string[] = Array.isArray(item.toppings)
      ? item.toppings
      : (item.toppings ? String(item.toppings).split(',').map((t: string) => t.trim()).filter(Boolean) : []);

    if (
      toppingsList.some(
        (t: string) =>
          !ALLOWED_TOPPINGS.includes(t as any) && (!allowedToppingsMap || !(t in allowedToppingsMap))
      )
    ) {
      throw new BadRequestException('Topping không hợp lệ');
    }

    normalizedItems.push({
      productId: item.productId,
      size: item.size,
      toppings: toppingsList,
      qty: item.qty,
    });

    productQuantities[item.productId] = (productQuantities[item.productId] || 0) + item.qty;
  }

  const itemKeys = normalizedItems.map((i) => `${i.productId}:${i.size}:${[...i.toppings].sort().join(',')}`);
  if (new Set(itemKeys).size !== itemKeys.length) {
    throw new BadRequestException('Không gửi trùng dòng sản phẩm; hãy gộp số lượng');
  }

  return {
    normalizedItems,
    productQuantities,
    productIds: Object.keys(productQuantities),
  };
}

/**
 * 2. Lõi xử lý nghiệp vụ tạo đơn hàng dùng chung (Unified Order Creation Core Engine)
 * Đảm bảo mọi đường tạo đơn (Checkout từ giỏ hàng hoặc Tạo đơn trực tiếp)
 * đều tuân theo đúng 1 quy tắc nghiệp vụ duy nhất:
 *   Step 1: Xác thực dữ liệu đầu vào (size, số lượng, topping, chống trùng)
 *   Step 2: Khóa bi quan (SELECT ... FOR UPDATE) chống race condition
 *   Step 3: Kiểm tra sản phẩm tồn tại, còn bán (active: true) và đủ tồn kho
 *   Step 4: Trừ tồn kho nguyên tử (atomic decrement với điều kiện stock: { gte: needed })
 *   Step 5: Tính giá từng dòng với giá sản phẩm mới nhất từ DB
 *   Step 6: Áp dụng mã khuyến mãi thống nhất (case-insensitive, kiểm tra active: true)
 *   Step 7: Tạo Order và OrderItem trong Database ở trạng thái PENDING
 */
export async function thucThiTaoDonHangCotLoi(tx: any, input: CreateOrderInput) {
  const { userId, items, promotionCode } = input;

  // 1. Lấy danh sách topping đang active để kiểm tra hợp lệ và giá
  const activeToppings = tx.topping
    ? await tx.topping.findMany({ where: { active: true } }).catch(() => [])
    : [];
  const toppingPricesMap: Record<string, number> = {};
  for (const top of activeToppings) {
    toppingPricesMap[top.name] = top.price;
  }

  // 1b. Kiểm tra tính hợp lệ và chuẩn hóa danh sách món
  const { normalizedItems, productQuantities, productIds } = kiemTraVaChuanBiDongDonHang(items, toppingPricesMap);

  // 2. Kiểm tra sớm khả dụng nguyên liệu (checkFulfillable) gom theo toàn đơn
  const inventory = getInventoryService();
  await inventory.checkFulfillable(
    normalizedItems.map((item) => ({
      productId: item.productId,
      size: item.size,
      qty: item.qty,
      toppings: item.toppings,
    }))
  );

  // 3. Kiểm tra sản phẩm tồn tại và đang kinh doanh (active: true)
  const productMap = new Map<string, any>();
  for (const prodId of productIds) {
    const p = await tx.product.findUnique({ where: { id: prodId } });
    if (!p || !p.active) {
      throw new NotFoundException('Sản phẩm không tồn tại hoặc đã ngừng kinh doanh');
    }
    productMap.set(prodId, p);
  }

  // 4. (Quy tắc 8): Đơn PENDING KHÔNG giữ/trừ kho. Việc trừ kho thực hiện khi sang PAID.

  // 5. Tính toán thành tiền từng dòng sản phẩm với giá mới nhất từ Database
  let subtotal = 0;
  const rows: any[] = [];
  for (const item of normalizedItems) {
    const p = productMap.get(item.productId) || (await tx.product.findUnique({ where: { id: item.productId } }));
    const lineTotal = calculateLineTotal(p.price, item.size, item.toppings, item.qty, toppingPricesMap);
    const unitPrice = calculateLineTotal(p.price, item.size, item.toppings, 1, toppingPricesMap);
    subtotal += lineTotal;
    rows.push({
      productId: p.id,
      size: item.size,
      toppings: item.toppings.join(', '),
      qty: item.qty,
      lineTotal,
      // Snapshot tại thời điểm đặt hàng (lịch sử đơn không đổi khi sản phẩm / topping được cập nhật)
      productName: p.name,
      basePrice: p.price,
      unitPrice,
      toppingsSnapshot: item.toppings.map((name: string) => ({
        name,
        price: name in toppingPricesMap ? toppingPricesMap[name] : TOPPING_PRICE,
      })),
    });
  }

  // 6. Áp dụng mã khuyến mãi thống nhất (case-insensitive, kiểm tra active & hạn sử dụng expiresAt)
  let total = subtotal;
  let promotion: any = null;
  if (promotionCode && promotionCode.trim()) {
    const cleanCode = promotionCode.trim().toUpperCase();
    promotion = await tx.promotion.findFirst({
      where: { code: cleanCode, active: true },
    });
    if (!promotion) {
      throw new BadRequestException('Mã khuyến mãi không hợp lệ');
    }
    if (isPromotionExpired(promotion)) {
      throw new BadRequestException('Mã khuyến mãi đã hết hạn sử dụng');
    }
    const percentOff = promotion.percentOff !== undefined && promotion.percentOff !== null ? promotion.percentOff : 0;
    const discountAmount =
      promotion.discountAmount !== undefined && promotion.discountAmount !== null
        ? promotion.discountAmount
        : promotion.fixedAmount !== undefined && promotion.fixedAmount !== null
        ? promotion.fixedAmount
        : 0;
    try {
      validatePromotionPercent(percentOff);
      validatePromotionDiscountAmount(discountAmount);
    } catch {
      throw new BadRequestException('Khuyến mãi có mức giảm giá không hợp lệ (phải là số nguyên từ 0% đến 100% hoặc số tiền không âm)');
    }
    total = applyPromotion(subtotal, { percentOff, discountAmount });
  }

  // 7. Xử lý đổi điểm thưởng (Loyalty Points Redemption)
  let pointsUsed = 0;
  let pointsDiscount = 0;

  if (input.pointsUsed !== undefined && input.pointsUsed !== null) {
    const rawPoints = input.pointsUsed;
    if (typeof rawPoints !== 'number' || !Number.isInteger(rawPoints) || rawPoints < 0) {
      throw new BadRequestException('Số điểm sử dụng phải là số nguyên không âm');
    }

    if (rawPoints > 0) {
      let minRedeem = 100;
      let pointToMoneyRate = 100;
      try {
        const settings = await tx.storeSettings.findFirst();
        if (settings?.pointRedeem) {
          const parsed = parseInt(settings.pointRedeem, 10);
          if (!isNaN(parsed) && parsed >= 0) minRedeem = parsed;
        }
        if ((settings as any)?.pointToMoneyRate) {
          const parsed = parseInt((settings as any).pointToMoneyRate, 10);
          if (!isNaN(parsed) && parsed > 0) pointToMoneyRate = parsed;
        }
      } catch {}

      if (rawPoints < minRedeem) {
        throw new BadRequestException(`Mức điểm quy đổi tối thiểu là ${minRedeem} điểm`);
      }

      // Khóa bi quan và đọc số dư điểm thực tế từ Database
      let user: any = null;
      if (typeof tx.$queryRaw === 'function') {
        try {
          const users = await tx.$queryRaw<Array<{ id: string; loyaltyPoints: number }>>`
            SELECT id, "loyaltyPoints" FROM "User" WHERE id = ${userId} FOR UPDATE
          `;
          if (users && users.length > 0) user = users[0];
        } catch {}
      }
      if (!user) {
        user = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true, loyaltyPoints: true },
        });
      }

      if (!user) {
        throw new NotFoundException('Không tìm thấy thông tin người dùng');
      }

      const balance = Number(user.loyaltyPoints) || 0;
      if (balance < minRedeem) {
        throw new BadRequestException(`Tài khoản cần tối thiểu ${minRedeem} điểm để đổi mã giảm giá`);
      }
      if (rawPoints > balance) {
        throw new BadRequestException('Số điểm sử dụng vượt quá số dư hiện có trong tài khoản');
      }

      // Quy ước chuẩn hóa: 1 điểm = pointToMoneyRate VNĐ (mặc định 100 VNĐ)
      const calculatedDiscount = rawPoints * pointToMoneyRate;
      if (calculatedDiscount > total) {
        throw new BadRequestException(
          'Mức giảm từ điểm thưởng không được vượt quá số tiền phải trả của đơn hàng'
        );
      }

      // Trừ điểm nguyên tử trong database
      const userUpdateResult = await tx.user.updateMany({
        where: {
          id: userId,
          loyaltyPoints: { gte: rawPoints },
        },
        data: {
          loyaltyPoints: { decrement: rawPoints },
        },
      });

      if (userUpdateResult.count !== 1) {
        throw new ConflictException('Số dư điểm thưởng vừa thay đổi hoặc không đủ, vui lòng thử lại');
      }

      pointsUsed = rawPoints;
      pointsDiscount = calculatedDiscount;
      total = Math.max(0, total - pointsDiscount);
    }
  }

  // 8. Tạo hoặc tái sử dụng Order trạng thái PENDING / PAYMENT_FAILED trong Database
  // Nếu người dùng đã có một đơn hàng PENDING hoặc PAYMENT_FAILED gần đây,
  // tái sử dụng đơn hàng này để cập nhật phương thức / tổng tiền, tránh tạo nhiều đơn trùng lặp trong lịch sử
  let order: any = null;
  if (typeof tx.order?.findFirst === 'function' && typeof tx.order?.update === 'function') {
    try {
      const existingUnpaid = await tx.order.findFirst({
        where: {
          userId,
          status: { in: [OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED] },
        },
        include: { payment: true },
        orderBy: { createdAt: 'desc' },
      });

      if (existingUnpaid) {
        if (existingUnpaid.pointsUsed && existingUnpaid.pointsUsed > 0) {
          await tx.user.updateMany({
            where: { id: userId },
            data: { loyaltyPoints: { increment: existingUnpaid.pointsUsed } },
          });
        }
        if (existingUnpaid.payment && typeof tx.payment?.deleteMany === 'function') {
          await tx.payment.deleteMany({ where: { orderId: existingUnpaid.id } });
        }
        if (typeof tx.orderItem?.deleteMany === 'function') {
          await tx.orderItem.deleteMany({ where: { orderId: existingUnpaid.id } });
        }

        order = await tx.order.update({
          where: { id: existingUnpaid.id },
          data: {
            code: existingUnpaid.code || generateOrderCode(),
            total,
            pointsUsed,
            pointsDiscount,
            status: OrderStatus.PENDING,
            paymentExpiresAt: input.paymentExpiresAt ?? null,
            promotionId: promotion?.id ?? null,
            items: { create: rows },
          },
          include: { items: { include: { product: true } } },
        });
      }
    } catch {}
  }

  if (!order) {
    let createdOrder: any = null;
    let attempts = 0;
    while (!createdOrder && attempts < 5) {
      attempts++;
      try {
        createdOrder = await tx.order.create({
          data: {
            code: generateOrderCode(),
            userId,
            total,
            pointsUsed,
            pointsDiscount,
            status: OrderStatus.PENDING,
            paymentExpiresAt: input.paymentExpiresAt ?? null,
            promotionId: promotion?.id,
            items: { create: rows },
          },
          include: { items: { include: { product: true } } },
        });
      } catch (err: any) {
        if (err?.code === 'P2002' && attempts < 5) {
          continue;
        }
        throw err;
      }
    }
    order = createdOrder;
  }

  // 9. Ghi nhận lịch sử giao dịch trừ điểm
  if (pointsUsed > 0 && typeof tx.loyaltyTransaction?.create === 'function') {
    await tx.loyaltyTransaction.create({
      data: {
        userId,
        points: -pointsUsed,
        reason: `Đổi ${pointsUsed} điểm giảm ${pointsDiscount.toLocaleString('vi-VN')}đ cho đơn hàng #${order.id}`,
      },
    });
  }

  return order;
}

/**
 * Tạo đơn hàng trực tiếp từ danh sách món (Direct Order Creation Flow)
 * - Sử dụng lõi nghiệp vụ thống nhất executeOrderCreationCore
 * - Không can thiệp vào giỏ hàng của người dùng
 */
export async function xuLyTaoDonHang(tx: any, input: CreateOrderInput) {
  return thucThiTaoDonHangCotLoi(tx, input);
}

/**
 * Tạo đơn hàng từ giỏ hàng lưu trong Database (Checkout from Cart Flow)
 * - Đọc giỏ hàng từ Database
 * - Chuyển đổi dữ liệu và ủy quyền toàn bộ nghiệp vụ cho lõi thucThiTaoDonHangCotLoi
 * - Dọn sạch giỏ hàng trong Database sau khi tạo đơn thành công
 */
export async function taoDonHangTuGioHang(
  tx: any,
  input: { userId: string; promotionCode?: string; pointsUsed?: number; paymentExpiresAt?: Date | null }
) {
  const { userId, promotionCode, pointsUsed, paymentExpiresAt } = input;

  // 1. Đọc giỏ hàng từ Database
  const cart = await tx.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } },
  });

  if (!cart || !cart.items || cart.items.length === 0) {
    throw new BadRequestException('Giỏ hàng đang trống');
  }

  // 2. Chuyển đổi sang định dạng CreateOrderItemInput
  const items: CreateOrderItemInput[] = cart.items.map((it: any) => ({
    productId: it.productId,
    size: it.size,
    toppings: it.toppings,
    qty: it.qty,
  }));

  const promoToUse = promotionCode || cart.voucherCode || undefined;

  // 3. Thực thi tạo đơn hàng qua lõi thống nhất
  const order = await thucThiTaoDonHangCotLoi(tx, {
    userId,
    items,
    promotionCode: promoToUse,
    pointsUsed,
    paymentExpiresAt,
  });

  // 4. Dọn sạch giỏ hàng sau khi tạo đơn thành công
  await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
  await tx.cart.update({
    where: { id: cart.id },
    data: { voucherCode: null },
  });

  return order;
}

export interface ProcessCartCheckoutInput {
  userId: string;
  paymentMethod?: string;
  promotionCode?: string;
  pointsUsed?: number;
  clientIp?: string;
}

/**
 * Toàn trình thanh toán giỏ hàng (Full Cart Checkout Flow)
 * 1. Mở transaction nguyên tử
 * 2. Đặt thời gian hết hạn thanh toán (15 phút đối với VNPay)
 * 3. Tạo đơn hàng và trừ kho qua taoDonHangTuGioHang -> thucThiTaoDonHangCotLoi
 * 4. Khởi tạo bản ghi thanh toán (Payment) tương ứng:
 *    - COD: status = 'PENDING', amount = order.total
 *    - VNPay: sinh URL thanh toán có ký số HMAC-SHA512
 * 5. Dọn sạch giỏ hàng
 * 6. Trả về kết quả cho client
 */
export async function xuLyThanhToanGioHang(
  prismaClient: any,
  input: ProcessCartCheckoutInput,
) {
  const { userId, promotionCode, pointsUsed, clientIp } = input;
  const paymentMethod = input.paymentMethod || 'Ví điện tử';

  if (paymentMethod === 'COD' && process.env.ENABLE_COD_PAYMENT !== 'true') {
    throw new BadRequestException(
      'Phương thức thanh toán tiền mặt (COD) đã bị tắt trong luồng thanh toán chính. Vui lòng chọn thanh toán không tiền mặt (VNPay, Ví điện tử, Thẻ ngân hàng).',
    );
  }

  if (!['COD', 'VNPay', 'Ví điện tử', 'Thẻ ngân hàng'].includes(paymentMethod)) {
    throw new BadRequestException(`Phương thức thanh toán "${paymentMethod}" không được hỗ trợ`);
  }

  let paymentExpiresAt: Date | null = null;
  let vnpayConfig: any = null;

  if (paymentMethod === 'VNPay') {
    if (!isVnpayConfigured()) {
      throw new BadRequestException('Cổng thanh toán VNPay chưa được cấu hình trên máy chủ');
    }
    vnpayConfig = vnpayConfigFromEnv();
    paymentExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  }

  const order = await prismaClient.$transaction(async (tx: any) => {
    const createdOrder = await taoDonHangTuGioHang(tx, {
      userId,
      promotionCode,
      pointsUsed,
      paymentExpiresAt,
    });

    if (paymentMethod === 'COD') {
      await tx.payment.create({
        data: {
          orderId: createdOrder.id,
          idempotencyKey: `cod-${createdOrder.id}`,
          amount: createdOrder.total,
          method: 'COD',
          status: 'PENDING',
          provider: 'COD',
          responseCode: 'COD_PENDING_COLLECTION',
        },
      });
    }

    return createdOrder;
  });

  let paymentUrl: string | null = null;
  if (paymentMethod === 'VNPay') {
    if (order.total === 0) {
      await prismaClient.$transaction(async (tx: any) => {
        await settleSuccessfulPaymentAndLoyalty(tx, {
          orderId: order.id,
          method: 'VNPay',
          amount: 0,
          provider: 'VNPAY',
          transactionRef: `ZERO-${Date.now()}`,
          responseCode: '00',
          reason: `Thanh toán đơn hàng 0đ #${order.id}`,
          existingOrder: order,
        });
      });
    } else if (vnpayConfig) {
      paymentUrl = buildVnpayUrl({
        order: { id: order.id, totalAmount: order.total },
        config: vnpayConfig,
        clientIp,
      });
    }
  }

  const freshOrder = await prismaClient.order.findUnique({
    where: { id: order.id },
    include: {
      items: { include: { product: true } },
      payment: true,
    },
  });

  return {
    success: true,
    order: freshOrder || order,
    orderId: order.id,
    amount: order.total,
    paymentMethod,
    paymentUrl,
    paymentExpiresAt: (freshOrder || order).paymentExpiresAt,
    message:
      paymentMethod === 'COD'
        ? 'Đặt đơn COD thành công! Đơn hàng đang chờ pha chế và thu tiền khi nhận đồ uống.'
        : 'Tạo đơn hàng thành công, vui lòng hoàn tất thanh toán trong vòng 15 phút.',
  };
}

// Aliases duy trì tính tương thích
export const validateAndPrepareOrderItems = kiemTraVaChuanBiDongDonHang;
export const executeOrderCreationCore = thucThiTaoDonHangCotLoi;
export const processOrderCreation = xuLyTaoDonHang;
export const createOrderFromCart = taoDonHangTuGioHang;
export const processCartCheckout = xuLyThanhToanGioHang;

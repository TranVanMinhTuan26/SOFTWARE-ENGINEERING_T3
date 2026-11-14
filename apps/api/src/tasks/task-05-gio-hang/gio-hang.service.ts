import { Injectable, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ALLOWED_TOPPINGS, calculateLineTotal, applyPromotion, isPromotionExpired } from '../task-04-chi-tiet-san-pham/tinh-gia-mon';
import { validatePromotionCode } from '../task-10-nghiep-vu-nang-cao/tich-diem-khuyen-mai';
import { getInventoryService } from '../task-10-ton-kho/khoi-tao-ton-kho';
import { IngredientStockService } from '../task-10-ton-kho/ton-kho-nguyen-lieu.service';

@Injectable()
export class CartService {
  constructor(
    private prisma: PrismaClient,
    @Optional() private inventoryService?: IngredientStockService,
  ) {}

  private get inventory(): IngredientStockService {
    return this.inventoryService || getInventoryService();
  }

  /** Lấy hoặc tự động khởi tạo Cart cho người dùng trong Database */
  private async layHoacTaoGioHang(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: { product: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    }

    return cart;
  }

  private async getOrCreateCart(userId: string) {
    return this.layHoacTaoGioHang(userId);
  }

  /**
   * 1. Lấy thông tin giỏ hàng từ Database
   * Tính toán lại thành tiền, chiết khấu voucher
   * KHÔNG TRỪ TỒN KHO tại bước này
   */
  async layThongTinGioHang(userId: string) {
    const cart = await this.layHoacTaoGioHang(userId);

    let voucherCode = cart.voucherCode;
    let discountPercent = 0;
    let discountFixed = 0;

    if (voucherCode) {
      const promo = await this.prisma.promotion.findFirst({
        where: { code: voucherCode.toUpperCase(), active: true },
      });
      if (promo && !isPromotionExpired(promo)) {
        discountPercent = promo.percentOff || 0;
        discountFixed = (promo as any).discountAmount || (promo as any).fixedAmount || 0;
      } else {
        // Mã voucher đã hết hạn hoặc bị xóa => tự động gỡ khỏi giỏ hàng
        await this.prisma.cart.update({
          where: { id: cart.id },
          data: { voucherCode: null },
        });
        voucherCode = null;
      }
    }

    const activeToppings = this.prisma.topping
      ? await this.prisma.topping.findMany({ where: { active: true } }).catch(() => [])
      : [];
    const toppingPricesMap: Record<string, number> = {};
    for (const top of activeToppings) {
      toppingPricesMap[top.name] = top.price;
    }

    let subtotal = 0;
    const formattedItems = cart.items.map((item) => {
      const toppingsArr = item.toppings
        ? item.toppings.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
      const unitPrice = calculateLineTotal(item.product.price, item.size, toppingsArr, 1, toppingPricesMap);
      const lineTotal = calculateLineTotal(item.product.price, item.size, toppingsArr, item.qty, toppingPricesMap);
      subtotal += lineTotal;

      return {
        id: item.id,
        productId: item.productId,
        product: {
          id: item.product.id,
          name: item.product.name,
          category: item.product.category,
          price: item.product.price,
          imageUrl: item.product.imageUrl,
          active: item.product.active,
        },
        size: item.size,
        toppings: toppingsArr,
        qty: item.qty,
        unitPrice,
        lineTotal,
        createdAt: item.createdAt,
      };
    });

    const total =
      discountPercent > 0 || discountFixed > 0
        ? applyPromotion(subtotal, { percentOff: discountPercent, discountAmount: discountFixed })
        : subtotal;
    const discount = subtotal - total;

    let isFulfillable = true;
    let inventoryError: string | null = null;
    let shortages: any[] = [];

    if (formattedItems.length > 0) {
      try {
        const simulated = formattedItems.map((it) => ({
          productId: it.productId,
          size: it.size,
          qty: it.qty,
          toppings: it.toppings,
        }));
        await this.inventory.checkFulfillable(simulated);
      } catch (err: any) {
        isFulfillable = false;
        inventoryError = err.message || 'Không đủ nguyên liệu để đáp ứng giỏ hàng';
        shortages = err.shortages || [];
      }
    }

    return {
      id: cart.id,
      userId: cart.userId,
      voucherCode,
      discountPercent,
      discountAmount: discountFixed,
      subtotal,
      discount,
      total,
      itemCount: formattedItems.reduce((acc, it) => acc + it.qty, 0),
      items: formattedItems,
      isFulfillable,
      inventoryError,
      shortages,
    };
  }

  async getCart(userId: string) {
    return this.layThongTinGioHang(userId);
  }

  /**
   * Kiểm tra khả dụng nguyên liệu cho danh sách món bất kỳ
   */
  async kiemTraKhaDungMon(items: Array<{ productId: string; size?: string; toppings?: string[] | string; qty: number }>) {
    if (!items || items.length === 0) {
      return { isFulfillable: true, inventoryError: null, shortages: [] };
    }
    try {
      const simulated = items.map((it) => ({
        productId: it.productId,
        size: it.size || 'M',
        qty: it.qty || 1,
        toppings: it.toppings || [],
      }));
      await this.inventory.checkFulfillable(simulated);
      return { isFulfillable: true, inventoryError: null, shortages: [] };
    } catch (err: any) {
      return {
        isFulfillable: false,
        inventoryError: err.message || 'Không đủ nguyên liệu trong kho',
        shortages: err.shortages || [],
      };
    }
  }

  async validateItems(items: Array<{ productId: string; size?: string; toppings?: string[] | string; qty: number }>) {
    return this.kiemTraKhaDungMon(items);
  }

  /**
   * 2. Thêm món vào giỏ hàng (Lưu trực tiếp vào Database)
   * KHÔNG TRỪ TỒN KHO khi thêm vào giỏ hàng
   */
  async themVaoGioHang(
    userId: string,
    dto: { productId: string; size?: string; toppings?: string[]; qty?: number }
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product || !product.active) {
      throw new NotFoundException('Sản phẩm không tồn tại hoặc đã ngừng kinh doanh');
    }

    const activeToppings = this.prisma.topping
      ? await this.prisma.topping.findMany({ where: { active: true } }).catch(() => [])
      : [];
    const validToppingNames = new Set([...ALLOWED_TOPPINGS, ...activeToppings.map((t) => t.name)]);

    const toppingsList = Array.isArray(dto.toppings) ? dto.toppings : [];
    for (const t of toppingsList) {
      if (!validToppingNames.has(t as any)) {
        throw new BadRequestException(`Topping "${t}" không hợp lệ`);
      }
    }

    const size = dto.size || 'M';
    if (!['S', 'M', 'L'].includes(size)) {
      throw new BadRequestException('Size không hợp lệ (chỉ chấp nhận S, M, L)');
    }

    const qtyToAdd = dto.qty !== undefined ? dto.qty : 1;
    if (typeof qtyToAdd !== 'number' || qtyToAdd < 1 || !Number.isInteger(qtyToAdd)) {
      throw new BadRequestException('Số lượng phải là số nguyên dương từ 1 đến 99');
    }
    if (qtyToAdd > 99) {
      throw new BadRequestException('Số lượng mỗi lần thêm không được vượt quá 99 ly');
    }

    const toppingsStr = toppingsList.slice().sort().join(', ');

    const executeInTransaction = async (tx: any) => {
      // 1. Lấy hoặc tạo Cart trong transaction
      let cart = await tx.cart.findUnique({
        where: { userId },
      });
      if (!cart) {
        cart = await tx.cart.create({
          data: { userId },
        });
      }

      // 2. Khóa bi quan ở cấp Cart để tuần tự hóa các request thêm món đồng thời
      if (typeof tx.$queryRaw === 'function') {
        try {
          await tx.$queryRaw`SELECT id FROM "Cart" WHERE id = ${cart.id} FOR UPDATE`;
        } catch {}
      }

      // 2.1. Kiểm tra tồn kho nguyên liệu gom theo toàn giỏ (bao gồm cả món sắp thêm)
      const existingCartItems = typeof tx.cartItem?.findMany === 'function'
        ? await tx.cartItem.findMany({
            where: { cartId: cart.id },
          })
        : [];

      const simulatedItems = existingCartItems.map((it: any) => ({
        productId: it.productId,
        size: it.size,
        qty: it.qty,
        toppings: it.toppings,
      }));

      // Cộng thêm món mới vào danh sách mô phỏng
      const matchingSimulated = simulatedItems.find(
        (it) => it.productId === product.id && it.size === size && it.toppings === toppingsStr,
      );
      if (matchingSimulated) {
        matchingSimulated.qty += qtyToAdd;
      } else {
        simulatedItems.push({
          productId: product.id,
          size,
          qty: qtyToAdd,
          toppings: toppingsStr,
        });
      }

      await this.inventory.checkFulfillable(simulatedItems);

      // 3. Tìm dòng sản phẩm cùng cấu hình (size & topping) trong giỏ
      const existingItem = await tx.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: product.id,
          size,
          toppings: toppingsStr,
        },
      });

      if (existingItem) {
        const newQty = existingItem.qty + qtyToAdd;
        if (newQty > 99) {
          throw new BadRequestException('Tổng số lượng của món này trong giỏ không được vượt quá 99 ly');
        }
        await tx.cartItem.update({
          where: { id: existingItem.id },
          data: { qty: newQty },
        });
      } else {
        try {
          await tx.cartItem.create({
            data: {
              cartId: cart.id,
              productId: product.id,
              size,
              toppings: toppingsStr,
              qty: qtyToAdd,
            },
          });
        } catch (createErr: any) {
          // Xử lý race condition: nếu một request đồng thời đã tạo trước đó gây trùng Unique constraint,
          // gộp số lượng
          const racedItem = await tx.cartItem.findFirst({
            where: {
              cartId: cart.id,
              productId: product.id,
              size,
              toppings: toppingsStr,
            },
          });
          if (racedItem) {
            const newQty = racedItem.qty + qtyToAdd;
            if (newQty > 99) {
              throw new BadRequestException('Tổng số lượng của món này trong giỏ không được vượt quá 99 ly');
            }
            await tx.cartItem.update({
              where: { id: racedItem.id },
              data: { qty: newQty },
            });
          } else {
            throw createErr;
          }
        }
      }
    };

    if (typeof this.prisma.$transaction === 'function') {
      await this.prisma.$transaction(executeInTransaction);
    } else {
      await executeInTransaction(this.prisma);
    }

    return this.layThongTinGioHang(userId);
  }

  async addItem(
    userId: string,
    dto: { productId: string; size?: string; toppings?: string[]; qty?: number }
  ) {
    return this.themVaoGioHang(userId, dto);
  }

  /**
   * 3. Cập nhật số lượng món trong giỏ hàng trên Database
   * Nếu qty <= 0 thì tự động xóa món
   */
  async capNhatSoLuongMon(userId: string, itemId: string, qty: number) {
    if (typeof qty !== 'number' || isNaN(qty) || !Number.isInteger(qty)) {
      throw new BadRequestException('Số lượng phải là số nguyên');
    }
    if (qty > 99) {
      throw new BadRequestException('Số lượng mỗi món không được vượt quá 99 ly');
    }

    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: { userId },
      },
      include: {
        product: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy món trong giỏ hàng');
    }

    if (qty <= 0) {
      await this.prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      // Kiểm tra tồn kho nguyên liệu gom toàn giỏ khi tăng/đổi số lượng
      const allCartItems = typeof this.prisma.cartItem?.findMany === 'function'
        ? await this.prisma.cartItem.findMany({
            where: { cartId: item.cartId },
          })
        : [];

      const simulatedItems = allCartItems.map((it: any) => ({
        productId: it.productId,
        size: it.size,
        qty: it.id === itemId ? qty : it.qty,
        toppings: it.toppings,
      }));

      await this.inventory.checkFulfillable(simulatedItems);

      await this.prisma.cartItem.update({
        where: { id: itemId },
        data: { qty },
      });
    }

    return this.layThongTinGioHang(userId);
  }

  async updateItemQuantity(userId: string, itemId: string, qty: number) {
    return this.capNhatSoLuongMon(userId, itemId, qty);
  }

  /**
   * 4. Xóa món khỏi giỏ hàng trên Database
   */
  async xoaMonKhoiGioHang(userId: string, itemId: string) {
    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: { userId },
      },
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy món trong giỏ hàng');
    }

    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.layThongTinGioHang(userId);
  }

  async removeItem(userId: string, itemId: string) {
    return this.xoaMonKhoiGioHang(userId, itemId);
  }

  /**
   * 5. Làm rỗng giỏ hàng trên Database
   */
  async lamRongGioHang(userId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      await this.prisma.cart.update({
        where: { id: cart.id },
        data: { voucherCode: null },
      });
    }
    return this.layThongTinGioHang(userId);
  }

  async clearCart(userId: string) {
    return this.lamRongGioHang(userId);
  }

  /**
   * 6. Áp dụng mã Voucher giảm giá lưu trực tiếp vào Database
   */
  async apDungMaUuDai(userId: string, code: string) {
    const cart = await this.layHoacTaoGioHang(userId);
    const cleanCode = (code || '').trim().toUpperCase();

    if (!cleanCode) {
      await this.prisma.cart.update({
        where: { id: cart.id },
        data: { voucherCode: null },
      });
      return this.layThongTinGioHang(userId);
    }

    const promo = await this.prisma.promotion.findFirst({
      where: { code: cleanCode, active: true },
    });

    if (!promo || isPromotionExpired(promo)) {
      throw new BadRequestException('Mã ưu đãi không hợp lệ hoặc đã hết hạn');
    }
    validatePromotionCode(promo);

    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { voucherCode: promo.code },
    });

    return this.layThongTinGioHang(userId);
  }

  async applyVoucher(userId: string, code: string) {
    return this.apDungMaUuDai(userId, code);
  }
}

import { BadRequestException, Body, ConflictException, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { prisma } from '../task-01-khoi-tao/ket-noi-prisma';
import { AdminGuard, DashboardGuard, OrderProcessingGuard, ProductManagementGuard, PromotionGuard, SuperAdminGuard, UserManagementGuard } from '../task-01-khoi-tao/bao-ve.guard';
import { transitionOrderStatus } from '../task-06-don-hang/don-hang.service';
import { AdminCreateUserDto, AdminProductDto, AdminUpdateProductDto, AdminUpdateUserDto, CreatePromotionDto, TogglePromotionDto, UpdatePromotionDto, UpdateUserRoleDto, UpdateUserStatusDto } from './quan-tri.dto';
import { UpdateLoyaltyDto } from '../task-07-xac-thuc/xac-thuc.dto';
import { UpdateOrderStatusDto } from '../task-06-don-hang/don-hang.dto';
import { IngredientStockService } from '../task-10-ton-kho/ton-kho-nguyen-lieu.service';
@Controller('admin')
export class AdminProductsController {
  constructor(private readonly inventoryService: IngredientStockService) {}

  @Get('products') @UseGuards(AdminGuard) async products(
    @Query('page') pageValue?: string,
    @Query('limit') limitValue?: string,
    @Query('search') searchValue?: string,
    @Query('category') categoryValue?: string,
    @Query('status') statusValue?: string,
  ) {
    if (pageValue === undefined && limitValue === undefined && searchValue === undefined &&
      categoryValue === undefined && statusValue === undefined) {
      const allProds = await prisma.product.findMany({
        include: { recipeItems: { select: { id: true } } },
        orderBy: { createdAt: 'desc' },
      });
      const availMap = await this.inventoryService.getProductAvailability(allProds.map((p) => p.id));
      return allProds.map((p) => {
        const hasRecipe = p.recipeItems && p.recipeItems.length > 0;
        const available = availMap.get(p.id) ?? false;
        const stockStatus = !hasRecipe ? 'Chưa có công thức' : available ? 'Còn hàng' : 'Hết hàng';
        return {
          id: p.id,
          name: p.name,
          category: p.category,
          price: p.price,
          description: p.description,
          imageUrl: p.imageUrl,
          active: p.active,
          createdAt: p.createdAt,
          hasRecipe,
          available,
          stockStatus,
        };
      });
    }

    const parsePositiveInteger = (value: string | undefined, fallback: number, field: string) => {
      if (value === undefined) return fallback;
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed < 1) {
        throw new BadRequestException(`${field} phải là số nguyên dương`);
      }
      return parsed;
    };
    const page = parsePositiveInteger(pageValue, 1, 'Trang');
    const limit = Math.min(parsePositiveInteger(limitValue, 20, 'Số lượng mỗi trang'), 100);
    const search = searchValue?.trim();
    const category = categoryValue?.trim();
    const status = statusValue?.trim();
    const where: Prisma.ProductWhereInput = {};

    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (category && category !== 'Tất cả') where.category = category;

    // Lấy toàn bộ sản phẩm khớp search & category để tính availability và filter status nếu có
    const candidateProducts = await prisma.product.findMany({
      where,
      include: { recipeItems: { select: { id: true } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    });

    const availMap = await this.inventoryService.getProductAvailability(candidateProducts.map((p) => p.id));
    const enriched = candidateProducts.map((p) => {
      const hasRecipe = p.recipeItems && p.recipeItems.length > 0;
      const available = availMap.get(p.id) ?? false;
      const stockStatus = !hasRecipe ? 'Chưa có công thức' : available ? 'Còn hàng' : 'Hết hàng';
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        description: p.description,
        imageUrl: p.imageUrl,
        active: p.active,
        createdAt: p.createdAt,
        hasRecipe,
        available,
        stockStatus,
      };
    });

    let filtered = enriched;
    if (status && status !== 'Tất cả') {
      if (['Còn hàng', 'Hết hàng', 'Chưa có công thức'].includes(status)) {
        filtered = enriched.filter((p) => p.stockStatus === status);
      } else {
        throw new BadRequestException('Trạng thái sản phẩm không hợp lệ (hỗ trợ: Còn hàng, Hết hàng, Chưa có công thức)');
      }
    }

    const total = filtered.length;
    const items = filtered.slice((page - 1) * limit, page * limit);
    const lowStockCount = enriched.filter((p) => p.stockStatus === 'Hết hàng' || p.stockStatus === 'Chưa có công thức').length;

    return { items, total, page, limit, totalPages: Math.ceil(total / limit), lowStockCount };
  }

@Post('products') @UseGuards(ProductManagementGuard) async createProduct(@Body() dto: AdminProductDto) {
    const trimmedName = (dto.name || '').trim();
    if (!trimmedName) throw new BadRequestException('Tên sản phẩm không được để trống');
    const existing = await prisma.product.findFirst({
      where: {
        name: { equals: trimmedName, mode: 'insensitive' },
        category: { equals: dto.category.trim(), mode: 'insensitive' },
      },
    });
    if (existing) {
      throw new ConflictException(
        'Sản phẩm đã tồn tại. Vui lòng chọn Sửa sản phẩm để cập nhật thông tin hoặc hàng tồn kho.'
      );
    }
    const created = await prisma.product.create({
      data: {
        name: trimmedName,
        category: dto.category.trim(),
        price: dto.price,
        description: dto.description || 'Thức uống thơm ngon từ BrewLite',
        imageUrl: dto.imageUrl || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
        active: dto.active !== undefined ? !!dto.active : true,
      },
    });

    if (Array.isArray(dto.toppingIds) && dto.toppingIds.length > 0 && (prisma as any).productTopping) {
      await (prisma as any).productTopping
        .createMany({
          data: dto.toppingIds.map((toppingId) => ({
            productId: created.id,
            toppingId,
          })),
          skipDuplicates: true,
        })
        .catch(() => {});
    }

    return created;
  }

@Patch('products/:id') @UseGuards(ProductManagementGuard) async updateProduct(
    @Param('id') id: string,
    @Body() dto: AdminUpdateProductDto,
  ) {
    const prod = await prisma.product.findUnique({ where: { id } });
    if (!prod) {
      throw new NotFoundException('Không tìm thấy sản phẩm cần cập nhật');
    }

    const nextName = dto.name === undefined ? prod.name : dto.name.trim();
    const nextCategory = dto.category === undefined ? prod.category : dto.category.trim();
    if (!nextName) throw new BadRequestException('Tên sản phẩm không được để trống');
    if (!nextCategory) throw new BadRequestException('Danh mục sản phẩm không được để trống');
    if (dto.name !== undefined || dto.category !== undefined) {
      const duplicate = await prisma.product.findFirst({
        where: {
          id: { not: prod.id },
          name: { equals: nextName, mode: 'insensitive' },
          category: { equals: nextCategory, mode: 'insensitive' },
        },
      });
      if (duplicate) {
        throw new ConflictException(
          'Sản phẩm đã tồn tại. Vui lòng chọn Sửa sản phẩm để cập nhật thông tin hoặc hàng tồn kho.'
        );
      }
    }

    const updateData: Prisma.ProductUpdateInput = {};
    if (dto.name !== undefined) updateData.name = nextName;
    if (dto.category !== undefined) updateData.category = nextCategory;
    if (dto.price !== undefined) updateData.price = dto.price;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.imageUrl !== undefined) updateData.imageUrl = dto.imageUrl;
    if (dto.active !== undefined) updateData.active = !!dto.active;

    const updated = await prisma.product.update({ where: { id: prod.id }, data: updateData });

    if (Array.isArray(dto.toppingIds) && (prisma as any).productTopping) {
      await (prisma as any).productTopping.deleteMany({ where: { productId: prod.id } }).catch(() => {});
      if (dto.toppingIds.length > 0) {
        await (prisma as any).productTopping
          .createMany({
            data: dto.toppingIds.map((toppingId) => ({
              productId: prod.id,
              toppingId,
            })),
            skipDuplicates: true,
          })
          .catch(() => {});
      }
    }

    return updated;
  }

@Patch('products/:id/toggle-active') @UseGuards(ProductManagementGuard) async toggleProductActive(@Param('id') id: string) {
    const prod = await prisma.product.findUnique({ where: { id } });
    if (!prod) throw new NotFoundException('Không tìm thấy sản phẩm');
    return prisma.product.update({
      where: { id: prod.id },
      data: { active: !prod.active },
    });
  }

@Delete('products/:id') @UseGuards(ProductManagementGuard) async deleteProduct(@Param('id') id: string, @Query('name') name?: string) {
    let prod = await prisma.product.findUnique({ where: { id } });
    if (!prod && name) {
      prod = await prisma.product.findFirst({ where: { name: { equals: name.trim(), mode: 'insensitive' } } });
    }
    if (!prod) throw new NotFoundException('Không tìm thấy sản phẩm cần xóa');

    // Check if referenced in OrderItem to protect order history integrity
    const orderItemCount = await prisma.orderItem.count({ where: { productId: prod.id } });
    if (orderItemCount > 0) {
      await prisma.product.update({ where: { id: prod.id }, data: { active: false } });
      return {
        message: `Sản phẩm "${prod.name}" đã có trong lịch sử đơn hàng, hệ thống đã chuyển sang trạng thái Ẩn (ngừng kinh doanh) để bảo toàn dữ liệu lịch sử.`,
        id: prod.id,
        archived: true,
        active: false,
      };
    }

    await prisma.product.delete({ where: { id: prod.id } });
    return {
      message: `Đã xóa vĩnh viễn sản phẩm "${prod.name}" thành công`,
      id: prod.id,
      deleted: true,
    };
  }
}


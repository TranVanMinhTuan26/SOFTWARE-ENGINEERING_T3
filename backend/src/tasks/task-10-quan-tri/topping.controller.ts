import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { prisma } from '../task-01-khoi-tao/ket-noi-prisma';
import { AdminGuard } from '../task-01-khoi-tao/bao-ve.guard';

export class CreateToppingDto {
  name: string;
  price: number;
  costPrice?: number;
  active?: boolean;
}

export class UpdateToppingDto {
  name?: string;
  price?: number;
  costPrice?: number;
  active?: boolean;
}

@Controller()
export class ToppingsController {
  @Get('toppings')
  async getPublicToppings() {
    return prisma.topping.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  @Get('admin/toppings')
  @UseGuards(AdminGuard)
  async getAdminToppings() {
    return prisma.topping.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('admin/toppings')
  @UseGuards(AdminGuard)
  async createTopping(@Body() dto: CreateToppingDto) {
    const name = dto.name?.trim();
    if (!name) {
      throw new BadRequestException('Tên topping không được để trống');
    }
    const price = Number(dto.price);
    if (!Number.isInteger(price) || price < 0) {
      throw new BadRequestException('Giá topping phải là số nguyên không âm');
    }

    const existing = await prisma.topping.findUnique({ where: { name } });
    if (existing) {
      throw new ConflictException(`Topping "${name}" đã tồn tại`);
    }

    return prisma.topping.create({
      data: {
        name,
        price,
        costPrice: dto.costPrice ? Math.max(0, Number(dto.costPrice)) : 0,
        active: dto.active ?? true,
      },
    });
  }

  @Patch('admin/toppings/:id')
  @UseGuards(AdminGuard)
  async updateTopping(@Param('id') id: string, @Body() dto: UpdateToppingDto) {
    const existing = await prisma.topping.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Topping không tồn tại');
    }

    const data: any = {};
    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException('Tên topping không được để trống');
      }
      if (name !== existing.name) {
        const dup = await prisma.topping.findUnique({ where: { name } });
        if (dup && dup.id !== id) {
          throw new ConflictException(`Topping "${name}" đã tồn tại`);
        }
      }
      data.name = name;
    }

    if (dto.price !== undefined) {
      const price = Number(dto.price);
      if (!Number.isInteger(price) || price < 0) {
        throw new BadRequestException('Giá topping phải là số nguyên không âm');
      }
      data.price = price;
    }

    if (dto.costPrice !== undefined) {
      const costPrice = Number(dto.costPrice);
      if (!Number.isInteger(costPrice) || costPrice < 0) {
        throw new BadRequestException('Giá vốn topping phải là số nguyên không âm');
      }
      data.costPrice = costPrice;
    }

    if (dto.active !== undefined) {
      data.active = Boolean(dto.active);
    }

    return prisma.topping.update({
      where: { id },
      data,
    });
  }

  @Delete('admin/toppings/:id')
  @UseGuards(AdminGuard)
  async deleteTopping(@Param('id') id: string) {
    const existing = await prisma.topping.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Topping không tồn tại');
    }

    await prisma.topping.delete({ where: { id } });
    return { success: true, message: `Đã xóa topping "${existing.name}"` };
  }

  @Get('admin/products/:productId/toppings')
  @UseGuards(AdminGuard)
  async getProductToppings(@Param('productId') productId: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');

    const allToppings = await prisma.topping.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });

    const assigned = await prisma.productTopping.findMany({
      where: { productId },
      select: { toppingId: true },
    });

    const selectedToppingIds = assigned.map((a) => a.toppingId);

    return {
      product: { id: product.id, name: product.name },
      allToppings,
      selectedToppingIds,
    };
  }

  @Put('admin/products/:productId/toppings')
  @UseGuards(AdminGuard)
  async setProductToppings(
    @Param('productId') productId: string,
    @Body() dto: { toppingIds: string[] }
  ) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');

    const toppingIds = Array.isArray(dto.toppingIds) ? dto.toppingIds : [];

    await prisma.$transaction(async (tx) => {
      await tx.productTopping.deleteMany({
        where: { productId },
      });

      if (toppingIds.length > 0) {
        await tx.productTopping.createMany({
          data: toppingIds.map((toppingId) => ({
            productId,
            toppingId,
          })),
          skipDuplicates: true,
        });
      }
    });

    return {
      success: true,
      message: `Đã cập nhật topping cho món "${product.name}"`,
      selectedToppingIds: toppingIds,
    };
  }
}

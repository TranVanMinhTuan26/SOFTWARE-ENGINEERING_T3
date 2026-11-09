import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ProductManagementGuard } from '../task-01-khoi-tao/bao-ve.guard';
import { PrismaClient } from '@prisma/client';
import { ReplaceRecipeDto } from './ton-kho.dto';
import { RecipeRepository } from './kho-luu-tru-cong-thuc';

/**
 * Controller Admin quản lý công thức cho từng món sản phẩm:
 * - Xem công thức của món
 * - Cập nhật/thay thế công thức của món
 */
@Controller('admin/recipes')
@UseGuards(ProductManagementGuard)
export class RecipesController {
  constructor(
    private readonly recipeRepo: RecipeRepository,
    private readonly prisma: PrismaClient,
  ) {}

  @Get('product/:productId')
  async getByProduct(@Param('productId') productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        recipeItems: {
          include: {
            ingredient: true,
          },
          orderBy: { ingredientId: 'asc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    const items = product.recipeItems.map((item) => {
      const costPrice = (item.ingredient as any).costPrice || 0;
      const subtotal = item.quantity * costPrice;
      return {
        id: item.id,
        ingredientId: item.ingredientId,
        ingredientName: item.ingredient.name,
        unit: item.ingredient.unit,
        quantity: item.quantity,
        costPrice,
        subtotal,
      };
    });

    const totalCost = items.reduce((sum, i) => sum + i.subtotal, 0);

    return {
      productId: product.id,
      productName: product.name,
      price: product.price,
      totalCost,
      items,
    };
  }

  @Put('product/:productId')
  async replaceRecipe(@Param('productId') productId: string, @Body() dto: ReplaceRecipeDto) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    // Kiểm tra các ingredientId có tồn tại trong kho không
    const ingredientIds = dto.items.map((i) => i.ingredientId);
    if (new Set(ingredientIds).size !== ingredientIds.length) {
      throw new BadRequestException('Không được trùng lặp nguyên liệu trong cùng một công thức');
    }

    if (ingredientIds.length > 0) {
      const existingCount = await this.prisma.ingredient.count({
        where: { id: { in: ingredientIds } },
      });
      if (existingCount !== ingredientIds.length) {
        throw new BadRequestException('Có nguyên liệu trong công thức không tồn tại trong hệ thống');
      }
    }

    await this.recipeRepo.replaceRecipe(productId, dto.items);

    if (typeof dto.newPrice === 'number' && dto.newPrice >= 0) {
      await this.prisma.product.update({
        where: { id: productId },
        data: { price: Math.round(dto.newPrice) },
      });
    }

    return this.getByProduct(productId);
  }
}


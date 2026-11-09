import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InventoryGuard } from '../task-01-khoi-tao/bao-ve.guard';
import { CreateIngredientDto, RestockDto, UpdateIngredientDto } from './ton-kho.dto';
import { IngredientRepository } from './kho-luu-tru-nguyen-lieu';
import { RecipeRepository } from './kho-luu-tru-cong-thuc';
import { prisma } from '../task-01-khoi-tao/ket-noi-prisma';

/**
 * Controller Admin quản lý nguyên liệu kho:
 * - CRUD nguyên liệu
 * - Nhập kho (cộng dồn)
 * - Lọc sắp hết theo ngưỡng riêng từng nguyên liệu
 * - Chặn xóa nguyên liệu đang nằm trong công thức (409 kèm danh sách món)
 */
@Controller('admin/ingredients')
@UseGuards(InventoryGuard)
export class IngredientsController {
  constructor(
    private readonly ingredientRepo: IngredientRepository,
    private readonly recipeRepo: RecipeRepository,
  ) {}

  @Get()
  async list(@Query('lowStock') lowStock?: string) {
    const items = (lowStock === 'true' || lowStock === '1')
      ? await this.ingredientRepo.findLowStock()
      : await this.ingredientRepo.findAll();

    const toppings = (prisma as any)?.topping
      ? await (prisma as any).topping.findMany().catch(() => [])
      : [];
    const toppingMap = new Map(toppings.map((t: any) => [t.name.toLowerCase().trim(), t]));

    return items.map((item: any) => {
      const top: any = toppingMap.get(item.name.toLowerCase().trim());
      return {
        ...item,
        costPrice: item.costPrice ?? (top?.costPrice || 0),
        isTopping: Boolean(top),
        price: top?.price || 0,
      };
    });
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const item: any = await this.ingredientRepo.findById(id);
    if (!item) throw new NotFoundException('Không tìm thấy nguyên liệu');

    const top = (prisma as any)?.topping
      ? await (prisma as any).topping.findUnique({ where: { name: item.name } }).catch(() => null)
      : null;

    return {
      ...item,
      costPrice: item.costPrice ?? (top?.costPrice || 0),
      isTopping: Boolean(top),
      price: top?.price || 0,
    };
  }

  @Post()
  async create(@Body() dto: CreateIngredientDto) {
    try {
      const created: any = await this.ingredientRepo.create({
        name: dto.name.trim(),
        unit: dto.unit.trim(),
        quantity: dto.quantity,
        costPrice: dto.costPrice ?? 0,
        lowStockThreshold: dto.lowStockThreshold,
      });

      if (dto.isTopping && (prisma as any)?.topping) {
        await (prisma as any).topping
          .upsert({
            where: { name: dto.name.trim() },
            create: {
              name: dto.name.trim(),
              price: dto.price ?? 10000,
              costPrice: dto.costPrice ?? 0,
              active: true,
            },
            update: {
              price: dto.price ?? 10000,
              costPrice: dto.costPrice ?? 0,
              active: true,
            },
          })
          .catch(() => {});
      }

      return {
        ...created,
        costPrice: created.costPrice ?? dto.costPrice ?? 0,
        isTopping: Boolean(dto.isTopping),
        price: dto.price || 0,
      };
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException(`Nguyên liệu với tên "${dto.name}" đã tồn tại`);
      }
      throw err;
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateIngredientDto) {
    const existing = await this.ingredientRepo.findById(id);
    if (!existing) throw new NotFoundException('Không tìm thấy nguyên liệu');

    try {
      const updated: any = await this.ingredientRepo.update(id, {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.unit !== undefined ? { unit: dto.unit.trim() } : {}),
        ...(dto.quantity !== undefined ? { quantity: dto.quantity } : {}),
        ...(dto.costPrice !== undefined ? { costPrice: dto.costPrice } : {}),
        ...(dto.lowStockThreshold !== undefined ? { lowStockThreshold: dto.lowStockThreshold } : {}),
      });

      if (dto.isTopping !== undefined && (prisma as any)?.topping) {
        const targetName = (dto.name || existing.name).trim();
        if (dto.isTopping) {
          await (prisma as any).topping
            .upsert({
              where: { name: targetName },
              create: { name: targetName, price: dto.price ?? 10000, costPrice: dto.costPrice ?? 0, active: true },
              update: {
                ...(dto.price !== undefined ? { price: dto.price } : {}),
                ...(dto.costPrice !== undefined ? { costPrice: dto.costPrice } : {}),
                active: true,
              },
            })
            .catch(() => {});
        } else {
          await (prisma as any).topping.delete({ where: { name: targetName } }).catch(() => {});
        }
      }

      return {
        ...updated,
        costPrice: updated.costPrice ?? dto.costPrice ?? 0,
        isTopping: Boolean(dto.isTopping),
        price: dto.price || 0,
      };
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException(`Nguyên liệu với tên "${dto.name}" đã tồn tại`);
      }
      throw err;
    }
  }

  @Post(':id/restock')
  async restock(@Param('id') id: string, @Body() dto: RestockDto) {
    const existing = await this.ingredientRepo.findById(id);
    if (!existing) throw new NotFoundException('Không tìm thấy nguyên liệu');

    const ok = await this.ingredientRepo.increment(id, dto.quantity);
    if (!ok) {
      throw new BadRequestException('Không thể cộng kho cho nguyên liệu này');
    }
    return this.ingredientRepo.findById(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const existing = await this.ingredientRepo.findById(id);
    if (!existing) throw new NotFoundException('Không tìm thấy nguyên liệu');

    // Quy tắc 15: Không cho xóa nguyên liệu đang nằm trong công thức (409, nêu tên các món đang dùng)
    const usingProducts = await this.recipeRepo.findProductsUsing(id);
    if (usingProducts.length > 0) {
      const productNames = usingProducts.map((p) => p.name).join(', ');
      throw new ConflictException(
        `Không thể xóa nguyên liệu "${existing.name}" vì đang được sử dụng trong công thức của các món: ${productNames}`,
      );
    }

    if ((prisma as any)?.topping) {
      await (prisma as any).topping.delete({ where: { name: existing.name } }).catch(() => {});
    }

    await this.ingredientRepo.delete(id);
    return { success: true, message: `Đã xóa nguyên liệu "${existing.name}"` };
  }
}


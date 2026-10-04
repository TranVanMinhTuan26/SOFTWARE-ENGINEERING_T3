import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { prisma } from '../task-01-khoi-tao/ket-noi-prisma';
import { IngredientStockService } from '../task-10-ton-kho/ton-kho-nguyen-lieu.service';
@Controller()
export class ApiController {
  constructor(private readonly inventoryService: IngredientStockService) {}

  @Get() root() {
    return {
      name: 'BrewLite API',
      status: 'running',
      version: '1.0.0',
      webUrl: 'http://localhost:3000',
      adminUrl: 'http://localhost:3000/admin',
      endpoints: {
        health: '/health',
        ready: '/health/ready',
        products: '/products',
        auth: '/auth/login',
        orders: '/orders',
        payments: '/payments',
      },
    };
  }
  @Get('health') health(){return {status:'ok',service:'brewlite-api',time:new Date().toISOString()};}
  @Get('health/ready') async ready(){await prisma.$queryRaw`SELECT 1`;return {status:'ready',database:'connected'};}

  @Get('products')
  async products() {
    const list = await prisma.product.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      include: {
        productToppings: {
          include: {
            topping: true,
          },
        },
      },
    });
    const availMap = await this.inventoryService.getProductAvailability(list.map((p) => p.id));
    return list.map((p) => {
      const isAvailable = availMap.get(p.id) ?? false;
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        price: p.price,
        imageUrl: p.imageUrl,
        active: p.active,
        createdAt: p.createdAt,
        stock: isAvailable ? 99 : 0,
        available: isAvailable,
        toppings: p.productToppings
          ? p.productToppings
              .filter((pt) => pt.topping && pt.topping.active)
              .map((pt) => ({
                id: pt.topping.id,
                name: pt.topping.name,
                price: pt.topping.price,
                active: pt.topping.active,
              }))
          : [],
      };
    });
  }

  @Get('products/:id')
  async product(@Param('id') id: string) {
    const p = await prisma.product.findFirst({
      where: { id, active: true },
      include: {
        productToppings: {
          include: {
            topping: true,
          },
        },
      },
    });
    if (!p) throw new NotFoundException('Không tìm thấy sản phẩm');
    const availMap = await this.inventoryService.getProductAvailability([p.id]);
    const isAvailable = availMap.get(p.id) ?? false;
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      price: p.price,
      imageUrl: p.imageUrl,
      active: p.active,
      createdAt: p.createdAt,
      stock: isAvailable ? 99 : 0,
      available: isAvailable,
      toppings: p.productToppings
        ? p.productToppings
            .filter((pt) => pt.topping && pt.topping.active)
            .map((pt) => ({
              id: pt.topping.id,
              name: pt.topping.name,
              price: pt.topping.price,
              active: pt.topping.active,
            }))
        : [],
    };
  }
}


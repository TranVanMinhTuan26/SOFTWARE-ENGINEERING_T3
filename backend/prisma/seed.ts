import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Danh sách sản phẩm (đã bỏ hoàn toàn Product.stock)
  const products = [
    {
      name: 'Cà phê đen',
      description: 'Cà phê nguyên chất đậm đà, hương thơm truyền thống đánh thức mọi giác quan.',
      category: 'Cà phê',
      price: 45000,
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Americano',
      description: 'Espresso pha loãng thanh dịu, hậu vị sạch sảng khoái suốt ngày.',
      category: 'Cà phê',
      price: 45000,
      imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Americano đá',
      description: 'Espresso và nước đá mát lạnh, hậu vị sạch, dễ uống suốt ngày.',
      category: 'Cà phê',
      price: 39000,
      imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Cappuccino',
      description: 'Espresso đậm vị hòa cùng sữa béo mịn và bọt sữa bông dày.',
      category: 'Cà phê',
      price: 55000,
      imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Latte',
      description: 'Hương vị nhẹ nhàng, sữa tươi sánh mịn kết hợp espresso thanh dịu.',
      category: 'Cà phê',
      price: 55000,
      imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Latte kem mịn',
      description: 'Espresso cân bằng cùng sữa tươi đánh nóng, lớp bọt sữa sánh mịn.',
      category: 'Cà phê',
      price: 49000,
      imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Mocha',
      description: 'Sự hòa quyện tuyệt vời giữa cà phê espresso và sốt socola thơm ngậy.',
      category: 'Cà phê',
      price: 60000,
      imageUrl: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Trà đào cam sả',
      description: 'Vị trà thanh mát hòa quyện đào ngọt lịm, hương cam sả sảng khoái.',
      category: 'Trà',
      price: 50000,
      imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Matcha latte',
      description: 'Matcha Uji cao cấp nguyên chất, vị bùi béo ngọt nhẹ.',
      category: 'Matcha',
      price: 60000,
      imageUrl: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Chocolate',
      description: 'Sô cô la Bỉ đậm đặc đánh cùng sữa đá thơm béo.',
      category: 'Đá xay',
      price: 55000,
      imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Chocolate đá',
      description: 'Sô cô la Bỉ đậm đà đánh cùng sữa đá thơm béo sảng khoái.',
      category: 'Đá xay',
      price: 50000,
      imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Bạc xỉu',
      description: 'Cà phê sữa dịu nhẹ, hòa quyện cùng sữa tươi béo thơm.',
      category: 'Cà phê',
      price: 45000,
      imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Trà vải',
      description: 'Trà thanh mát kết hợp vị vải ngọt thơm, dễ uống.',
      category: 'Trà',
      price: 50000,
      imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const productMap = new Map<string, string>();
  for (const p of products) {
    const existing = await prisma.product.findFirst({
      where: { name: { equals: p.name, mode: 'insensitive' } },
      select: { id: true },
    });
    if (!existing) {
      const created = await prisma.product.create({ data: { ...p } });
      productMap.set(p.name, created.id);
    } else {
      productMap.set(p.name, existing.id);
    }
  }

  // 2. Danh sách 16 nguyên liệu thực tế với đơn vị, số lượng và ngưỡng cảnh báo
  const ingredientsData = [
    { name: 'Cà phê hạt Robusta', unit: 'g', quantity: 20000, lowStockThreshold: 2000 },
    { name: 'Cà phê hạt Arabica', unit: 'g', quantity: 20000, lowStockThreshold: 2000 },
    { name: 'Nước tinh khiết', unit: 'ml', quantity: 500000, lowStockThreshold: 50000 },
    { name: 'Sữa tươi thanh trùng', unit: 'ml', quantity: 30000, lowStockThreshold: 5000 },
    { name: 'Sữa đặc', unit: 'ml', quantity: 20000, lowStockThreshold: 3000 },
    { name: 'Đường cát', unit: 'g', quantity: 20000, lowStockThreshold: 2000 },
    { name: 'Trà đen', unit: 'g', quantity: 10000, lowStockThreshold: 1000 },
    { name: 'Trà ô long', unit: 'g', quantity: 10000, lowStockThreshold: 1000 },
    { name: 'Đào ngâm', unit: 'g', quantity: 15000, lowStockThreshold: 2000 },
    { name: 'Cam tươi', unit: 'ml', quantity: 15000, lowStockThreshold: 2000 },
    { name: 'Sả tươi', unit: 'g', quantity: 5000, lowStockThreshold: 500 },
    { name: 'Vải ngâm', unit: 'g', quantity: 15000, lowStockThreshold: 2000 },
    { name: 'Bột Matcha Uji', unit: 'g', quantity: 5000, lowStockThreshold: 500 },
    { name: 'Bột Cacao nguyên chất', unit: 'g', quantity: 10000, lowStockThreshold: 1000 },
    { name: 'Kem tươi Whipping Cream', unit: 'ml', quantity: 10000, lowStockThreshold: 1500 },
    { name: 'Đá viên', unit: 'g', quantity: 100000, lowStockThreshold: 10000 },
    // Topping đồ uống
    { name: 'Trân châu', unit: 'g', quantity: 10000, lowStockThreshold: 1000 },
    { name: 'Kem cheese', unit: 'ml', quantity: 8000, lowStockThreshold: 1000 },
    { name: 'Shot espresso', unit: 'shot', quantity: 500, lowStockThreshold: 50 },
  ];

  const ingredientMap = new Map<string, string>();
  for (const ing of ingredientsData) {
    const saved = await prisma.ingredient.upsert({
      where: { name: ing.name },
      update: {
        unit: ing.unit,
        lowStockThreshold: ing.lowStockThreshold,
      },
      create: {
        name: ing.name,
        unit: ing.unit,
        quantity: ing.quantity,
        lowStockThreshold: ing.lowStockThreshold,
      },
    });
    ingredientMap.set(ing.name, saved.id);
  }

  // 3. Công thức chuẩn cho Size M cho toàn bộ 13 món
  // Quy tắc 1: Cà phê đen = 18g cà phê hạt (Robusta) + 150ml nước.
  const recipes: { productName: string; items: { ingredientName: string; quantity: number }[] }[] = [
    {
      productName: 'Cà phê đen',
      items: [
        { ingredientName: 'Cà phê hạt Robusta', quantity: 18 },
        { ingredientName: 'Nước tinh khiết', quantity: 150 },
      ],
    },
    {
      productName: 'Americano',
      items: [
        { ingredientName: 'Cà phê hạt Arabica', quantity: 18 },
        { ingredientName: 'Nước tinh khiết', quantity: 180 },
      ],
    },
    {
      productName: 'Americano đá',
      items: [
        { ingredientName: 'Cà phê hạt Arabica', quantity: 18 },
        { ingredientName: 'Nước tinh khiết', quantity: 150 },
        { ingredientName: 'Đá viên', quantity: 100 },
      ],
    },
    {
      productName: 'Cappuccino',
      items: [
        { ingredientName: 'Cà phê hạt Arabica', quantity: 18 },
        { ingredientName: 'Sữa tươi thanh trùng', quantity: 120 },
        { ingredientName: 'Nước tinh khiết', quantity: 30 },
      ],
    },
    {
      productName: 'Latte',
      items: [
        { ingredientName: 'Cà phê hạt Arabica', quantity: 18 },
        { ingredientName: 'Sữa tươi thanh trùng', quantity: 150 },
        { ingredientName: 'Nước tinh khiết', quantity: 30 },
      ],
    },
    {
      productName: 'Latte kem mịn',
      items: [
        { ingredientName: 'Cà phê hạt Arabica', quantity: 18 },
        { ingredientName: 'Sữa tươi thanh trùng', quantity: 120 },
        { ingredientName: 'Kem tươi Whipping Cream', quantity: 30 },
        { ingredientName: 'Nước tinh khiết', quantity: 30 },
      ],
    },
    {
      productName: 'Mocha',
      items: [
        { ingredientName: 'Cà phê hạt Arabica', quantity: 18 },
        { ingredientName: 'Bột Cacao nguyên chất', quantity: 20 },
        { ingredientName: 'Sữa tươi thanh trùng', quantity: 120 },
        { ingredientName: 'Nước tinh khiết', quantity: 30 },
      ],
    },
    {
      productName: 'Trà đào cam sả',
      items: [
        { ingredientName: 'Trà đen', quantity: 15 },
        { ingredientName: 'Đào ngâm', quantity: 40 },
        { ingredientName: 'Cam tươi', quantity: 30 },
        { ingredientName: 'Sả tươi', quantity: 10 },
        { ingredientName: 'Nước tinh khiết', quantity: 150 },
        { ingredientName: 'Đá viên', quantity: 100 },
      ],
    },
    {
      productName: 'Matcha latte',
      items: [
        { ingredientName: 'Bột Matcha Uji', quantity: 10 },
        { ingredientName: 'Sữa tươi thanh trùng', quantity: 150 },
        { ingredientName: 'Sữa đặc', quantity: 30 },
        { ingredientName: 'Nước tinh khiết', quantity: 50 },
      ],
    },
    {
      productName: 'Chocolate',
      items: [
        { ingredientName: 'Bột Cacao nguyên chất', quantity: 30 },
        { ingredientName: 'Sữa tươi thanh trùng', quantity: 100 },
        { ingredientName: 'Sữa đặc', quantity: 30 },
        { ingredientName: 'Nước tinh khiết', quantity: 30 },
      ],
    },
    {
      productName: 'Chocolate đá',
      items: [
        { ingredientName: 'Bột Cacao nguyên chất', quantity: 30 },
        { ingredientName: 'Sữa tươi thanh trùng', quantity: 100 },
        { ingredientName: 'Sữa đặc', quantity: 30 },
        { ingredientName: 'Đá viên', quantity: 100 },
      ],
    },
    {
      productName: 'Bạc xỉu',
      items: [
        { ingredientName: 'Cà phê hạt Robusta', quantity: 10 },
        { ingredientName: 'Sữa tươi thanh trùng', quantity: 80 },
        { ingredientName: 'Sữa đặc', quantity: 40 },
        { ingredientName: 'Nước tinh khiết', quantity: 50 },
      ],
    },
    {
      productName: 'Trà vải',
      items: [
        { ingredientName: 'Trà ô long', quantity: 15 },
        { ingredientName: 'Vải ngâm', quantity: 40 },
        { ingredientName: 'Đường cát', quantity: 20 },
        { ingredientName: 'Nước tinh khiết', quantity: 150 },
        { ingredientName: 'Đá viên', quantity: 100 },
      ],
    },
  ];

  for (const recipe of recipes) {
    const productId = productMap.get(recipe.productName);
    if (!productId) continue;

    for (const item of recipe.items) {
      const ingredientId = ingredientMap.get(item.ingredientName);
      if (!ingredientId) continue;

      await prisma.recipeItem.upsert({
        where: {
          productId_ingredientId: {
            productId,
            ingredientId,
          },
        },
        update: {
          quantity: item.quantity,
        },
        create: {
          productId,
          ingredientId,
          quantity: item.quantity,
        },
      });
    }
  }

  // 4. Tài khoản mặc định
  const defaultAccounts = [
    { email: (process.env.ADMIN_EMAIL || 'admin@brewlite.local').toLowerCase(), role: 'ADMIN', fullName: 'Quản trị viên Admin' },
    { email: 'manager@brewlite.local', role: 'MANAGER', fullName: 'Quản lý Cửa hàng' },
    { email: 'barista@brewlite.local', role: 'BARISTA', fullName: 'Nhân viên Pha chế Barista' },
    { email: 'inventory@brewlite.local', role: 'INVENTORY', fullName: 'Thủ kho Nguyên liệu' },
    { email: 'staff@brewlite.local', role: 'STAFF', fullName: 'Nhân viên Bán hàng / Thu ngân' },
  ];
  if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_PASSWORD) {
    throw new Error('Cần cung cấp ADMIN_PASSWORD an toàn khi chạy seed trên môi trường production');
  }
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
  const rolePasswordHash = await bcrypt.hash(adminPassword, 10);
  for (const acc of defaultAccounts) {
    await prisma.user.upsert({
      where: { email: acc.email },
      update: {},
      create: {
        email: acc.email,
        passwordHash: rolePasswordHash,
        role: acc.role,
        fullName: acc.fullName,
        status: 'ACTIVE',
      },
    });
  }

  // 5. Khuyến mãi mặc định (hỗ trợ cả giảm % và giảm số tiền cố định + hạn sử dụng expiresAt)
  const defaultPromotions = [
    { code: 'BREW20', description: 'Giảm 20% toàn menu', percentOff: 20, discountAmount: 0, expiresAt: new Date('2027-12-31T23:59:59.000Z') },
    { code: 'COMBO15', description: 'Combo Cà phê sáng', percentOff: 15, discountAmount: 0, expiresAt: new Date('2027-12-31T23:59:59.000Z') },
    { code: 'BREW10', description: 'Khách hàng thân thiết', percentOff: 10, discountAmount: 0, expiresAt: null },
    { code: 'GIAM15K', description: 'Giảm trực tiếp 15.000đ cho đơn bất kỳ', percentOff: 0, discountAmount: 15000, expiresAt: new Date('2027-12-31T23:59:59.000Z') },
  ];
  for (const promo of defaultPromotions) {
    await prisma.promotion.upsert({
      where: { code: promo.code },
      update: {},
      create: {
        code: promo.code,
        description: promo.description,
        percentOff: promo.percentOff,
        discountAmount: promo.discountAmount,
        expiresAt: promo.expiresAt,
        active: true,
      },
    });
  }

  // 6. Topping mặc định (giá thống nhất 10.000đ theo tài liệu đề bài)
  const defaultToppings = ['Trân châu', 'Shot espresso', 'Kem cheese'];
  for (const name of defaultToppings) {
    await prisma.topping.upsert({
      where: { name },
      update: {},
      create: { name, price: 10000, active: true },
    });
  }

  console.log('Seed completed successfully: products, ingredients, recipes, accounts, promotions, and toppings.');
}

main().finally(() => prisma.$disconnect());

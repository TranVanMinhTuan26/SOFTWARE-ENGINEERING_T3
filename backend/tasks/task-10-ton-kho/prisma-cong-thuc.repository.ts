import { ProductRecipe, ProductSummary, RecipeLine, TxClient } from './kieu-ton-kho';
import { RecipeRepository } from './kho-luu-tru-cong-thuc';

/** Cài đặt RecipeRepository bằng Prisma; client được tiêm qua constructor. */
export class PrismaRecipeRepository extends RecipeRepository {
  constructor(private readonly db: TxClient) {
    super();
  }

  withTx(tx: TxClient): RecipeRepository {
    return new PrismaRecipeRepository(tx);
  }

  async findByProductIds(productIds: ReadonlyArray<string>): Promise<ProductRecipe[]> {
    const ids = Array.from(new Set(productIds));
    if (ids.length === 0) return [];
    const products = await this.db.product.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        recipeItems: { select: { ingredientId: true, quantity: true }, orderBy: { ingredientId: 'asc' } },
      },
    });
    return products.map((p) => ({ productId: p.id, productName: p.name, items: p.recipeItems }));
  }

  async replaceRecipe(productId: string, items: ReadonlyArray<RecipeLine>): Promise<RecipeLine[]> {
    await this.db.recipeItem.deleteMany({ where: { productId } });
    if (items.length > 0) {
      await this.db.recipeItem.createMany({
        data: items.map((it) => ({ productId, ingredientId: it.ingredientId, quantity: it.quantity })),
      });
    }
    return this.db.recipeItem.findMany({
      where: { productId },
      select: { ingredientId: true, quantity: true },
      orderBy: { ingredientId: 'asc' },
    });
  }

  async findProductsUsing(ingredientId: string): Promise<ProductSummary[]> {
    return this.db.product.findMany({
      where: { recipeItems: { some: { ingredientId } } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }
}


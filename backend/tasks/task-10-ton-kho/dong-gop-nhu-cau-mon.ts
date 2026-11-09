import { IngredientDemand } from './nhu-cau-nguyen-lieu';
import { OrderItemWithRecipe } from './kieu-ton-kho';

/**
 * Điểm mở rộng (Open/Closed) cho nhu cầu nguyên liệu PHỤ của một dòng đơn, ví dụ topping.
 *
 * Hiện tại topping CHƯA trừ nguyên liệu nên RecipeCalculator được khởi tạo với danh sách rỗng.
 * Khi cần trừ topping, chỉ việc viết một lớp mới implements interface này
 * (vd. `ToppingDemandContributor`) và đăng ký vào RecipeCalculator — không sửa lớp lõi.
 */
export interface LineDemandContributor {
  contribute(item: OrderItemWithRecipe): IngredientDemand;
}


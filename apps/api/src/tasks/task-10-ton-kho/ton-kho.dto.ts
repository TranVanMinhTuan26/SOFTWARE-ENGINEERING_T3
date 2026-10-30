import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';

/** DTO tạo mới nguyên liệu */
export class CreateIngredientDto {
  @IsString({ message: 'Tên nguyên liệu phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên nguyên liệu không được để trống' })
  @MaxLength(100, { message: 'Tên nguyên liệu không vượt quá 100 ký tự' })
  name: string;

  @IsString({ message: 'Đơn vị tính phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Đơn vị tính không được để trống' })
  @MaxLength(20, { message: 'Đơn vị tính không vượt quá 20 ký tự' })
  unit: string;

  @IsInt({ message: 'Số lượng tồn kho ban đầu phải là số nguyên' })
  @Min(0, { message: 'Số lượng tồn kho không được âm' })
  quantity: number;

  @IsInt({ message: 'Ngưỡng cảnh báo sắp hết phải là số nguyên' })
  @Min(0, { message: 'Ngưỡng cảnh báo không được âm' })
  lowStockThreshold: number;

  @IsOptional()
  @IsInt({ message: 'Giá vốn phải là số nguyên' })
  @Min(0, { message: 'Giá vốn không được âm' })
  costPrice?: number;

  @IsOptional()
  isTopping?: boolean;

  @IsOptional()
  price?: number;
}

/** DTO cập nhật nguyên liệu */
export class UpdateIngredientDto {
  @IsOptional()
  @IsString({ message: 'Tên nguyên liệu phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên nguyên liệu không được để trống' })
  @MaxLength(100, { message: 'Tên nguyên liệu không vượt quá 100 ký tự' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Đơn vị tính phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Đơn vị tính không được để trống' })
  @MaxLength(20, { message: 'Đơn vị tính không vượt quá 20 ký tự' })
  unit?: string;

  @IsOptional()
  @IsInt({ message: 'Số lượng tồn kho phải là số nguyên' })
  @Min(0, { message: 'Số lượng tồn kho không được âm' })
  quantity?: number;

  @IsOptional()
  @IsInt({ message: 'Ngưỡng cảnh báo sắp hết phải là số nguyên' })
  @Min(0, { message: 'Ngưỡng cảnh báo không được âm' })
  lowStockThreshold?: number;

  @IsOptional()
  @IsInt({ message: 'Giá vốn phải là số nguyên' })
  @Min(0, { message: 'Giá vốn không được âm' })
  costPrice?: number;

  @IsOptional()
  isTopping?: boolean;

  @IsOptional()
  price?: number;
}

/** DTO nhập kho nguyên liệu (cộng dồn) */
export class RestockDto {
  @IsInt({ message: 'Số lượng nhập kho phải là số nguyên' })
  @Min(1, { message: 'Số lượng nhập kho phải lớn hơn 0' })
  quantity: number;
}

/** DTO một dòng công thức */
export class RecipeItemDto {
  @IsString({ message: 'Mã nguyên liệu phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Mã nguyên liệu không được để trống' })
  ingredientId: string;

  @IsInt({ message: 'Định lượng phải là số nguyên' })
  @Min(1, { message: 'Định lượng cho 1 ly size M phải lớn hơn 0' })
  quantity: number;
}

/** DTO thay thế toàn bộ công thức cho một món */
export class ReplaceRecipeDto {
  @IsArray({ message: 'Danh sách công thức phải là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => RecipeItemDto)
  items: RecipeItemDto[];

  @IsOptional()
  @IsInt({ message: 'Giá sản phẩm phải là số nguyên' })
  @Min(0, { message: 'Giá sản phẩm không được âm' })
  newPrice?: number;
}


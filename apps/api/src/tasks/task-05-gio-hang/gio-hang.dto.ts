import { ArrayMaxSize, ArrayUnique, IsArray, IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
export class AddCartItemDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsIn(['S', 'M', 'L'])
  size?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ArrayUnique()
  @IsString({ each: true })
  toppings?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  qty?: number;
}

export class UpdateCartItemDto {
  @IsInt({ message: 'Số lượng phải là số nguyên' })
  qty: number;
}

export class ApplyVoucherDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;
}

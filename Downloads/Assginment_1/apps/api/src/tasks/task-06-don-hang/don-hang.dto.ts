import { OrderStatus } from '@prisma/client';
import { ArrayMaxSize, ArrayUnique, IsArray, IsBooleanString, IsIn, IsInt, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
export class UpdateOrderStatusDto {
  @IsString()
  @IsIn(['PENDING', 'PAID', 'PREPARING', 'READY', 'COMPLETED', 'PAYMENT_FAILED', 'CANCELLED'], {
    message: 'Trạng thái đơn hàng không hợp lệ',
  })
  status: OrderStatus;

  @IsOptional()
  @IsString()
  cancelReason?: string;
}

export class CheckoutDto {
  @IsOptional()
  @IsString()
  promotionCode?: string;

  @IsOptional()
  @IsIn(['VNPay', 'Ví điện tử', 'Thẻ ngân hàng'], {
    message: 'Phương thức thanh toán không hợp lệ (chỉ hỗ trợ thanh toán không tiền mặt: VNPay, Ví điện tử, Thẻ ngân hàng)',
  })
  paymentMethod?: string;

  @IsOptional()
  @IsInt({ message: 'Số điểm sử dụng phải là số nguyên' })
  @Min(0, { message: 'Số điểm sử dụng không được là số âm' })
  pointsUsed?: number;
}

export class ItemDto { @IsString() @MaxLength(80) productId:string; @IsString() @IsIn(['S','M','L']) size:string; @IsArray() @ArrayMaxSize(5) @ArrayUnique() @IsString({each:true}) toppings:string[]; @IsInt() @Min(1) qty:number; }

export class CreateOrderDto {
  @IsArray() @ArrayMaxSize(30) @ValidateNested({each:true}) @Type(()=>ItemDto) items:ItemDto[];
  @IsOptional() @IsString() promotionCode?:string;
  @IsOptional()
  @IsIn(['VNPay', 'Ví điện tử', 'Thẻ ngân hàng'], {
    message: 'Phương thức thanh toán không hợp lệ (chỉ hỗ trợ thanh toán không tiền mặt: VNPay, Ví điện tử, Thẻ ngân hàng)',
  })
  paymentMethod?: string;
  @IsOptional() @IsInt({ message: 'Số điểm sử dụng phải là số nguyên' }) @Min(0, { message: 'Số điểm sử dụng không được là số âm' }) pointsUsed?: number;
}

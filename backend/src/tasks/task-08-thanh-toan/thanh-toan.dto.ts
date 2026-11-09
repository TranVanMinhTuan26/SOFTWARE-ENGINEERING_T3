import { IsBooleanString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
export class CreateVnpayUrlDto {
  @IsString()
  orderId: string;
}

export class PaymentDto {
  @IsString()
  orderId: string;

  @IsString()
  @IsIn(['Ví điện tử', 'Thẻ ngân hàng'])
  method: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  idempotencyKey?: string;

  @IsOptional()
  @IsBooleanString()
  simulateFailure?: string;
}

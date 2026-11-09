import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { TokenGuard } from '../task-01-khoi-tao/bao-ve.guard';
import { CartService } from './gio-hang.service';
import { AddCartItemDto, ApplyVoucherDto, UpdateCartItemDto } from './gio-hang.dto';
@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Post('validate')
  validateCart(@Body() body: { items?: any[] }) {
    return this.cartService.validateItems(body?.items || []);
  }

  @UseGuards(TokenGuard)
  @Get()
  getCart(@Req() req: any) {
    return this.cartService.getCart(req.user.sub || req.user.id);
  }

  @UseGuards(TokenGuard)
  @Post('items')
  addItem(@Req() req: any, @Body() body: AddCartItemDto) {
    return this.cartService.addItem(req.user.sub || req.user.id, body);
  }

  @UseGuards(TokenGuard)
  @Patch('items/:id')
  updateItem(@Req() req: any, @Param('id') id: string, @Body() body: UpdateCartItemDto) {
    return this.cartService.updateItemQuantity(req.user.sub || req.user.id, id, Number(body?.qty));
  }

  @UseGuards(TokenGuard)
  @Delete('items/:id')
  removeItem(@Req() req: any, @Param('id') id: string) {
    return this.cartService.removeItem(req.user.sub || req.user.id, id);
  }

  @UseGuards(TokenGuard)
  @Delete()
  clearCart(@Req() req: any) {
    return this.cartService.clearCart(req.user.sub || req.user.id);
  }

  @UseGuards(TokenGuard)
  @Post('apply-voucher')
  applyVoucher(@Req() req: any, @Body() body: ApplyVoucherDto) {
    return this.cartService.applyVoucher(req.user.sub || req.user.id, body?.code || '');
  }
}

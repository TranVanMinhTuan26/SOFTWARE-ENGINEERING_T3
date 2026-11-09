import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CheckoutDto, CreateOrderDto } from '../task-06-don-hang/don-hang.dto';
import { processCartCheckout } from '../task-06-don-hang/tao-don-hang.service';

describe('VNPay-only payment policy', () => {
  for (const paymentMethod of ['Ví điện tử', 'Thẻ ngân hàng', 'COD']) {
    it(`rejects ${paymentMethod} at checkout DTO`, async () => {
      expect((await validate(plainToInstance(CheckoutDto, { paymentMethod }))).length).toBeGreaterThan(0);
    });
    it(`rejects ${paymentMethod} at order DTO`, async () => {
      const dto = plainToInstance(CreateOrderDto, { items: [], paymentMethod });
      expect((await validate(dto)).some(e => e.property === 'paymentMethod')).toBe(true);
    });
    it(`rejects ${paymentMethod} before accessing the database`, async () => {
      await expect(processCartCheckout({}, { userId: 'test', paymentMethod })).rejects.toThrow();
    });
  }
  it('accepts VNPay', async () => {
    expect(await validate(plainToInstance(CheckoutDto, { paymentMethod: 'VNPay' }))).toEqual([]);
  });
});


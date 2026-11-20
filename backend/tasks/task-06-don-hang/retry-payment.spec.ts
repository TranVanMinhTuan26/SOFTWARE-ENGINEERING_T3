import 'reflect-metadata';
import { OrderController } from './don-hang.controller';
import { prisma } from '../task-01-khoi-tao/ket-noi-prisma';
import * as vnpay from '../task-08-thanh-toan/cong-vnpay.service';

describe('retry payment missing merchant configuration', () => {
  afterEach(() => jest.restoreAllMocks());
  it('returns a configuration error without modifying the order', async () => {
    jest.spyOn(vnpay, 'vnpayConfigFromEnv').mockReturnValue({ tmnCode: '', hashSecret: '', returnUrl: 'http://localhost:4000/payments/vnpay/return' });
    jest.spyOn(prisma.order, 'findFirst').mockResolvedValue({ id: 'test-order', userId: 'test-user', status: 'PENDING', total: 50000, payment: null } as any);
    const update = jest.spyOn(prisma.order, 'update').mockResolvedValue({} as any);
    await expect(new OrderController({} as any).retryPayment({ user: { sub: 'test-user' }, headers: {} }, 'test-order', { method: 'VNPay' })).rejects.toMatchObject({ status: 400 });
    expect(update).not.toHaveBeenCalled();
  });
});

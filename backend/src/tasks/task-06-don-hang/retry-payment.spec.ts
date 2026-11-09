import 'reflect-metadata';
import { OrderController } from './don-hang.controller';
import { prisma } from '../task-01-khoi-tao/ket-noi-prisma';

describe('retry payment missing merchant configuration', () => {
  const original = { tmn: process.env.VNPAY_TMN_CODE, hash: process.env.VNPAY_HASH_SECRET };
  afterEach(() => {
    jest.restoreAllMocks();
    if (original.tmn === undefined) delete process.env.VNPAY_TMN_CODE; else process.env.VNPAY_TMN_CODE = original.tmn;
    if (original.hash === undefined) delete process.env.VNPAY_HASH_SECRET; else process.env.VNPAY_HASH_SECRET = original.hash;
  });
  it('returns a configuration error without modifying the order', async () => {
    process.env.VNPAY_TMN_CODE = '';
    process.env.VNPAY_HASH_SECRET = '';
    jest.spyOn(prisma.order, 'findFirst').mockResolvedValue({ id: 'test-order', userId: 'test-user', status: 'PENDING', total: 50000, payment: null } as any);
    const update = jest.spyOn(prisma.order, 'update').mockResolvedValue({} as any);
    await expect(new OrderController({} as any).retryPayment({ user: { sub: 'test-user' }, headers: {} }, 'test-order', { method: 'VNPay' })).rejects.toMatchObject({ status: 400 });
    expect(update).not.toHaveBeenCalled();
  });
});

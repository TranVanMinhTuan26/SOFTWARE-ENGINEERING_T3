import 'reflect-metadata';
import { VnpayController } from './cong-vnpay.controller';
import { sign } from './cong-vnpay.service';
import { prisma } from '../task-01-khoi-tao/ket-noi-prisma';
import { transitionOrderStatus } from '../task-06-don-hang/don-hang.service';

jest.mock('../task-06-don-hang/don-hang.service', () => ({ transitionOrderStatus: jest.fn().mockResolvedValue({}) }));

describe('VNPay rejects unsuccessful transaction status even with response code 00', () => {
  const originalSecret = process.env.VNPAY_HASH_SECRET;
  beforeEach(() => { process.env.VNPAY_HASH_SECRET = 'callback-unit-only-key'; });
  afterEach(() => { jest.restoreAllMocks(); jest.clearAllMocks(); });
  afterAll(() => { if (originalSecret === undefined) delete process.env.VNPAY_HASH_SECRET; else process.env.VNPAY_HASH_SECRET = originalSecret; });

  function query(status: string | undefined) {
    const params: Record<string, string> = { vnp_TxnRef: 'test-order', vnp_ResponseCode: '00', vnp_Amount: '5000000', vnp_TransactionNo: 'test-txn' };
    if (status !== undefined) params.vnp_TransactionStatus = status;
    return { ...params, vnp_SecureHash: sign(params, process.env.VNPAY_HASH_SECRET!) };
  }

  it.each(['02', undefined])('IPN does not settle status %s', async status => {
    jest.spyOn(prisma.order, 'findUnique').mockResolvedValue({ id: 'test-order', total: 50000, status: 'PENDING', payment: null } as any);
    const settle = jest.spyOn(prisma, '$transaction').mockResolvedValue({} as any);
    const result = await new VnpayController().vnpayIpn(query(status));
    expect(settle).not.toHaveBeenCalled();
    expect(transitionOrderStatus).toHaveBeenCalledWith(prisma, 'test-order', 'PAYMENT_FAILED', expect.anything());
    expect(result.RspCode).toBe('00');
  });

  it.each(['02', undefined])('return URL does not settle status %s', async status => {
    jest.spyOn(prisma.order, 'findUnique').mockResolvedValue({ id: 'test-order', total: 50000, status: 'PENDING', payment: null } as any);
    const settle = jest.spyOn(prisma, '$transaction').mockResolvedValue({} as any);
    const res = { redirect: jest.fn() };
    await new VnpayController().vnpayReturn(query(status), {}, res as any);
    expect(settle).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('vnpay=failed'));
  });
});

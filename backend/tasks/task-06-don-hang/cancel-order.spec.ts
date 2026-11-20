import 'reflect-metadata';
import { cancelOrderWithRefund } from './huy-don-hang.service';
import { OrderController } from './don-hang.controller';
import { AdminOrdersController } from '../task-10-quan-tri/don-hang.controller';
import { transitionOrderStatus } from './don-hang.service';

jest.mock('./don-hang.service', () => ({ transitionOrderStatus: jest.fn().mockResolvedValue({}) }));

function fixture(status: string) {
  let order: any = { id: 'cancel-test', userId: 'customer', status, total: 50000, pointsUsed: 0, items: [] };
  let payment: any = status === 'PAID' ? { id: 'payment', status: 'SUCCESS', method: 'VNPay' } : null;
  const inventory = { restoreForOrder: jest.fn().mockResolvedValue(undefined) };
  const tx: any = {
    order: {
      findUnique: jest.fn(async () => ({ ...order, payment })),
      updateMany: jest.fn(async ({ data }) => { order = { ...order, ...data }; return { count: 1 }; }),
      update: jest.fn(async ({ data }) => { order = { ...order, ...data }; return { ...order, payment }; }),
    },
    payment: { findUnique: jest.fn(async () => payment), update: jest.fn(async ({ data }) => { payment = { ...payment, ...data }; return payment; }) },
    storeSettings: { findFirst: jest.fn().mockResolvedValue({ pointRate: '1000' }) },
    user: { findUnique: jest.fn().mockResolvedValue({ id: 'customer', loyaltyPoints: 50 }), update: jest.fn().mockResolvedValue({}) },
    loyaltyTransaction: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({}) },
  };
  return { tx, inventory };
}

test('paid cancellation awaits a real refund and repeated cancellation has no duplicate effects', async () => {
  const { tx, inventory } = fixture('PAID');
  const result = await cancelOrderWithRefund(tx, 'cancel-test', 'Test cancellation', inventory as any);
  expect(result.status).toBe('CANCELLED');
  expect(result.payment.status).toBe('REFUND_PENDING');
  await cancelOrderWithRefund(tx, 'cancel-test', 'Repeated', inventory as any);
  expect(tx.payment.update).toHaveBeenCalledTimes(1);
  expect(inventory.restoreForOrder).toHaveBeenCalledTimes(1);
  expect(tx.user.update).toHaveBeenCalledTimes(1);
});

test('unpaid cancellation does not invent a refund', async () => {
  const { tx, inventory } = fixture('PENDING');
  expect((await cancelOrderWithRefund(tx, 'cancel-test', undefined, inventory as any)).status).toBe('CANCELLED');
  expect(tx.payment.update).not.toHaveBeenCalled();
});

test.each(['PREPARING', 'READY', 'COMPLETED'])('cannot cancel %s', async status => {
  const { tx, inventory } = fixture(status);
  await expect(cancelOrderWithRefund(tx, 'cancel-test', undefined, inventory as any)).rejects.toThrow();
  expect(tx.order.updateMany).not.toHaveBeenCalled();
});


test('admin status endpoint cannot manually mark an order PAID', async () => {
  await expect(new AdminOrdersController().updateOrder('test-order', { status: 'PAID' })).rejects.toMatchObject({ status: 400 });
  expect(transitionOrderStatus).not.toHaveBeenCalled();
});

test('order status endpoint cannot manually mark an order PAID', async () => {
  await expect(new OrderController({} as any).updateStatus('test-order', { status: 'PAID' })).rejects.toMatchObject({ status: 400 });
  expect(transitionOrderStatus).not.toHaveBeenCalled();
});

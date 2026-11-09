import 'reflect-metadata';
import { calculateLineTotal, applyPromotion, isPromotionExpired } from './tasks/task-04-chi-tiet-san-pham/tinh-gia-mon';
import { canTransition, assertTransition } from './tasks/task-10-nghiep-vu-nang-cao/may-trang-thai-don-hang';
import { sign, signingString, verifyVnpayCallback, buildVnpayUrl } from './tasks/task-08-thanh-toan/cong-vnpay.service';

describe('UNIT-T01 pricing and promotions', () => {
  it.each([['S',90000],['M',100000],['L',110000]])('prices size %s for two cups', (size, total) => {
    expect(calculateLineTotal(45000, size as string, [], 2)).toBe(total);
  });
  it('uses database topping prices', () => expect(calculateLineTotal(45000,'M',['extra'],2,{extra:7000})).toBe(114000));
  it.each([0,-1,1.5])('rejects invalid quantity %s', qty => expect(() => calculateLineTotal(10000,'M',[],qty)).toThrow());
  it('rejects unknown size and topping', () => {
    expect(() => calculateLineTotal(10000,'XL',[],1)).toThrow();
    expect(() => calculateLineTotal(10000,'M',['unknown'],1)).toThrow();
  });
  it('applies percentage before fixed discount and clamps zero', () => {
    expect(applyPromotion(100000,{percentOff:20,discountAmount:15000})).toBe(65000);
    expect(applyPromotion(10000,{discountAmount:15000})).toBe(0);
  });
  it('expires at the exact boundary', () => expect(isPromotionExpired({expiresAt:'2026-01-01'},new Date('2026-01-01'))).toBe(true));
});
describe('UNIT-T02 order states', () => {
  it.each([['PENDING','PAID'],['PAID','PREPARING'],['PREPARING','READY'],['READY','COMPLETED'],['PAYMENT_FAILED','PENDING']])('allows %s → %s', (a,b) => expect(canTransition(a,b)).toBe(true));
  it.each([['PENDING','COMPLETED'],['COMPLETED','PAID'],['CANCELLED','PAID'],['PREPARING','CANCELLED']])('blocks %s → %s',(a,b) => expect(() => assertTransition(a,b)).toThrow());
});
describe('UNIT-T03 VNPay signing', () => {
  const secret='unit-test-only-secret';
  it('sorts and encodes before signing', () => expect(signingString({z:'a b',a:'100'})).toBe('a=100&z=a+b'));
  it('accepts authentic signatures and rejects tampering', () => {
    const params={vnp_TxnRef:'order-test',vnp_Amount:'1000000',vnp_ResponseCode:'00'};
    const callback={...params,vnp_SecureHash:sign(params,secret)};
    expect(verifyVnpayCallback(callback,secret)).toBe(true);
    expect(verifyVnpayCallback({...callback,vnp_Amount:'1'},secret)).toBe(false);
    expect(verifyVnpayCallback({...callback,vnp_SecureHash:'zz'},secret)).toBe(false);
    expect(verifyVnpayCallback(callback,'')).toBe(false);
  });
  it('builds a signed redirect with VND converted to hundredths', () => {
    const url=new URL(buildVnpayUrl({order:{id:'order-test',totalAmount:45000},config:{tmnCode:'UNITTEST',hashSecret:secret,returnUrl:'https://example.test/return'},clientIp:'127.0.0.1'}));
    expect(url.searchParams.get('vnp_Amount')).toBe('4500000');
    expect(verifyVnpayCallback(Object.fromEntries(url.searchParams),secret)).toBe(true);
  });
});

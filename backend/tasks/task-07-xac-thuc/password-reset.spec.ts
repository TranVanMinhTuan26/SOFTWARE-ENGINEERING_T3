import 'reflect-metadata';
import { AuthService } from './xac-thuc.service';
import { prisma } from '../task-01-khoi-tao/ket-noi-prisma';

describe('demo reset remains opt-in and disabled in production', () => {
  const original = { node: process.env.NODE_ENV, flag: process.env.ALLOW_INSECURE_PASSWORD_RESET };
  afterEach(() => {
    jest.restoreAllMocks();
    if (original.node === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = original.node;
    if (original.flag === undefined) delete process.env.ALLOW_INSECURE_PASSWORD_RESET; else process.env.ALLOW_INSECURE_PASSWORD_RESET = original.flag;
  });
  it.each([['production', 'true'], ['development', 'false']])('blocks NODE_ENV=%s / flag=%s without touching user data', async (node, flag) => {
    process.env.NODE_ENV = node;
    process.env.ALLOW_INSECURE_PASSWORD_RESET = flag;
    const read = jest.spyOn(prisma.user, 'findUnique');
    const service = new AuthService({} as any);
    await expect(service.forgotPassword({ email: 'guard@example.test' })).rejects.toMatchObject({ status: 403 });
    await expect(service.resetPassword({ email: 'guard@example.test', token: '123456', newPassword: 'Password123!' })).rejects.toMatchObject({ status: 403 });
    expect(read).not.toHaveBeenCalled();
  });
});

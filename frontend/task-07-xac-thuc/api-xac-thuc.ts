export type AuthMode = 'register' | 'login';

export type AuthApiResponse = {
  accessToken?: string;
  message?: string;
  resetToken?: string;
  user?: {
    status?: string;
    role?: string;
    fullName?: string | null;
    phone?: string | null;
  };
};

function isAuthApiResponse(value: unknown): value is AuthApiResponse {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const body = value as Record<string, unknown>;
  if (
    (body.accessToken !== undefined && typeof body.accessToken !== 'string') ||
    (body.message !== undefined && typeof body.message !== 'string') ||
    (body.resetToken !== undefined && typeof body.resetToken !== 'string')
  ) {
    return false;
  }

  if (body.user === undefined) {
    return true;
  }
  if (typeof body.user !== 'object' || body.user === null || Array.isArray(body.user)) {
    return false;
  }

  const user = body.user as Record<string, unknown>;
  return (
    (user.status === undefined || typeof user.status === 'string') &&
    (user.role === undefined || typeof user.role === 'string') &&
    (user.fullName === undefined || user.fullName === null || typeof user.fullName === 'string') &&
    (user.phone === undefined || user.phone === null || typeof user.phone === 'string')
  );
}

async function guiYeuCauXacThuc(
  api: string,
  duongDan: string,
  duLieuGui: unknown,
  thongBaoMacDinh: string
): Promise<AuthApiResponse> {
  const phanHoi = await fetch(`${api}${duongDan}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(duLieuGui),
  });
  const duLieu: unknown = await phanHoi.json();

  if (!phanHoi.ok) {
    const thongBaoLoi =
      typeof duLieu === 'object' &&
      duLieu !== null &&
      'message' in duLieu &&
      typeof duLieu.message === 'string'
        ? duLieu.message
        : thongBaoMacDinh;
    throw new Error(thongBaoLoi);
  }

  if (!isAuthApiResponse(duLieu)) {
    throw new Error('Phản hồi xác thực từ máy chủ không hợp lệ.');
  }
  return duLieu;
}
const postAuthRequest = guiYeuCauXacThuc;

export function yeuCauQuenMatKhau(api: string, email: string) {
  return guiYeuCauXacThuc(
    api,
    '/auth/forgot-password',
    { email },
    'Yêu cầu khôi phục mật khẩu thất bại.'
  );
}
export const requestForgotPassword = yeuCauQuenMatKhau;

export function datLaiMatKhau(
  api: string,
  duLieuGui: { email: string; token: string; newPassword: string }
) {
  return guiYeuCauXacThuc(api, '/auth/reset-password', duLieuGui, 'Đặt lại mật khẩu thất bại.');
}
export const resetPassword = datLaiMatKhau;

export function xacThucTaiKhoan(
  api: string,
  mode: AuthMode,
  duLieuGui: {
    email: string;
    password: string;
    fullName?: string;
    phone?: string;
  }
) {
  return guiYeuCauXacThuc(
    api,
    `/auth/${mode}`,
    duLieuGui,
    'Xác thực không thành công.'
  );
}
export const authenticate = xacThucTaiKhoan;

export function xoaThongTinXacThuc() {
  localStorage.removeItem('brewlite-token');
  localStorage.removeItem('brewlite-email');
  localStorage.removeItem('brewlite-role');
  localStorage.removeItem('brewlite_admin_role');
}
export const clearStoredAuth = xoaThongTinXacThuc;

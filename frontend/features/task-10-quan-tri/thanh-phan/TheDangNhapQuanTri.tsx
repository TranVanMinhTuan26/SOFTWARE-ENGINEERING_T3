'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface AdminLoginCardProps {
  adminEmailInput: string;
  setAdminEmailInput: (v: string) => void;
  adminPasswordInput: string;
  setAdminPasswordInput: (v: string) => void;
  adminLoginError: string;
  adminLoginLoading: boolean;
  handleAdminLogin: (e: React.FormEvent) => void;
}

export function AdminLoginCard({
  adminEmailInput,
  setAdminEmailInput,
  adminPasswordInput,
  setAdminPasswordInput,
  adminLoginError,
  adminLoginLoading,
  handleAdminLogin,
}: AdminLoginCardProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: '24px',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '36px 32px',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              background: '#eaf4eb',
              borderRadius: '16px',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 12px',
              fontSize: '28px',
            }}
          >
            🌱
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>
            Đăng nhập Quản trị BrewLite
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Dành riêng cho Ban Quản trị & Nhân viên vận hành
          </p>
        </div>

        {adminLoginError && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              color: '#991b1b',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} />
            <span>{adminLoginError}</span>
          </div>
        )}

        <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 700,
                color: '#334155',
                marginBottom: '6px',
              }}
            >
              Email quản trị
            </label>
            <input
              type="email"
              required
              value={adminEmailInput}
              onChange={(e) => setAdminEmailInput(e.target.value)}
              placeholder="admin@brewlite.local"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1.5px solid #cbd5e1',
                borderRadius: '10px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 700,
                color: '#334155',
                marginBottom: '6px',
              }}
            >
              Mật khẩu
            </label>
            <input
              type="password"
              required
              value={adminPasswordInput}
              onChange={(e) => setAdminPasswordInput(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1.5px solid #cbd5e1',
                borderRadius: '10px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={adminLoginLoading}
            style={{
              marginTop: '6px',
              background: '#173f35',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: adminLoginLoading ? 'not-allowed' : 'pointer',
              opacity: adminLoginLoading ? 0.7 : 1,
            }}
          >
            {adminLoginLoading ? 'Đang xác thực...' : 'Đăng nhập vào Hệ thống'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '18px' }}>
          <a
            href="/"
            style={{
              fontSize: '13px',
              color: '#16a34a',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            ← Quay lại Trang đặt món Khách hàng
          </a>
        </div>
      </div>
    </div>
  );
}

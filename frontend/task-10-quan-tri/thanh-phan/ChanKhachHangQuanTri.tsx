'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface AdminCustomerBlockedProps {
  currentUserEmail: string;
  onLogout: () => void;
}

export function AdminCustomerBlocked({ currentUserEmail, onLogout }: AdminCustomerBlockedProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#f8fafc',
        padding: '24px',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '48px 32px',
          width: '100%',
          maxWidth: '520px',
          textAlign: 'center',
          border: '1.5px solid #fee2e2',
          boxShadow: '0 12px 32px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: '#fef2f2',
            color: '#dc2626',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 18px',
          }}
        >
          <ShieldAlert size={38} color="#dc2626" />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#991b1b', margin: '0 0 10px' }}>
          Quyền hạn không đủ - Truy cập bị từ chối
        </h2>
        <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, margin: '0 0 24px' }}>
          Tài khoản <strong style={{ color: '#0f172a' }}>{currentUserEmail}</strong> của bạn là tài
          khoản <strong>Khách hàng (CUSTOMER)</strong>.
          <br />
          Bảng điều khiển này chỉ dành riêng cho Ban Quản trị, Quản lý và Nhân viên vận hành cửa hàng
          BrewLite.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <a
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: '#173f35',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '14px',
              padding: '12px 20px',
              borderRadius: '12px',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(23,63,53,0.25)',
            }}
          >
            🌱 Quay về Trang Khách hàng (Đặt món)
          </a>
          <button
            onClick={onLogout}
            style={{
              background: '#f1f5f9',
              color: '#475569',
              fontWeight: 700,
              fontSize: '13px',
              padding: '10px 18px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              cursor: 'pointer',
            }}
          >
            Đăng xuất tài khoản này & Đăng nhập bằng tài khoản Quản trị
          </button>
        </div>
      </div>
    </div>
  );
}


'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, LogIn } from 'lucide-react';

export function OrdersNotLoggedIn() {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #e2e8e0',
        padding: '60px 24px',
        textAlign: 'center',
        maxWidth: '560px',
        margin: '30px auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: '#fef3c7',
          color: '#d97706',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}
      >
        <Lock size={36} color="#d97706" />
      </div>
      <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#173f35', margin: '0 0 10px' }}>
        Vui lòng đăng nhập tài khoản
      </h2>
      <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 28px', lineHeight: 1.6 }}>
        Bạn cần đăng nhập để theo dõi trạng thái món ăn, lịch sử giao dịch và tích điểm thưởng của
        riêng bạn.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <Link
          href="/?login=1"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--green, #173f35)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '14px',
            padding: '12px 24px',
            borderRadius: '12px',
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(23,63,53,0.25)',
          }}
        >
          <LogIn size={18} /> Đăng nhập ngay
        </Link>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#f3f4f6',
            color: '#374151',
            fontWeight: 600,
            fontSize: '14px',
            padding: '12px 20px',
            borderRadius: '12px',
            textDecoration: 'none',
          }}
        >
          Quay lại trang chủ
        </Link>
      </div>
    </div>
  );
}


'use client';

import React from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';

interface OrdersEmptyProps {
  currentUserEmail: string;
}

export function OrdersEmpty({ currentUserEmail }: OrdersEmptyProps) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '24px',
        border: '1px solid #e2e8e0',
        padding: '64px 32px',
        textAlign: 'center',
        maxWidth: '560px',
        margin: '36px auto',
        boxShadow: '0 12px 36px rgba(0,0,0,0.04)',
      }}
    >
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: '#eaf4eb',
          color: '#1b6338',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 4px 14px rgba(27,99,56,0.08)',
        }}
      >
        <Package size={40} color="#1b6338" />
      </div>
      <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#173f35', margin: '0 0 10px' }}>
        Bạn chưa có đơn hàng nào
      </h2>
      <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 28px', lineHeight: 1.6 }}>
        Tài khoản <strong style={{ color: '#173f35' }}>{currentUserEmail || 'của bạn'}</strong> hiện
        tại chưa phát sinh đơn hàng nào. Hãy khám phá thực đơn đồ uống và bánh ngọt thơm ngon của
        BrewLite nhé!
      </p>
      <Link
        href="/#menu"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--green, #173f35)',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '14px',
          padding: '12px 28px',
          borderRadius: '12px',
          textDecoration: 'none',
          boxShadow: '0 4px 14px rgba(23,63,53,0.22)',
        }}
      >
        ☕ Khám phá thực đơn & Đặt món ngay
      </Link>
    </div>
  );
}


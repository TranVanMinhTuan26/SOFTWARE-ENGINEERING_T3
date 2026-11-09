'use client';

import React from 'react';

export function AdminAuthChecking() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#f8fafc',
        color: '#1e293b',
      }}
    >
      <div style={{ textAlign: 'center', padding: '30px' }}>
        <div style={{ fontSize: '42px', marginBottom: '14px' }}>🌱</div>
        <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>
          Đang xác thực quyền hạn...
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
          Vui lòng đợi giây lát trong khi BrewLite kiểm tra vai trò tài khoản.
        </p>
      </div>
    </div>
  );
}


'use client';

import React from 'react';
import Link from 'next/link';

export class OrdersErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('OrdersPage caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            background: '#f8faf7',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              maxWidth: '440px',
              background: '#fff',
              padding: '32px 24px',
              borderRadius: '20px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
              border: '1px solid #e2e8e0',
            }}
          >
            <span style={{ fontSize: '42px', display: 'block', marginBottom: '12px' }}>🌿</span>
            <h3 style={{ margin: '0 0 8px', color: '#173f35', fontSize: '18px', fontWeight: 800 }}>
              Đã khôi phục dữ liệu đơn hàng
            </h3>
            <p
              style={{
                fontSize: '13px',
                color: '#6b7280',
                margin: '0 0 20px',
                lineHeight: 1.5,
              }}
            >
              Một số thông tin đơn hàng lưu tạm trước đó đã được tự động cập nhật lại tương thích.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem('brewlite_last_order');
                  } catch {}
                  window.location.reload();
                }}
                style={{
                  padding: '10px 18px',
                  background: '#173f35',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Tải lại trang
              </button>
              <Link
                href="/"
                style={{
                  padding: '10px 18px',
                  background: '#eaf4eb',
                  color: '#173f35',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '13px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                🏠 Về màn hình chính
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}


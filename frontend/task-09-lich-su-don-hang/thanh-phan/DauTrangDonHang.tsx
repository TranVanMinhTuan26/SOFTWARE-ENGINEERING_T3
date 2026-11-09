'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { API } from '../../dung-chung/cau-hinh-api';
import { useCartContext } from '../../task-05-gio-hang/NguCanhGioHang';

interface OrdersHeaderProps {
  isLoggedIn: boolean;
  currentUserEmail: string;
}

export function OrdersHeader({ isLoggedIn, currentUserEmail }: OrdersHeaderProps) {
  const { cartCount, setCart } = useCartContext();

  useEffect(() => {
    const tok =
      typeof window !== 'undefined'
        ? localStorage.getItem('brewlite-token') ||
          localStorage.getItem('brewlite_token') ||
          localStorage.getItem('token')
        : '';
    if (tok) {
      fetch(`${API}/cart`, {
        headers: { Authorization: `Bearer ${tok}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data && Array.isArray(data.items)) {
            setCart(
              data.items.map((it: any) => ({
                id: it.id,
                product: {
                  id: it.product?.id || it.productId,
                  name: it.product?.name || '',
                  description: it.product?.description || '',
                  category: it.product?.category || '',
                  price: it.product?.price || 0,
                  available: it.product?.available !== false,
                  imageUrl: it.product?.imageUrl || '',
                },
                size: it.size || 'M',
                toppings: Array.isArray(it.toppings) ? it.toppings : [],
                qty: it.qty || 1,
                unitPrice: it.unitPrice,
              }))
            );
          }
        })
        .catch(() => {});
    }
  }, [setCart]);

  return (
    <header className="site-header">
      <div className="nav-wrapper">
        <Link href="/" className="brand-logo">
          <div className="brand-icon">🌱</div>
          <span>BrewLite</span>
        </Link>

        <nav className="nav-links">
          <Link href="/">Trang chủ</Link>
          <Link href="/#menu">Thực đơn</Link>
          <Link href="/orders" className="active">
            Theo dõi & Lịch sử đơn hàng
          </Link>
        </nav>

        <div className="nav-actions">
          {isLoggedIn && currentUserEmail && (
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--green, #173f35)',
                background: 'var(--green-light, #eaf3ee)',
                padding: '6px 14px',
                borderRadius: '99px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              👤 {currentUserEmail}
            </span>
          )}

          <Link
            href="/#cart"
            className="icon-btn"
            aria-label="Giỏ hàng"
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: '#f1f5f9',
              color: 'var(--green, #173f35)',
            }}
          >
            <ShoppingBag size={18} />
            {cartCount > 0 && <span className="badge-count">{cartCount}</span>}
          </Link>

          <Link
            href="/#menu"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--green, #173f35)',
              textDecoration: 'none',
              background: '#eaf4eb',
              padding: '8px 16px',
              borderRadius: '10px',
            }}
          >
            <ArrowLeft size={16} /> Tiếp tục chọn món
          </Link>
        </div>
      </div>
    </header>
  );
}


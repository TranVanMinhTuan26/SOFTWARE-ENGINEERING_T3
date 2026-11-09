'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, Globe, Facebook, Instagram, ShieldCheck } from 'lucide-react';
import { useStoreSettings } from '../dung-chung/useCaiDatCuaHang';

export function SiteFooter() {
  const { settings, loading } = useStoreSettings();

  return (
    <footer
      style={{
        backgroundColor: '#173f35',
        color: '#f8fafc',
        marginTop: '60px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '50px 20px 30px',
      }}
    >
      <div
        style={{
          maxWidth: '1160px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '36px',
          paddingBottom: '36px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        {/* Cột 1: Thông tin thương hiệu */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <span style={{ fontSize: '24px' }}>🌱</span>
            <span style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', color: '#ffffff' }}>
              BrewLite
            </span>
          </div>
          <p style={{ margin: '0 0 16px', fontSize: '14px', lineHeight: 1.6, color: '#cbd5e1' }}>
            {settings.storeName} — Nơi tận hưởng hương vị cà phê và trà tinh tế, đậm đà cùng phong cách phục vụ nhanh chóng, tiện lợi.
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            {settings.website && (
              <a
                href={settings.website}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: '#ffffff',
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '8px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                }}
                title="Website chính thức"
              >
                <Globe size={18} />
              </a>
            )}
            {settings.facebook && (
              <a
                href={settings.facebook}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: '#ffffff',
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '8px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                }}
                title="Facebook Fanpage"
              >
                <Facebook size={18} />
              </a>
            )}
            {settings.instagram && (
              <a
                href={settings.instagram}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: '#ffffff',
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '8px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                }}
                title="Instagram"
              >
                <Instagram size={18} />
              </a>
            )}
          </div>
        </div>

        {/* Cột 2: Thông tin liên hệ trực tiếp */}
        <div>
          <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>
            Thông tin liên hệ
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: '#cbd5e1' }}>
              <MapPin size={18} style={{ color: '#4ade80', flexShrink: 0, marginTop: '2px' }} />
              <span>{settings.address || 'Đang cập nhật địa chỉ...'}</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#cbd5e1' }}>
              <Phone size={18} style={{ color: '#4ade80', flexShrink: 0 }} />
              <a href={`tel:${(settings.hotline || settings.phone || '').replace(/[^\d]/g, '')}`} style={{ color: '#ffffff', textDecoration: 'none', fontWeight: 600 }}>
                {settings.hotline || settings.phone || 'Đang cập nhật hotline...'}
              </a>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#cbd5e1' }}>
              <Mail size={18} style={{ color: '#4ade80', flexShrink: 0 }} />
              <a href={`mailto:${settings.email}`} style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                {settings.email || 'contact@brewlite.vn'}
              </a>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#cbd5e1' }}>
              <Clock size={18} style={{ color: '#4ade80', flexShrink: 0 }} />
              <span>{settings.openHours || '06:30 - 22:30 hàng ngày'}</span>
            </li>
          </ul>
        </div>

        {/* Cột 3: Liên kết nhanh */}
        <div>
          <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>
            Liên kết nhanh
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
            <li>
              <Link href="/" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                Trang chủ
              </Link>
            </li>
            <li>
              <Link href="/#menu" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                Thực đơn đồ uống
              </Link>
            </li>
            <li>
              <Link href="/orders" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                Theo dõi đơn hàng
              </Link>
            </li>
            <li>
              <Link href="/admin" style={{ color: '#94a3b8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={14} />
                <span>Cổng quản trị Admin</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div
        style={{
          maxWidth: '1160px',
          margin: '20px auto 0',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '12.5px',
          color: '#94a3b8',
        }}
      >
        <div>© {new Date().getFullYear()} {settings.storeName}. All rights reserved.</div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>Cổng thanh toán bảo mật VNPay</span>
          <span>•</span>
          <span>Chính sách tích điểm khách hàng</span>
        </div>
      </div>
    </footer>
  );
}


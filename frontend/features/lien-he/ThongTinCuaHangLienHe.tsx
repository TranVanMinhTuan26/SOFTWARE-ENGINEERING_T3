'use client';

import React from 'react';
import { MapPin, Phone, Mail, Clock, Globe, Facebook, Instagram } from 'lucide-react';
import type { PublicStoreSettings } from '../dung-chung/useCaiDatCuaHang';

interface ContactStoreInfoProps {
  settings: PublicStoreSettings;
}

export function ContactStoreInfo({ settings }: ContactStoreInfoProps) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        border: '1px solid #e2e8f0',
      }}
    >
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#173f35', marginTop: 0, marginBottom: '20px' }}>
        Thông tin cửa hàng
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#eaf3ee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#173f35',
              flexShrink: 0,
            }}
          >
            <MapPin size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
              Địa chỉ quán
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>
              {settings.address}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#eaf3ee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#173f35',
              flexShrink: 0,
            }}
          >
            <Phone size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
              Hotline đặt hàng & Hỗ trợ
            </div>
            <a
              href={`tel:${(settings.hotline || settings.phone || '').replace(/[^\d]/g, '')}`}
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#166534',
                marginTop: '2px',
                textDecoration: 'none',
                display: 'block',
              }}
            >
              {settings.hotline || settings.phone}
            </a>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#eaf3ee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#173f35',
              flexShrink: 0,
            }}
          >
            <Mail size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
              Email tiếp nhận thông tin
            </div>
            <a
              href={`mailto:${settings.email}`}
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#0f172a',
                marginTop: '2px',
                textDecoration: 'none',
                display: 'block',
              }}
            >
              {settings.email}
            </a>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#eaf3ee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#173f35',
              flexShrink: 0,
            }}
          >
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
              Khung giờ phục vụ
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>
              {settings.openHours}
            </div>
          </div>
        </div>

        {/* Mạng xã hội */}
        <div style={{ marginTop: '10px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#64748b',
              marginBottom: '10px',
            }}
          >
            Kênh truyền thông & Website
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {settings.website && (
              <a
                href={settings.website}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#173f35',
                  textDecoration: 'none',
                  border: '1px solid #e2e8f0',
                }}
              >
                <Globe size={16} />
                <span>Website</span>
              </a>
            )}
            {settings.facebook && (
              <a
                href={settings.facebook}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#1877f2',
                  textDecoration: 'none',
                  border: '1px solid #e2e8f0',
                }}
              >
                <Facebook size={16} />
                <span>Facebook</span>
              </a>
            )}
            {settings.instagram && (
              <a
                href={settings.instagram}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#e1306c',
                  textDecoration: 'none',
                  border: '1px solid #e2e8f0',
                }}
              >
                <Instagram size={16} />
                <span>Instagram</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

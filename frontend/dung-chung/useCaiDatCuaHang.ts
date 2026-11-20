'use client';

import { useState, useEffect, useCallback } from 'react';
import { API } from './cau-hinh-api';

export interface PublicStoreSettings {
  storeName: string;
  hotline: string;
  phone?: string;
  address: string;
  email: string;
  openHours: string;
  website?: string;
  facebook?: string;
  instagram?: string;
}

export const DEFAULT_PUBLIC_SETTINGS: PublicStoreSettings = {
  storeName: 'BrewLite Specialty Coffee & Tea',
  hotline: '1900 6868 - 0988 123 456',
  phone: '1900 6868 - 0988 123 456',
  address: '123 Nguyễn Thị Minh Khai, Bến Nghé, Quận 1, TP. Hồ Chí Minh',
  email: 'contact@brewlite.vn',
  openHours: '06:30 - 22:30 hàng ngày',
  website: 'https://brewlite.vn',
  facebook: 'https://facebook.com/brewlite',
  instagram: 'https://instagram.com/brewlite',
};

export function useStoreSettings() {
  const [settings, setSettings] = useState<PublicStoreSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('brewlite_store_settings');
        if (cached) {
          const parsed = JSON.parse(cached);
          return {
            ...DEFAULT_PUBLIC_SETTINGS,
            storeName: parsed.storeName || DEFAULT_PUBLIC_SETTINGS.storeName,
            hotline: parsed.hotline || parsed.phone || DEFAULT_PUBLIC_SETTINGS.hotline,
            phone: parsed.phone || parsed.hotline || DEFAULT_PUBLIC_SETTINGS.phone,
            address: parsed.address || DEFAULT_PUBLIC_SETTINGS.address,
            email: parsed.email || DEFAULT_PUBLIC_SETTINGS.email,
            openHours: parsed.openHours || DEFAULT_PUBLIC_SETTINGS.openHours,
            website: parsed.website || DEFAULT_PUBLIC_SETTINGS.website,
            facebook: parsed.facebook || DEFAULT_PUBLIC_SETTINGS.facebook,
            instagram: parsed.instagram || DEFAULT_PUBLIC_SETTINGS.instagram,
          };
        }
      } catch {}
    }
    return DEFAULT_PUBLIC_SETTINGS;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Try public /settings endpoint first
      let res = await fetch(`${API}/settings`, {
        headers: { Accept: 'application/json' },
      }).catch(() => null);

      // If /settings is not reachable, fallback to /admin/settings/public
      if (!res || !res.ok) {
        res = await fetch(`${API}/admin/settings/public`, {
          headers: { Accept: 'application/json' },
        }).catch(() => null);
      }

      if (res && res.ok) {
        const data = await res.json();
        const merged: PublicStoreSettings = {
          storeName: data.storeName || DEFAULT_PUBLIC_SETTINGS.storeName,
          hotline: data.hotline || data.phone || DEFAULT_PUBLIC_SETTINGS.hotline,
          phone: data.phone || data.hotline || DEFAULT_PUBLIC_SETTINGS.phone,
          address: data.address || DEFAULT_PUBLIC_SETTINGS.address,
          email: data.email || DEFAULT_PUBLIC_SETTINGS.email,
          openHours: data.openHours || DEFAULT_PUBLIC_SETTINGS.openHours,
          website: data.website || DEFAULT_PUBLIC_SETTINGS.website,
          facebook: data.facebook || DEFAULT_PUBLIC_SETTINGS.facebook,
          instagram: data.instagram || DEFAULT_PUBLIC_SETTINGS.instagram,
        };
        setSettings(merged);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('brewlite_store_settings', JSON.stringify(merged));
          } catch {}
        }
      } else {
        setError('Không thể tải thông tin liên hệ mới nhất từ máy chủ.');
      }
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi tải thông tin liên hệ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();

    const handleStorageUpdate = (e: StorageEvent | Event) => {
      if ((e as StorageEvent).key === 'brewlite_store_settings' || e.type === 'brewlite:settings-updated') {
        fetchSettings();
      }
    };

    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('brewlite:settings-updated', handleStorageUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('brewlite:settings-updated', handleStorageUpdate);
    };
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    refreshSettings: fetchSettings,
  };
}


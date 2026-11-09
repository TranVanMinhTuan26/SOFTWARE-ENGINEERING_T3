import { useEffect, useMemo, useState } from 'react';
import type { PromotionItem } from '../../dung-chung/kieu-du-lieu-chung';
import { API } from '../../dung-chung/cau-hinh-api';
import { useCartContext } from '../NguCanhGioHang';

export interface UseCartDiscountsProps {
  token: string;
  userPoints: number;
  subtotal: number;
  syncCartFromApi: (data: any) => void;
}

export function useCartDiscounts({
  token,
  userPoints,
  subtotal,
  syncCartFromApi,
}: UseCartDiscountsProps) {
  const {
    voucher,
    setVoucher,
    voucherApplied,
    setVoucherApplied,
    selectedPromo,
    setSelectedPromo,
    usePoints,
    setUsePoints,
    pointsToRedeem,
    setPointsToRedeem,
  } = useCartContext();
  const [availablePromotions, setAvailablePromotions] = useState<PromotionItem[]>([]);

  // Store Settings đồng bộ thời gian thực từ Admin
  const [storeSettings, setStoreSettings] = useState<{ pointRate: string; pointRedeem: string; pointToMoneyRate: string }>({
    pointRate: '1000',
    pointRedeem: '100',
    pointToMoneyRate: '100',
  });

  useEffect(() => {
    const syncSettings = async () => {
      // 1. Nạp từ localStorage trước (nếu có)
      try {
        const stored = localStorage.getItem('brewlite_store_settings');
        if (stored) {
          const parsed = JSON.parse(stored);
          setStoreSettings({
            pointRate: parsed.pointRate || '1000',
            pointRedeem: parsed.pointRedeem || '100',
            pointToMoneyRate: parsed.pointToMoneyRate || '100',
          });
        }
      } catch {}

      // 2. Đồng bộ thời gian thực từ Backend API
      try {
        const res = await fetch(`${API}/settings/loyalty-policy`);
        if (res.ok) {
          const pub = await res.json();
          if (pub?.pointRate || pub?.pointRedeem || pub?.pointToMoneyRate) {
            const next = {
              pointRate: String(pub.pointRate || '1000'),
              pointRedeem: String(pub.pointRedeem || '100'),
              pointToMoneyRate: String(pub.pointToMoneyRate || '100'),
            };
            setStoreSettings(next);
            try {
              localStorage.setItem('brewlite_store_settings', JSON.stringify(next));
            } catch {}
          }
        }
      } catch {}
    };

    syncSettings();
    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key === 'brewlite_store_settings') syncSettings();
    };
    const handleCustom = (e: any) => {
      if (e?.detail) {
        setStoreSettings({
          pointRate: String(e.detail.pointRate || '1000'),
          pointRedeem: String(e.detail.pointRedeem || '100'),
          pointToMoneyRate: String(e.detail.pointToMoneyRate || '100'),
        });
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', syncSettings);
    window.addEventListener('brewlite:settings-updated', handleCustom);
    const interval = setInterval(syncSettings, 3000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', syncSettings);
      window.removeEventListener('brewlite:settings-updated', handleCustom);
      clearInterval(interval);
    };
  }, []);

  // Đồng bộ danh sách khuyến mãi thời gian thực từ Backend API và Admin
  useEffect(() => {
    const syncPromos = async () => {
      try {
        const res = await fetch(`${API}/promotions`);
        if (res.ok) {
          const apiPromos = await res.json();
          if (Array.isArray(apiPromos)) {
            const now = Date.now();
            const mapped: PromotionItem[] = apiPromos.map((p: any) => {
              const isExpired = p.expiresAt ? new Date(p.expiresAt).getTime() < now : false;
              const fixedAmt = Number(p.discountAmount || p.fixedAmount || 0);
              const pctOff = Number(p.percentOff || 0);
              const discountLabel =
                fixedAmt > 0 && pctOff > 0
                  ? `${pctOff}% + ${fixedAmt.toLocaleString('vi-VN')}đ`
                  : fixedAmt > 0
                  ? `${fixedAmt.toLocaleString('vi-VN')}đ`
                  : `${pctOff}%`;
              const timeRangeLabel = p.expiresAt
                ? `HSD: ${new Date(p.expiresAt).toLocaleDateString('vi-VN')}`
                : 'Không giới hạn';
              return {
                id: p.id,
                code: p.code,
                name: p.description || `Giảm ${discountLabel}`,
                discount: discountLabel,
                percentOff: pctOff,
                discountAmount: fixedAmt,
                expiresAt: p.expiresAt || null,
                timeRange: timeRangeLabel,
                status: (p.active && !isExpired ? 'Đang hoạt động' : 'Đã kết thúc') as PromotionItem['status'],
              };
            });
            const activeOnly = mapped.filter((p) => p.status === 'Đang hoạt động');
            setAvailablePromotions(activeOnly);
            localStorage.setItem('brewlite_promotions', JSON.stringify(mapped));
            return;
          }
        }
      } catch {}

      setAvailablePromotions([]);
    };
    syncPromos();
    const handleStoragePromos = (e: StorageEvent) => {
      if (!e.key || e.key === 'brewlite_promotions') syncPromos();
    };
    window.addEventListener('storage', handleStoragePromos);
    window.addEventListener('focus', syncPromos);
    const interval = setInterval(syncPromos, 10000);
    return () => {
      window.removeEventListener('storage', handleStoragePromos);
      window.removeEventListener('focus', syncPromos);
      clearInterval(interval);
    };
  }, []);

  const pointRateNumber = useMemo(() => {
    const val = Number(storeSettings.pointRate);
    return !isNaN(val) && val > 0 ? val : 1000;
  }, [storeSettings.pointRate]);

  const minPointRedeem = useMemo(() => {
    const val = Number(storeSettings.pointRedeem);
    return !isNaN(val) && val >= 0 ? val : 100;
  }, [storeSettings.pointRedeem]);

  const pointToMoneyRateNumber = useMemo(() => {
    const val = Number(storeSettings.pointToMoneyRate);
    return !isNaN(val) && val > 0 ? val : 100;
  }, [storeSettings.pointToMoneyRate]);

  const discountAmount = useMemo(() => {
    if (!voucherApplied) return 0;
    const promo =
      selectedPromo ||
      availablePromotions.find((p) => p.code.toUpperCase() === voucher.trim().toUpperCase());
    if (promo) {
      if (promo.expiresAt && new Date(promo.expiresAt).getTime() < Date.now()) {
        return 0;
      }
      const fixedOff = Number(promo.discountAmount || 0);
      const pctOff =
        promo.percentOff !== undefined
          ? Number(promo.percentOff)
          : promo.discount.includes('%')
          ? parseInt(promo.discount.replace(/\D/g, ''), 10) || 0
          : 0;
      const parsedFixedFromStr =
        !promo.discount.includes('%') && fixedOff === 0
          ? parseInt(promo.discount.replace(/\D/g, ''), 10) || 0
          : fixedOff;
      const afterPercent = Math.round((subtotal * (100 - pctOff)) / 100);
      const finalPayable = Math.max(0, afterPercent - parsedFixedFromStr);
      return Math.max(0, subtotal - finalPayable);
    }
    return 0;
  }, [voucherApplied, selectedPromo, voucher, availablePromotions, subtotal]);

  const maxRedeemablePoints = useMemo(() => {
    const afterVoucher = Math.max(0, subtotal - discountAmount);
    return Math.min(userPoints, Math.floor(afterVoucher / pointToMoneyRateNumber));
  }, [userPoints, subtotal, discountAmount, pointToMoneyRateNumber]);

  useEffect(() => {
    if (userPoints < minPointRedeem || maxRedeemablePoints < minPointRedeem) {
      if (usePoints) setUsePoints(false);
      if (pointsToRedeem > 0) setPointsToRedeem(0);
    }
  }, [userPoints, minPointRedeem, maxRedeemablePoints, usePoints, pointsToRedeem, setUsePoints, setPointsToRedeem]);

  const actualPointsUsed = useMemo(() => {
    if (!usePoints || userPoints <= 0) return 0;
    if (userPoints < minPointRedeem || maxRedeemablePoints < minPointRedeem) return 0;
    const requested = pointsToRedeem > 0 ? pointsToRedeem : maxRedeemablePoints;
    const clamped = Math.min(requested, maxRedeemablePoints);
    if (clamped < minPointRedeem) return 0;
    return clamped;
  }, [usePoints, userPoints, pointsToRedeem, maxRedeemablePoints, minPointRedeem]);

  // Quy đổi: 1 điểm = pointToMoneyRateNumber VNĐ (mặc định: 100 VNĐ)
  const pointsDiscount = actualPointsUsed * pointToMoneyRateNumber;
  const grandTotal = Math.max(0, subtotal - discountAmount - pointsDiscount);
  const expectedEarnedPoints = Math.floor(grandTotal / pointRateNumber);

  const handleSelectPromo = async (promo: PromotionItem) => {
    setSelectedPromo(promo);
    setVoucher(promo.code);
    setVoucherApplied(true);
    if (token) {
      try {
        const res = await fetch(`${API}/cart/apply-voucher`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ code: promo.code }),
        });
        if (res.ok) {
          const data = await res.json();
          syncCartFromApi(data);
        }
      } catch {}
    }
  };

  const handleRemovePromo = async () => {
    setSelectedPromo(null);
    setVoucher('');
    setVoucherApplied(false);
    if (token) {
      try {
        const res = await fetch(`${API}/cart/apply-voucher`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ code: '' }),
        });
        if (res.ok) {
          const data = await res.json();
          syncCartFromApi(data);
        }
      } catch {}
    }
  };

  const applyVoucher = async () => {
    const code = voucher.trim().toUpperCase();
    if (!code) {
      alert('Vui lòng chọn hoặc nhập mã giảm giá!');
      return;
    }
    if (token) {
      try {
        const res = await fetch(`${API}/cart/apply-voucher`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ code }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setSelectedPromo(null);
          setVoucherApplied(false);
          alert(err.message || `Mã giảm giá "${code}" không hợp lệ hoặc đã hết hạn.`);
          return;
        }
        const data = await res.json();
        syncCartFromApi(data);
        const found = availablePromotions.find((p) => p.code.toUpperCase() === code);
        if (found) {
          setSelectedPromo(found);
        }
        setVoucher(code);
        setVoucherApplied(true);
        return;
      } catch {}
    }

    const found = availablePromotions.find((p) => p.code.toUpperCase() === code);
    if (found) {
      setSelectedPromo(found);
      setVoucher(found.code);
      setVoucherApplied(true);
    } else {
      setSelectedPromo(null);
      setVoucherApplied(false);
      alert(`Mã giảm giá "${code}" không hợp lệ hoặc đã hết hạn. Hãy chọn mã từ danh sách khuyến mãi của quán!`);
    }
  };

  return {
    voucher,
    setVoucher,
    voucherApplied,
    availablePromotions,
    selectedPromo,
    usePoints,
    setUsePoints,
    pointsToRedeem,
    setPointsToRedeem,
    pointRateNumber,
    pointToMoneyRateNumber,
    minPointRedeem,
    discountAmount,
    maxRedeemablePoints,
    actualPointsUsed,
    pointsDiscount,
    grandTotal,
    expectedEarnedPoints,
    handleSelectPromo,
    chonKhuyenMai: handleSelectPromo,
    handleRemovePromo,
    boChonKhuyenMai: handleRemovePromo,
    applyVoucher,
    apDungMaGiamGia: applyVoucher,
  };
}


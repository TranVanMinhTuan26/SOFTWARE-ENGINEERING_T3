'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Minus, ShoppingCart, CheckCircle2 } from 'lucide-react';
import type { ProductSize } from '../../../features/task-04-chi-tiet-san-pham/HopThoaiChiTietSanPham';
import type { Product, Topping } from '../../../features/dung-chung/kieu-du-lieu-chung';

/**
 * Trang Chi tiết sản phẩm: /products/[id] (Wireframe 2)
 * Phụ trách: Chương (Task 4.1, 4.2)
 * Tính năng: Xem thông tin đồ uống, chọn Size (S/M/L) và Topping, tính giá động
 */
export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [size, setSize] = useState<ProductSize>('M');
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  // Mẫu dữ liệu sản phẩm chuẩn đề bài BrewLite
  const product: Product = {
    id: params?.id || 'demo-product',
    name: 'Cappuccino',
    category: 'Cà phê',
    price: 45000,
    imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&auto=format&fit=crop&q=60',
    description: 'Cà phê Espresso phối hợp cùng sữa nóng và bọt sữa bồng bềnh mịn màng đặc trưng phong cách Ý.',
    active: true,
  };

  const availableToppings: Topping[] = [
    { id: 'top-1', name: 'Trân châu trắng', price: 10000 },
    { id: 'top-2', name: 'Kem cheese Macchiato', price: 10000 },
    { id: 'top-3', name: 'Thạch sương sáo', price: 8000 },
  ];

  const sizeUpcharge = size === 'S' ? 0 : size === 'M' ? 5000 : 10000;
  const toppingTotal = selectedToppings.reduce((sum, topName) => {
    const found = availableToppings.find((t) => t.name === topName);
    return sum + (found?.price || 10000);
  }, 0);
  const singlePrice = product.price + sizeUpcharge + toppingTotal;
  const totalPrice = singlePrice * qty;

  const handleToggleTopping = (toppingName: string) => {
    setSelectedToppings((prev) =>
      prev.includes(toppingName) ? prev.filter((t) => t !== toppingName) : [...prev, toppingName]
    );
  };

  const handleAddToCart = () => {
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2500);
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        {/* Nút quay lại */}
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại thực đơn</span>
          </Link>
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200">
            Task 4.1 & 4.2: Chi tiết & Tùy chọn món
          </span>
        </div>

        {/* Ảnh và thông tin món */}
        <div className="relative h-64 sm:h-72 w-full bg-neutral-100">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-neutral-900">{product.name}</h1>
              <span className="text-xl font-bold text-amber-600">
                {product.price.toLocaleString('vi-VN')}đ
              </span>
            </div>
            <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{product.description}</p>
          </div>

          {/* Chọn Size: S / M / L */}
          <div>
            <label className="block text-sm font-semibold text-neutral-800 mb-2">
              Chọn kích cỡ (Size)
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['S', 'M', 'L'] as ProductSize[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`py-3 px-4 rounded-xl border text-center transition-all ${
                    size === s
                      ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold shadow-sm'
                      : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 font-medium'
                  }`}
                >
                  <div className="text-base font-bold">Size {s}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    {s === 'S' ? 'Tiêu chuẩn' : s === 'M' ? '+5.000đ' : '+10.000đ'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chọn Topping */}
          <div>
            <label className="block text-sm font-semibold text-neutral-800 mb-2">
              Thêm Topping
            </label>
            <div className="space-y-2">
              {availableToppings.map((top) => {
                const checked = selectedToppings.includes(top.name);
                return (
                  <label
                    key={top.id}
                    onClick={() => handleToggleTopping(top.name)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      checked
                        ? 'border-amber-500 bg-amber-50/50 text-neutral-900'
                        : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm font-medium">{top.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-neutral-500">
                      +{top.price.toLocaleString('vi-VN')}đ
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Số lượng & Nút thêm vào giỏ */}
          <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-4">
            <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden bg-neutral-50">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="p-2.5 hover:bg-neutral-200 transition-colors text-neutral-600"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-bold text-neutral-800">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="p-2.5 hover:bg-neutral-200 transition-colors text-neutral-600"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className={`flex-1 py-3.5 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                isAdded
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200'
              }`}
            >
              {isAdded ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Đã thêm vào giỏ!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  <span>Thêm vào giỏ — {totalPrice.toLocaleString('vi-VN')}đ</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

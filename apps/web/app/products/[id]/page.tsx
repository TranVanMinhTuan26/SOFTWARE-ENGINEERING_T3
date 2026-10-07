'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/**
 * Task 4.1: Trang Chi tiết món /products/[id] (WIP Draft)
 */
export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [size, setSize] = useState<'S' | 'M' | 'L'>('M');

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-neutral-600 mb-4">
          <ArrowLeft className="w-4 h-4" /> Quay lại thực đơn
        </Link>
        <h1 className="text-xl font-bold">Chi tiết sản phẩm #{params?.id || 'demo'}</h1>
        <p className="text-sm text-neutral-500 mt-2">Đang xây dựng giao diện tùy chọn Size và Topping...</p>
      </div>
    </div>
  );
}

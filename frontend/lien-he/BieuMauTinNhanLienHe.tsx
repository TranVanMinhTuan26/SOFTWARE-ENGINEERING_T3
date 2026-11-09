'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';

interface ContactMessageFormProps {
  storeName: string;
}

export function ContactMessageForm({ storeName }: ContactMessageFormProps) {
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !message.trim()) {
      alert('Vui lòng điền đầy đủ họ tên và nội dung liên hệ.');
      return;
    }
    setSubmitted(true);
  };

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
        Gửi tin nhắn hoặc góp ý
      </h2>

      {submitted ? (
        <div
          style={{
            padding: '30px 20px',
            background: '#dcfce7',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#166534',
          }}
        >
          <CheckCircle2 size={44} style={{ margin: '0 auto 12px' }} />
          <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>Cảm ơn bạn đã liên hệ!</h3>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5 }}>
            {storeName} đã nhận được tin nhắn và sẽ phản hồi qua email/số điện thoại trong thời gian sớm nhất.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setMessage('');
            }}
            style={{
              marginTop: '20px',
              padding: '8px 20px',
              background: '#166534',
              color: '#ffffff',
              borderRadius: '8px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Gửi tin nhắn khác
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Họ và tên của bạn <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Nguyễn Văn A"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Email
              </label>
              <input
                type="email"
                placeholder="ban@example.com"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Số điện thoại
              </label>
              <input
                type="tel"
                placeholder="0901234567"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Nội dung tin nhắn / Góp ý <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Nhập nội dung bạn muốn chia sẻ với BrewLite..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: '#173f35',
              color: '#ffffff',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '15px',
              marginTop: '8px',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <Send size={16} />
            <span>Gửi tin nhắn</span>
          </button>
        </form>
      )}
    </div>
  );
}


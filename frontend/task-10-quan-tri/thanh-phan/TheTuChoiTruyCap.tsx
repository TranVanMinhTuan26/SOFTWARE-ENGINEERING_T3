import { ShieldAlert } from 'lucide-react';
import type { AdminRole } from '../kieu-quan-tri';
import { ROLE_INFO } from '../hang-so-quan-tri';

type AccessDeniedCardProps = {
  currentAdminRole: AdminRole;
  activeTab: string;
  onFallbackTab: (tab: string) => void;
  fallbackTab: string;
};

export function AccessDeniedCard(props: AccessDeniedCardProps) {
  const { currentAdminRole, activeTab, onFallbackTab, fallbackTab } = props;

  return (
    <div
      style={{
        padding: '60px 24px',
        textAlign: 'center',
        background: '#fff',
        borderRadius: '20px',
        border: '1.5px dashed #fca5a5',
        maxWidth: '640px',
        margin: '40px auto',
        boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
      }}
    >
      <ShieldAlert size={56} color="#dc2626" style={{ margin: '0 auto 16px' }} />
      <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#991b1b', margin: '0 0 10px' }}>
        Truy cập bị giới hạn theo phân quyền vai trò
      </h2>
      <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.6, margin: '0 0 20px' }}>
        Bạn đang thao tác với vai trò:{' '}
        <strong style={{ color: ROLE_INFO[currentAdminRole].color }}>
          {ROLE_INFO[currentAdminRole].title}
        </strong>
        .<br />
        Mục <strong>"{activeTab}"</strong> chỉ dành cho các vai trò có thẩm quyền cao hơn.<br />
        <span style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', display: 'inline-block' }}>
          {ROLE_INFO[currentAdminRole].desc}
        </span>
      </p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button
          className="action-btn"
          style={{
            background: '#f1f5f9',
            border: '1px solid #cbd5e1',
            padding: '10px 18px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '13px',
          }}
          onClick={() => onFallbackTab(fallbackTab)}
        >
          Quay lại {fallbackTab}
        </button>
      </div>
    </div>
  );
}

type ToastNotificationProps = {
  message: string;
};

export function ToastNotification({ message }: ToastNotificationProps) {
  if (!message) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        background: 'var(--green, #173f35)',
        color: '#fff',
        padding: '12px 20px',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        zIndex: 9999,
        fontSize: '13px',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <span>✓</span>
      <span>{message}</span>
    </div>
  );
}


export async function getConfirmedPayment(api: string, token: string | null, reference: string | null) {
  const message = 'Đơn hàng chưa được xác nhận thanh toán. Giỏ hàng được giữ nguyên.';
  if (!token || !reference) throw new Error(message);
  const response = await fetch(`${api}/orders/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(message);
  const order = await response.json();
  if (!['PAID', 'PREPARING', 'READY', 'COMPLETED'].includes(order.status) || order.payment?.status !== 'SUCCESS') {
    throw new Error(message);
  }
  return order;
}

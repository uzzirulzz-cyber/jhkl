import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ordersAPI } from '../services/api';
import {
  t, Page, PageHeader, Card, Badge, statusColor, Input, Select, Table, Td,
  Loading, EmptyState, money, Button
} from '../components/ui/primitives';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded', 'on_hold'];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ page: 1, limit: 20, status: '', search: '', sort: '-createdAt' });
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ordersAPI.getAll(filters);
      setOrders(res.orders || []);
      setTotal(res.pagination?.total || 0);
    } catch {} finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    try {
      await ordersAPI.updateStatus(id, { status });
      toast.success(`Order marked ${status}`);
      setOrders(os => os.map(o => o._id === id ? { ...o, status } : o));
      if (active?._id === id) setActive(a => ({ ...a, status }));
    } catch {}
  };

  const pages = Math.ceil(total / filters.limit) || 1;

  return (
    <Page>
      <PageHeader title="Orders" subtitle={`${total} total`} />

      <Card pad={14} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Input placeholder="Search order #, customer…" defaultValue={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))} style={{ maxWidth: 280 }} />
          <Select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}>
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
      </Card>

      <Card pad={0}>
        {loading ? <Loading /> :
          orders.length === 0 ? <EmptyState icon="🧾" title="No orders yet" subtitle="Orders placed in your store will appear here." /> :
          <Table head={['Order', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date', '']}>
            {orders.map(o => (
              <tr key={o._id}>
                <Td><span style={{ fontFamily: 'monospace', fontSize: 12, color: t.accent, cursor: 'pointer' }} onClick={() => setActive(o)}>{o.orderNumber}</span></Td>
                <Td>{o.customerName || o.customer?.name || '—'}<div style={{ fontSize: 11, color: t.muted2 }}>{o.customerEmail}</div></Td>
                <Td style={{ color: t.muted }}>{o.items?.length || 0}</Td>
                <Td style={{ fontWeight: 600 }}>{money(o.total, o.currency)}</Td>
                <Td><Badge color={statusColor(o.paymentStatus)}>{o.paymentStatus}</Badge></Td>
                <Td>
                  <Select value={o.status} onChange={e => updateStatus(o._id, e.target.value)}
                    style={{ padding: '4px 8px', fontSize: 12, color: `var(--x)`, borderColor: t.line2 }}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </Td>
                <Td style={{ color: t.muted, fontSize: 12 }}>{new Date(o.createdAt).toLocaleDateString()}</Td>
                <Td><Button size="sm" variant="ghost" onClick={() => setActive(o)}>View</Button></Td>
              </tr>
            ))}
          </Table>}
      </Card>

      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <Button size="sm" variant="secondary" disabled={filters.page <= 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>‹ Prev</Button>
          <span style={{ fontSize: 13, color: t.muted, padding: '6px 4px' }}>Page {filters.page} / {pages}</span>
          <Button size="sm" variant="secondary" disabled={filters.page >= pages} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>Next ›</Button>
        </div>
      )}

      {active && <OrderDrawer order={active} onClose={() => setActive(null)} onStatus={updateStatus} />}
    </Page>
  );
}

function OrderDrawer({ order, onClose, onStatus }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 440, maxWidth: '90vw', height: '100%', background: t.panel, borderLeft: `1px solid ${t.line}`, overflowY: 'auto', padding: 22, animation: 'fadeIn .2s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: 'monospace', color: t.accent, fontSize: 14 }}>{order.orderNumber}</div>
            <div style={{ fontSize: 11, color: t.muted2 }}>{new Date(order.createdAt).toLocaleString()}</div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <Badge color={statusColor(order.status)}>{order.status}</Badge>
          <Badge color={statusColor(order.paymentStatus)}>{order.paymentStatus}</Badge>
        </div>

        <Section title="Customer">
          <div style={{ fontSize: 13 }}>{order.customerName || order.customer?.name}</div>
          <div style={{ fontSize: 12, color: t.muted }}>{order.customerEmail}</div>
          {order.customerPhone && <div style={{ fontSize: 12, color: t.muted }}>{order.customerPhone}</div>}
        </Section>

        <Section title="Items">
          {(order.items || []).map((it, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: `1px solid ${t.line}` }}>
              <span>{it.name} <span style={{ color: t.muted2 }}>× {it.quantity}</span></span>
              <span>{money(it.subtotal || it.price * it.quantity)}</span>
            </div>
          ))}
        </Section>

        <Section title="Totals">
          {[['Subtotal', order.subtotal], ['Discount', -order.discount], ['Tax', order.tax], ['Shipping', order.shipping]].map(([l, v]) => (
            (v ? <Row key={l} l={l} v={money(v, order.currency)} /> : null)
          ))}
          <Row l="Total" v={money(order.total, order.currency)} bold />
        </Section>

        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 11, color: t.muted, marginBottom: 6, textTransform: 'uppercase' }}>Update status</div>
          <Select value={order.status} onChange={e => onStatus(order._id, e.target.value)} style={{ width: '100%' }}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
      </div>
    </div>
  );
}

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ fontSize: 11, color: t.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px' }}>{title}</div>
    {children}
  </div>
);
const Row = ({ l, v, bold }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', fontWeight: bold ? 700 : 400, color: bold ? '#fff' : '#ccc' }}>
    <span>{l}</span><span>{v}</span>
  </div>
);

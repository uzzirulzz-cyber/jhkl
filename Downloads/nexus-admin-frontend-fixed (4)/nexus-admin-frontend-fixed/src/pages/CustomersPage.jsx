import React, { useEffect, useState, useCallback } from 'react';
import { customersAPI } from '../services/api';
import {
  t, Page, PageHeader, Card, Input, Table, Td, Loading, EmptyState, money, Button, Badge, statusColor
} from '../components/ui/primitives';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ page: 1, limit: 20, search: '' });
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customersAPI.getAll(filters);
      setCustomers(res.customers || []);
      setTotal(res.pagination?.total || 0);
    } catch {} finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id) => {
    setDetail({ loading: true });
    try { const res = await customersAPI.getOne(id); setDetail({ ...res }); } catch { setDetail(null); }
  };

  return (
    <Page>
      <PageHeader title="Customers" subtitle={`${total} total`} />
      <Card pad={14} style={{ marginBottom: 14 }}>
        <Input placeholder="Search by name or email…" defaultValue={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))} style={{ maxWidth: 300 }} />
      </Card>

      <Card pad={0}>
        {loading ? <Loading /> :
          customers.length === 0 ? <EmptyState icon="👥" title="No customers yet" subtitle="Customers who register or order will show up here." /> :
          <Table head={['Customer', 'Email', 'Joined', 'Status', '']}>
            {customers.map(c => (
              <tr key={c._id}>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#1e3a5f', color: t.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
                      {c.name?.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ color: '#eee' }}>{c.name}</span>
                  </div>
                </Td>
                <Td style={{ color: t.muted }}>{c.email}</Td>
                <Td style={{ color: t.muted, fontSize: 12 }}>{new Date(c.createdAt).toLocaleDateString()}</Td>
                <Td><Badge color={c.isActive ? 'green' : 'muted'}>{c.isActive ? 'active' : 'inactive'}</Badge></Td>
                <Td><Button size="sm" variant="ghost" onClick={() => openDetail(c._id)}>View</Button></Td>
              </tr>
            ))}
          </Table>}
      </Card>

      {detail && (
        <div onClick={() => setDetail(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 420, maxWidth: '90vw', height: '100%', background: t.panel, borderLeft: `1px solid ${t.line}`, overflowY: 'auto', padding: 22 }}>
            {detail.loading ? <Loading /> : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
                  <h3 style={{ margin: 0, fontSize: 16 }}>{detail.customer?.name}</h3>
                  <Button variant="ghost" size="sm" onClick={() => setDetail(null)}>✕</Button>
                </div>
                <div style={{ fontSize: 13, color: t.muted, marginBottom: 4 }}>{detail.customer?.email}</div>
                <div style={{ fontSize: 12, color: t.muted2, marginBottom: 20 }}>Joined {new Date(detail.customer?.createdAt).toLocaleDateString()}</div>
                <div style={{ fontSize: 11, color: t.muted, textTransform: 'uppercase', marginBottom: 10 }}>Recent orders</div>
                {(detail.orders || []).length === 0 ? <div style={{ color: t.muted2, fontSize: 13 }}>No orders yet.</div> :
                  detail.orders.map(o => (
                    <div key={o._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${t.line}`, fontSize: 13 }}>
                      <span style={{ fontFamily: 'monospace', color: t.accent }}>{o.orderNumber}</span>
                      <Badge color={statusColor(o.status)}>{o.status}</Badge>
                      <span>{money(o.total)}</span>
                    </div>
                  ))}
              </>
            )}
          </div>
        </div>
      )}
    </Page>
  );
}

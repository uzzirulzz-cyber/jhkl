import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { inventoryAPI, productsAPI } from '../services/api';
import {
  t, Page, PageHeader, Card, Button, Badge, statusColor, Table, Td, Loading, EmptyState, money, Input
} from '../components/ui/primitives';

export default function InventoryPage() {
  const [alerts, setAlerts] = useState({ lowStock: [], outOfStock: [], counts: {} });
  const [loading, setLoading] = useState(true);
  const [adjust, setAdjust] = useState(null); // { product, type, qty, note }

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await inventoryAPI.alerts(); setAlerts(res); } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submitAdjust = async () => {
    if (!adjust) return;
    try {
      await productsAPI.adjustStock(adjust.product._id, {
        type: adjust.type, quantity: Number(adjust.qty), note: adjust.note
      });
      toast.success('Stock updated');
      setAdjust(null); load();
    } catch {}
  };

  if (loading) return <Loading label="Loading inventory…" />;

  const renderTable = (rows, kind) => (
    <Table head={['Product', 'SKU', 'Stock', kind === 'low' ? 'Alert at' : 'Status', '']}>
      {rows.map(p => (
        <tr key={p._id}>
          <Td>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 6, background: t.panel2, overflow: 'hidden' }}>
                {p.thumbnail && <img src={p.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <span style={{ color: '#eee' }}>{p.name}</span>
            </div>
          </Td>
          <Td style={{ color: t.muted, fontFamily: 'monospace', fontSize: 12 }}>{p.sku}</Td>
          <Td><Badge color={kind === 'low' ? 'yellow' : 'red'}>{p.stock}</Badge></Td>
          <Td>{kind === 'low' ? <span style={{ color: t.muted }}>{p.lowStockAlert}</span> : <Badge color="red">out of stock</Badge>}</Td>
          <Td><Button size="sm" variant="secondary" onClick={() => setAdjust({ product: p, type: 'add', qty: 10, note: '' })}>Restock</Button></Td>
        </tr>
      ))}
    </Table>
  );

  return (
    <Page>
      <PageHeader title="Inventory" subtitle="Stock alerts that need your attention"
        actions={<Button variant="secondary" onClick={load}>↻ Refresh</Button>} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 14, marginBottom: 18 }}>
        <Card pad={16}><div style={{ fontSize: 12, color: t.muted }}>Low stock</div><div style={{ fontSize: 26, fontWeight: 700, color: t.yellow }}>{alerts.counts?.lowStock ?? 0}</div></Card>
        <Card pad={16}><div style={{ fontSize: 12, color: t.muted }}>Out of stock</div><div style={{ fontSize: 26, fontWeight: 700, color: t.red }}>{alerts.counts?.outOfStock ?? 0}</div></Card>
      </div>

      <Card pad={0} style={{ marginBottom: 18 }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${t.line}`, fontSize: 14, fontWeight: 600, color: t.yellow }}>⚠️ Low stock</div>
        {alerts.lowStock?.length ? renderTable(alerts.lowStock, 'low') : <EmptyState icon="✅" title="All good" subtitle="No products are running low." />}
      </Card>

      <Card pad={0}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${t.line}`, fontSize: 14, fontWeight: 600, color: t.red }}>⛔ Out of stock</div>
        {alerts.outOfStock?.length ? renderTable(alerts.outOfStock, 'out') : <EmptyState icon="✅" title="Nothing sold out" subtitle="Every product has stock." />}
      </Card>

      {adjust && (
        <div onClick={() => setAdjust(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 360, background: t.panel, border: `1px solid ${t.line}`, borderRadius: 12, padding: 22 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 15 }}>Adjust stock</h3>
            <div style={{ fontSize: 12, color: t.muted, marginBottom: 16 }}>{adjust.product.name} · current {adjust.product.stock}</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {['add', 'remove', 'adjust'].map(type => (
                <Button key={type} size="sm" variant={adjust.type === type ? 'primary' : 'secondary'} onClick={() => setAdjust(a => ({ ...a, type }))}>
                  {type === 'add' ? 'Add' : type === 'remove' ? 'Remove' : 'Set to'}
                </Button>
              ))}
            </div>
            <Input type="number" value={adjust.qty} onChange={e => setAdjust(a => ({ ...a, qty: e.target.value }))} style={{ marginBottom: 10 }} />
            <Input placeholder="Note (optional)" value={adjust.note} onChange={e => setAdjust(a => ({ ...a, note: e.target.value }))} style={{ marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setAdjust(null)}>Cancel</Button>
              <Button onClick={submitAdjust}>Apply</Button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}

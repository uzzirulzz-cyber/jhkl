import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productsAPI } from '../services/api';
import { useProductsStore } from '../store';
import {
  t, Page, PageHeader, Card, Button, Badge, statusColor, Input, Select,
  Table, Td, Loading, EmptyState, money
} from '../components/ui/primitives';

export default function ProductsPage() {
  const navigate = useNavigate();
  const { products, total, filters, selected, setFilters, toggleSelected, selectAll, clearSelected } = useProductsStore();
  const setStore = useProductsStore.setState;
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productsAPI.getAll(filters);
      setStore({ products: res.products, total: res.pagination?.total || 0 });
    } catch (e) { /* toasts via interceptor */ }
    finally { setLoading(false); }
  }, [filters, setStore]);

  useEffect(() => { load(); }, [load]);

  const del = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try { await productsAPI.delete(id); toast.success('Product deleted'); load(); } catch {}
  };
  const dup = async (id) => {
    try { await productsAPI.duplicate(id); toast.success('Product duplicated'); load(); } catch {}
  };
  const bulk = async (action, data) => {
    if (!selected.length) return;
    if (action === 'delete' && !window.confirm(`Delete ${selected.length} products?`)) return;
    try { await productsAPI.bulk({ action, ids: selected, data }); toast.success('Bulk action applied'); clearSelected(); load(); } catch {}
  };
  const exportCsv = async () => {
    try {
      const blob = await productsAPI.exportCSV();
      const url = URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a'); a.href = url; a.download = 'products.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const pages = Math.ceil(total / filters.limit) || 1;

  return (
    <Page>
      <PageHeader title="Products" subtitle={`${total} total`}
        actions={<>
          <Button variant="secondary" onClick={exportCsv}>Export CSV</Button>
          <Button onClick={() => navigate('/products/new')}>+ New Product</Button>
        </>} />

      <Card pad={14} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Input placeholder="Search by name, SKU, tag…" defaultValue={filters.search}
            onChange={e => setFilters({ search: e.target.value })} style={{ maxWidth: 280 }} />
          <Select value={filters.status} onChange={e => setFilters({ status: e.target.value })}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="hidden">Hidden</option>
            <option value="archived">Archived</option>
          </Select>
          <Select value={filters.sort} onChange={e => setFilters({ sort: e.target.value })}>
            <option value="-createdAt">Newest</option>
            <option value="createdAt">Oldest</option>
            <option value="price">Price ↑</option>
            <option value="-price">Price ↓</option>
            <option value="-salesCount">Best selling</option>
          </Select>
        </div>
      </Card>

      {selected.length > 0 && (
        <Card pad={10} style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, background: t.accentSoft, borderColor: 'rgba(249,115,22,0.3)' }}>
          <span style={{ fontSize: 13, color: t.accent }}>{selected.length} selected</span>
          <Button size="sm" variant="secondary" onClick={() => bulk('status', { status: 'active' })}>Set Active</Button>
          <Button size="sm" variant="secondary" onClick={() => bulk('status', { status: 'draft' })}>Set Draft</Button>
          <Button size="sm" variant="secondary" onClick={() => bulk('feature', { isFeatured: true })}>Feature</Button>
          <Button size="sm" variant="danger" onClick={() => bulk('delete')}>Delete</Button>
          <Button size="sm" variant="ghost" onClick={clearSelected}>Clear</Button>
        </Card>
      )}

      <Card pad={0}>
        {loading ? <Loading /> :
          products.length === 0 ? <EmptyState icon="📦" title="No products found" subtitle="Try adjusting filters or create your first product."
            action={<Button onClick={() => navigate('/products/new')}>+ New Product</Button>} /> :
          <Table head={[
            <input key="c" type="checkbox" checked={selected.length === products.length && products.length > 0}
              onChange={e => e.target.checked ? selectAll() : clearSelected()} />,
            'Product', 'SKU', 'Price', 'Stock', 'Status', 'Flags', '']}>
            {products.map(p => (
              <tr key={p._id} style={{ transition: 'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#141414'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Td><input type="checkbox" checked={selected.includes(p._id)} onChange={() => toggleSelected(p._id)} /></Td>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 7, background: t.panel2, overflow: 'hidden', flexShrink: 0 }}>
                      {p.thumbnail && <img src={p.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <span style={{ color: '#eee', cursor: 'pointer' }} onClick={() => navigate(`/products/${p._id}/edit`)}>{p.name}</span>
                  </div>
                </Td>
                <Td style={{ color: t.muted, fontFamily: 'monospace', fontSize: 12 }}>{p.sku}</Td>
                <Td>
                  {p.salePrice ? <span><s style={{ color: t.muted2 }}>{money(p.price)}</s> <b style={{ color: t.accent }}>{money(p.salePrice)}</b></span> : money(p.price)}
                </Td>
                <Td><Badge color={statusColor(p.stockStatus)}>{p.stock}</Badge></Td>
                <Td><Badge color={statusColor(p.status)}>{p.status}</Badge></Td>
                <Td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {p.isFeatured && <span title="Featured">⭐</span>}
                    {p.isTrending && <span title="Trending">🔥</span>}
                    {p.isBestSeller && <span title="Best seller">🏆</span>}
                    {p.isNewArrival && <span title="New">🆕</span>}
                  </div>
                </Td>
                <Td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/products/${p._id}/edit`)}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => dup(p._id)}>Copy</Button>
                    <Button size="sm" variant="danger" onClick={() => del(p._id, p.name)}>✕</Button>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>}
      </Card>

      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <Button size="sm" variant="secondary" disabled={filters.page <= 1} onClick={() => setStore({ filters: { ...filters, page: filters.page - 1 } })}>‹ Prev</Button>
          <span style={{ fontSize: 13, color: t.muted, padding: '6px 4px' }}>Page {filters.page} / {pages}</span>
          <Button size="sm" variant="secondary" disabled={filters.page >= pages} onClick={() => setStore({ filters: { ...filters, page: filters.page + 1 } })}>Next ›</Button>
        </div>
      )}
    </Page>
  );
}

import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { categoriesAPI } from '../services/api';
import {
  t, Page, PageHeader, Card, Button, Badge, Field, Input, Select, Table, Td, Loading, EmptyState
} from '../components/ui/primitives';

const blank = { name: '', description: '', parent: '', icon: '', isActive: true, isFeatured: false, order: 0 };

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | {} (new) | category (edit)

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await categoriesAPI.getAll(); setCategories(res.categories || []); } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (form) => {
    try {
      const payload = { ...form, parent: form.parent || null, order: Number(form.order) || 0 };
      if (form._id) { await categoriesAPI.update(form._id, payload); toast.success('Category updated'); }
      else { await categoriesAPI.create(payload); toast.success('Category created'); }
      setEditing(null); load();
    } catch {}
  };

  const del = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    try { await categoriesAPI.delete(id); toast.success('Deleted'); load(); } catch {}
  };

  return (
    <Page>
      <PageHeader title="Categories" subtitle={`${categories.length} total`}
        actions={<Button onClick={() => setEditing({ ...blank })}>+ New Category</Button>} />

      <Card pad={0}>
        {loading ? <Loading /> :
          categories.length === 0 ? <EmptyState icon="🗂" title="No categories" subtitle="Organize your catalog by creating categories."
            action={<Button onClick={() => setEditing({ ...blank })}>+ New Category</Button>} /> :
          <Table head={['Name', 'Parent', 'Products', 'Status', '']}>
            {categories.map(c => (
              <tr key={c._id}>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {c.icon && <span>{c.icon}</span>}
                    <span style={{ color: '#eee' }}>{c.name}</span>
                    {c.isFeatured && <span title="Featured">⭐</span>}
                  </div>
                </Td>
                <Td style={{ color: t.muted }}>{c.parent?.name || '—'}</Td>
                <Td style={{ color: t.muted }}>{c.productCount || 0}</Td>
                <Td><Badge color={c.isActive ? 'green' : 'muted'}>{c.isActive ? 'active' : 'hidden'}</Badge></Td>
                <Td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Button size="sm" variant="ghost" onClick={() => setEditing({ ...c, parent: c.parent?._id || '' })}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => del(c._id, c.name)}>✕</Button>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>}
      </Card>

      {editing && <CategoryModal initial={editing} categories={categories} onClose={() => setEditing(null)} onSave={save} />}
    </Page>
  );
}

function CategoryModal({ initial, categories, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 420, background: t.panel, border: `1px solid ${t.line}`, borderRadius: 12, padding: 22, maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 18px', fontSize: 15 }}>{form._id ? 'Edit category' : 'New category'}</h3>
        <Field label="Name *"><Input value={form.name} onChange={set('name')} /></Field>
        <Field label="Icon (emoji)"><Input value={form.icon} onChange={set('icon')} placeholder="🛍" /></Field>
        <Field label="Parent">
          <Select value={form.parent} onChange={set('parent')} style={{ width: '100%' }}>
            <option value="">— Top level —</option>
            {categories.filter(c => c._id !== form._id).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Description">
          <textarea value={form.description} onChange={set('description')} rows={3}
            style={{ background: t.panel2, border: `1px solid ${t.line2}`, borderRadius: 8, padding: '8px 12px', color: t.text, fontSize: 13, width: '100%', resize: 'vertical' }} />
        </Field>
        <Field label="Order"><Input type="number" value={form.order} onChange={set('order')} /></Field>
        <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
          <label style={{ display: 'flex', gap: 6, fontSize: 13, color: t.muted }}><input type="checkbox" checked={!!form.isActive} onChange={set('isActive')} /> Active</label>
          <label style={{ display: 'flex', gap: 6, fontSize: 13, color: t.muted }}><input type="checkbox" checked={!!form.isFeatured} onChange={set('isFeatured')} /> Featured</label>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)} disabled={!form.name}>Save</Button>
        </div>
      </div>
    </div>
  );
}

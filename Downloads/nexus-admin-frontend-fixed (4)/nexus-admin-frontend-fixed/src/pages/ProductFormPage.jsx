import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productsAPI, categoriesAPI, mediaAPI } from '../services/api';
import {
  t, Page, PageHeader, Card, Button, Field, Input, Select, Loading
} from '../components/ui/primitives';

const empty = {
  name: '', sku: '', description: '', price: '', salePrice: '', costPrice: '',
  stock: 0, lowStockAlert: 5, category: '', brand: '', status: 'draft',
  thumbnail: '', tags: '', isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: false
};

export default function ProductFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const cats = await categoriesAPI.getAll();
        setCategories(cats.categories || []);
        if (editing) {
          const res = await productsAPI.getOne(id);
          const p = res.product;
          setForm({
            ...empty, ...p,
            category: p.category?._id || p.category || '',
            tags: (p.tags || []).join(', '),
            salePrice: p.salePrice ?? '', costPrice: p.costPrice ?? ''
          });
        }
      } catch {} finally { setLoading(false); }
    })();
  }, [id, editing]);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [k]: v }));
  };

  const onUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'nexus-admin/products');
      const res = await mediaAPI.upload(fd);
      setForm(f => ({ ...f, thumbnail: res.file.url }));
      toast.success('Image uploaded');
    } catch { toast.error('Upload failed (check Cloudinary keys)'); }
    finally { setUploading(false); }
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price) || 0,
        salePrice: form.salePrice === '' ? null : Number(form.salePrice),
        costPrice: Number(form.costPrice) || 0,
        stock: Number(form.stock) || 0,
        lowStockAlert: Number(form.lowStockAlert) || 0,
        category: form.category || undefined,
        tags: form.tags.split(',').map(s => s.trim()).filter(Boolean)
      };
      if (editing) { await productsAPI.update(id, payload); toast.success('Product updated'); }
      else { await productsAPI.create(payload); toast.success('Product created'); }
      navigate('/products');
    } catch (err) { toast.error(err?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <Loading label="Loading product…" />;

  return (
    <Page>
      <PageHeader title={editing ? 'Edit Product' : 'New Product'}
        subtitle={editing ? form.name : 'Add a product to your catalog'}
        actions={<Button variant="ghost" onClick={() => navigate('/products')}>← Back</Button>} />

      <form onSubmit={save} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <h3 style={{ margin: '0 0 14px', fontSize: 14 }}>Basics</h3>
            <Field label="Name *"><Input value={form.name} onChange={set('name')} required /></Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="SKU" hint="Auto-generated if blank"><Input value={form.sku} onChange={set('sku')} placeholder="Auto" /></Field>
              <Field label="Brand"><Input value={form.brand} onChange={set('brand')} /></Field>
            </div>
            <Field label="Description">
              <textarea value={form.description} onChange={set('description')} rows={5}
                style={{ background: t.panel2, border: `1px solid ${t.line2}`, borderRadius: 8, padding: '8px 12px', color: t.text, fontSize: 13, width: '100%', resize: 'vertical' }} />
            </Field>
            <Field label="Tags" hint="Comma separated"><Input value={form.tags} onChange={set('tags')} placeholder="summer, sale, new" /></Field>
          </Card>

          <Card>
            <h3 style={{ margin: '0 0 14px', fontSize: 14 }}>Pricing & Inventory</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Field label="Price *"><Input type="number" step="0.01" value={form.price} onChange={set('price')} required /></Field>
              <Field label="Sale price"><Input type="number" step="0.01" value={form.salePrice} onChange={set('salePrice')} /></Field>
              <Field label="Cost price"><Input type="number" step="0.01" value={form.costPrice} onChange={set('costPrice')} /></Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Stock"><Input type="number" value={form.stock} onChange={set('stock')} /></Field>
              <Field label="Low stock alert"><Input type="number" value={form.lowStockAlert} onChange={set('lowStockAlert')} /></Field>
            </div>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <h3 style={{ margin: '0 0 14px', fontSize: 14 }}>Status</h3>
            <Field label="Visibility">
              <Select value={form.status} onChange={set('status')} style={{ width: '100%' }}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="hidden">Hidden</option>
                <option value="archived">Archived</option>
              </Select>
            </Field>
            <Field label="Category">
              <Select value={form.category} onChange={set('category')} style={{ width: '100%' }}>
                <option value="">— None —</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </Select>
            </Field>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {[['isFeatured', '⭐ Featured'], ['isTrending', '🔥 Trending'], ['isBestSeller', '🏆 Best seller'], ['isNewArrival', '🆕 New arrival']].map(([k, label]) => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: t.muted, cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!form[k]} onChange={set(k)} /> {label}
                </label>
              ))}
            </div>
          </Card>

          <Card>
            <h3 style={{ margin: '0 0 14px', fontSize: 14 }}>Thumbnail</h3>
            <div style={{ width: '100%', aspectRatio: '1', borderRadius: 10, background: t.panel2, border: `1px dashed ${t.line2}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              {form.thumbnail ? <img src={form.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ color: t.muted2, fontSize: 12 }}>No image</span>}
            </div>
            <label style={{ display: 'block' }}>
              <span style={{ display: 'block', textAlign: 'center', padding: '8px', background: t.panel2, border: `1px solid ${t.line2}`, borderRadius: 8, fontSize: 13, color: t.text, cursor: 'pointer' }}>
                {uploading ? 'Uploading…' : 'Upload image'}
              </span>
              <input type="file" accept="image/*" onChange={onUpload} style={{ display: 'none' }} />
            </label>
            <Input value={form.thumbnail} onChange={set('thumbnail')} placeholder="…or paste image URL" style={{ marginTop: 8 }} />
          </Card>

          <Button type="submit" size="lg" disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
            {saving ? 'Saving…' : (editing ? 'Save Changes' : 'Create Product')}
          </Button>
        </div>
      </form>
    </Page>
  );
}

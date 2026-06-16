import React, { useEffect, useState, useCallback } from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragOverlay
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable, arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { homepageAPI, productsAPI, categoriesAPI } from '../services/api';
import { useHomepageStore } from '../store';
import toast from 'react-hot-toast';

// ─── Section type definitions ─────────────────────────────────────────────────
const SECTION_TYPES = [
  { type: 'hero_slider',         label: 'Hero Slider',        icon: '🎯', desc: 'Full-width banner with slides' },
  { type: 'featured_products',   label: 'Featured Products',  icon: '⭐', desc: 'Hand-picked featured items' },
  { type: 'trending_products',   label: 'Trending Products',  icon: '🔥', desc: 'Popular & trending items' },
  { type: 'best_sellers',        label: 'Best Sellers',       icon: '🏆', desc: 'Top-selling products' },
  { type: 'new_arrivals',        label: 'New Arrivals',       icon: '✨', desc: 'Recently added products' },
  { type: 'categories_grid',     label: 'Categories Grid',    icon: '🗂', desc: 'Browse by category' },
  { type: 'flash_sales',         label: 'Flash Sales',        icon: '⚡', desc: 'Limited-time deals with countdown' },
  { type: 'promo_banners',       label: 'Promo Banners',      icon: '📢', desc: 'Promotional campaign banners' },
  { type: 'reviews',             label: 'Customer Reviews',   icon: '💬', desc: 'Social proof testimonials' },
  { type: 'brand_showcase',      label: 'Brand Showcase',     icon: '🏷', desc: 'Partner & brand logos' },
  { type: 'newsletter',          label: 'Newsletter',         icon: '📧', desc: 'Email signup section' },
  { type: 'footer_blocks',       label: 'Footer Blocks',      icon: '🔗', desc: 'Footer links & info' },
];

const LAYOUTS = ['grid','masonry','carousel','slider','card','full_width','multi_column'];

// ─── Sortable Section Card ────────────────────────────────────────────────────
function SortableSectionCard({ section, onEdit, onDelete, onDuplicate, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const def = SECTION_TYPES.find(t => t.type === section.type) || { icon: '📄', label: section.type };

  return (
    <div ref={setNodeRef} style={{
      transform: CSS.Transform.toString(transform), transition,
      opacity: isDragging ? 0.4 : 1,
      background: '#161616', border: `1px solid ${section.isEnabled ? '#2a2a2a' : '#1e1e1e'}`,
      borderRadius: 10, marginBottom: 8, overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
        {/* Drag handle */}
        <div {...attributes} {...listeners} style={{ cursor: 'grab', color: '#444', fontSize: 16, flexShrink: 0 }}>⠿</div>

        {/* Icon + info */}
        <div style={{ fontSize: 20, flexShrink: 0 }}>{def.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: section.isEnabled ? '#e0e0e0' : '#555' }}>
            {section.title || def.label}
          </div>
          <div style={{ fontSize: 11, color: '#444', display: 'flex', gap: 8, marginTop: 2 }}>
            <span style={{ background: '#1e1e1e', padding: '1px 6px', borderRadius: 4, border: '1px solid #2a2a2a' }}>{def.label}</span>
            <span style={{ background: '#1e1e1e', padding: '1px 6px', borderRadius: 4, border: '1px solid #2a2a2a' }}>{section.layout?.type || 'grid'}</span>
            {section.slides?.length > 0 && <span style={{ background: '#1e1e1e', padding: '1px 6px', borderRadius: 4 }}>{section.slides.length} slides</span>}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6 }}>
          <ActionBtn icon="✏️" title="Edit section"      onClick={() => onEdit(section)} />
          <ActionBtn icon="⧉"  title="Duplicate"         onClick={() => onDuplicate(section.id)} />
          <ActionBtn
            icon={section.isEnabled ? '👁' : '👁‍🗨'}
            title={section.isEnabled ? 'Disable' : 'Enable'}
            onClick={() => onToggle(section.id)}
            color={section.isEnabled ? '#22c55e' : '#555'}
          />
          <ActionBtn icon="🗑" title="Delete section"    onClick={() => onDelete(section.id)} danger />
        </div>
      </div>

      {/* Enabled indicator */}
      <div style={{ height: 2, background: section.isEnabled ? '#f97316' : '#222' }} />
    </div>
  );
}

function ActionBtn({ icon, title, onClick, danger, color }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      title={title} onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? (danger ? 'rgba(239,68,68,0.1)' : '#1e1e1e') : 'transparent',
        border: '1px solid ' + (hov ? (danger ? '#ef4444' : '#333') : 'transparent'),
        borderRadius: 6, width: 30, height: 30, cursor: 'pointer', fontSize: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: color || (danger && hov ? '#ef4444' : '#666'),
        transition: 'all 0.15s'
      }}
    >{icon}</button>
  );
}

// ─── Section Editor Panel ─────────────────────────────────────────────────────
function SectionEditor({ section, onSave, onClose }) {
  const [form, setForm] = useState({ ...section });
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    productsAPI.getAll({ limit: 100, status: 'active' }).then(r => setProducts(r.products || [])).catch(() => {});
  }, []);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const updateNested = (parent, key, val) => setForm(f => ({ ...f, [parent]: { ...(f[parent] || {}), [key]: val } }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(section.id, form);
      toast.success('Section saved');
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'flex-end'
    }}>
      <div style={{
        width: 480, height: '100vh', background: '#111', borderLeft: '1px solid #222',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#e0e0e0' }}>Edit Section</div>
            <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{SECTION_TYPES.find(t=>t.type===section.type)?.label}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <Field label="Section Title">
            <Input value={form.title || ''} onChange={e => update('title', e.target.value)} placeholder="e.g. Featured Products" />
          </Field>
          <Field label="Subtitle">
            <Input value={form.subtitle || ''} onChange={e => update('subtitle', e.target.value)} placeholder="Supporting text" />
          </Field>

          {/* Layout */}
          <Field label="Layout Type">
            <Select value={form.layout?.type || 'grid'} onChange={e => updateNested('layout', 'type', e.target.value)}>
              {LAYOUTS.map(l => <option key={l} value={l}>{l.replace('_', ' ')}</option>)}
            </Select>
          </Field>
          {['grid','masonry','multi_column'].includes(form.layout?.type) && (
            <Field label="Columns">
              <Select value={form.layout?.columns || 4} onChange={e => updateNested('layout', 'columns', Number(e.target.value))}>
                {[2,3,4,5,6].map(n => <option key={n} value={n}>{n} columns</option>)}
              </Select>
            </Field>
          )}

          {/* Background */}
          <Field label="Background Type">
            <Select value={form.background?.type || 'color'} onChange={e => updateNested('background', 'type', e.target.value)}>
              <option value="color">Solid Color</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="gradient">Gradient</option>
            </Select>
          </Field>
          <Field label="Background Value">
            <Input value={form.background?.value || ''} onChange={e => updateNested('background', 'value', e.target.value)}
              placeholder={form.background?.type === 'color' ? '#1a1a1a' : 'URL or CSS value'} />
          </Field>

          {/* Animation */}
          <Field label="Animation">
            <Select value={form.animation?.type || 'none'} onChange={e => updateNested('animation', 'type', e.target.value)}>
              {['none','fade','slide','zoom','bounce'].map(a => <option key={a} value={a}>{a}</option>)}
            </Select>
          </Field>

          {/* Product selection for product sections */}
          {['featured_products','trending_products','best_sellers','new_arrivals','flash_sales'].includes(section.type) && (
            <Field label="Select Products (hold Ctrl/Cmd)">
              <select multiple value={(form.products || []).map(p => p._id || p)} onChange={e => update('products', Array.from(e.target.selectedOptions, o => o.value))}
                style={{ width: '100%', height: 160, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#e0e0e0', padding: 8, fontSize: 12 }}>
                {products.map(p => <option key={p._id} value={p._id}>{p.name} — ${p.price}</option>)}
              </select>
            </Field>
          )}

          {/* Hero slides */}
          {section.type === 'hero_slider' && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Slides ({(form.slides || []).length})</span>
                <button onClick={() => update('slides', [...(form.slides||[]), { title: 'New Slide', subtitle: '', image: '', isEnabled: true }])}
                  style={{ background: '#1e3a5f', border: 'none', borderRadius: 6, padding: '4px 10px', color: '#3b82f6', fontSize: 11, cursor: 'pointer' }}>+ Add Slide</button>
              </div>
              {(form.slides || []).map((slide, i) => (
                <div key={i} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: '#555' }}>Slide {i + 1}</span>
                    <button onClick={() => update('slides', form.slides.filter((_,j) => j !== i))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>Remove</button>
                  </div>
                  <Input value={slide.title||''} placeholder="Slide title" onChange={e => { const s=[...form.slides]; s[i]={...s[i],title:e.target.value}; update('slides',s); }} style={{ marginBottom: 6 }} />
                  <Input value={slide.subtitle||''} placeholder="Slide subtitle" onChange={e => { const s=[...form.slides]; s[i]={...s[i],subtitle:e.target.value}; update('slides',s); }} style={{ marginBottom: 6 }} />
                  <Input value={slide.image||''} placeholder="Image URL" onChange={e => { const s=[...form.slides]; s[i]={...s[i],image:e.target.value}; update('slides',s); }} />
                </div>
              ))}
            </div>
          )}

          {/* Custom CSS */}
          <Field label="Custom CSS">
            <textarea value={form.customCss||''} onChange={e => update('customCss', e.target.value)}
              placeholder=".section { padding: 60px 0; }" rows={4}
              style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#e0e0e0', padding: 10, fontSize: 12, fontFamily: 'monospace', resize: 'vertical' }} />
          </Field>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #222', display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, background: 'transparent', border: '1px solid #333', borderRadius: 8, padding: '9px', color: '#888', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, background: '#f97316', border: 'none', borderRadius: 8, padding: '9px', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500 }}>
            {saving ? 'Saving…' : 'Save Section'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tiny shared form components ──────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: 'block', fontSize: 11, color: '#666', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</label>
    {children}
  </div>
);
const Input = ({ style, ...props }) => (
  <input {...props} style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 12px', color: '#e0e0e0', fontSize: 13, outline: 'none', ...style }} />
);
const Select = ({ children, ...props }) => (
  <select {...props} style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 12px', color: '#e0e0e0', fontSize: 13, outline: 'none' }}>
    {children}
  </select>
);

// ─── Add Section Modal ────────────────────────────────────────────────────────
function AddSectionModal({ onAdd, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, width: 640, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#e0e0e0' }}>Add Section</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>
        <div style={{ padding: 20, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {SECTION_TYPES.map(type => (
            <button key={type.type} onClick={() => { onAdd(type.type); onClose(); }} style={{
              background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '14px 16px',
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s'
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.background = 'rgba(249,115,22,0.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.background = '#1a1a1a'; }}
            >
              <div style={{ fontSize: 22, marginBottom: 6 }}>{type.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#e0e0e0', marginBottom: 3 }}>{type.label}</div>
              <div style={{ fontSize: 11, color: '#555' }}>{type.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Homepage Builder Page ───────────────────────────────────────────────
export default function HomepageBuilder() {
  const { homepage, sections, setSections, setHomepage, isDirty, markClean } = useHomepageStore();
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    homepageAPI.get().then(res => { setHomepage(res.homepage); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIdx = sections.findIndex(s => s.id === active.id);
    const newIdx = sections.findIndex(s => s.id === over.id);
    const reordered = arrayMove(sections, oldIdx, newIdx).map((s, i) => ({ ...s, order: i }));
    setSections(reordered);
    try {
      await homepageAPI.reorderSections({ orderedIds: reordered.map(s => s.id) });
      toast.success('Sections reordered');
    } catch { toast.error('Reorder failed'); }
  };

  const handleAddSection = async (type) => {
    const def = SECTION_TYPES.find(t => t.type === type);
    try {
      const res = await homepageAPI.addSection({
        type, title: def.label, isEnabled: true,
        layout: { type: 'grid', columns: 4 },
        background: { type: 'color', value: '#0a0a0a' },
        animation: { type: 'none' }
      });
      setSections([...sections, res.section]);
      toast.success(`${def.label} section added`);
    } catch {}
  };

  const handleUpdateSection = async (id, data) => {
    const res = await homepageAPI.updateSection(id, data);
    setSections(sections.map(s => s.id === id ? res.section : s));
  };

  const handleDeleteSection = async (id) => {
    if (!window.confirm('Delete this section?')) return;
    await homepageAPI.deleteSection(id);
    setSections(sections.filter(s => s.id !== id));
    toast.success('Section deleted');
  };

  const handleDuplicateSection = async (id) => {
    const res = await homepageAPI.duplicateSection(id);
    setSections([...sections, res.section]);
    toast.success('Section duplicated');
  };

  const handleToggleSection = async (id) => {
    await homepageAPI.toggleSection(id);
    setSections(sections.map(s => s.id === id ? { ...s, isEnabled: !s.isEnabled } : s));
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await homepageAPI.publish();
      markClean();
      toast.success('🎉 Homepage published!');
    } catch {} finally { setPublishing(false); }
  };

  const handleSaveDraft = async () => {
    await homepageAPI.saveDraft({ sections });
    toast.success('Draft saved');
  };

  const sorted = [...sections].sort((a, b) => a.order - b.order);

  if (loading) return <div style={{ padding: 40, color: '#555', textAlign: 'center' }}>Loading homepage builder…</div>;

  return (
    <div style={{ display: 'flex', height: '100%', background: '#0a0a0a' }}>
      {/* Builder panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e1e1e' }}>
        {/* Builder header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', gap: 12, background: '#0f0f0f' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#e0e0e0' }}>Homepage Builder</div>
            <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>
              {sections.length} sections · {sections.filter(s=>s.isEnabled).length} enabled
              {isDirty && <span style={{ color: '#f97316', marginLeft: 8 }}>● Unsaved changes</span>}
            </div>
          </div>
          <button onClick={handleSaveDraft} style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 8, padding: '7px 14px', color: '#888', fontSize: 12, cursor: 'pointer' }}>Save Draft</button>
          <button onClick={handlePublish} disabled={publishing} style={{
            background: publishing ? '#7c3910' : '#f97316', border: 'none', borderRadius: 8,
            padding: '7px 16px', color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer'
          }}>
            {publishing ? 'Publishing…' : homepage?.isPublished ? '✓ Republish' : 'Publish'}
          </button>
        </div>

        {/* Sections list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {sorted.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#444', padding: '60px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
              <div style={{ fontSize: 16, color: '#666', marginBottom: 8 }}>No sections yet</div>
              <div style={{ fontSize: 12, color: '#444', marginBottom: 24 }}>Add your first section to start building the homepage</div>
              <button onClick={() => setShowAddModal(true)} style={{
                background: '#f97316', border: 'none', borderRadius: 8, padding: '10px 20px',
                color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer'
              }}>+ Add First Section</button>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={e => setActiveId(e.active.id)} onDragEnd={handleDragEnd}>
              <SortableContext items={sorted.map(s => s.id)} strategy={verticalListSortingStrategy}>
                {sorted.map(section => (
                  <SortableSectionCard
                    key={section.id}
                    section={section}
                    onEdit={setEditingSection}
                    onDelete={handleDeleteSection}
                    onDuplicate={handleDuplicateSection}
                    onToggle={handleToggleSection}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}

          {sorted.length > 0 && (
            <button onClick={() => setShowAddModal(true)} style={{
              width: '100%', background: 'transparent', border: '1px dashed #2a2a2a', borderRadius: 10,
              padding: '14px', color: '#555', cursor: 'pointer', fontSize: 13, marginTop: 8, transition: 'all 0.15s'
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.color = '#f97316'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#555'; }}
            >+ Add Section</button>
          )}
        </div>
      </div>

      {/* Section palette sidebar */}
      <div style={{ width: 200, background: '#0d0d0d', borderLeft: '1px solid #1a1a1a', padding: '16px 12px', overflowY: 'auto' }}>
        <div style={{ fontSize: 10, color: '#444', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 12 }}>Section Types</div>
        {SECTION_TYPES.map(type => (
          <button key={type.type} onClick={() => handleAddSection(type.type)} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            background: 'transparent', border: '1px solid transparent', borderRadius: 8,
            padding: '7px 8px', cursor: 'pointer', textAlign: 'left', marginBottom: 4, transition: 'all 0.15s'
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.borderColor = '#2a2a2a'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
          >
            <span style={{ fontSize: 14 }}>{type.icon}</span>
            <span style={{ fontSize: 11, color: '#888' }}>{type.label}</span>
          </button>
        ))}
      </div>

      {/* Section editor panel */}
      {editingSection && (
        <SectionEditor
          section={editingSection}
          onSave={handleUpdateSection}
          onClose={() => setEditingSection(null)}
        />
      )}

      {/* Add section modal */}
      {showAddModal && (
        <AddSectionModal
          onAdd={handleAddSection}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

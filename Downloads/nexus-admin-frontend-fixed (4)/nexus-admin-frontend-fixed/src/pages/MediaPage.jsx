import React, { useEffect, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { mediaAPI } from '../services/api';
import { t, Page, PageHeader, Card, Button, Loading, EmptyState } from '../components/ui/primitives';

export default function MediaPage() {
  const [resources, setResources] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async (next) => {
    setLoading(true);
    try {
      const res = await mediaAPI.library({ folder: 'nexus-admin', type: 'image', next_cursor: next });
      setResources(r => next ? [...r, ...(res.resources || [])] : (res.resources || []));
      setCursor(res.next_cursor || null);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onDrop = useCallback(async (files) => {
    if (!files.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('files', f));
      fd.append('folder', 'nexus-admin');
      await mediaAPI.uploadMultiple(fd);
      toast.success(`${files.length} file(s) uploaded`);
      load();
    } catch { toast.error('Upload failed (check Cloudinary keys)'); }
    finally { setUploading(false); }
  }, [load]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] } });

  const del = async (publicId) => {
    if (!window.confirm('Delete this file?')) return;
    try { await mediaAPI.delete(publicId); setResources(r => r.filter(x => x.public_id !== publicId)); toast.success('Deleted'); } catch {}
  };

  return (
    <Page>
      <PageHeader title="Media Library" subtitle="Images hosted on Cloudinary" />

      <div {...getRootProps()} style={{
        border: `2px dashed ${isDragActive ? t.accent : t.line2}`, borderRadius: 12, padding: 30,
        textAlign: 'center', marginBottom: 18, cursor: 'pointer', background: isDragActive ? t.accentSoft : t.panel, transition: 'all .15s'
      }}>
        <input {...getInputProps()} />
        <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.5 }}>🖼</div>
        <div style={{ fontSize: 14, color: '#ddd' }}>{uploading ? 'Uploading…' : isDragActive ? 'Drop to upload' : 'Drag & drop images here, or click to browse'}</div>
        <div style={{ fontSize: 12, color: t.muted2, marginTop: 4 }}>JPG, PNG, WebP, GIF · up to 50MB each</div>
      </div>

      {loading && resources.length === 0 ? <Loading /> :
        resources.length === 0 ? <EmptyState icon="🖼" title="No media yet" subtitle="Upload images to build your library." /> :
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
            {resources.map(r => (
              <Card key={r.public_id} pad={0} style={{ overflow: 'hidden', position: 'relative' }}>
                <div style={{ aspectRatio: '1', background: t.panel2 }}>
                  <img src={r.secure_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: t.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(r.bytes / 1024).toFixed(0)} KB</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button title="Copy URL" onClick={() => { navigator.clipboard.writeText(r.secure_url); toast.success('URL copied'); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.muted, fontSize: 13 }}>⧉</button>
                    <button title="Delete" onClick={() => del(r.public_id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.red, fontSize: 13 }}>✕</button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {cursor && <div style={{ textAlign: 'center', marginTop: 18 }}><Button variant="secondary" onClick={() => load(cursor)}>Load more</Button></div>}
        </>}
    </Page>
  );
}

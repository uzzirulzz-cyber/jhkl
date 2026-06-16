import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { settingsAPI, authAPI } from '../services/api';
import { useAuthStore } from '../store';
import { t, Page, PageHeader, Card, Button, Field, Input, Loading } from '../components/ui/primitives';

const TABS = ['Store', 'Account', 'Security'];

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState('Store');
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  useEffect(() => {
    (async () => {
      try { const res = await settingsAPI.get(); setSettings(res.settings || {}); } catch {} finally { setLoading(false); }
    })();
  }, []);

  const set = (k) => (e) => setSettings(s => ({ ...s, [k]: e.target.value }));

  const saveStore = async () => {
    setSaving(true);
    try {
      await settingsAPI.update({
        storeName: settings.storeName || '',
        supportEmail: settings.supportEmail || '',
        currency: settings.currency || 'USD',
        defaultTaxRate: Number(settings.defaultTaxRate) || 0,
        shippingFlatRate: Number(settings.shippingFlatRate) || 0
      });
      toast.success('Settings saved');
    } catch {} finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (pw.newPassword !== pw.confirm) return toast.error('Passwords do not match');
    if (pw.newPassword.length < 8) return toast.error('Password must be at least 8 characters');
    try {
      await authAPI.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      toast.success('Password changed');
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
    } catch {}
  };

  if (loading) return <Loading label="Loading settings…" />;

  return (
    <Page>
      <PageHeader title="Settings" subtitle="Manage your store and account" />

      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
        {TABS.map(x => (
          <Button key={x} size="sm" variant={tab === x ? 'primary' : 'secondary'} onClick={() => setTab(x)}>{x}</Button>
        ))}
      </div>

      {tab === 'Store' && (
        <Card style={{ maxWidth: 560 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14 }}>Store configuration</h3>
          <Field label="Store name"><Input value={settings.storeName || ''} onChange={set('storeName')} placeholder="NexusAdmin Store" /></Field>
          <Field label="Support email"><Input type="email" value={settings.supportEmail || ''} onChange={set('supportEmail')} placeholder="support@store.com" /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Field label="Currency"><Input value={settings.currency || 'USD'} onChange={set('currency')} /></Field>
            <Field label="Tax rate %"><Input type="number" step="0.01" value={settings.defaultTaxRate ?? ''} onChange={set('defaultTaxRate')} /></Field>
            <Field label="Flat shipping"><Input type="number" step="0.01" value={settings.shippingFlatRate ?? ''} onChange={set('shippingFlatRate')} /></Field>
          </div>
          <Button onClick={saveStore} disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</Button>
        </Card>
      )}

      {tab === 'Account' && (
        <Card style={{ maxWidth: 560 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14 }}>Your profile</h3>
          <Field label="Name"><Input value={user?.name || ''} disabled /></Field>
          <Field label="Email"><Input value={user?.email || ''} disabled /></Field>
          <Field label="Role"><Input value={(user?.role || '').replace('_', ' ')} disabled /></Field>
          <p style={{ fontSize: 12, color: t.muted2 }}>Profile edits are managed by your administrator.</p>
        </Card>
      )}

      {tab === 'Security' && (
        <Card style={{ maxWidth: 480 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14 }}>Change password</h3>
          <Field label="Current password"><Input type="password" value={pw.currentPassword} onChange={e => setPw(p => ({ ...p, currentPassword: e.target.value }))} /></Field>
          <Field label="New password" hint="At least 8 characters"><Input type="password" value={pw.newPassword} onChange={e => setPw(p => ({ ...p, newPassword: e.target.value }))} /></Field>
          <Field label="Confirm new password"><Input type="password" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} /></Field>
          <Button onClick={changePassword} disabled={!pw.currentPassword || !pw.newPassword}>Update password</Button>
        </Card>
      )}
    </Page>
  );
}

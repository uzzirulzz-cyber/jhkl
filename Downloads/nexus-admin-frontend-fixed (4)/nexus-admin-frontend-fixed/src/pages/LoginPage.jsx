import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store';
import { authAPI } from '../services/api';
import { t, Button, Input } from '../components/ui/primitives';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, isAuthenticated } = useAuthStore();
  const [mode, setMode] = useState('login'); // 'login' | 'setup'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);

  React.useEffect(() => { if (isAuthenticated) navigate('/overview', { replace: true }); }, [isAuthenticated, navigate]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (mode === 'login') {
      const ok = await login(form.email, form.password);
      if (ok) navigate('/overview', { replace: true });
      return;
    }
    // setup
    setBusy(true);
    try {
      const res = await authAPI.setup(form);
      localStorage.setItem('nexus_token', res.token);
      useAuthStore.setState({ user: res.user, token: res.token, isAuthenticated: true });
      toast.success('Admin account created');
      navigate('/overview', { replace: true });
    } catch (err) {
      toast.error(err?.message || 'Setup failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.bg, padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380, animation: 'fadeIn .25s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 28 }}>
          <div style={{ width: 40, height: 40, background: t.accent, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, color: '#fff' }}>N</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#f5f5f5' }}>NexusAdmin</div>
            <div style={{ fontSize: 11, color: t.muted2 }}>Enterprise Commerce</div>
          </div>
        </div>

        <form onSubmit={submit} style={{ background: t.panel, border: `1px solid ${t.line}`, borderRadius: 14, padding: 26 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 16, color: '#eee' }}>
            {mode === 'login' ? 'Sign in to your dashboard' : 'Create the first admin'}
          </h2>
          <p style={{ margin: '0 0 20px', fontSize: 12, color: t.muted }}>
            {mode === 'login' ? 'Use your team credentials.' : 'Run this once to bootstrap the platform.'}
          </p>

          {mode === 'setup' && (
            <div style={{ marginBottom: 12 }}>
              <Input placeholder="Full name" value={form.name} onChange={set('name')} required />
            </div>
          )}
          <div style={{ marginBottom: 12 }}>
            <Input type="email" placeholder="Email" value={form.email} onChange={set('email')} required />
          </div>
          <div style={{ marginBottom: 18 }}>
            <Input type="password" placeholder="Password" value={form.password} onChange={set('password')} required minLength={mode === 'setup' ? 8 : undefined} />
          </div>

          <Button type="submit" size="lg" style={{ width: '100%', justifyContent: 'center' }} disabled={isLoading || busy}>
            {(isLoading || busy) ? 'Please wait…' : (mode === 'login' ? 'Sign In' : 'Create Admin')}
          </Button>

          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: t.muted }}>
            {mode === 'login'
              ? <>First time here? <a onClick={() => setMode('setup')} style={{ color: t.accent, cursor: 'pointer' }}>Set up admin</a></>
              : <>Already have an account? <a onClick={() => setMode('login')} style={{ color: t.accent, cursor: 'pointer' }}>Sign in</a></>}
          </div>
        </form>
        <p style={{ textAlign: 'center', fontSize: 11, color: t.muted2, marginTop: 16 }}>
          Default seed login: admin@nexusadmin.com / Admin@123456
        </p>
      </div>
    </div>
  );
}

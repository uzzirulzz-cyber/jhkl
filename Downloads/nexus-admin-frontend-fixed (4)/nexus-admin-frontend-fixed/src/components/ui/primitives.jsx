import React from 'react';

// ─── Design tokens (mirror index.css / DashboardLayout) ──────────────────────
export const t = {
  bg: '#0a0a0a', panel: '#111', panel2: '#161616', line: '#222', line2: '#2a2a2a',
  text: '#e8e8e8', muted: '#777', muted2: '#555', accent: '#f97316',
  accentSoft: 'rgba(249,115,22,0.08)', blue: '#3b82f6', green: '#22c55e',
  red: '#ef4444', yellow: '#eab308'
};

// ─── Page container ──────────────────────────────────────────────────────────
export const Page = ({ children, style }) => (
  <div style={{ padding: 24, animation: 'fadeIn .2s ease', ...style }}>{children}</div>
);

// ─── Page header ─────────────────────────────────────────────────────────────
export const PageHeader = ({ title, subtitle, actions }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
    <div>
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#f5f5f5' }}>{title}</h1>
      {subtitle && <p style={{ margin: '4px 0 0', fontSize: 13, color: t.muted }}>{subtitle}</p>}
    </div>
    {actions && <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{actions}</div>}
  </div>
);

// ─── Card ────────────────────────────────────────────────────────────────────
export const Card = ({ children, style, pad = 18 }) => (
  <div style={{ background: t.panel, border: `1px solid ${t.line}`, borderRadius: 12, padding: pad, ...style }}>
    {children}
  </div>
);

// ─── Button ──────────────────────────────────────────────────────────────────
export const Button = ({ children, variant = 'primary', size = 'md', style, ...rest }) => {
  const variants = {
    primary:   { background: t.accent, color: '#fff', border: 'none' },
    secondary: { background: t.panel2, color: t.text, border: `1px solid ${t.line2}` },
    ghost:     { background: 'transparent', color: t.muted, border: `1px solid ${t.line}` },
    danger:    { background: 'rgba(239,68,68,0.12)', color: t.red, border: '1px solid rgba(239,68,68,0.3)' }
  };
  const sizes = { sm: '5px 10px', md: '8px 14px', lg: '10px 18px' };
  return (
    <button {...rest} style={{
      ...variants[variant], padding: sizes[size], borderRadius: 8, fontSize: 13, fontWeight: 500,
      cursor: rest.disabled ? 'not-allowed' : 'pointer', opacity: rest.disabled ? 0.5 : 1,
      transition: 'filter .15s', whiteSpace: 'nowrap', ...style
    }}
      onMouseEnter={e => { if (!rest.disabled) e.currentTarget.style.filter = 'brightness(1.15)'; }}
      onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}>
      {children}
    </button>
  );
};

// ─── Badge ───────────────────────────────────────────────────────────────────
const badgeColors = {
  green: t.green, red: t.red, yellow: t.yellow, blue: t.blue, accent: t.accent, muted: t.muted
};
export const Badge = ({ children, color = 'muted', style }) => {
  const c = badgeColors[color] || t.muted;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600,
      padding: '2px 9px', borderRadius: 20, color: c, background: `${c}1a`,
      border: `1px solid ${c}33`, textTransform: 'capitalize', ...style
    }}>{children}</span>
  );
};

// Map a status string to a badge colour
export const statusColor = (s) => ({
  active: 'green', delivered: 'green', completed: 'green', paid: 'green', in_stock: 'green',
  draft: 'muted', pending: 'yellow', processing: 'blue', shipped: 'blue', unpaid: 'yellow',
  partially_paid: 'yellow', low_stock: 'yellow', on_hold: 'yellow',
  hidden: 'muted', archived: 'muted',
  cancelled: 'red', refunded: 'red', failed: 'red', out_of_stock: 'red'
}[s] || 'muted');

// ─── Inputs ──────────────────────────────────────────────────────────────────
export const Input = ({ style, ...rest }) => (
  <input {...rest} style={{
    background: t.panel2, border: `1px solid ${t.line2}`, borderRadius: 8, padding: '8px 12px',
    color: t.text, fontSize: 13, width: '100%', ...style
  }} />
);

export const Select = ({ children, style, ...rest }) => (
  <select {...rest} style={{
    background: t.panel2, border: `1px solid ${t.line2}`, borderRadius: 8, padding: '8px 12px',
    color: t.text, fontSize: 13, cursor: 'pointer', ...style
  }}>{children}</select>
);

export const Field = ({ label, children, hint }) => (
  <label style={{ display: 'block', marginBottom: 14 }}>
    <span style={{ display: 'block', fontSize: 12, color: t.muted, marginBottom: 6, fontWeight: 500 }}>{label}</span>
    {children}
    {hint && <span style={{ display: 'block', fontSize: 11, color: t.muted2, marginTop: 4 }}>{hint}</span>}
  </label>
);

// ─── Spinner / states ────────────────────────────────────────────────────────
export const Spinner = ({ size = 22 }) => (
  <div style={{
    width: size, height: size, border: `2px solid ${t.line2}`, borderTopColor: t.accent,
    borderRadius: '50%', animation: 'spin .7s linear infinite'
  }} />
);

export const Loading = ({ label = 'Loading…' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12, color: t.muted }}>
    <Spinner /><span style={{ fontSize: 13 }}>{label}</span>
  </div>
);

export const EmptyState = ({ icon = '∅', title, subtitle, action }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 20px', gap: 8, textAlign: 'center' }}>
    <div style={{ fontSize: 34, opacity: 0.4 }}>{icon}</div>
    <div style={{ fontSize: 15, fontWeight: 600, color: '#ddd' }}>{title}</div>
    {subtitle && <div style={{ fontSize: 13, color: t.muted, maxWidth: 360 }}>{subtitle}</div>}
    {action && <div style={{ marginTop: 8 }}>{action}</div>}
  </div>
);

// ─── Table helpers ───────────────────────────────────────────────────────────
export const Table = ({ head, children }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ textAlign: 'left', color: t.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.5px' }}>
          {head.map((h, i) => <th key={i} style={{ padding: '10px 12px', borderBottom: `1px solid ${t.line}`, fontWeight: 600 }}>{h}</th>)}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

export const Td = ({ children, style }) => (
  <td style={{ padding: '12px', borderBottom: `1px solid ${t.line}`, color: '#cfcfcf', verticalAlign: 'middle', ...style }}>{children}</td>
);

// Currency helper
export const money = (n, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(n || 0));

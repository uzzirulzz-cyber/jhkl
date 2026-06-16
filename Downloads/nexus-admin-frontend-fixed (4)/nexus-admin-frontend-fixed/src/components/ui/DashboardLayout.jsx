import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useUIStore } from '../../store';

const navItems = [
  { group: 'Main', items: [
    { id: 'overview',   path: '/overview',   icon: '⬡', label: 'Overview' },
    { id: 'products',   path: '/products',   icon: '📦', label: 'Products' },
    { id: 'inventory',  path: '/inventory',  icon: '🏭', label: 'Inventory' },
    { id: 'orders',     path: '/orders',     icon: '🧾', label: 'Orders', badge: 'orders' }
  ]},
  { group: 'Commerce', items: [
    { id: 'customers',  path: '/customers',  icon: '👥', label: 'Customers' },
    { id: 'analytics',  path: '/analytics',  icon: '📊', label: 'Analytics' },
    { id: 'categories', path: '/categories', icon: '🗂', label: 'Categories' }
  ]},
  { group: 'Content', items: [
    { id: 'homepage',   path: '/homepage',   icon: '🏠', label: 'Homepage Builder' },
    { id: 'media',      path: '/media',      icon: '🖼', label: 'Media Library' }
  ]},
  { group: 'System', items: [
    { id: 'settings',   path: '/settings',   icon: '⚙️', label: 'Settings' }
  ]}
];

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar, unreadCount } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  const activeId = navItems.flatMap(g => g.items).find(i => location.pathname.startsWith(i.path))?.id;

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0a0a0a', color: '#e8e8e8', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 220 : 64, minWidth: sidebarOpen ? 220 : 64,
        background: '#111', borderRight: '1px solid #222',
        display: 'flex', flexDirection: 'column', transition: 'width 0.2s ease', overflow: 'hidden'
      }}>
        {/* Logo */}
        <div style={{ padding: '18px 14px 14px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: '#f97316', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>N</div>
          {sidebarOpen && <div><div style={{ fontSize: 14, fontWeight: 500, color: '#f0f0f0' }}>NexusAdmin</div><div style={{ fontSize: 10, color: '#555' }}>Enterprise</div></div>}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {navItems.map(group => (
            <div key={group.group} style={{ marginBottom: 4 }}>
              {sidebarOpen && <div style={{ fontSize: 10, color: '#444', letterSpacing: '1.2px', textTransform: 'uppercase', padding: '10px 14px 4px' }}>{group.group}</div>}
              {group.items.map(item => {
                const isActive = activeId === item.id;
                return (
                  <button key={item.id} onClick={() => navigate(item.path)} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: sidebarOpen ? '8px 12px' : '10px', margin: '1px 6px', width: 'calc(100% - 12px)',
                    borderRadius: 7, border: isActive ? '1px solid #2a2a2a' : '1px solid transparent',
                    background: isActive ? 'rgba(249,115,22,0.08)' : 'transparent',
                    color: isActive ? '#f97316' : '#777', cursor: 'pointer', fontSize: 13,
                    transition: 'all 0.15s', textAlign: 'left', justifyContent: sidebarOpen ? 'flex-start' : 'center'
                  }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = '#ccc'; }}}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#777'; }}}
                  >
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                    {sidebarOpen && <><span style={{ flex: 1 }}>{item.label}</span>{item.badge === 'orders' && <span style={{ background: '#ef4444', color: '#fff', fontSize: 10, borderRadius: 8, padding: '1px 6px' }}>14</span>}</>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User */}
        {sidebarOpen && user && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1e3a5f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, color: '#3b82f6', flexShrink: 0 }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#e0e0e0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
              <div style={{ fontSize: 10, color: '#555', textTransform: 'capitalize' }}>{user.role?.replace('_', ' ')}</div>
            </div>
            <button onClick={logout} title="Logout" style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 16 }}>↩</button>
          </div>
        )}
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: '#111', borderBottom: '1px solid #222' }}>
          <button onClick={toggleSidebar} style={{ background: 'none', border: 'none', color: '#777', cursor: 'pointer', fontSize: 18, padding: 4 }}>☰</button>
          <div style={{ flex: 1 }}>
            <input placeholder="Search products, orders, customers…" style={{
              background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8,
              padding: '7px 14px', color: '#e0e0e0', fontSize: 13, width: '100%', maxWidth: 340, outline: 'none'
            }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Notification bell */}
            <button style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#888', position: 'relative' }}>
              🔔
              {unreadCount > 0 && <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }} />}
            </button>
            <button onClick={() => navigate('/products/new')} style={{
              background: '#f97316', border: 'none', borderRadius: 8, padding: '7px 14px',
              color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer'
            }}>+ Add Product</button>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', background: '#0a0a0a' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { create } from 'zustand';
import { io } from 'socket.io-client';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

// ─── Auth Store ──────────────────────────────────────────────────────────────
export const useAuthStore = create((set, get) => ({
  user:          null,
  token:         localStorage.getItem('nexus_token') || null,
  isLoading:     false,
  isAuthenticated: !!localStorage.getItem('nexus_token'),

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await authAPI.login({ email, password });
      localStorage.setItem('nexus_token', res.token);
      set({ user: res.user, token: res.token, isAuthenticated: true, isLoading: false });
      toast.success(`Welcome back, ${res.user.name.split(' ')[0]}!`);
      return true;
    } catch (err) {
      set({ isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('nexus_token');
    set({ user: null, token: null, isAuthenticated: false });
    toast.success('Logged out');
    window.location.href = '/login';
  },

  fetchMe: async () => {
    try {
      const res = await authAPI.me();
      set({ user: res.user, isAuthenticated: true });
    } catch {
      localStorage.removeItem('nexus_token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  can: (role) => {
    const user = get().user;
    if (!user) return false;
    const hierarchy = { super_admin: 5, admin: 4, manager: 3, editor: 2, support: 1 };
    const allowed = { super_admin: 5, admin: 4, manager: 3, editor: 2, support: 1 };
    return (hierarchy[user.role] || 0) >= (allowed[role] || 99);
  }
}));

// ─── UI Store ────────────────────────────────────────────────────────────────
export const useUIStore = create((set) => ({
  sidebarOpen:    true,
  activeNav:      'overview',
  notifications:  [],
  unreadCount:    0,

  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveNav:  (nav) => set({ activeNav: nav }),
  addNotification: (notif) => set(s => ({
    notifications: [{ ...notif, id: Date.now(), read: false }, ...s.notifications.slice(0, 49)],
    unreadCount: s.unreadCount + 1
  })),
  markAllRead: () => set(s => ({
    notifications: s.notifications.map(n => ({ ...n, read: true })),
    unreadCount: 0
  }))
}));

// ─── Products Store ──────────────────────────────────────────────────────────
export const useProductsStore = create((set, get) => ({
  products:   [],
  total:      0,
  loading:    false,
  filters:    { page: 1, limit: 20, search: '', status: '', sort: '-createdAt' },
  selected:   [],

  setFilters: (f) => set(s => ({ filters: { ...s.filters, ...f, page: 1 } })),
  setSelected: (ids) => set({ selected: ids }),
  toggleSelected: (id) => set(s => ({
    selected: s.selected.includes(id) ? s.selected.filter(i => i !== id) : [...s.selected, id]
  })),
  selectAll: () => set(s => ({ selected: s.products.map(p => p._id) })),
  clearSelected: () => set({ selected: [] })
}));

// ─── Homepage Store ──────────────────────────────────────────────────────────
export const useHomepageStore = create((set, get) => ({
  homepage:    null,
  sections:    [],
  loading:     false,
  isDirty:     false,
  previewMode: false,

  setSections: (sections) => set({ sections, isDirty: true }),
  setHomepage: (hp) => set({ homepage: hp, sections: hp.sections || [], isDirty: false }),
  setPreviewMode: (v) => set({ previewMode: v }),
  markClean:   () => set({ isDirty: false }),

  reorderLocally: (oldIndex, newIndex) => {
    const sections = [...get().sections];
    const [moved] = sections.splice(oldIndex, 1);
    sections.splice(newIndex, 0, moved);
    set({ sections, isDirty: true });
  }
}));

// ─── Socket Store ────────────────────────────────────────────────────────────
export const useSocketStore = create((set, get) => ({
  socket: null,
  connected: false,

  connect: () => {
    const existing = get().socket;
    if (existing?.connected) return;
    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');
    const { addNotification } = useUIStore.getState();

    socket.on('connect', () => set({ connected: true }));
    socket.on('disconnect', () => set({ connected: false }));

    socket.on('inventory:low_stock', ({ name, stock }) => {
      addNotification({ type: 'warning', title: 'Low Stock', message: `${name} only has ${stock} left` });
      toast(`⚠️ Low stock: ${name}`, { icon: '📦' });
    });
    socket.on('inventory:out_of_stock', ({ name }) => {
      addNotification({ type: 'error', title: 'Out of Stock', message: `${name} is now out of stock` });
      toast.error(`Out of stock: ${name}`);
    });
    socket.on('order:status_updated', ({ orderNumber, status }) => {
      addNotification({ type: 'info', title: 'Order Updated', message: `${orderNumber} → ${status}` });
    });
    socket.on('homepage:published', () => {
      toast.success('Homepage is now live!');
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) { socket.disconnect(); set({ socket: null, connected: false }); }
  }
}));

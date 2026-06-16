import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore, useSocketStore } from './store';

// Pages
import LoginPage       from './pages/LoginPage';
import DashboardLayout from './components/ui/DashboardLayout';
import OverviewPage    from './pages/OverviewPage';
import ProductsPage    from './pages/ProductsPage';
import ProductFormPage from './pages/ProductFormPage';
import HomepageBuilder from './pages/HomepageBuilder';
import OrdersPage      from './pages/OrdersPage';
import CustomersPage   from './pages/CustomersPage';
import InventoryPage   from './pages/InventoryPage';
import AnalyticsPage   from './pages/AnalyticsPage';
import MediaPage       from './pages/MediaPage';
import CategoriesPage  from './pages/CategoriesPage';
import SettingsPage    from './pages/SettingsPage';

// Protected route wrapper
const PrivateRoute = ({ children }) => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default function App() {
  const { fetchMe, isAuthenticated } = useAuthStore();
  const { connect, disconnect } = useSocketStore();

  useEffect(() => {
    if (isAuthenticated) { fetchMe(); connect(); }
    return () => disconnect();
  }, [isAuthenticated]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1c1c1c', color: '#f0f0f0', border: '1px solid #333', borderRadius: '8px' },
          success: { iconTheme: { primary: '#22c55e', secondary: '#1c1c1c' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#1c1c1c' } }
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview"          element={<OverviewPage />} />
          <Route path="products"          element={<ProductsPage />} />
          <Route path="products/new"      element={<ProductFormPage />} />
          <Route path="products/:id/edit" element={<ProductFormPage />} />
          <Route path="homepage"          element={<HomepageBuilder />} />
          <Route path="orders"            element={<OrdersPage />} />
          <Route path="customers"         element={<CustomersPage />} />
          <Route path="inventory"         element={<InventoryPage />} />
          <Route path="analytics"         element={<AnalyticsPage />} />
          <Route path="media"             element={<MediaPage />} />
          <Route path="categories"        element={<CategoriesPage />} />
          <Route path="settings"          element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

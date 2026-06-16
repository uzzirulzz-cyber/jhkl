import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler
} from 'chart.js';
import { analyticsAPI } from '../services/api';
import { t, Page, PageHeader, Card, Loading, money, Badge } from '../components/ui/primitives';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const Stat = ({ label, value, change, accent }) => (
  <Card pad={16}>
    <div style={{ fontSize: 12, color: t.muted, marginBottom: 8 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: accent || '#f5f5f5' }}>{value}</div>
    {change !== undefined && change !== null && (
      <div style={{ marginTop: 6 }}>
        <Badge color={Number(change) >= 0 ? 'green' : 'red'}>
          {Number(change) >= 0 ? '▲' : '▼'} {Math.abs(Number(change))}%
        </Badge>
        <span style={{ fontSize: 11, color: t.muted2, marginLeft: 6 }}>vs last month</span>
      </div>
    )}
  </Card>
);

export default function OverviewPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [chart, setChart] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ov, rc, tp] = await Promise.all([
          analyticsAPI.overview(),
          analyticsAPI.revenueChart({ days: 14 }),
          analyticsAPI.topProducts()
        ]);
        setData(ov.data);
        setChart(rc.data || []);
        setTopProducts(tp.products || []);
      } catch (e) { /* interceptor toasts */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <Loading label="Loading dashboard…" />;

  const d = data || {};
  const chartData = {
    labels: chart.map(c => c._id?.slice(5) || ''),
    datasets: [{
      data: chart.map(c => c.revenue),
      borderColor: t.accent, backgroundColor: 'rgba(249,115,22,0.12)',
      fill: true, tension: 0.35, pointRadius: 2, borderWidth: 2
    }]
  };
  const chartOpts = {
    plugins: { tooltip: { callbacks: { label: ctx => money(ctx.parsed.y) } }, legend: { display: false } },
    scales: {
      x: { grid: { color: '#1a1a1a' }, ticks: { color: '#666', font: { size: 10 } } },
      y: { grid: { color: '#1a1a1a' }, ticks: { color: '#666', font: { size: 10 }, callback: v => '$' + v } }
    },
    maintainAspectRatio: false
  };

  return (
    <Page>
      <PageHeader title="Overview" subtitle="Your store at a glance" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 18 }}>
        <Stat label="Revenue (this month)" value={money(d.revenue?.current)} change={d.revenue?.change} accent={t.accent} />
        <Stat label="Orders (this month)" value={d.orders?.current ?? 0} change={d.orders?.change} />
        <Stat label="Customers" value={d.customers?.total ?? 0} accent={t.blue} />
        <Stat label="New customers" value={d.customers?.new ?? 0} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 18 }}>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Revenue · last 14 days</div>
          <div style={{ height: 240 }}>
            {chart.length ? <Line data={chartData} options={chartOpts} /> :
              <div style={{ color: t.muted, fontSize: 13, paddingTop: 90, textAlign: 'center' }}>No revenue yet</div>}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Inventory health</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Row label="Active products" value={d.inventory?.total ?? 0} />
            <Row label="Low stock" value={d.inventory?.lowStock ?? 0} color={t.yellow} onClick={() => navigate('/inventory')} />
            <Row label="Out of stock" value={d.inventory?.outOfStock ?? 0} color={t.red} onClick={() => navigate('/inventory')} />
          </div>
        </Card>
      </div>

      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Top products</div>
        {topProducts.length === 0 ? <div style={{ color: t.muted, fontSize: 13 }}>No sales data yet.</div> :
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {topProducts.map((p, i) => (
              <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 6px', borderBottom: i < topProducts.length - 1 ? `1px solid ${t.line}` : 'none' }}>
                <span style={{ width: 22, color: t.muted2, fontSize: 12 }}>#{i + 1}</span>
                <div style={{ width: 30, height: 30, borderRadius: 6, background: t.panel2, overflow: 'hidden', flexShrink: 0 }}>
                  {p.thumbnail && <img src={p.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <span style={{ flex: 1, fontSize: 13, color: '#ddd' }}>{p.name}</span>
                <span style={{ fontSize: 12, color: t.muted }}>{p.salesCount || 0} sold</span>
                <span style={{ fontSize: 13, color: t.accent, fontWeight: 600, width: 80, textAlign: 'right' }}>{money(p.price)}</span>
              </div>
            ))}
          </div>}
      </Card>
    </Page>
  );
}

const Row = ({ label, value, color, onClick }) => (
  <div onClick={onClick} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: onClick ? 'pointer' : 'default' }}>
    <span style={{ fontSize: 13, color: t.muted }}>{label}</span>
    <span style={{ fontSize: 18, fontWeight: 700, color: color || '#eee' }}>{value}</span>
  </div>
);

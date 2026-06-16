import React, { useEffect, useState, useCallback } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler
} from 'chart.js';
import { analyticsAPI } from '../services/api';
import { t, Page, PageHeader, Card, Button, Loading, money } from '../components/ui/primitives';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler);

export default function AnalyticsPage() {
  const [range, setRange] = useState(30);
  const [chart, setChart] = useState([]);
  const [top, setTop] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rc, tp, ov] = await Promise.all([
        analyticsAPI.revenueChart({ days: range }),
        analyticsAPI.topProducts(),
        analyticsAPI.overview()
      ]);
      setChart(rc.data || []); setTop(tp.products || []); setOverview(ov.data);
    } catch {} finally { setLoading(false); }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loading label="Crunching numbers…" />;

  const axis = (fmt) => ({
    x: { grid: { color: '#1a1a1a' }, ticks: { color: '#666', font: { size: 10 } } },
    y: { grid: { color: '#1a1a1a' }, ticks: { color: '#666', font: { size: 10 }, callback: fmt } }
  });

  const revenueData = {
    labels: chart.map(c => c._id?.slice(5)),
    datasets: [{ label: 'Revenue', data: chart.map(c => c.revenue), borderColor: t.accent, backgroundColor: 'rgba(249,115,22,0.12)', fill: true, tension: 0.35, borderWidth: 2, pointRadius: 2 }]
  };
  const ordersData = {
    labels: chart.map(c => c._id?.slice(5)),
    datasets: [{ label: 'Orders', data: chart.map(c => c.orders), backgroundColor: 'rgba(59,130,246,0.5)', borderRadius: 4 }]
  };
  const topData = {
    labels: top.slice(0, 8).map(p => p.name?.slice(0, 14)),
    datasets: [{ data: top.slice(0, 8).map(p => p.salesCount || 0), backgroundColor: 'rgba(249,115,22,0.5)', borderRadius: 4 }]
  };

  return (
    <Page>
      <PageHeader title="Analytics" subtitle="Sales performance and trends"
        actions={[7, 30, 90].map(d => (
          <Button key={d} size="sm" variant={range === d ? 'primary' : 'secondary'} onClick={() => setRange(d)}>{d}d</Button>
        ))} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Revenue</div>
          <div style={{ height: 240 }}>{chart.length ? <Line data={revenueData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => money(c.parsed.y) } } }, scales: axis(v => '$' + v) }} /> : <Empty />}</div>
        </Card>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Orders</div>
          <div style={{ height: 240 }}>{chart.length ? <Bar data={ordersData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: axis(v => v) }} /> : <Empty />}</div>
        </Card>
      </div>

      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Top products by units sold</div>
        <div style={{ height: 260 }}>{top.length ? <Bar data={topData} options={{ maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: axis(v => v) }} /> : <Empty />}</div>
      </Card>

      {overview && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginTop: 14 }}>
          <Mini label="Month revenue" value={money(overview.revenue?.current)} />
          <Mini label="Month orders" value={overview.orders?.current ?? 0} />
          <Mini label="Customers" value={overview.customers?.total ?? 0} />
          <Mini label="Active products" value={overview.inventory?.total ?? 0} />
        </div>
      )}
    </Page>
  );
}

const Empty = () => <div style={{ color: t.muted, fontSize: 13, textAlign: 'center', paddingTop: 100 }}>No data for this range</div>;
const Mini = ({ label, value }) => (
  <Card pad={16}><div style={{ fontSize: 12, color: t.muted }}>{label}</div><div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div></Card>
);

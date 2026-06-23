'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Activity,
  TrendingDown,
  MapPin,
  Clock,
  Flame,
  Info,
  Beaker,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileDown,
  BarChart3,
  Radio,
  CalendarDays,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const MapView = dynamic(() => import('./MapView'), { ssr: false, loading: () => <Skeleton className="w-full h-full rounded-lg" /> });

type TestResult = {
  id: string;
  sampleType: string;
  cfuValue: number;
  result: string;
  latitude: number;
  longitude: number;
  locationName: string;
  createdAt: string;
  variant?: string;
};

type Alert = {
  id: string;
  type: string;
  title: string;
  message: string;
  resolved: boolean;
  createdAt: string;
};

type Stats = {
  totalThisMonth: number;
  positiveRate: number;
  mostVulnerable: string;
  dailyTrend: Array<{ date: string; positif: number; negatif: number }>;
  commodityDistribution: Array<{
    type: string;
    label: string;
    total: number;
    positive: number;
    negative: number;
    positiveRate: number;
  }>;
  resultDistribution?: { POSITIF: number; NEGATIF: number };
  cityRanking?: Array<{
    cityName: string;
    total: number;
    positive: number;
    positiveRate: number;
  }>;
};

const SAMPLE_LABELS: Record<string, string> = {
  AYAM: 'Daging Ayam',
  TELUR: 'Telur',
  SUSU_MENTAH: 'Susu Mentah',
  DAGING_SAPI: 'Daging Sapi',
};

const ALERT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  OUTBREAK: Flame,
  WARNING: AlertTriangle,
  INFO: Info,
};

/* Mock sparkline data for stat cards */
const SPARKLINE_DATA = {
  samples: [30, 45, 38, 50, 42, 55, 48, 60, 53, 65, 58, 70],
  positive: [12, 15, 10, 18, 14, 20, 16, 22, 19, 25, 21, 18],
  vulnerable: [5, 8, 12, 9, 15, 11, 18, 14, 20, 16, 22, 19],
};

type MobileTab = 'statistik' | 'peta' | 'feed';

export default function AdminControlRoom() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [tests, setTests] = useState<TestResult[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [mapFilter, setMapFilter] = useState('SEMUA');
  const [mobileTab, setMobileTab] = useState<MobileTab>('statistik');
  const [feedSearch, setFeedSearch] = useState('');
  const [feedFilter, setFeedFilter] = useState<'SEMUA' | 'POSITIF' | 'NEGATIF'>('SEMUA');
  const [resolvedHistoryOpen, setResolvedHistoryOpen] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [tabTapScale, setTabTapScale] = useState<Record<string, number>>({});
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const params = new URLSearchParams();
        if (dateFrom) params.set('from', dateFrom);
        if (dateTo) params.set('to', dateTo);
        const statsUrl = `/api/stats${params.toString() ? '?' + params.toString() : ''}`;
        const [statsRes, testsRes, alertsRes] = await Promise.all([
          fetch(statsUrl),
          fetch('/api/tests'),
          fetch('/api/alerts'),
        ]);
        if (cancelled) return;
        if (statsRes.ok) setStats(await statsRes.json());
        if (testsRes.ok) setTests(await testsRes.json());
        if (alertsRes.ok) setAlerts(await alertsRes.json());
      } catch (err) {
        console.error('Failed to fetch admin data:', err);
      }
    };
    load();
    setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    const interval = setInterval(() => {
      load();
      setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [dateFrom, dateTo]);

  const activeAlerts = alerts.filter((a) => !a.resolved);
  const resolvedAlerts = alerts.filter((a) => a.resolved);

  const handleResolveAlert = async (alertId: string) => {
    setResolvingId(alertId);
    try {
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved: true }),
      });
      if (res.ok) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, resolved: true } : a))
        );
      }
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    } finally {
      setResolvingId(null);
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Jenis Sampel', 'Hasil', 'CFU', 'Lokasi', 'Koordinat', 'Waktu'];
    const rows = tests.map((t) => [
      t.id,
      SAMPLE_LABELS[t.sampleType] || t.sampleType,
      t.result,
      t.cfuValue,
      t.locationName,
      `${t.latitude}, ${t.longitude}`,
      new Date(t.createdAt).toLocaleString('id-ID'),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salmosens-data-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* Filtered live feed */
  const filteredTests = useMemo(() => {
    let filtered = tests;
    if (feedFilter !== 'SEMUA') {
      filtered = filtered.filter((t) => t.result === feedFilter);
    }
    if (feedSearch.trim()) {
      const q = feedSearch.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.locationName.toLowerCase().includes(q) ||
          (SAMPLE_LABELS[t.sampleType] || t.sampleType).toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [tests, feedFilter, feedSearch]);

  /* Sparkline component */
  const MiniSparkline = ({ data, color }: { data: number[]; color: string }) => (
    <div className="flex items-end gap-0.5 h-6">
      {data.slice(-7).map((val, i) => {
        const maxVal = Math.max(...data);
        const h = Math.max(3, (val / maxVal) * 24);
        return (
          <motion.div
            key={i}
            className="sparkline-bar rounded-sm"
            style={{
              width: 4,
              height: h,
              backgroundColor: color,
              opacity: 0.5 + (i / 7) * 0.5,
            }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.3 + i * 0.05 }}
          />
        );
      })}
    </div>
  );

  /* ===== LEFT COLUMN: Analytics / Statistik ===== */
  const leftColumn = (
    <div className="space-y-4">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-3">
        {/* Total Samples */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800 hover:border-sky-500/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
                  <Beaker className="h-5 w-5 text-sky-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Total Sampel Bulan Ini</p>
                  <p className="text-2xl font-bold text-white">{stats?.totalThisMonth ?? '-'}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <MiniSparkline data={SPARKLINE_DATA.samples} color="#38bdf8" />
                  <span className="text-xs text-sky-400 font-medium flex items-center gap-0.5">
                    ↑ 12%
                    <span className="text-gray-600 text-[10px]">vs lalu</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Positive Rate */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800 hover:border-red-500/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  (stats?.positiveRate ?? 0) > 20 ? 'bg-red-500/10' : 'bg-green-500/10'
                }`}>
                  <TrendingDown className={`h-5 w-5 ${
                    (stats?.positiveRate ?? 0) > 20 ? 'text-red-400' : 'text-green-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">% Positif</p>
                  <p className={`text-2xl font-bold ${
                    (stats?.positiveRate ?? 0) > 20 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {stats?.positiveRate ?? '-'}%
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <MiniSparkline data={SPARKLINE_DATA.positive} color={
                    (stats?.positiveRate ?? 0) > 20 ? '#f87171' : '#4ade80'
                  } />
                  <span className={`text-xs font-medium flex items-center gap-0.5 ${
                    (stats?.positiveRate ?? 0) > 20 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    ↓ 5%
                    <span className="text-gray-600 text-[10px]">vs lalu</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Most Vulnerable */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800 hover:border-yellow-500/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Komoditas Paling Rentan</p>
                  <p className="text-lg font-bold text-white">{stats?.mostVulnerable ?? '-'}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <MiniSparkline data={SPARKLINE_DATA.vulnerable} color="#facc15" />
                  <span className="text-xs text-yellow-400 font-medium flex items-center gap-0.5">
                    ↑ 3%
                    <span className="text-gray-600 text-[10px]">vs lalu</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Trend Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-sky-400" />
              Tren 30 Hari Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="h-52">
              {stats?.dailyTrend ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#6b7280' }}
                      tickFormatter={(v: string) => v.slice(5)}
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#e5e7eb',
                        fontSize: '12px',
                      }}
                      labelFormatter={(label: string) => {
                        const d = new Date(label);
                        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px' }}
                      formatter={(value: string) => (value === 'positif' ? 'Positif' : 'Negatif')}
                    />
                    <Line
                      type="monotone"
                      dataKey="positif"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: '#ef4444' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="negatif"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: '#22c55e' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <Skeleton className="w-full h-full" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Commodity Distribution Bar Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Beaker className="h-4 w-4 text-amber-400" />
              Distribusi Komoditas
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="h-44">
              {stats?.commodityDistribution && stats.commodityDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.commodityDistribution} layout="vertical" margin={{ left: 0, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      width={80}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#e5e7eb',
                        fontSize: '11px',
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'positive') return [`${value} positif`, 'Positif'];
                        return [`${value} negatif`, 'Negatif'];
                      }}
                    />
                    <Bar dataKey="negative" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} barSize={16} />
                    <Bar dataKey="positive" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <Skeleton className="w-full h-full" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pie/Donut Chart - Result Distribution */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-400" />
              Distribusi Hasil Pengujian
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {stats?.resultDistribution ? (
              <div className="flex items-center gap-4">
                <div className="relative h-36 w-36 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Positif', value: stats.resultDistribution.POSITIF },
                          { name: 'Negatif', value: stats.resultDistribution.NEGATIF },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={36}
                        outerRadius={56}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        <Cell fill="#ef4444" />
                        <Cell fill="#10b981" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-lg font-bold text-white">
                      {(stats.resultDistribution.POSITIF + stats.resultDistribution.NEGATIF).toLocaleString('id-ID')}
                    </span>
                    <span className="text-[10px] text-gray-500">total</span>
                  </div>
                </div>
                {/* Legend */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-red-500 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Positif</p>
                      <p className="text-sm font-bold text-red-400">{stats.resultDistribution.POSITIF}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-emerald-500 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Negatif</p>
                      <p className="text-sm font-bold text-emerald-400">{stats.resultDistribution.NEGATIF}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-36 flex items-center justify-center">
                <Skeleton className="w-full h-full rounded-lg" />
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* City Ranking Panel */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-orange-400" />
              Kota dengan Positif Tertinggi
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {stats?.cityRanking && stats.cityRanking.length > 0 ? (
              <div className="space-y-2.5">
                {stats.cityRanking.map((city, index) => {
                  const barColor = city.positiveRate >= 40 ? 'bg-red-500' : city.positiveRate >= 20 ? 'bg-amber-500' : 'bg-emerald-500';
                  const barTrackColor = city.positiveRate >= 40 ? 'bg-red-500/10' : city.positiveRate >= 20 ? 'bg-amber-500/10' : 'bg-emerald-500/10';
                  return (
                    <div key={city.cityName} className="flex items-center gap-2.5">
                      <span className={`text-xs font-bold w-5 text-center shrink-0 ${index === 0 ? 'text-amber-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-orange-400' : 'text-gray-600'}`}>
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-300 truncate">{city.cityName}</span>
                          <span className="text-[10px] text-gray-500 shrink-0 ml-2">{city.positive}/{city.total} uji</span>
                        </div>
                        <div className={`h-1.5 rounded-full ${barTrackColor}`}>
                          <div
                            className={`h-full rounded-full ${barColor} transition-all duration-700`}
                            style={{ width: `${Math.min(city.positiveRate, 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className={`text-xs font-bold w-12 text-right shrink-0 ${city.positiveRate >= 40 ? 'text-red-400' : city.positiveRate >= 20 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {city.positiveRate}%
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <MapPin className="h-8 w-8 text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Data not available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );

  /* ===== CENTER COLUMN: Map ===== */
  const centerColumn = (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="h-full min-h-[500px] lg:min-h-0"
    >
      <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800 border-sky-500/20 animate-glow-border-sky h-full flex flex-col">
        <CardHeader className="pb-2 pt-4 px-4 shrink-0">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sky-400" />
              Peta Heatmap Interaktif
            </span>
            <div className="flex items-center gap-2">
              {/* Total count label */}
              <Badge variant="secondary" className="bg-sky-500/10 text-sky-400 border-sky-500/20 text-[11px]">
                {tests.length} titik pengujian
              </Badge>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-xs text-gray-500">Aman</span>
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 ml-2" />
                <span className="text-xs text-gray-500">Positif</span>
              </div>
            </div>
          </CardTitle>
          {/* Export CSV button */}
          <div className="flex justify-end mt-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-gray-400 hover:text-sky-400 hover:bg-sky-500/10 gap-1"
              onClick={handleExportCSV}
            >
              <FileDown className="h-3 w-3" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 px-4 pb-4 min-h-0">
          <MapView
            tests={tests}
            zoom={5}
            showPublicView={false}
            filter={mapFilter}
            onFilterChange={setMapFilter}
          />
        </CardContent>
      </Card>
    </motion.div>
  );

  /* ===== RIGHT COLUMN: Live Feed & Alerts ===== */
  const rightColumn = (
    <div className="space-y-4">
      {/* Alert Banner */}
      {activeAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-red-500/10 border border-red-500/30 overflow-hidden relative">
            <div className="absolute inset-0 bg-red-500/5 animate-pulse" />
            <CardContent className="p-4 relative">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="h-5 w-5 text-red-400" />
                <h3 className="text-sm font-bold text-red-400">
                  Peringatan Aktif ({activeAlerts.length})
                </h3>
              </div>
              <div className="space-y-2">
                {activeAlerts.slice(0, 3).map((alert) => {
                  const IconComp = ALERT_ICONS[alert.type] || Info;
                  return (
                    <div
                      key={alert.id}
                      className="flex items-start gap-2 p-2 rounded-lg bg-red-500/5 group"
                    >
                      <IconComp className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-red-300">{alert.title}</p>
                        <p className="text-xs text-red-400/70 truncate">{alert.message}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[10px] text-red-300 hover:text-green-400 hover:bg-green-500/10 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleResolveAlert(alert.id)}
                        disabled={resolvingId === alert.id}
                      >
                        {resolvingId === alert.id ? (
                          <span className="animate-pulse">...</span>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Resolve
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Resolved alerts history */}
      {resolvedAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={() => setResolvedHistoryOpen(!resolvedHistoryOpen)}
            className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-gray-900/50 hover:bg-gray-800/50 transition-colors border border-gray-800/50"
          >
            <span className="text-xs text-gray-500 flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              Riwayat Peringatan ({resolvedAlerts.length})
            </span>
            {resolvedHistoryOpen ? (
              <ChevronUp className="h-3 w-3 text-gray-600" />
            ) : (
              <ChevronDown className="h-3 w-3 text-gray-600" />
            )}
          </button>
          {resolvedHistoryOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-1 space-y-1 max-h-40 overflow-y-auto custom-scrollbar"
            >
              {resolvedAlerts.map((alert) => {
                const IconComp = ALERT_ICONS[alert.type] || Info;
                return (
                  <div
                    key={alert.id}
                    className="flex items-start gap-2 p-2 rounded-lg bg-gray-900/30 opacity-50"
                  >
                    <IconComp className="h-3.5 w-3.5 text-gray-600 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500 truncate">{alert.title}</p>
                      <p className="text-[10px] text-gray-600 truncate">{alert.message}</p>
                    </div>
                    <CheckCircle2 className="h-3 w-3 text-green-600/50 shrink-0 mt-0.5" />
                  </div>
                );
              })}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Live Feed */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
        <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Radio className="h-4 w-4 text-sky-400" />
              Feed Pengujian Terkini
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {/* Search Input */}
            <div className="mb-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                <Input
                  placeholder="Cari lokasi atau sampel..."
                  value={feedSearch}
                  onChange={(e) => setFeedSearch(e.target.value)}
                  className="pl-8 h-8 text-xs bg-gray-800/50 border-gray-700 text-gray-300 placeholder:text-gray-600 focus:border-sky-500/50"
                />
              </div>
            </div>

            {/* Quick Filter Badges */}
            <div className="flex items-center gap-1.5 mb-3">
              {(['SEMUA', 'POSITIF', 'NEGATIF'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFeedFilter(filter)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                    feedFilter === filter
                      ? filter === 'POSITIF'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : filter === 'NEGATIF'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      : 'bg-gray-800/50 text-gray-500 border border-gray-700/50 hover:bg-gray-800'
                  }`}
                >
                  {filter.charAt(0) + filter.slice(1).toLowerCase()}
                </button>
              ))}
              {filteredTests.length > 0 && (
                <span className="ml-auto text-[10px] text-gray-600">
                  {filteredTests.length} hasil
                </span>
              )}
            </div>

            {/* Feed List */}
            <div className="max-h-96 overflow-y-auto custom-scrollbar space-y-2">
              {filteredTests.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-8 w-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Tidak ada hasil ditemukan</p>
                </div>
              ) : (
                filteredTests.slice(0, 30).map((test, index) => {
                  const isPositive = test.result === 'POSITIF';
                  const timeStr = new Date(test.createdAt).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <motion.div
                      key={test.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.5) }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
                    >
                      <Badge
                        className={`shrink-0 ${
                          isPositive
                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                            : 'bg-green-500/20 text-green-400 border-green-500/30'
                        }`}
                        variant="outline"
                      >
                        {test.result}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-200 truncate">
                          {SAMPLE_LABELS[test.sampleType] || test.sampleType}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{test.locationName}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs">{timeStr}</span>
                        </div>
                        {isPositive && (
                          <span className="text-xs text-red-400 font-medium">
                            {test.cfuValue} CFU
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col admin-grid-bg">
      {/* Mobile Tab Navigation (visible below lg) */}
      <div className="lg:hidden sticky top-0 z-30 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800 px-4 py-2">
        {/* Last synced indicator - mobile */}
        <div className="flex items-center justify-center gap-1.5 mb-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] text-gray-500">
            Terakhir diperbarui: {lastSyncTime || '--:--:--'}
          </span>
        </div>
        <div className="relative flex items-center gap-1 bg-gray-900 rounded-lg p-1">
          {([
            { key: 'statistik' as MobileTab, label: 'Statistik', icon: BarChart3 },
            { key: 'peta' as MobileTab, label: 'Peta', icon: MapPin },
            { key: 'feed' as MobileTab, label: 'Feed', icon: Radio },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setMobileTab(tab.key);
                setTabTapScale((prev) => ({ ...prev, [tab.key]: 0.92 }));
                setTimeout(() => setTabTapScale((prev) => ({ ...prev, [tab.key]: 1 })), 150);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors relative z-10 ${
                mobileTab === tab.key
                  ? 'text-sky-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              style={{ transform: `scale(${tabTapScale[tab.key] ?? 1})`, transition: 'transform 150ms ease' }}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
          {/* Sliding indicator */}
          <motion.div
            layoutId="admin-mobile-tab-indicator"
            className="absolute top-1 bottom-1 bg-sky-500/20 rounded-md shadow-sm"
            style={{
              width: `calc(33.333% - 3px)`,
              left: mobileTab === 'statistik' ? '4px' : mobileTab === 'peta' ? 'calc(33.333% + 1px)' : 'calc(66.666% - 2px)',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-[1800px] mx-auto w-full p-4">
        {/* Desktop: Date filter + refresh indicator */}
        <div className="hidden lg:flex items-center justify-between mb-3">
          <div className="relative">
            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${showDateFilter || dateFrom || dateTo ? 'bg-sky-500/20 text-sky-400 border-sky-500/30' : 'bg-gray-900/50 text-gray-500 border-gray-800 hover:text-gray-300 hover:border-gray-700'}`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              {dateFrom || dateTo ? `${dateFrom || '...'} — ${dateTo || '...'}` : 'Filter Tanggal'}
              {(dateFrom || dateTo) && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-sky-400" />
              )}
            </button>
            {showDateFilter && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 mt-2 z-50 bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-2xl w-72"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-300">Rentang Tanggal</span>
                  {(dateFrom || dateTo) && (
                    <button
                      onClick={() => { setDateFrom(''); setDateTo(''); }}
                      className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300"
                    >
                      <X className="h-3 w-3" /> Reset
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">Dari</label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="h-8 text-xs bg-gray-800 border-gray-700 text-gray-300"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">Sampai</label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="h-8 text-xs bg-gray-800 border-gray-700 text-gray-300"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-gray-500">
              Terakhir diperbarui: {lastSyncTime || '--:--:--'}
            </span>
          </div>
        </div>

        {/* Desktop Layout - 3 Columns */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-4 h-full">
          <div className="lg:col-span-3">{leftColumn}</div>
          <div className="lg:col-span-5">{centerColumn}</div>
          <div className="lg:col-span-4">{rightColumn}</div>
        </div>

        {/* Mobile Layout - Single Column with Tabs */}
        <div className="lg:hidden space-y-4 pb-4">
          {mobileTab === 'statistik' && leftColumn}
          {mobileTab === 'peta' && centerColumn}
          {mobileTab === 'feed' && rightColumn}
        </div>
      </main>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, FunnelChart } from 'recharts';
import { RefreshCw, DollarSign, ShoppingCart, Users, Eye, Globe, TrendingUp, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

interface DashboardData {
  funnel: Record<string, number>;
  totalRevenue: number;
  totalOrders: number;
  countryCounts: Record<string, { count: number; revenue: number }>;
  ordersByHour: Record<string, number>;
  utmSources: Record<string, number>;
  uniqueSessions: number;
  totalPageViews: number;
  recentOrders: Array<{
    id: string;
    created_at: string;
    email: string;
    package_name: string;
    amount: number;
    country: string;
    utm_source: string;
  }>;
}

const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸', BR: '🇧🇷', CO: '🇨🇴', MX: '🇲🇽', AR: '🇦🇷', PE: '🇵🇪', CL: '🇨🇱',
  EC: '🇪🇨', VE: '🇻🇪', GT: '🇬🇹', CR: '🇨🇷', PA: '🇵🇦', DO: '🇩🇴', SV: '🇸🇻',
  HN: '🇭🇳', BO: '🇧🇴', PY: '🇵🇾', UY: '🇺🇾', NI: '🇳🇮', PR: '🇵🇷',
  ES: '🇪🇸', PT: '🇵🇹', IN: '🇮🇳', PH: '🇵🇭', Unknown: '🌍',
};

const CHART_COLORS = ['#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#f43f5e'];

const FUNNEL_LABELS: Record<string, string> = {
  quiz: 'Quiz',
  identify: 'Identificar',
  recharge: 'Recarga',
  checkout: 'Checkout',
  success: 'Sucesso',
};

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('today');
  const [dashKey, setDashKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (!dashKey) return;
    setLoading(true);
    setError('');
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('dashboard-data', {
        headers: { 'x-dashboard-key': dashKey },
        body: null,
        method: 'GET',
      });

      // Since invoke doesn't support query params easily, use fetch directly
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dashboard-data?period=${period}`;
      const response = await fetch(url, {
        headers: {
          'x-dashboard-key': dashKey,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setAuthenticated(false);
          setError('Chave inválida');
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();
      setData(json);
      setAuthenticated(true);
      setLastUpdate(new Date());
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [dashKey, period]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!authenticated) return;
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [authenticated, period, fetchData]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (dashKey.trim()) {
      fetchData();
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-[#141414] border border-gray-800 rounded-2xl p-8 w-full max-w-sm">
          <div className="flex items-center justify-center mb-6">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
              <Lock className="w-7 h-7 text-primary" />
            </div>
          </div>
          <h1 className="text-white text-xl font-bold text-center mb-2">Dashboard</h1>
          <p className="text-gray-400 text-sm text-center mb-6">Insira a chave de acesso</p>
          <form onSubmit={handleLogin}>
            <Input
              type="password"
              placeholder="Chave secreta"
              value={dashKey}
              onChange={(e) => setDashKey(e.target.value)}
              className="bg-[#0a0a0a] border-gray-700 text-white mb-4 h-12"
            />
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <Button type="submit" className="w-full bg-primary text-primary-foreground h-12 font-semibold" disabled={loading}>
              {loading ? 'Verificando...' : 'Acessar'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  const funnelData = data ? Object.entries(data.funnel).map(([key, value]) => ({
    name: FUNNEL_LABELS[key] || key,
    value,
  })) : [];

  const countryData = data ? Object.entries(data.countryCounts)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .map(([country, info]) => ({
      country,
      flag: COUNTRY_FLAGS[country] || '🌍',
      ...info,
    })) : [];

  const hourlyData = data ? Object.entries(data.ordersByHour)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([hour, count]) => ({
      hour: hour.substring(11, 16),
      vendas: count,
    })) : [];

  const utmData = data ? Object.entries(data.utmSources)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value })) : [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="bg-[#111] border-b border-gray-800 py-4 px-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h1 className="font-bold text-lg">COD Mobile Dashboard</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {['today', '7d', '30d'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  period === p ? 'bg-primary text-primary-foreground' : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
                }`}
              >
                {p === 'today' ? 'Hoje' : p === '7d' ? '7 dias' : '30 dias'}
              </button>
            ))}
            <button onClick={fetchData} disabled={loading} className="p-2 rounded-lg bg-[#1a1a1a] hover:bg-[#222] transition-all">
              <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        {lastUpdate && (
          <div className="max-w-7xl mx-auto mt-1">
            <p className="text-gray-500 text-xs">Atualizado: {lastUpdate.toLocaleTimeString()} (auto-refresh 30s)</p>
          </div>
        )}
      </header>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-[#141414] border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <span className="text-gray-400 text-sm">Receita</span>
            </div>
            <p className="text-2xl font-bold text-green-400">US$ {(data?.totalRevenue || 0).toFixed(2)}</p>
          </div>
          <div className="bg-[#141414] border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <span className="text-gray-400 text-sm">Vendas</span>
            </div>
            <p className="text-2xl font-bold text-primary">{data?.totalOrders || 0}</p>
          </div>
          <div className="bg-[#141414] border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-gray-400 text-sm">Sessões</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">{data?.uniqueSessions || 0}</p>
          </div>
          <div className="bg-[#141414] border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-5 h-5 text-purple-400" />
              <span className="text-gray-400 text-sm">Page Views</span>
            </div>
            <p className="text-2xl font-bold text-purple-400">{data?.totalPageViews || 0}</p>
          </div>
        </div>

        {/* Funnel + Sales Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Funnel */}
          <div className="bg-[#141414] border border-gray-800 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Funil de Conversão
            </h2>
            <div className="space-y-3">
              {funnelData.map((step, i) => {
                const maxVal = Math.max(...funnelData.map(s => s.value), 1);
                const pct = (step.value / maxVal) * 100;
                const convRate = i > 0 && funnelData[i - 1].value > 0
                  ? ((step.value / funnelData[i - 1].value) * 100).toFixed(1)
                  : '100';
                return (
                  <div key={step.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{step.name}</span>
                      <span className="text-gray-400">
                        {step.value} <span className="text-xs text-gray-500">({convRate}%)</span>
                      </span>
                    </div>
                    <div className="h-6 bg-[#0a0a0a] rounded-lg overflow-hidden">
                      <div
                        className="h-full rounded-lg transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hourly Sales */}
          <div className="bg-[#141414] border border-gray-800 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">📊 Vendas por Hora</h2>
            {hourlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={hourlyData}>
                  <XAxis dataKey="hour" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="vendas" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-gray-500">
                Sem vendas no período
              </div>
            )}
          </div>
        </div>

        {/* Country + UTM Source */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Countries */}
          <div className="bg-[#141414] border border-gray-800 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Vendas por País
            </h2>
            {countryData.length > 0 ? (
              <div className="space-y-3">
                {countryData.map((c) => (
                  <div key={c.country} className="flex items-center justify-between bg-[#0a0a0a] rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{c.flag}</span>
                      <span className="text-gray-300 font-medium">{c.country}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold">US$ {c.revenue.toFixed(2)}</p>
                      <p className="text-gray-500 text-xs">{c.count} venda{c.count !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Sem vendas no período</p>
            )}
          </div>

          {/* UTM Sources */}
          <div className="bg-[#141414] border border-gray-800 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">📢 Fontes de Tráfego</h2>
            {utmData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={utmData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {utmData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">Sem dados de tráfego</p>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-[#141414] border border-gray-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">🛒 Vendas Recentes</h2>
          {data?.recentOrders && data.recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="text-left py-2 pr-4">Data</th>
                    <th className="text-left py-2 pr-4">Email</th>
                    <th className="text-left py-2 pr-4">Pacote</th>
                    <th className="text-left py-2 pr-4">Valor</th>
                    <th className="text-left py-2 pr-4">País</th>
                    <th className="text-left py-2">Fonte</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-800 hover:bg-[#1a1a1a]">
                      <td className="py-2.5 pr-4 text-gray-300 whitespace-nowrap">
                        {new Date(order.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 pr-4 text-gray-300 max-w-[140px] truncate">{order.email || '-'}</td>
                      <td className="py-2.5 pr-4 text-white font-medium">{order.package_name || '-'}</td>
                      <td className="py-2.5 pr-4 text-green-400 font-bold">US$ {order.amount.toFixed(2)}</td>
                      <td className="py-2.5 pr-4">
                        <span className="text-lg mr-1">{COUNTRY_FLAGS[order.country] || '🌍'}</span>
                        <span className="text-gray-300">{order.country || '-'}</span>
                      </td>
                      <td className="py-2.5 text-gray-400">{order.utm_source || 'direct'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Sem vendas no período</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

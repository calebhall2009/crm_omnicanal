import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  MessageSquare,
  LifeBuoy,
  DollarSign,
  Bot,
  Sparkles,
  Users,
  Kanban,
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
  Activity,
  CheckCircle,
} from 'lucide-react';
import OnboardingChecklist from '../components/onboarding/OnboardingChecklist';

interface DashboardStats {
  summary: {
    total_clients: number;
    total_deals: number;
    won_deals_value: number;
    open_pipeline_value: number;
    open_conversations: number;
  };
  tickets_by_status: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  pipeline_value_by_stage: Array<{
    stage: string;
    value: number;
    count: number;
  }>;
  ai_usage: {
    used: number;
    limit: number;
    percentage: number;
  };
  active_pipeline: {
    id: number;
    name: string;
  } | null;
}

export const Dashboard: React.FC = () => {
  const { user, fetchApi } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const totalTickets = stats?.tickets_by_status.reduce((sum, item) => sum + item.value, 0) || 0;
  const openTickets = stats?.tickets_by_status.find((t) => t.name === 'Abiertos')?.value || 0;
  const pendingTickets = stats?.tickets_by_status.find((t) => t.name === 'Pendientes')?.value || 0;

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
      
      {/* Welcome & Action Banner */}
      <div className="bg-gradient-to-r from-[#141726] via-[#1a1e36] to-[#1c1833] border border-gray-800/80 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Dashboard CRM Inteligente</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Hola,</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{user?.name}</span>
            <Sparkles className="h-6 w-6 text-indigo-400 inline" />
          </h1>
          <p className="text-gray-300 text-xs sm:text-sm max-w-xl leading-relaxed">
            Aquí tienes el resumen de tu empresa <strong className="text-white">{user?.company?.name}</strong>. Administra tus contactos, analiza tus embudos en tiempo real y supervisa el rendimiento de IA.
          </p>
        </div>

        <div className="flex items-center space-x-3 relative z-10 shrink-0">
          <button
            onClick={loadStats}
            className="p-3 bg-gray-900/80 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800 rounded-2xl transition shadow-lg"
            title="Actualizar datos"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
          <Link
            to="/inbox"
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-xl shadow-blue-500/25 transition duration-150 transform hover:-translate-y-0.5"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Bandeja Omnicanal</span>
          </Link>
          <Link
            to="/kanban"
            className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-xl shadow-indigo-500/25 transition duration-150 transform hover:-translate-y-0.5"
          >
            <Kanban className="h-4 w-4" />
            <span>Ver Tablero</span>
          </Link>
        </div>
      </div>

      {/* Interactive Onboarding Checklist */}
      <OnboardingChecklist />

      {loading && !stats ? (
        <div className="py-24 flex flex-col items-center justify-center text-gray-400 space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <span className="text-sm font-semibold">Calculando métricas del CRM...</span>
        </div>
      ) : stats ? (
        <>
          {/* 4 KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* KPI 1: Conversaciones Abiertas */}
            <div className="bg-[#0f111a] border border-gray-800/80 p-5 rounded-2xl shadow-xl flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                  Conversaciones
                </span>
                <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 group-hover:scale-110 transition">
                  <MessageSquare className="h-5 w-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-white">
                  {stats.summary.open_conversations}
                </div>
                <div className="flex items-center space-x-1.5 mt-1 text-[11px] text-blue-400 font-medium">
                  <Activity className="h-3.5 w-3.5" />
                  <span>Canales activos en tiempo real</span>
                </div>
              </div>
            </div>

            {/* KPI 2: Tickets por Estado */}
            <div className="bg-[#0f111a] border border-gray-800/80 p-5 rounded-2xl shadow-xl flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                  Tickets Soporte
                </span>
                <div className="p-2.5 bg-yellow-500/10 text-yellow-400 rounded-xl border border-yellow-500/20 group-hover:scale-110 transition">
                  <LifeBuoy className="h-5 w-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-white">
                  {totalTickets}
                </div>
                <div className="flex items-center space-x-2 mt-1 text-[11px] text-gray-400">
                  <span className="text-blue-400 font-bold">{openTickets} abtos</span>
                  <span>•</span>
                  <span className="text-yellow-400 font-bold">{pendingTickets} pend</span>
                </div>
              </div>
            </div>

            {/* KPI 3: Valor de Pipeline */}
            <div className="bg-[#0f111a] border border-gray-800/80 p-5 rounded-2xl shadow-xl flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                  Valor Pipeline
                </span>
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 group-hover:scale-110 transition">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-emerald-400">
                  ${stats.summary.open_pipeline_value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="flex items-center space-x-1.5 mt-1 text-[11px] text-gray-400 font-medium">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Ganados: ${stats.summary.won_deals_value.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                </div>
              </div>
            </div>

            {/* KPI 4: Uso de IA del Mes */}
            <div className="bg-[#0f111a] border border-gray-800/80 p-5 rounded-2xl shadow-xl flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                  Cuota de IA (Mes)
                </span>
                <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20 group-hover:scale-110 transition">
                  <Bot className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-white">
                    {stats.ai_usage.used}
                  </span>
                  <span className="text-xs font-bold text-gray-500">
                    / {stats.ai_usage.limit} msjs
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden border border-gray-800">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      stats.ai_usage.percentage > 85 ? 'bg-red-500' :
                      stats.ai_usage.percentage > 60 ? 'bg-yellow-500' :
                      'bg-gradient-to-r from-indigo-500 to-purple-500'
                    }`}
                    style={{ width: `${Math.min(100, stats.ai_usage.percentage)}%` }}
                  ></div>
                </div>
              </div>
            </div>

          </div>

          {/* Recharts Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 1: Bar Chart - Valor por Etapa (Takes 2 columns) */}
            <div className="lg:col-span-2 bg-[#0f111a] border border-gray-800/80 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-indigo-400" />
                    Valor de Embudos por Etapa
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Distribución económica de los deals abiertos en tu pipeline principal
                  </p>
                </div>
                {stats.active_pipeline && (
                  <span className="text-[11px] font-bold bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full">
                    {stats.active_pipeline.name}
                  </span>
                )}
              </div>

              <div className="h-72 w-full">
                {stats.pipeline_value_by_stage.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.pipeline_value_by_stage} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <XAxis dataKey="stage" stroke="#6b7280" fontSize={11} tickLine={false} />
                      <YAxis
                        stroke="#6b7280"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `$${val / 1000}k`}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#161824', borderColor: '#374151', borderRadius: '12px', fontSize: '12px' }}
                        formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Valor Total']}
                        labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500 text-xs italic">
                    No hay suficientes datos en el embudo comercial.
                  </div>
                )}
              </div>
            </div>

            {/* Chart 2: Pie Chart - Tickets por Estado (Takes 1 column) */}
            <div className="bg-[#0f111a] border border-gray-800/80 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center mb-1">
                  <LifeBuoy className="h-4 w-4 mr-2 text-yellow-400" />
                  Tickets por Estado
                </h3>
                <p className="text-xs text-gray-400">
                  Desglose del estado de atención de soporte
                </p>
              </div>

              <div className="h-64 w-full flex items-center justify-center my-2">
                {totalTickets > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.tickets_by_status}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {stats.tickets_by_status.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f111a" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#161824', borderColor: '#374151', borderRadius: '12px', fontSize: '12px' }}
                        formatter={(value: any) => [value, 'Tickets']}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => <span className="text-xs text-gray-300 font-medium ml-1">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500 text-xs italic">
                    No hay tickets registrados aún.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Quick Access Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Link
              to="/clients"
              className="bg-[#0f111a] border border-gray-800/80 hover:border-indigo-500/50 p-5 rounded-2xl flex items-center justify-between group transition shadow-lg cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 group-hover:scale-110 transition">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white group-hover:text-indigo-300 transition">Directorio CRM</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Gestión de {stats.summary.total_clients} clientes activos</p>
                </div>
              </div>
              <ArrowUpRight className="h-5 w-5 text-gray-500 group-hover:text-white transition transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>

            <Link
              to="/kanban"
              className="bg-[#0f111a] border border-gray-800/80 hover:border-purple-500/50 p-5 rounded-2xl flex items-center justify-between group transition shadow-lg cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20 group-hover:scale-110 transition">
                  <Kanban className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white group-hover:text-purple-300 transition">Embudos y Deals</h4>
                  <p className="text-xs text-gray-400 mt-0.5">{stats.summary.total_deals} deals en seguimiento</p>
                </div>
              </div>
              <ArrowUpRight className="h-5 w-5 text-gray-500 group-hover:text-white transition transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>

            <div className="bg-[#0f111a] border border-gray-800/80 p-5 rounded-2xl flex items-center justify-between opacity-75 cursor-not-allowed">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-gray-300">Conectar Canales</h4>
                  <p className="text-xs text-emerald-400/80 mt-0.5 font-semibold">Próximamente (Fase 3)</p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

    </div>
  );
};

export default Dashboard;

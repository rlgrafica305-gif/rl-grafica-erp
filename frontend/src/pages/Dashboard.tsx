import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingCart, DollarSign, Printer, AlertTriangle,
  TrendingUp, Package, Clock, CheckCircle, ShoppingBag,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { dashboardApi } from '@/services/api'
import { formatCurrency, formatDate, STATUS_PEDIDO_LABEL, STATUS_PEDIDO_COLOR } from '@/utils'
import type { DashboardData } from '@/types'

const STATUS_PIE_COLORS: Record<string, string> = {
  recebido:             '#3B82F6',
  aguardando_arte:      '#EAB308',
  aguardando_aprovacao: '#F97316',
  em_producao:          '#A855F7',
  finalizado:           '#22C55E',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get().then(r => r.data),
    refetchInterval: 60000,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const kpis = data?.kpis
  const pieData = Object.entries(data?.pedidos_por_status ?? {}).map(([name, value]) => ({
    name: STATUS_PEDIDO_LABEL[name] ?? name,
    value,
    color: STATUS_PIE_COLORS[name] ?? '#6B7280',
  }))

  const areaData = (data?.faturamento_mensal ?? []).map(m => ({
    mes: m.mes,
    faturamento: Number(m.total),
  }))

  return (
    <div className="space-y-6">
      {/* Logo header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="RL Gráfica" className="h-10 w-auto object-contain hidden sm:block" />
          <div>
            <h2 className="text-xl font-bold text-white">Dashboard</h2>
            <p className="text-sm text-gray-400">Visão geral em tempo real</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/venda-rapida')}
          className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white font-semibold px-4 py-2 rounded-lg transition-all text-sm shadow-lg shadow-primary/20"
        >
          <ShoppingBag size={16} />
          <span className="hidden sm:inline">Nova Venda</span>
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<ShoppingCart size={22} />}
          label="Pedidos Hoje"
          value={kpis?.pedidos_hoje ?? 0}
          color="text-blue-400"
          bg="bg-blue-500/10 border-blue-500/20"
        />
        <KpiCard
          icon={<DollarSign size={22} />}
          label="Faturamento Mês"
          value={formatCurrency(kpis?.faturamento_mes ?? 0)}
          color="text-green-400"
          bg="bg-green-500/10 border-green-500/20"
        />
        <KpiCard
          icon={<Printer size={22} />}
          label="Em Produção"
          value={kpis?.em_producao ?? 0}
          color="text-purple-400"
          bg="bg-purple-500/10 border-purple-500/20"
        />
        <KpiCard
          icon={<TrendingUp size={22} />}
          label="A Receber"
          value={formatCurrency(kpis?.a_receber ?? 0)}
          color="text-yellow-400"
          bg="bg-yellow-500/10 border-yellow-500/20"
        />
        <KpiCard
          icon={<AlertTriangle size={22} />}
          label="Pedidos Atrasados"
          value={kpis?.pedidos_atrasados ?? 0}
          color="text-red-400"
          bg="bg-red-500/10 border-red-500/20"
        />
        <KpiCard
          icon={<Clock size={22} />}
          label="Contas a Vencer (7d)"
          value={kpis?.contas_a_vencer ?? 0}
          color="text-orange-400"
          bg="bg-orange-500/10 border-orange-500/20"
        />
        <KpiCard
          icon={<Package size={22} />}
          label="Alertas Estoque"
          value={kpis?.alertas_estoque ?? 0}
          color="text-pink-400"
          bg="bg-pink-500/10 border-pink-500/20"
        />
        <KpiCard
          icon={<CheckCircle size={22} />}
          label="Saldo do Mês"
          value={formatCurrency(data?.saldo_mes?.saldo ?? 0)}
          color={(data?.saldo_mes?.saldo ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}
          bg="bg-emerald-500/10 border-emerald-500/20"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Faturamento */}
        <div className="card lg:col-span-2">
          <h3 className="text-base font-semibold text-white mb-4">Faturamento — Últimos 6 Meses</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={areaData}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D81B60" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#D81B60" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
              <XAxis dataKey="mes" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#161B22', border: '1px solid #21262D', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
                formatter={(v: number) => [formatCurrency(v), 'Faturamento']}
              />
              <Area type="monotone" dataKey="faturamento" stroke="#D81B60" strokeWidth={2} fill="url(#grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pedidos por status */}
        <div className="card">
          <h3 className="text-base font-semibold text-white mb-4">Pedidos em Aberto</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3}>
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#161B22', border: '1px solid #21262D', borderRadius: '8px' }}
                formatter={(v: number, name: string) => [v, name]}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#9CA3AF' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Últimos pedidos */}
      <div className="card">
        <h3 className="text-base font-semibold text-white mb-4">Últimos Pedidos</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Cliente</th>
                <th>Status</th>
                <th>Prazo</th>
                <th>Total</th>
                <th>Vendedor</th>
              </tr>
            </thead>
            <tbody>
              {data?.ultimos_pedidos?.map(pedido => (
                <tr key={pedido.id}>
                  <td className="font-mono text-xs text-gray-300">{pedido.numero}</td>
                  <td className="font-medium text-white">{pedido.cliente?.nome}</td>
                  <td>
                    <span className={`badge ${STATUS_PEDIDO_COLOR[pedido.status]}`}>
                      {STATUS_PEDIDO_LABEL[pedido.status]}
                    </span>
                  </td>
                  <td className="text-gray-300">{formatDate(pedido.prazo_entrega)}</td>
                  <td className="font-semibold text-green-400">{formatCurrency(pedido.total)}</td>
                  <td className="text-gray-300">{pedido.vendedor?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ icon, label, value, color, bg }: {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
  bg: string
}) {
  return (
    <div className={`card border ${bg} flex items-center gap-4`}>
      <div className={`${color} ${bg} p-2.5 rounded-lg border`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { relatoriosApi } from '@/services/api'
import { formatCurrency, formatDate } from '@/utils'

const today = new Date()
const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
const lastDay  = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]

export default function RelatoriosDashboard() {
  const [aba,   setAba]   = useState<'produtos' | 'clientes' | 'lucro' | 'vendedores'>('lucro')
  const [inicio, setInicio] = useState(firstDay)
  const [fim,    setFim]    = useState(lastDay)

  const params = { inicio, fim }

  const { data: lucro } = useQuery({
    queryKey: ['rel-lucro', inicio, fim],
    queryFn: () => relatoriosApi.lucroPeriodo({ ...params, agrupar: 'dia' }).then(r => r.data),
    enabled: aba === 'lucro',
  })

  const { data: produtos } = useQuery({
    queryKey: ['rel-produtos', inicio, fim],
    queryFn: () => relatoriosApi.produtosMaisVendidos(params).then(r => r.data),
    enabled: aba === 'produtos',
  })

  const { data: clientes } = useQuery({
    queryKey: ['rel-clientes', inicio, fim],
    queryFn: () => relatoriosApi.clientesTop(params).then(r => r.data),
    enabled: aba === 'clientes',
  })

  const { data: vendedores } = useQuery({
    queryKey: ['rel-vendedores', inicio, fim],
    queryFn: () => relatoriosApi.desempenhoVendedores(params).then(r => r.data),
    enabled: aba === 'vendedores',
  })

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Relatórios</h2>

      {/* Filtro de período */}
      <div className="card flex flex-wrap gap-4 items-end">
        <div>
          <label className="label">Data Início</label>
          <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Data Fim</label>
          <input type="date" value={fim} onChange={e => setFim(e.target.value)} className="input" />
        </div>
      </div>

      {/* Abas */}
      <div className="flex border-b border-brand-dark-border gap-1 flex-wrap">
        {([
          ['lucro',     'Faturamento'],
          ['produtos',  'Produtos'],
          ['clientes',  'Clientes'],
          ['vendedores','Vendedores'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setAba(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              aba === key ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Faturamento */}
      {aba === 'lucro' && lucro && (
        <div className="card">
          <h3 className="text-base font-semibold text-white mb-1">Faturamento por Dia</h3>
          <p className="text-sm text-gray-400 mb-4">
            Total: {formatCurrency(lucro.total_periodo?.faturamento ?? 0)} · {lucro.total_periodo?.pedidos ?? 0} pedidos
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={lucro.dados}>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
              <XAxis dataKey="periodo" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#161B22', border: '1px solid #21262D', borderRadius: '8px' }}
                formatter={(v: number) => [formatCurrency(v), 'Faturamento']}
              />
              <Bar dataKey="faturamento" fill="#D81B60" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Produtos mais vendidos */}
      {aba === 'produtos' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Produto</th>
                <th>Qtd Vendida</th>
                <th>Pedidos</th>
                <th>Total Faturado</th>
              </tr>
            </thead>
            <tbody>
              {produtos?.map((p: any, i: number) => (
                <tr key={p.produto_id}>
                  <td className="text-gray-500 font-bold">{i + 1}</td>
                  <td className="font-medium text-white">{p.produto?.nome ?? 'Sem nome'}</td>
                  <td className="text-gray-300">{Number(p.total_quantidade).toFixed(0)}</td>
                  <td className="text-gray-300">{p.total_pedidos}</td>
                  <td className="font-semibold text-green-400">{formatCurrency(p.total_faturado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Clientes top */}
      {aba === 'clientes' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Pedidos</th>
                <th>Total Gasto</th>
              </tr>
            </thead>
            <tbody>
              {clientes?.map((c: any, i: number) => (
                <tr key={c.cliente_id}>
                  <td className="text-gray-500 font-bold">{i + 1}</td>
                  <td className="font-medium text-white">{c.cliente?.nome}</td>
                  <td className="text-gray-300">{c.total_pedidos}</td>
                  <td className="font-semibold text-green-400">{formatCurrency(c.total_gasto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Desempenho vendedores */}
      {aba === 'vendedores' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Vendedor</th>
                <th>Pedidos</th>
                <th>Ticket Médio</th>
                <th>Entregues</th>
                <th>Total Vendido</th>
              </tr>
            </thead>
            <tbody>
              {vendedores?.map((v: any) => (
                <tr key={v.vendedor_id}>
                  <td className="font-medium text-white">{v.vendedor?.name}</td>
                  <td className="text-gray-300">{v.total_pedidos}</td>
                  <td className="text-gray-300">{formatCurrency(v.ticket_medio)}</td>
                  <td className="text-gray-300">{v.entregues}</td>
                  <td className="font-semibold text-green-400">{formatCurrency(v.total_vendido)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

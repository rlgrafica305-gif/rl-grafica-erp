import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingBag, Search, TrendingUp, DollarSign, Package, Plus,
  ChevronLeft, ChevronRight, Eye,
} from 'lucide-react'
import { api } from '@/services/api'
import { formatCurrency } from '@/utils'
import type { Pedido, Pagination } from '@/types'

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  recebido:              { label: 'Recebido',          cls: 'bg-blue-500/20 text-blue-300' },
  aguardando_arte:       { label: 'Ag. Arte',          cls: 'bg-yellow-500/20 text-yellow-300' },
  aguardando_aprovacao:  { label: 'Ag. Aprovação',     cls: 'bg-orange-500/20 text-orange-300' },
  em_producao:           { label: 'Em Produção',       cls: 'bg-purple-500/20 text-purple-300' },
  finalizado:            { label: 'Finalizado',        cls: 'bg-emerald-500/20 text-emerald-300' },
  entregue:              { label: 'Entregue',          cls: 'bg-emerald-600/20 text-emerald-400' },
  cancelado:             { label: 'Cancelado',         cls: 'bg-red-500/20 text-red-300' },
}

export default function VendasLista() {
  const navigate = useNavigate()
  const [pagina, setPagina]   = useState(1)
  const [busca, setBusca]     = useState('')
  const [status, setStatus]   = useState('')

  const { data, isLoading } = useQuery<Pagination<Pedido>>({
    queryKey: ['vendas', pagina, busca, status],
    queryFn: () =>
      api.get('/pedidos', { params: { page: pagina, busca: busca || undefined, status: status || undefined } })
         .then(r => r.data),
    staleTime: 30_000,
  })

  const vendas = data?.data ?? []
  const totalRegistros = data?.total ?? 0
  const ultimaPagina   = data?.last_page ?? 1

  const totalFaturado = vendas.reduce((s, v) => s + Number(v.total), 0)

  return (
    <div className="space-y-5">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 border border-primary/30 p-2.5 rounded-lg">
            <ShoppingBag size={22} className="text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Vendas</h2>
            <p className="text-sm text-gray-400">Histórico de todas as vendas realizadas</p>
          </div>
        </div>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => navigate('/venda-rapida')}
        >
          <Plus size={16} /> Nova Venda
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="bg-emerald-500/20 p-3 rounded-lg">
            <DollarSign size={22} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Faturado (página)</p>
            <p className="text-xl font-bold text-white">{formatCurrency(totalFaturado)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="bg-blue-500/20 p-3 rounded-lg">
            <TrendingUp size={22} className="text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Vendas na página</p>
            <p className="text-xl font-bold text-white">{vendas.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="bg-purple-500/20 p-3 rounded-lg">
            <Package size={22} className="text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Total de registros</p>
            <p className="text-xl font-bold text-white">{totalRegistros}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9 w-full"
            placeholder="Buscar por cliente ou número..."
            value={busca}
            onChange={e => { setBusca(e.target.value); setPagina(1) }}
          />
        </div>
        <select
          className="input w-full sm:w-48"
          value={status}
          onChange={e => { setStatus(e.target.value); setPagina(1) }}
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Tabela */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-dark-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Número</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Data</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Pagamento</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Pgto Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Total</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status Pedido</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      Carregando...
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && vendas.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    Nenhuma venda encontrada.
                  </td>
                </tr>
              )}
              {vendas.map(venda => {
                const st = STATUS_LABEL[venda.status] ?? { label: venda.status, cls: 'bg-gray-500/20 text-gray-300' }
                return (
                  <tr key={venda.id} className="border-b border-brand-dark-border/50 hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-primary text-xs">{venda.numero}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{venda.cliente?.nome ?? '—'}</p>
                      <p className="text-xs text-gray-500">{venda.cliente?.telefone ?? ''}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">
                      {new Date(venda.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-xs hidden md:table-cell">
                      {venda.forma_pagamento ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      {(() => {
                        const sp = venda.status_pagamento ?? 'aguardando_pagamento'
                        const [lbl, cls] = sp === 'pago'
                          ? ['Pago',            'bg-emerald-500/20 text-emerald-400']
                          : sp === 'sinal_entrada'
                          ? ['Sinal',           'bg-yellow-500/20 text-yellow-400']
                          : ['Aguardando',      'bg-orange-500/20 text-orange-400']
                        return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{lbl}</span>
                      })()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-emerald-400">{formatCurrency(Number(venda.total))}</span>
                      {Number(venda.desconto_percentual) > 0 && (
                        <p className="text-xs text-gray-500 line-through">{formatCurrency(Number(venda.subtotal))}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${st.cls}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="text-gray-500 hover:text-primary transition-colors"
                        title="Ver detalhes"
                        onClick={() => navigate(`/pedidos/${venda.id}`)}
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {ultimaPagina > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-brand-dark-border">
            <p className="text-xs text-gray-500">
              Página {pagina} de {ultimaPagina} — {totalRegistros} registros
            </p>
            <div className="flex gap-2">
              <button
                className="btn-secondary flex items-center gap-1 text-xs py-1.5 px-3 disabled:opacity-40"
                disabled={pagina === 1}
                onClick={() => setPagina(p => p - 1)}
              >
                <ChevronLeft size={14} /> Anterior
              </button>
              <button
                className="btn-secondary flex items-center gap-1 text-xs py-1.5 px-3 disabled:opacity-40"
                disabled={pagina === ultimaPagina}
                onClick={() => setPagina(p => p + 1)}
              >
                Próxima <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

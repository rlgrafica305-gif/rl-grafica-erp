import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Eye, Filter } from 'lucide-react'
import { pedidosApi } from '@/services/api'
import { formatCurrency, formatDate, STATUS_PEDIDO_LABEL, STATUS_PEDIDO_COLOR } from '@/utils'
import type { Pedido } from '@/types'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'recebido',             label: 'Recebido' },
  { value: 'aguardando_arte',      label: 'Aguardando Arte' },
  { value: 'aguardando_aprovacao', label: 'Aguardando Aprovação' },
  { value: 'em_producao',          label: 'Em Produção' },
  { value: 'finalizado',           label: 'Finalizado' },
  { value: 'entregue',             label: 'Entregue' },
  { value: 'cancelado',            label: 'Cancelado' },
]

export default function PedidosLista() {
  const [busca,  setBusca]  = useState('')
  const [status, setStatus] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['pedidos', busca, status],
    queryFn: () => pedidosApi.list({ busca, status, per_page: 20 }).then(r => r.data),
    placeholderData: prev => prev,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => pedidosApi.mudarStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pedidos'] }),
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Pedidos</h2>
          <p className="text-sm text-gray-400">{data?.total ?? 0} pedidos</p>
        </div>
        <Link to="/pedidos/novo" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Novo Pedido
        </Link>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por número ou cliente..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <select value={status} onChange={e => setStatus(e.target.value)} className="select pl-9 pr-8 w-full sm:w-52">
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : (
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
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((pedido: Pedido) => (
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
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/pedidos/${pedido.id}`} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded">
                          <Eye size={15} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.data?.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-500">Nenhum pedido encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

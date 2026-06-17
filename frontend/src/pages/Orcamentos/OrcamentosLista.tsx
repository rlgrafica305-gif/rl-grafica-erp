import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Filter, Trash2, ClipboardList, History } from 'lucide-react'
import { orcamentosApi } from '@/services/api'
import { formatCurrency, formatDate, STATUS_ORCAMENTO_LABEL } from '@/utils'
import type { Orcamento } from '@/types'
import OrcamentoFormulario from './OrcamentoFormulario'

const STATUS_COLOR: Record<string, string> = {
  pendente:   'bg-yellow-500/20 text-yellow-400',
  enviado:    'bg-blue-500/20 text-blue-400',
  aprovado:   'bg-green-500/20 text-green-400',
  rejeitado:  'bg-red-500/20 text-red-400',
  convertido: 'bg-emerald-500/20 text-emerald-400',
  expirado:   'bg-gray-500/20 text-gray-400',
}

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'pendente',   label: 'Pendente' },
  { value: 'enviado',    label: 'Enviado' },
  { value: 'aprovado',   label: 'Aprovado' },
  { value: 'rejeitado',  label: 'Rejeitado' },
  { value: 'convertido', label: 'Convertido' },
  { value: 'expirado',   label: 'Expirado' },
]

export default function OrcamentosLista() {
  const [aba, setAba]       = useState<'emitir' | 'historico'>('emitir')
  const [busca, setBusca]   = useState('')
  const [status, setStatus] = useState('')

  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['orcamentos', busca, status],
    queryFn: () => orcamentosApi.list({ busca, status, per_page: 50 }).then(r => r.data),
    placeholderData: prev => prev,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => orcamentosApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orcamentos'] }),
  })

  const handleDelete = (orc: Orcamento) => {
    if (!confirm(`Excluir o orçamento ${orc.numero}?`)) return
    deleteMutation.mutate(orc.id)
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-white">Orçamentos</h2>
        <div className="flex items-center gap-2">
          {aba === 'emitir' && (
            <button onClick={() => setAba('historico')} className="btn-secondary flex items-center gap-2 text-sm">
              <History size={15} /> Ver Histórico
            </button>
          )}
          {aba === 'historico' && (
            <button onClick={() => setAba('emitir')} className="btn-secondary flex items-center gap-2 text-sm">
              <ClipboardList size={15} /> Emitir Orçamento/Recibo
            </button>
          )}
        </div>
      </div>

      {/* Formulário */}
      {aba === 'emitir' && <OrcamentoFormulario />}

      {/* Histórico */}
      {aba === 'historico' && (
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
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="select pl-9 pr-8 w-full sm:w-52"
              >
                {STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
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
                    <th>Data</th>
                    <th>Total</th>
                    <th>Vendedor</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data?.map((orc: Orcamento) => (
                    <tr key={orc.id}>
                      <td className="font-mono text-xs text-gray-300">{orc.numero}</td>
                      <td className="font-medium text-white">{orc.cliente?.nome}</td>
                      <td>
                        <span className={`badge ${STATUS_COLOR[orc.status]}`}>
                          {STATUS_ORCAMENTO_LABEL[orc.status]}
                        </span>
                      </td>
                      <td className="text-gray-300">{formatDate(orc.created_at)}</td>
                      <td className="font-semibold text-green-400">{formatCurrency(orc.total)}</td>
                      <td className="text-gray-300">{orc.vendedor?.name}</td>
                      <td>
                        <div className="flex items-center justify-end">
                          {!['convertido', 'expirado'].includes(orc.status) && (
                            <button
                              onClick={() => handleDelete(orc)}
                              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded"
                              title="Excluir"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {data?.data?.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">
                        Nenhum orçamento encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

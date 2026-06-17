import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Package, AlertTriangle, Plus, TrendingUp, TrendingDown } from 'lucide-react'
import { estoqueApi } from '@/services/api'
import { formatCurrency } from '@/utils'
import type { Insumo } from '@/types'

export default function EstoqueControle() {
  const [aba, setAba] = useState<'insumos' | 'fornecedores' | 'alertas'>('insumos')
  const [busca, setBusca] = useState('')
  const qc = useQueryClient()

  const { data: insumos, isLoading } = useQuery({
    queryKey: ['insumos', busca, aba],
    queryFn: () => estoqueApi.insumos({ busca, per_page: 30 }).then(r => r.data),
    enabled: aba === 'insumos',
  })

  const { data: alertas } = useQuery({
    queryKey: ['alertas-estoque'],
    queryFn: () => estoqueApi.alertas().then(r => r.data),
    enabled: aba === 'alertas',
  })

  const movMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) => estoqueApi.movimentar(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['insumos'] }),
  })

  const handleMovimentar = (insumo: Insumo, tipo: 'entrada' | 'saida') => {
    const qtd = prompt(`Quantidade para ${tipo === 'entrada' ? 'entrada' : 'saída'} (${insumo.unidade_medida}):`)
    if (!qtd || isNaN(Number(qtd))) return
    movMutation.mutate({
      id: insumo.id,
      data: {
        tipo,
        quantidade: Number(qtd),
        data_movimentacao: new Date().toISOString().split('T')[0],
        motivo: tipo === 'entrada' ? 'Compra' : 'Consumo produção',
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Estoque</h2>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Novo Insumo
        </button>
      </div>

      <div className="flex border-b border-brand-dark-border gap-1">
        {([['insumos','Insumos'],['alertas','Alertas'],['fornecedores','Fornecedores']] as const).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setAba(k)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              aba === k ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {aba === 'alertas' && (
        <div className="space-y-3">
          {alertas?.length === 0 && (
            <div className="card text-center py-8">
              <p className="text-green-400 font-medium">Nenhum alerta de estoque!</p>
            </div>
          )}
          {alertas?.map((insumo: Insumo) => (
            <div key={insumo.id} className="card border border-yellow-500/30 bg-yellow-500/5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle size={18} className="text-yellow-400 shrink-0" />
                <div>
                  <p className="font-medium text-white">{insumo.nome}</p>
                  <p className="text-sm text-yellow-400">
                    Atual: {insumo.quantidade_atual} {insumo.unidade_medida} · Mínimo: {insumo.estoque_minimo} {insumo.unidade_medida}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleMovimentar(insumo, 'entrada')}
                className="btn-secondary text-sm"
              >
                Entrada
              </button>
            </div>
          ))}
        </div>
      )}

      {aba === 'insumos' && (
        <>
          <input
            type="text"
            placeholder="Buscar insumo..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="input"
          />
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Insumo</th>
                    <th>Código</th>
                    <th>Unidade</th>
                    <th>Estoque Atual</th>
                    <th>Est. Mínimo</th>
                    <th>Custo Unit.</th>
                    <th>Status</th>
                    <th>Movimentar</th>
                  </tr>
                </thead>
                <tbody>
                  {insumos?.data?.map((insumo: Insumo) => (
                    <tr key={insumo.id}>
                      <td>
                        <p className="font-medium text-white">{insumo.nome}</p>
                        <p className="text-xs text-gray-500">{insumo.fornecedor?.nome}</p>
                      </td>
                      <td className="font-mono text-xs text-gray-400">{insumo.codigo ?? '—'}</td>
                      <td className="text-gray-300">{insumo.unidade_medida}</td>
                      <td className={`font-semibold ${insumo.em_alerta ? 'text-yellow-400' : 'text-white'}`}>
                        {Number(insumo.quantidade_atual).toFixed(2)}
                        {insumo.em_alerta && <AlertTriangle size={12} className="inline ml-1 text-yellow-400" />}
                      </td>
                      <td className="text-gray-400">{Number(insumo.estoque_minimo).toFixed(2)}</td>
                      <td className="text-gray-300">{formatCurrency(insumo.custo_unitario)}</td>
                      <td>
                        <span className={`badge ${insumo.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                          {insumo.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleMovimentar(insumo, 'entrada')}
                            className="p-1.5 text-green-400 hover:bg-green-500/20 rounded"
                            title="Entrada"
                          >
                            <TrendingUp size={14} />
                          </button>
                          <button
                            onClick={() => handleMovimentar(insumo, 'saida')}
                            className="p-1.5 text-red-400 hover:bg-red-500/20 rounded"
                            title="Saída"
                          >
                            <TrendingDown size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

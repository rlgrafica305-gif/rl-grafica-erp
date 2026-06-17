import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Play, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { producaoApi } from '@/services/api'
import { formatDate, SETOR_LABEL } from '@/utils'
import type { Producao } from '@/types'

const SETORES = ['pre_impressao', 'impressao', 'acabamento', 'embalagem', 'expedicao'] as const

const STATUS_COLOR: Record<string, string> = {
  na_fila:     'border-l-blue-500',
  em_andamento:'border-l-yellow-500',
  concluido:   'border-l-green-500',
  pausado:     'border-l-red-500',
}

export default function ProducaoKanban() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['producao-fila'],
    queryFn: () => producaoApi.fila().then(r => r.data),
    refetchInterval: 30000,
  })

  const iniciarMutation = useMutation({
    mutationFn: (id: number) => producaoApi.iniciar(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['producao-fila'] }),
  })

  const concluirMutation = useMutation({
    mutationFn: (id: number) => producaoApi.concluir(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['producao-fila'] }),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Fila de Produção</h2>
        <p className="text-sm text-gray-400">Controle em tempo real por setor</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {SETORES.map(setor => {
          const items: Producao[] = data?.[setor] ?? []
          return (
            <div key={setor} className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">{SETOR_LABEL[setor]}</h3>
                <span className="badge bg-white/10 text-gray-300">{items.length}</span>
              </div>

              <div className="space-y-3">
                {items.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">Fila vazia</p>
                )}
                {items.map(item => (
                  <div
                    key={item.id}
                    className={`bg-brand-dark rounded-lg p-3 border-l-4 ${STATUS_COLOR[item.status]}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-gray-400">{item.pedido?.numero}</p>
                        <p className="font-medium text-white text-sm truncate">{item.pedido?.cliente?.nome}</p>
                        {item.prazo && (
                          <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                            <Clock size={11} /> {formatDate(item.prazo)}
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-1">
                          <span className={`badge text-xs ${
                            item.prioridade <= 2 ? 'bg-red-500/20 text-red-400' :
                            item.prioridade <= 5 ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            P{item.prioridade}
                          </span>
                          {item.status === 'em_andamento' && (
                            <span className="badge bg-yellow-500/20 text-yellow-400 text-xs">Em andamento</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        {item.status === 'na_fila' && (
                          <button
                            onClick={() => iniciarMutation.mutate(item.id)}
                            className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                            title="Iniciar"
                          >
                            <Play size={14} />
                          </button>
                        )}
                        {item.status === 'em_andamento' && (
                          <button
                            onClick={() => concluirMutation.mutate(item.id)}
                            className="p-1.5 text-green-400 hover:bg-green-500/20 rounded transition-colors"
                            title="Concluir"
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

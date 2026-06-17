import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, Upload, Eye, Loader2, FileImage, FileText, Paperclip } from 'lucide-react'
import { artesApi } from '@/services/api'
import { formatDateTime, STATUS_ARTE_LABEL } from '@/utils'
import type { Arte } from '@/types'

const STATUS_COLOR: Record<string, string> = {
  aguardando_envio:       'bg-gray-500/20 text-gray-400',
  em_desenvolvimento:     'bg-blue-500/20 text-blue-400',
  aguardando_aprovacao:   'bg-yellow-500/20 text-yellow-400',
  aprovada:               'bg-green-500/20 text-green-400',
  rejeitada:              'bg-red-500/20 text-red-400',
  reenvio_solicitado:     'bg-orange-500/20 text-orange-400',
}

function UploadCliente({ arte }: { arte: Arte }) {
  const qc         = useQueryClient()
  const inputRef   = useRef<HTMLInputElement>(null)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [erro, setErro]       = useState('')

  const uploadMutation = useMutation({
    mutationFn: (file: File) => artesApi.uploadCliente(arte.id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['artes'] })
      setArquivo(null)
      setErro('')
    },
    onError: () => setErro('Erro ao enviar arquivo. Tente novamente.'),
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
    if (!allowed.includes(file.type)) {
      setErro('Formato inválido. Use PDF, PNG ou JPG.')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setErro('Arquivo muito grande. Máximo 20 MB.')
      return
    }
    setErro('')
    setArquivo(file)
  }

  function handleEnviar() {
    if (arquivo) uploadMutation.mutate(arquivo)
  }

  const ext = arquivo?.name.split('.').pop()?.toUpperCase()
  const Icon = arquivo?.type === 'application/pdf' ? FileText : FileImage

  return (
    <div className="pt-2 border-t border-brand-dark-border space-y-2">
      <p className="text-xs font-semibold text-gray-400 flex items-center gap-1">
        <Paperclip size={12} /> Enviar arquivo da arte
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        className="hidden"
        onChange={handleChange}
      />

      {!arquivo ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-brand-dark-border hover:border-primary text-gray-400 hover:text-primary text-xs py-3 rounded-lg transition-colors"
        >
          <Upload size={14} />
          Selecionar arquivo (PDF, PNG, JPG)
        </button>
      ) : (
        <div className="bg-white/5 rounded-lg px-3 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Icon size={16} className="text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-white truncate">{arquivo.name}</p>
              <p className="text-xs text-gray-500">{ext} · {(arquivo.size / 1024).toFixed(0)} KB</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setArquivo(null); if (inputRef.current) inputRef.current.value = '' }}
            className="text-gray-500 hover:text-red-400 text-xs shrink-0"
          >
            Trocar
          </button>
        </div>
      )}

      {erro && <p className="text-xs text-red-400">{erro}</p>}

      {arquivo && (
        <button
          type="button"
          onClick={handleEnviar}
          disabled={uploadMutation.isPending}
          className="w-full flex items-center justify-center gap-2 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary text-xs py-2.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {uploadMutation.isPending
            ? <><Loader2 size={13} className="animate-spin" /> Enviando...</>
            : <><Upload size={13} /> Enviar Arquivo</>
          }
        </button>
      )}
    </div>
  )
}

export default function ArtesGerenciamento() {
  const [status, setStatus] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['artes', status],
    queryFn: () => artesApi.list({ status, per_page: 30 }).then(r => r.data),
    placeholderData: prev => prev,
  })

  const aprovarMutation = useMutation({
    mutationFn: (id: number) => artesApi.aprovar(id, 'Arte aprovada pelo cliente.'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['artes'] }),
  })

  const rejeitarMutation = useMutation({
    mutationFn: ({ id, comentario }: { id: number; comentario: string }) =>
      artesApi.rejeitar(id, comentario),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['artes'] }),
  })

  const handleRejeitar = (arte: Arte) => {
    const motivo = prompt('Motivo da rejeição (descreva o que precisa ser alterado):')
    if (!motivo) return
    rejeitarMutation.mutate({ id: arte.id, comentario: motivo })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Gestão de Artes</h2>
      </div>

      {/* Filtro status */}
      <div className="flex flex-wrap gap-2">
        {[
          ['', 'Todas'],
          ['aguardando_envio', 'Aguardando Envio'],
          ['em_desenvolvimento', 'Em Desenvolvimento'],
          ['aguardando_aprovacao', 'Aguardando Aprovação'],
          ['aprovada', 'Aprovadas'],
          ['rejeitada', 'Rejeitadas'],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setStatus(v)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              status === v
                ? 'bg-primary border-primary text-white'
                : 'border-brand-dark-border text-gray-400 hover:text-white hover:border-gray-600'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data?.data?.map((arte: Arte) => (
            <div key={arte.id} className="card space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-xs text-gray-400">{arte.pedido?.numero}</p>
                  <p className="font-semibold text-white">{arte.pedido?.cliente?.nome}</p>
                  <span className={`badge ${STATUS_COLOR[arte.status]} mt-1`}>
                    {STATUS_ARTE_LABEL[arte.status]}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Rev. {arte.numero_revisao}</p>
                  {arte.designer && (
                    <p className="text-xs text-gray-400">{arte.designer.name}</p>
                  )}
                </div>
              </div>

              {arte.briefing && (
                <div className="bg-brand-dark rounded p-2.5">
                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">{arte.briefing}</p>
                </div>
              )}

              <div className="flex gap-2">
                {arte.arquivo_cliente_url && (
                  <a
                    href={arte.arquivo_cliente_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-3 py-1.5 rounded transition-colors"
                  >
                    <Eye size={12} /> Arte Cliente
                  </a>
                )}
                {arte.arquivo_final_url && (
                  <a
                    href={arte.arquivo_final_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 px-3 py-1.5 rounded transition-colors"
                  >
                    <Eye size={12} /> Arte Final
                  </a>
                )}
              </div>

              {arte.status === 'aguardando_envio' && (
                <UploadCliente arte={arte} />
              )}

              {arte.status === 'aguardando_aprovacao' && (
                <div className="flex gap-2 pt-2 border-t border-brand-dark-border">
                  <button
                    onClick={() => aprovarMutation.mutate(arte.id)}
                    className="flex-1 flex items-center justify-center gap-1 text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 py-2 rounded transition-colors"
                  >
                    <CheckCircle size={13} /> Aprovar
                  </button>
                  <button
                    onClick={() => handleRejeitar(arte)}
                    className="flex-1 flex items-center justify-center gap-1 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 py-2 rounded transition-colors"
                  >
                    <XCircle size={13} /> Rejeitar
                  </button>
                </div>
              )}

              <p className="text-xs text-gray-600">{formatDateTime(arte.created_at)}</p>
            </div>
          ))}
          {data?.data?.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              Nenhuma arte encontrada com este filtro.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

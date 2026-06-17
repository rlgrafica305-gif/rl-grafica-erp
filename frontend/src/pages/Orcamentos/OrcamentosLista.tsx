import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Search, Filter, Eye, Trash2, ArrowRight,
  ChevronDown, X, Check, Send, XCircle, FileText, ClipboardList, History,
} from 'lucide-react'
import { orcamentosApi, clientesApi, produtosApi } from '@/services/api'
import {
  formatCurrency, formatDate,
  STATUS_ORCAMENTO_LABEL,
} from '@/utils'
import type { Orcamento, OrcamentoItem, Cliente, Produto } from '@/types'
import OrcamentoFormulario from './OrcamentoFormulario'

// ─── Constantes ──────────────────────────────────────────────────────────────

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

const FORMA_PAGAMENTO_OPTIONS = [
  { value: 'dinheiro',       label: 'Dinheiro' },
  { value: 'pix',            label: 'PIX' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito',  label: 'Cartão de Débito' },
  { value: 'boleto',         label: 'Boleto' },
  { value: 'transferencia',  label: 'Transferência' },
  { value: 'a_prazo',        label: 'A Prazo' },
]

const ITEM_VAZIO: Omit<OrcamentoItem, 'id' | 'subtotal'> = {
  descricao: '',
  quantidade: 1,
  preco_unitario: 0,
  largura: undefined,
  altura: undefined,
  cor: '',
  acabamento: '',
  papel_material: '',
  observacoes: '',
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function OrcamentosLista() {
  const [aba, setAba]       = useState<'emitir' | 'historico'>('emitir')
  const [busca, setBusca]   = useState('')
  const [status, setStatus] = useState('')

  // Modals
  const [modalNovo, setModalNovo]             = useState(false)
  const [modalDetalhe, setModalDetalhe]       = useState<Orcamento | null>(null)
  const [modalConverter, setModalConverter]   = useState<Orcamento | null>(null)

  const qc = useQueryClient()

  // ─── Queries ───────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ['orcamentos', busca, status],
    queryFn: () => orcamentosApi.list({ busca, status, per_page: 20 }).then(r => r.data),
    placeholderData: prev => prev,
  })

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      orcamentosApi.mudarStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orcamentos'] })
      if (modalDetalhe) {
        orcamentosApi.get(modalDetalhe.id).then(r => setModalDetalhe(r.data))
      }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => orcamentosApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orcamentos'] }),
  })

  const handleDelete = (orc: Orcamento) => {
    if (!confirm(`Excluir o orçamento ${orc.numero}?`)) return
    deleteMutation.mutate(orc.id)
  }

  const handleVerDetalhe = (orc: Orcamento) => {
    orcamentosApi.get(orc.id).then(r => setModalDetalhe(r.data))
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-white">Orçamentos</h2>
        <div className="flex items-center gap-2">
          {aba === 'historico' && (
            <>
              <button
                onClick={() => setAba('emitir')}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <ClipboardList size={15} /> Emitir Orçamento/Recibo
              </button>
              <button onClick={() => setModalNovo(true)} className="btn-primary flex items-center gap-2 text-sm">
                <Plus size={15} /> Novo Orçamento
              </button>
            </>
          )}
          {aba === 'emitir' && (
            <button
              onClick={() => setAba('historico')}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <History size={15} /> Ver Histórico
            </button>
          )}
        </div>
      </div>

      {/* Formulário de emissão */}
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
                    <th>Validade</th>
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
                      <td className="text-gray-300">{formatDate(orc.validade)}</td>
                      <td className="font-semibold text-green-400">{formatCurrency(orc.total)}</td>
                      <td className="text-gray-300">{orc.vendedor?.name}</td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleVerDetalhe(orc)}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded"
                            title="Ver detalhes"
                          >
                            <Eye size={15} />
                          </button>
                          {orc.status === 'aprovado' && (
                            <button
                              onClick={() => setModalConverter(orc)}
                              className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded"
                              title="Converter em pedido"
                            >
                              <ArrowRight size={15} />
                            </button>
                          )}
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

      {/* Modals */}
      {modalNovo && (
        <ModalNovoOrcamento
          onClose={() => setModalNovo(false)}
          onSuccess={() => {
            setModalNovo(false)
            qc.invalidateQueries({ queryKey: ['orcamentos'] })
          }}
        />
      )}

      {modalDetalhe && (
        <ModalDetalheOrcamento
          orcamento={modalDetalhe}
          onClose={() => setModalDetalhe(null)}
          onMudarStatus={(id, s) => statusMutation.mutate({ id, status: s })}
          onConverter={() => {
            setModalConverter(modalDetalhe)
            setModalDetalhe(null)
          }}
          onDelete={() => {
            handleDelete(modalDetalhe)
            setModalDetalhe(null)
          }}
          isChangingStatus={statusMutation.isPending}
        />
      )}

      {modalConverter && (
        <ModalConverterPedido
          orcamento={modalConverter}
          onClose={() => setModalConverter(null)}
          onSuccess={() => {
            setModalConverter(null)
            qc.invalidateQueries({ queryKey: ['orcamentos'] })
          }}
        />
      )}
    </div>
  )
}

// ─── Modal Novo Orçamento ─────────────────────────────────────────────────────

interface ModalNovoOrcamentoProps {
  onClose: () => void
  onSuccess: () => void
}

function ModalNovoOrcamento({ onClose, onSuccess }: ModalNovoOrcamentoProps) {
  const [clienteId, setClienteId]         = useState('')
  const [validade, setValidade]           = useState('')
  const [descontoPerc, setDescontoPerc]   = useState('0')
  const [descontoValor, setDescontoValor] = useState('0')
  const [observacoes, setObservacoes]     = useState('')
  const [condicoes, setCondicoes]         = useState('')
  const [itens, setItens]                 = useState<Array<Omit<OrcamentoItem, 'id' | 'subtotal'>>>([{ ...ITEM_VAZIO }])
  const [buscaCliente, setBuscaCliente]   = useState('')
  const [saving, setSaving]               = useState(false)
  const [erro, setErro]                   = useState<string | null>(null)

  const { data: clientes } = useQuery({
    queryKey: ['clientes-select', buscaCliente],
    queryFn: () => clientesApi.list({ busca: buscaCliente, per_page: 50 }).then(r => r.data.data),
  })

  const { data: produtos } = useQuery({
    queryKey: ['produtos-select'],
    queryFn: () => produtosApi.list().then(r => r.data),
  })

  const subtotal = itens.reduce((acc, it) => acc + (it.quantidade * it.preco_unitario), 0)
  const desconto = (subtotal * parseFloat(descontoPerc || '0') / 100) + parseFloat(descontoValor || '0')
  const total    = Math.max(0, subtotal - desconto)

  const addItem = () => setItens(prev => [...prev, { ...ITEM_VAZIO }])
  const removeItem = (idx: number) => setItens(prev => prev.filter((_, i) => i !== idx))
  const updateItem = (idx: number, field: string, value: string | number) => {
    setItens(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
  }

  const handleSelectProduto = (idx: number, produtoId: string) => {
    const prod = (produtos as Produto[])?.find(p => p.id === parseInt(produtoId))
    if (prod) {
      setItens(prev => {
        const next = [...prev]
        next[idx] = {
          ...next[idx],
          produto_id: prod.id,
          descricao: prod.nome,
          preco_unitario: prod.preco_base,
        }
        return next
      })
    }
  }

  const handleSave = async () => {
    setErro(null)
    if (!clienteId) { setErro('Selecione um cliente.'); return }
    if (itens.length === 0) { setErro('Adicione ao menos um item.'); return }
    if (itens.some(it => !it.descricao.trim())) { setErro('Todos os itens precisam de descrição.'); return }

    setSaving(true)
    try {
      await orcamentosApi.create({
        cliente_id: parseInt(clienteId),
        validade: validade || null,
        desconto_percentual: parseFloat(descontoPerc) || 0,
        desconto_valor: parseFloat(descontoValor) || 0,
        observacoes: observacoes || null,
        condicoes_pagamento: condicoes || null,
        itens: itens.map((it, i) => ({ ...it, ordem: i })),
      })
      onSuccess()
    } catch (e: any) {
      setErro(e?.response?.data?.message ?? 'Erro ao salvar orçamento.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-brand-dark-card border border-brand-dark-border rounded-xl w-full max-w-3xl my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-dark-border">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-primary" />
            <h3 className="text-lg font-bold text-white">Novo Orçamento</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-6">
          {erro && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
              {erro}
            </div>
          )}

          {/* Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Cliente *</label>
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={buscaCliente}
                onChange={e => setBuscaCliente(e.target.value)}
                className="input mb-2"
              />
              <select
                value={clienteId}
                onChange={e => setClienteId(e.target.value)}
                className="select"
              >
                <option value="">Selecione o cliente</option>
                {(clientes as Cliente[])?.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Validade</label>
              <input
                type="date"
                value={validade}
                onChange={e => setValidade(e.target.value)}
                className="input"
              />
            </div>
          </div>

          {/* Itens */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label mb-0">Itens do Orçamento *</label>
              <button onClick={addItem} className="btn-secondary text-xs flex items-center gap-1 py-1.5 px-3">
                <Plus size={13} /> Adicionar Item
              </button>
            </div>

            <div className="space-y-3">
              {itens.map((item, idx) => (
                <div key={idx} className="bg-brand-dark border border-brand-dark-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Item {idx + 1}
                    </span>
                    {itens.length > 1 && (
                      <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-300">
                        <X size={15} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Produto (opcional) */}
                    <div>
                      <label className="label text-xs">Produto (opcional)</label>
                      <select
                        onChange={e => handleSelectProduto(idx, e.target.value)}
                        className="select text-sm"
                      >
                        <option value="">Selecionar produto...</option>
                        {(produtos as Produto[])?.map(p => (
                          <option key={p.id} value={p.id}>{p.nome}</option>
                        ))}
                      </select>
                    </div>
                    {/* Descrição */}
                    <div className="sm:col-span-2">
                      <label className="label text-xs">Descrição *</label>
                      <input
                        type="text"
                        value={item.descricao}
                        onChange={e => updateItem(idx, 'descricao', e.target.value)}
                        placeholder="Descrição do item..."
                        className="input text-sm"
                      />
                    </div>
                    {/* Qtd */}
                    <div>
                      <label className="label text-xs">Quantidade</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.quantidade}
                        onChange={e => updateItem(idx, 'quantidade', parseFloat(e.target.value) || 0)}
                        className="input text-sm"
                      />
                    </div>
                    {/* Preço Unit */}
                    <div>
                      <label className="label text-xs">Preço Unit. (R$)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.preco_unitario}
                        onChange={e => updateItem(idx, 'preco_unitario', parseFloat(e.target.value) || 0)}
                        className="input text-sm"
                      />
                    </div>
                    {/* Subtotal */}
                    <div>
                      <label className="label text-xs">Subtotal</label>
                      <div className="input text-sm text-green-400 font-semibold bg-brand-dark-card cursor-default">
                        {formatCurrency(item.quantidade * item.preco_unitario)}
                      </div>
                    </div>
                    {/* Dimensões */}
                    <div>
                      <label className="label text-xs">Largura (cm)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.largura ?? ''}
                        onChange={e => updateItem(idx, 'largura', e.target.value ? parseFloat(e.target.value) : '')}
                        placeholder="—"
                        className="input text-sm"
                      />
                    </div>
                    <div>
                      <label className="label text-xs">Altura (cm)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.altura ?? ''}
                        onChange={e => updateItem(idx, 'altura', e.target.value ? parseFloat(e.target.value) : '')}
                        placeholder="—"
                        className="input text-sm"
                      />
                    </div>
                    <div>
                      <label className="label text-xs">Cor</label>
                      <input
                        type="text"
                        value={item.cor ?? ''}
                        onChange={e => updateItem(idx, 'cor', e.target.value)}
                        placeholder="Ex: 4x4, 4x0..."
                        className="input text-sm"
                      />
                    </div>
                    {/* Acabamento e Material */}
                    <div>
                      <label className="label text-xs">Acabamento</label>
                      <input
                        type="text"
                        value={item.acabamento ?? ''}
                        onChange={e => updateItem(idx, 'acabamento', e.target.value)}
                        placeholder="Ex: Laminação, verniz..."
                        className="input text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="label text-xs">Papel/Material</label>
                      <input
                        type="text"
                        value={item.papel_material ?? ''}
                        onChange={e => updateItem(idx, 'papel_material', e.target.value)}
                        placeholder="Ex: Couché 150g..."
                        className="input text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Descontos e totais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Desconto (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={descontoPerc}
                onChange={e => setDescontoPerc(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Desconto (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={descontoValor}
                onChange={e => setDescontoValor(e.target.value)}
                className="input"
              />
            </div>
          </div>

          {/* Condições e Observações */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Condições de Pagamento</label>
              <textarea
                rows={2}
                value={condicoes}
                onChange={e => setCondicoes(e.target.value)}
                placeholder="Ex: 50% entrada + 50% na entrega..."
                className="input resize-none"
              />
            </div>
            <div>
              <label className="label">Observações</label>
              <textarea
                rows={2}
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                placeholder="Informações adicionais..."
                className="input resize-none"
              />
            </div>
          </div>

          {/* Totais */}
          <div className="bg-brand-dark border border-brand-dark-border rounded-lg p-4">
            <div className="flex justify-between items-center text-sm text-gray-400 mb-1">
              <span>Subtotal</span>
              <span className="text-white font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-400 mb-1">
              <span>Desconto</span>
              <span className="text-red-400">- {formatCurrency(desconto)}</span>
            </div>
            <div className="flex justify-between items-center text-base font-bold border-t border-brand-dark-border pt-2 mt-2">
              <span className="text-white">Total</span>
              <span className="text-green-400 text-lg">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-dark-border">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Check size={16} />
            )}
            Salvar Orçamento
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Detalhe Orçamento ──────────────────────────────────────────────────

interface ModalDetalheProps {
  orcamento: Orcamento
  onClose: () => void
  onMudarStatus: (id: number, status: string) => void
  onConverter: () => void
  onDelete: () => void
  isChangingStatus: boolean
}

function ModalDetalheOrcamento({
  orcamento, onClose, onMudarStatus, onConverter, onDelete, isChangingStatus,
}: ModalDetalheProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  const acoes = [
    { label: 'Marcar como Enviado',  status: 'enviado',   icon: Send,    show: ['pendente'].includes(orcamento.status) },
    { label: 'Marcar como Aprovado', status: 'aprovado',  icon: Check,   show: ['enviado'].includes(orcamento.status) },
    { label: 'Marcar como Rejeitado',status: 'rejeitado', icon: XCircle, show: ['enviado', 'aprovado'].includes(orcamento.status) },
  ].filter(a => a.show)

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-brand-dark-card border border-brand-dark-border rounded-xl w-full max-w-2xl my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-dark-border">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-gray-400">{orcamento.numero}</span>
              <span className={`badge ${STATUS_COLOR[orcamento.status]}`}>
                {STATUS_ORCAMENTO_LABEL[orcamento.status]}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-0.5">{orcamento.cliente?.nome}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Info geral */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Vendedor</p>
              <p className="text-white font-medium">{orcamento.vendedor?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-gray-400">Data</p>
              <p className="text-white font-medium">{formatDate(orcamento.created_at)}</p>
            </div>
            <div>
              <p className="text-gray-400">Validade</p>
              <p className="text-white font-medium">{formatDate(orcamento.validade)}</p>
            </div>
            {orcamento.observacoes && (
              <div className="col-span-2 sm:col-span-3">
                <p className="text-gray-400">Observações</p>
                <p className="text-white">{orcamento.observacoes}</p>
              </div>
            )}
          </div>

          {/* Itens */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wider">Itens</h4>
            <div className="table-container">
              <table className="table text-xs">
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th className="text-right">Qtd</th>
                    <th className="text-right">Unit.</th>
                    <th className="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {orcamento.itens?.map((item, idx) => (
                    <tr key={item.id ?? idx}>
                      <td>
                        <p className="font-medium text-white">{item.descricao}</p>
                        {(item.largura || item.altura) && (
                          <p className="text-gray-500 text-xs">
                            {item.largura}×{item.altura} cm
                            {item.cor ? ` · ${item.cor}` : ''}
                            {item.acabamento ? ` · ${item.acabamento}` : ''}
                          </p>
                        )}
                      </td>
                      <td className="text-right text-gray-300">{item.quantidade}</td>
                      <td className="text-right text-gray-300">{formatCurrency(item.preco_unitario)}</td>
                      <td className="text-right font-semibold text-green-400">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totais */}
          <div className="bg-brand-dark border border-brand-dark-border rounded-lg p-4 space-y-1 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span>
              <span className="text-white">{formatCurrency(orcamento.subtotal)}</span>
            </div>
            {(orcamento.desconto_percentual > 0 || orcamento.desconto_valor > 0) && (
              <div className="flex justify-between text-gray-400">
                <span>
                  Desconto
                  {orcamento.desconto_percentual > 0 && ` (${orcamento.desconto_percentual}%)`}
                </span>
                <span className="text-red-400">
                  - {formatCurrency(
                    (orcamento.subtotal * orcamento.desconto_percentual / 100) + orcamento.desconto_valor
                  )}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t border-brand-dark-border pt-2 mt-2">
              <span className="text-white">Total</span>
              <span className="text-green-400">{formatCurrency(orcamento.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer ações */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-brand-dark-border flex-wrap">
          <div className="flex items-center gap-2">
            {/* Converter em pedido */}
            {orcamento.status === 'aprovado' && (
              <button
                onClick={onConverter}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <ArrowRight size={15} /> Converter em Pedido
              </button>
            )}
            {/* Menu mudar status */}
            {acoes.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowStatusMenu(v => !v)}
                  disabled={isChangingStatus}
                  className="btn-secondary flex items-center gap-2 text-sm"
                >
                  {isChangingStatus
                    ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    : <ChevronDown size={15} />
                  }
                  Mudar Status
                </button>
                {showStatusMenu && (
                  <div className="absolute bottom-full mb-2 left-0 bg-brand-dark-card border border-brand-dark-border rounded-lg shadow-xl min-w-48 z-10 overflow-hidden">
                    {acoes.map(a => (
                      <button
                        key={a.status}
                        onClick={() => {
                          onMudarStatus(orcamento.id, a.status)
                          setShowStatusMenu(false)
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <a.icon size={14} />
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* Excluir */}
            {!['convertido', 'expirado'].includes(orcamento.status) && (
              <button
                onClick={() => { onDelete(); onClose() }}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Excluir orçamento"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <button onClick={onClose} className="btn-ghost text-sm">Fechar</button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Converter em Pedido ────────────────────────────────────────────────

interface ModalConverterProps {
  orcamento: Orcamento
  onClose: () => void
  onSuccess: () => void
}

function ModalConverterPedido({ orcamento, onClose, onSuccess }: ModalConverterProps) {
  const [formaPagamento, setFormaPagamento] = useState('')
  const [prazoEntrega, setPrazoEntrega]     = useState('')
  const [observacoes, setObservacoes]       = useState('')
  const [saving, setSaving]                 = useState(false)
  const [erro, setErro]                     = useState<string | null>(null)

  const handleConverter = async () => {
    setErro(null)
    if (!formaPagamento) { setErro('Selecione a forma de pagamento.'); return }
    if (!prazoEntrega)   { setErro('Informe o prazo de entrega.'); return }

    setSaving(true)
    try {
      await orcamentosApi.converter(orcamento.id, {
        forma_pagamento: formaPagamento,
        prazo_entrega: prazoEntrega,
        observacoes: observacoes || null,
      })
      onSuccess()
    } catch (e: any) {
      setErro(e?.response?.data?.message ?? 'Erro ao converter orçamento.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-brand-dark-card border border-brand-dark-border rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-dark-border">
          <div className="flex items-center gap-3">
            <ArrowRight size={20} className="text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white">Converter em Pedido</h3>
              <p className="text-xs text-gray-400">{orcamento.numero} · {orcamento.cliente?.nome}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          {erro && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
              {erro}
            </div>
          )}

          {/* Resumo do orçamento */}
          <div className="bg-brand-dark border border-brand-dark-border rounded-lg p-4 text-sm space-y-1">
            <div className="flex justify-between text-gray-400">
              <span>Itens</span>
              <span className="text-white">{orcamento.itens?.length ?? 0} item(s)</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-gray-400">Total do pedido</span>
              <span className="text-green-400 text-base">{formatCurrency(orcamento.total)}</span>
            </div>
          </div>

          {/* Forma de pagamento */}
          <div>
            <label className="label">Forma de Pagamento *</label>
            <select
              value={formaPagamento}
              onChange={e => setFormaPagamento(e.target.value)}
              className="select"
            >
              <option value="">Selecione...</option>
              {FORMA_PAGAMENTO_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Prazo de entrega */}
          <div>
            <label className="label">Prazo de Entrega *</label>
            <input
              type="date"
              value={prazoEntrega}
              onChange={e => setPrazoEntrega(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="input"
            />
          </div>

          {/* Observações */}
          <div>
            <label className="label">Observações do Pedido</label>
            <textarea
              rows={3}
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              placeholder="Instruções especiais, endereço de entrega..."
              className="input resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-dark-border">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button
            onClick={handleConverter}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <ArrowRight size={16} />
            )}
            Converter em Pedido
          </button>
        </div>
      </div>
    </div>
  )
}

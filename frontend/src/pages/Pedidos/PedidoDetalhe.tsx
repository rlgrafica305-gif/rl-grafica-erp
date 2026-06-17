import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Edit2, Save, X, Plus, Trash2, RefreshCw, MessageCircle } from 'lucide-react'
import { pedidosApi } from '@/services/api'
import { formatCurrency, formatDate, STATUS_PEDIDO_LABEL, STATUS_PEDIDO_COLOR, FORMA_PAGAMENTO_LABEL } from '@/utils'

const STATUS_PAG: Record<string, { label: string; cls: string }> = {
  pago:                 { label: 'Pago',             cls: 'bg-emerald-500/20 text-emerald-400' },
  sinal_entrada:        { label: 'Sinal de Entrada', cls: 'bg-yellow-500/20 text-yellow-400' },
  aguardando_pagamento: { label: 'Aguardando Pgto',  cls: 'bg-orange-500/20 text-orange-400' },
}

const FORMAS_PAG_OPTS = [
  { value: 'dinheiro',       label: 'Dinheiro' },
  { value: 'pix',            label: 'PIX' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito',  label: 'Cartão de Débito' },
  { value: 'boleto',         label: 'Boleto' },
  { value: 'transferencia',  label: 'Transferência' },
  { value: 'a_prazo',        label: 'A Prazo' },
]

const STATUS_PEDIDO_OPTS = [
  'recebido', 'aguardando_arte', 'aguardando_aprovacao',
  'em_producao', 'finalizado', 'entregue', 'cancelado',
]

interface ItemEdit {
  descricao: string
  quantidade: number
  preco_unitario: number
  custo_unitario: number
  _key: string
}

function gerarKey() { return Math.random().toString(36).slice(2) }

export default function PedidoDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [editando, setEditando] = useState(false)
  const [novoStatus, setNovoStatus] = useState('')

  const [eFormaPag,  setEFormaPag]  = useState('')
  const [eStatusPag, setEStatusPag] = useState('')
  const [ePrazo,     setEPrazo]     = useState('')
  const [eDesconto,  setEDesconto]  = useState(0)
  const [eObs,       setEObs]       = useState('')
  const [eItens,     setEItens]     = useState<ItemEdit[]>([])
  const [eStatus,    setEStatus]    = useState('')

  const { data: pedido, isLoading } = useQuery({
    queryKey: ['pedido', id],
    queryFn: () => pedidosApi.get(Number(id)).then(r => r.data),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: (data: object) => pedidosApi.update(Number(id), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pedido', id] })
      qc.invalidateQueries({ queryKey: ['pedidos'] })
      qc.invalidateQueries({ queryKey: ['vendas'] })
      setEditando(false)
    },
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => pedidosApi.mudarStatus(Number(id), status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pedido', id] })
      qc.invalidateQueries({ queryKey: ['pedidos'] })
      qc.invalidateQueries({ queryKey: ['vendas'] })
      setNovoStatus('')
    },
  })

  function iniciarEdicao() {
    if (!pedido) return
    setEFormaPag(pedido.forma_pagamento ?? 'pix')
    setEStatusPag(pedido.status_pagamento ?? 'aguardando_pagamento')
    setEPrazo(pedido.prazo_entrega ?? '')
    setEDesconto(Number(pedido.desconto_percentual ?? 0))
    setEObs(pedido.observacoes ?? '')
    setEStatus(pedido.status)
    setEItens((pedido.itens ?? []).map((i: { descricao: string; quantidade: number; preco_unitario: number; custo_unitario?: number }) => ({
      descricao: i.descricao,
      quantidade: Number(i.quantidade),
      preco_unitario: Number(i.preco_unitario),
      custo_unitario: Number(i.custo_unitario ?? 0),
      _key: gerarKey(),
    })))
    setEditando(true)
  }

  function salvar() {
    const payload: Record<string, unknown> = {
      forma_pagamento:    eFormaPag,
      status_pagamento:   eStatusPag,
      prazo_entrega:      ePrazo || undefined,
      desconto_percentual: eDesconto,
      observacoes:        eObs || undefined,
      itens:              eItens.map(({ _key: _, ...rest }) => rest),
    }
    if (eStatus !== pedido?.status) {
      payload.status = eStatus
    }
    updateMutation.mutate(payload)
  }

  function handleWhatsApp() {
    if (!pedido) return
    const telefone = (pedido.cliente?.whatsapp || pedido.cliente?.telefone || '').replace(/\D/g, '')
    const nomeCliente = pedido.cliente?.nome || 'Cliente'
    const stPagLabel = STATUS_PAG[pedido.status_pagamento ?? '']?.label ?? ''
    const linhasItens = (pedido.itens ?? [])
      .map((i: { descricao: string; quantidade: number; preco_unitario: number; subtotal: number }) =>
        `• ${i.descricao} (${i.quantidade}x) — ${formatCurrency(Number(i.subtotal))}`
      ).join('\n')

    let msg = `Olá ${nomeCliente}!\n\n`
    msg += `*Comprovante RL Gráfica*\n`
    msg += `Pedido: *${pedido.numero}*\n\n`
    msg += `*Itens:*\n${linhasItens}\n\n`
    if (Number(pedido.desconto_percentual) > 0) {
      msg += `Desconto (${pedido.desconto_percentual}%): -${formatCurrency(Number(pedido.subtotal) * Number(pedido.desconto_percentual) / 100)}\n`
    }
    msg += `*Total: ${formatCurrency(Number(pedido.total))}*\n`
    msg += `Pagamento: ${FORMA_PAGAMENTO_LABEL[pedido.forma_pagamento ?? ''] ?? pedido.forma_pagamento}\n`
    msg += `Status: ${stPagLabel}\n`
    if (pedido.prazo_entrega) msg += `Data: ${formatDate(pedido.prazo_entrega)}\n`
    msg += `\n_RL Gráfica — (11) 98092-3986_`

    const phone = telefone ? `55${telefone}` : '5511980923986'
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  function atualizarItem(key: string, campo: keyof ItemEdit, valor: unknown) {
    setEItens(prev => prev.map(i => i._key === key ? { ...i, [campo]: valor } : i))
  }

  const subtotalEdit = eItens.reduce((s, i) => s + i.quantidade * i.preco_unitario, 0)
  const descontoEditVal = (subtotalEdit * eDesconto) / 100
  const totalEdit = Math.max(0, subtotalEdit - descontoEditVal)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!pedido) {
    return <div className="text-center py-20 text-gray-500">Pedido não encontrado.</div>
  }

  const stPedido = STATUS_PEDIDO_LABEL[pedido.status] ?? pedido.status
  const clsPedido = STATUS_PEDIDO_COLOR[pedido.status] ?? 'bg-gray-500/20 text-gray-400'
  const stPag = STATUS_PAG[pedido.status_pagamento ?? ''] ?? STATUS_PAG['aguardando_pagamento']

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white font-mono">{pedido.numero}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${clsPedido}`}>
                {stPedido}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stPag.cls}`}>
                {stPag.label}
              </span>
            </div>
            <p className="text-sm text-gray-400">{pedido.cliente?.nome ?? '—'}</p>
          </div>
        </div>

        {!editando ? (
          <div className="flex gap-2">
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors"
            >
              <MessageCircle size={15} /> WhatsApp
            </button>
            <button
              onClick={iniciarEdicao}
              className="flex items-center gap-2 btn-secondary text-sm"
            >
              <Edit2 size={14} /> Editar
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setEditando(false)}
              className="flex items-center gap-1 btn-secondary text-sm"
            >
              <X size={14} /> Cancelar
            </button>
            <button
              onClick={salvar}
              disabled={updateMutation.isPending}
              className="flex items-center gap-1 btn-primary text-sm disabled:opacity-50"
            >
              <Save size={14} />
              {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        )}
      </div>

      {updateMutation.isError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2 rounded-lg">
          Erro ao salvar. Verifique os dados e tente novamente.
        </div>
      )}

      {/* Info geral */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Pagamento</h3>

          {!editando ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Forma</span>
                <span className="text-white">{FORMA_PAGAMENTO_LABEL[pedido.forma_pagamento ?? ''] ?? pedido.forma_pagamento ?? '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Status pgto</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stPag.cls}`}>{stPag.label}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Prazo entrega</span>
                <span className="text-white">{formatDate(pedido.prazo_entrega ?? '') || '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Criado em</span>
                <span className="text-white">{formatDate(pedido.created_at)}</span>
              </div>
              {pedido.vendedor && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Vendedor</span>
                  <span className="text-white">{pedido.vendedor.name}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="label">Forma de Pagamento</label>
                <select className="input" value={eFormaPag} onChange={e => setEFormaPag(e.target.value)}>
                  {FORMAS_PAG_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Status do Pagamento</label>
                <div className="flex gap-2">
                  {([
                    ['pago',                 'Pago'],
                    ['sinal_entrada',        'Sinal'],
                    ['aguardando_pagamento', 'Aguardando'],
                  ] as [string, string][]).map(([val, lbl]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setEStatusPag(val)}
                      className={`flex-1 text-xs py-2 rounded-lg border transition-colors ${
                        eStatusPag === val
                          ? val === 'pago'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                            : val === 'sinal_entrada'
                            ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                            : 'bg-orange-500/20 border-orange-500 text-orange-400'
                          : 'border-brand-dark-border text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Status do Pedido</label>
                <select className="input" value={eStatus} onChange={e => setEStatus(e.target.value)}>
                  {STATUS_PEDIDO_OPTS.map(s => (
                    <option key={s} value={s}>{STATUS_PEDIDO_LABEL[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Prazo de Entrega</label>
                <input type="date" className="input" value={ePrazo} onChange={e => setEPrazo(e.target.value)} />
              </div>
              <div>
                <label className="label">Desconto (%)</label>
                <input type="number" min="0" max="100" className="input" value={eDesconto} onChange={e => setEDesconto(parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label className="label">Observações</label>
                <textarea className="input resize-none" rows={2} value={eObs} onChange={e => setEObs(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Resumo Financeiro</h3>
          {!editando ? (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-white">{formatCurrency(Number(pedido.subtotal))}</span>
              </div>
              {Number(pedido.desconto_percentual) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Desconto ({pedido.desconto_percentual}%)</span>
                  <span className="text-red-400">-{formatCurrency(Number(pedido.subtotal) * Number(pedido.desconto_percentual) / 100)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold border-t border-brand-dark-border pt-3">
                <span className="text-gray-300">Total</span>
                <span className="text-emerald-400">{formatCurrency(Number(pedido.total))}</span>
              </div>
              {pedido.observacoes && (
                <div className="bg-brand-dark rounded p-2.5 mt-2">
                  <p className="text-xs text-gray-400">{pedido.observacoes}</p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-white">{formatCurrency(subtotalEdit)}</span>
              </div>
              {eDesconto > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Desconto ({eDesconto}%)</span>
                  <span className="text-red-400">-{formatCurrency(descontoEditVal)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold border-t border-brand-dark-border pt-3">
                <span className="text-gray-300">Total</span>
                <span className="text-emerald-400">{formatCurrency(totalEdit)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Itens */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Itens</h3>
          {editando && (
            <button
              type="button"
              onClick={() => setEItens(prev => [...prev, { descricao: '', quantidade: 1, preco_unitario: 0, custo_unitario: 0, _key: gerarKey() }])}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
            >
              <Plus size={13} /> Adicionar item
            </button>
          )}
        </div>

        {!editando ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-dark-border">
                  <th className="text-left py-2 text-xs text-gray-500 font-medium">Descrição</th>
                  <th className="text-center py-2 text-xs text-gray-500 font-medium w-20">Qtd</th>
                  <th className="text-right py-2 text-xs text-gray-500 font-medium w-28">Vlr Unit.</th>
                  <th className="text-right py-2 text-xs text-gray-500 font-medium w-28">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {pedido.itens?.map((item: { id: number; descricao: string; quantidade: number; preco_unitario: number; subtotal: number }) => (
                  <tr key={item.id} className="border-b border-brand-dark-border/40">
                    <td className="py-2.5 text-white">{item.descricao}</td>
                    <td className="py-2.5 text-center text-gray-300">{item.quantidade}</td>
                    <td className="py-2.5 text-right text-gray-300">{formatCurrency(Number(item.preco_unitario))}</td>
                    <td className="py-2.5 text-right font-medium text-emerald-400">{formatCurrency(Number(item.subtotal))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-3">
            {eItens.map((item) => (
              <div key={item._key} className="bg-brand-dark rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    className="input flex-1 text-sm"
                    placeholder="Serviço / Descrição"
                    value={item.descricao}
                    onChange={e => atualizarItem(item._key, 'descricao', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setEItens(prev => prev.filter(i => i._key !== item._key))}
                    className="text-gray-500 hover:text-red-400 transition-colors shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Qtd</label>
                    <input
                      type="number" min="0.01" step="0.01" className="input text-sm"
                      value={item.quantidade}
                      onChange={e => atualizarItem(item._key, 'quantidade', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Custo unit.</label>
                    <input
                      type="number" min="0" step="0.01" className="input text-sm"
                      value={item.custo_unitario}
                      onChange={e => atualizarItem(item._key, 'custo_unitario', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Valor venda</label>
                    <input
                      type="number" min="0" step="0.01" className="input text-sm"
                      value={item.preco_unitario}
                      onChange={e => atualizarItem(item._key, 'preco_unitario', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Total</label>
                    <div className="input text-sm text-emerald-400 font-medium bg-brand-dark/50">
                      {formatCurrency(item.quantidade * item.preco_unitario)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mudar status rápido (modo visualização) */}
      {!editando && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Atualizar Status do Pedido</h3>
          <div className="flex flex-wrap gap-2">
            {STATUS_PEDIDO_OPTS.filter(s => s !== pedido.status).map(s => (
              <button
                key={s}
                onClick={() => statusMutation.mutate(s)}
                disabled={statusMutation.isPending}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${STATUS_PEDIDO_COLOR[s] ?? 'bg-gray-500/10 text-gray-400'} border-current/30 hover:opacity-80`}
              >
                {statusMutation.isPending
                  ? <RefreshCw size={11} className="inline animate-spin mr-1" />
                  : null
                }
                → {STATUS_PEDIDO_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

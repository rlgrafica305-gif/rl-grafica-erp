import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Plus, Trash2, Search, CheckCircle, ShoppingBag, MessageCircle } from 'lucide-react'
import { api } from '@/services/api'
import { formatCurrency } from '@/utils'
import type { Cliente, Produto } from '@/types'

interface ItemVenda {
  id: string
  produto_id?: number
  descricao: string
  quantidade: number
  preco_unitario: number
  custo_unitario: number
  largura?: number
  altura?: number
  cor?: string
  acabamento?: string
}

interface ClienteNovo {
  nome: string
  telefone: string
  cpf_cnpj: string
  email: string
}

const FORMAS_PAGAMENTO = [
  'Dinheiro', 'Pix', 'Cartão de Crédito', 'Cartão de Débito',
  'Boleto', 'Transferência', 'A prazo',
]

function gerarId() {
  return Math.random().toString(36).slice(2)
}

export default function VendaRapida() {
  const navigate = useNavigate()
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [buscaCliente, setBuscaCliente] = useState('')
  const [resultados, setResultados] = useState<Cliente[]>([])
  const [clienteNovo, setClienteNovo] = useState<ClienteNovo>({ nome: '', telefone: '', cpf_cnpj: '', email: '' })
  const [itens, setItens] = useState<ItemVenda[]>([{ id: gerarId(), descricao: '', quantidade: 1, preco_unitario: 0, custo_unitario: 0 }])
  const [formaPagamento, setFormaPagamento] = useState('Pix')
  const [statusPagamento, setStatusPagamento] = useState('aguardando_pagamento')
  const [desconto, setDesconto] = useState(0)
  const [prazoEntrega, setPrazoEntrega] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [vendaFeita, setVendaFeita] = useState<{
    numero: string
    total: number
    cliente_nome: string
    cliente_telefone: string
    itens: { descricao: string; quantidade: number; subtotal: number }[]
    forma_pagamento: string
  } | null>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>()

  const { data: produtos } = useQuery<Produto[]>({
    queryKey: ['produtos'],
    queryFn: () => api.get('/produtos').then(r => r.data),
  })

  // Busca cliente com debounce
  useEffect(() => {
    clearTimeout(searchTimeout.current)
    if (buscaCliente.length < 2) { setResultados([]); return }
    searchTimeout.current = setTimeout(async () => {
      try {
        const { data } = await api.get('/vendas/buscar-cliente', { params: { q: buscaCliente } })
        setResultados(data)
      } catch { setResultados([]) }
    }, 300)
    return () => clearTimeout(searchTimeout.current)
  }, [buscaCliente])

  const mutation = useMutation({
    mutationFn: (payload: object) => api.post('/vendas/rapida', payload),
    onSuccess: (res) => {
      setVendaFeita({
        numero:           res.data.numero,
        total:            res.data.total,
        cliente_nome:     res.data.cliente_nome     ?? '',
        cliente_telefone: res.data.cliente_telefone ?? '',
        itens:            res.data.itens            ?? [],
        forma_pagamento:  res.data.forma_pagamento  ?? '',
      })
    },
  })

  const subtotal = itens.reduce((s, i) => s + i.quantidade * i.preco_unitario, 0)
  const descontoValor = (subtotal * desconto) / 100
  const total = Math.max(0, subtotal - descontoValor)

  function adicionarItem() {
    setItens(prev => [...prev, { id: gerarId(), descricao: '', quantidade: 1, preco_unitario: 0, custo_unitario: 0 }])
  }

  function removerItem(id: string) {
    setItens(prev => prev.filter(i => i.id !== id))
  }

  function atualizarItem(id: string, campo: keyof ItemVenda, valor: unknown) {
    setItens(prev => prev.map(i => i.id === id ? { ...i, [campo]: valor } : i))
  }

  function selecionarCliente(c: Cliente) {
    setClienteSelecionado(c)
    setBuscaCliente('')
    setClienteNovo({ nome: '', telefone: '', cpf_cnpj: '', email: '' })
    setResultados([])
  }

  function finalizarVenda() {
    const payload: Record<string, unknown> = {
      forma_pagamento: formaPagamento,
      status_pagamento: statusPagamento,
      prazo_entrega: prazoEntrega || undefined,
      desconto_percentual: desconto,
      observacoes: observacoes || undefined,
      itens: itens.map(({ id: _id, ...rest }) => rest),
    }

    if (clienteSelecionado) {
      payload.cliente_id = clienteSelecionado.id
    } else {
      payload.cliente_novo = {
        nome: clienteNovo.nome,
        telefone: clienteNovo.telefone || undefined,
        cpf_cnpj: clienteNovo.cpf_cnpj || undefined,
        email: clienteNovo.email || undefined,
      }
    }

    mutation.mutate(payload)
  }

  const podeFinalizar = (clienteSelecionado || clienteNovo.nome.trim()) &&
    itens.every(i => i.descricao && i.quantidade > 0 && i.preco_unitario >= 0) &&
    formaPagamento

  // Tela de sucesso
  if (vendaFeita) {
    const telefone = vendaFeita.cliente_telefone.replace(/\D/g, '')
    const msgItens = vendaFeita.itens
      .map(i => `• ${i.descricao} (${i.quantidade}x) — ${formatCurrency(i.subtotal)}`)
      .join('\n')
    const msg = encodeURIComponent(
      `Olá ${vendaFeita.cliente_nome}! 😊\n\n` +
      `Sua venda foi registrada com sucesso!\n\n` +
      `📋 *Pedido: ${vendaFeita.numero}*\n\n` +
      `*Itens:*\n${msgItens}\n\n` +
      `💰 *Total: ${formatCurrency(vendaFeita.total)}*\n` +
      `💳 Pagamento: ${vendaFeita.forma_pagamento}\n\n` +
      `Obrigado pela preferência! 🙏\n*RL Gráfica*`
    )
    const whatsappUrl = `https://wa.me/55${telefone}?text=${msg}`

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-full p-6">
          <CheckCircle size={64} className="text-emerald-400" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-1">Venda registrada!</h2>
          <p className="text-gray-400 mb-1">
            Cliente: <span className="text-white font-medium">{vendaFeita.cliente_nome}</span>
          </p>
          <p className="text-gray-400">
            Pedido <span className="text-white font-mono">{vendaFeita.numero}</span>
            {' — '}
            Total: <span className="text-emerald-400 font-bold">{formatCurrency(vendaFeita.total)}</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {telefone && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bc5a] text-white font-bold px-6 py-2.5 rounded-lg transition-colors"
            >
              <MessageCircle size={18} /> Enviar comprovante no WhatsApp
            </a>
          )}
          <button className="btn-secondary" onClick={() => navigate('/pedidos')}>Ver Pedidos</button>
          <button className="btn-primary" onClick={() => {
            setVendaFeita(null)
            setClienteSelecionado(null)
            setClienteNovo({ nome: '', telefone: '', cpf_cnpj: '', email: '' })
            setItens([{ id: gerarId(), descricao: '', quantidade: 1, preco_unitario: 0, custo_unitario: 0 }])
            setDesconto(0)
            setObservacoes('')
          }}>
            Nova Venda
          </button>
        </div>
      </div>
    )
  }

  const cardW = 'bg-white border border-gray-200 rounded-xl p-4 shadow-sm'
  const labelW = 'text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5 block'
  const inputW = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40'

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <div className="bg-primary/20 border border-primary/30 p-2.5 rounded-lg">
          <ShoppingBag size={22} className="text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">NOVA VENDA</h2>
          <p className="text-sm text-gray-400 uppercase tracking-wide">Registre uma venda em segundos</p>
        </div>
      </div>

      {/* Cliente */}
      <div className={cardW}>
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Cliente</h3>

        {clienteSelecionado ? (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 rounded-lg px-4 py-3">
            <div>
              <p className="font-bold text-gray-900 uppercase">{clienteSelecionado.nome}</p>
              <p className="text-xs text-gray-500 uppercase">{clienteSelecionado.telefone || clienteSelecionado.email || 'Sem contato'}</p>
            </div>
            <button className="text-xs font-bold text-gray-500 hover:text-red-500 uppercase transition-colors" onClick={() => setClienteSelecionado(null)}>
              Trocar
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className={labelW}>Nome do Cliente *</label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className={inputW + ' pl-9'}
                  placeholder="Digite o nome para buscar ou cadastrar..."
                  value={clienteNovo.nome}
                  onChange={e => {
                    setClienteNovo(p => ({ ...p, nome: e.target.value }))
                    setBuscaCliente(e.target.value)
                  }}
                />
                {resultados.length > 0 && clienteNovo.nome.length >= 2 && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                    {resultados.map(c => (
                      <button key={c.id} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0" onClick={() => selecionarCliente(c)}>
                        <p className="text-sm font-bold text-gray-900 uppercase">{c.nome}</p>
                        <p className="text-xs text-gray-500">{c.telefone || c.email || ''}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className={labelW}>Telefone / WhatsApp</label>
              <input className={inputW} placeholder="(00) 00000-0000" value={clienteNovo.telefone}
                onChange={e => setClienteNovo(p => ({ ...p, telefone: e.target.value }))} />
            </div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              Se o nome ou telefone já existir na base, o cliente será identificado automaticamente.
            </p>
          </div>
        )}
      </div>

      {/* Itens */}
      <div className={cardW}>
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Itens da Venda</h3>
        <div className="space-y-2">
          {itens.map((item) => (
            <div key={item.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className={labelW}>Serviço / Descrição *</label>
                  <input className={inputW} placeholder="Ex: Banner 2x1m, Cartão de visita..."
                    value={item.descricao} onChange={e => atualizarItem(item.id, 'descricao', e.target.value)} />
                </div>
                {itens.length > 1 && (
                  <button className="text-gray-400 hover:text-red-500 transition-colors mt-5 shrink-0" onClick={() => removerItem(item.id)}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className={labelW}>Quantidade</label>
                  <input type="number" min="0.01" step="0.01" className={inputW}
                    value={item.quantidade} onChange={e => atualizarItem(item.id, 'quantidade', parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label className={labelW}>Custo Unit. R$</label>
                  <input type="number" min="0" step="0.01" className={inputW} placeholder="0,00"
                    value={item.custo_unitario} onChange={e => atualizarItem(item.id, 'custo_unitario', parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label className={labelW}>Valor Venda R$</label>
                  <input type="number" min="0" step="0.01" className={inputW} placeholder="0,00"
                    value={item.preco_unitario} onChange={e => atualizarItem(item.id, 'preco_unitario', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="flex flex-col justify-end">
                  <label className={labelW}>Total</label>
                  <div className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-emerald-600 bg-emerald-50">
                    {formatCurrency(item.quantidade * item.preco_unitario)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 uppercase tracking-wide mt-3 transition-colors" onClick={adicionarItem}>
          <Plus size={15} /> Adicionar Item
        </button>
      </div>

      {/* Pagamento + Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={cardW + ' space-y-3'}>
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Pagamento</h3>
          <div>
            <label className={labelW}>Forma de Pagamento *</label>
            <select className={inputW} value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)}>
              {FORMAS_PAGAMENTO.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className={labelW}>Status do Pagamento</label>
            <div className="flex gap-2">
              {([
                ['pago',                 'Pago'],
                ['sinal_entrada',        'Sinal'],
                ['aguardando_pagamento', 'Aguardando'],
              ] as [string, string][]).map(([val, label]) => (
                <button key={val} type="button" onClick={() => setStatusPagamento(val)}
                  className={`flex-1 text-xs font-bold py-2 rounded-lg border uppercase transition-colors ${
                    statusPagamento === val
                      ? val === 'pago' ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                        : val === 'sinal_entrada' ? 'bg-yellow-100 border-yellow-500 text-yellow-700'
                        : 'bg-orange-100 border-orange-500 text-orange-700'
                      : 'border-gray-300 text-gray-500 hover:text-gray-700 bg-white'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelW}>Prazo de Entrega</label>
            <input type="date" className={inputW} value={prazoEntrega} onChange={e => setPrazoEntrega(e.target.value)} />
          </div>
          <div>
            <label className={labelW}>Desconto (%)</label>
            <input type="number" min="0" max="100" className={inputW} value={desconto} onChange={e => setDesconto(parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label className={labelW}>Observações</label>
            <textarea className={inputW + ' resize-none'} rows={2} value={observacoes} onChange={e => setObservacoes(e.target.value)} />
          </div>
        </div>

        <div className={cardW + ' space-y-4'}>
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Resumo</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600 uppercase font-medium">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {desconto > 0 && (
              <div className="flex justify-between text-red-600 uppercase font-medium">
                <span>Desconto ({desconto}%)</span>
                <span>-{formatCurrency(descontoValor)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-gray-900 text-base pt-2 border-t border-gray-200 uppercase">
              <span>Total</span>
              <span className="text-emerald-600">{formatCurrency(total)}</span>
            </div>
          </div>

          <button
            className="btn-primary w-full text-base py-3 mt-2 uppercase font-bold tracking-wider"
            disabled={!podeFinalizar || mutation.isPending}
            onClick={finalizarVenda}
          >
            {mutation.isPending ? 'Registrando...' : `Finalizar Venda — ${formatCurrency(total)}`}
          </button>

          {mutation.isError && (
            <p className="text-sm text-red-500 text-center uppercase font-medium">
              Erro ao registrar. Verifique os campos e tente novamente.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, MessageCircle, Printer, Search } from 'lucide-react'
import { clientesApi } from '@/services/api'
import type { Cliente } from '@/types'

interface LinhaItem {
  quantidade: string
  produto: string
  valorUnit: string
  valorTotal: string
}

const LINHA_VAZIA: LinhaItem = { quantidade: '', produto: '', valorUnit: '', valorTotal: '' }

function initLinhas(n: number): LinhaItem[] {
  return Array.from({ length: n }, () => ({ ...LINHA_VAZIA }))
}

export default function OrcamentoFormulario() {
  const [tipo, setTipo] = useState<'orcamento' | 'recibo'>('orcamento')
  const [buscaCliente, setBuscaCliente] = useState('')
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [telefoneCliente, setTelefoneCliente] = useState('')
  const [linhas, setLinhas] = useState<LinhaItem[]>(initLinhas(7))
  const [obs, setObs] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: clientes } = useQuery({
    queryKey: ['clientes-formulario', buscaCliente],
    queryFn: () => clientesApi.list({ busca: buscaCliente, per_page: 20 }).then(r => r.data.data),
    enabled: buscaCliente.length >= 1,
  })

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSelecionarCliente = (c: Cliente) => {
    setClienteSelecionado(c)
    setBuscaCliente(c.nome)
    setTelefoneCliente(c.whatsapp || c.telefone || '')
    setShowDropdown(false)
  }

  const handleLimparCliente = () => {
    setClienteSelecionado(null)
    setBuscaCliente('')
    setTelefoneCliente('')
  }

  const clienteNome = clienteSelecionado?.nome ?? buscaCliente

  const valorTotalGeral = linhas.reduce((acc, l) => acc + (parseFloat(l.valorTotal) || 0), 0)

  const updateLinha = (idx: number, field: keyof LinhaItem, value: string) => {
    setLinhas(prev => {
      const next = [...prev]
      const linha = { ...next[idx], [field]: value }
      if (field === 'valorTotal') {
        const total = parseFloat(value) || 0
        const qty = parseFloat(linha.quantidade) || 0
        linha.valorUnit = qty > 0 && total > 0 ? (total / qty).toFixed(2) : ''
      } else if (field === 'valorUnit') {
        const unit = parseFloat(value) || 0
        const qty = parseFloat(linha.quantidade) || 0
        linha.valorTotal = qty > 0 && unit > 0 ? (unit * qty).toFixed(2) : ''
      } else if (field === 'quantidade') {
        const qty = parseFloat(value) || 0
        if (linha.valorTotal) {
          const total = parseFloat(linha.valorTotal) || 0
          linha.valorUnit = qty > 0 && total > 0 ? (total / qty).toFixed(2) : ''
        } else if (linha.valorUnit) {
          const unit = parseFloat(linha.valorUnit) || 0
          linha.valorTotal = qty > 0 && unit > 0 ? (unit * qty).toFixed(2) : ''
        }
      }
      next[idx] = linha
      return next
    })
  }

  const fmtBRL = (value: string) => {
    const n = parseFloat(value)
    return isNaN(n) ? '' : n.toFixed(2).replace('.', ',')
  }

  const handleLimparTudo = () => {
    setTipo('orcamento')
    handleLimparCliente()
    setLinhas(initLinhas(7))
    setObs('')
  }

  const handleWhatsApp = () => {
    const tipoLabel = tipo === 'orcamento' ? 'ORCAMENTO' : 'RECIBO'
    let msg = `*RL GRAFICA* - Desde 1999\n`
    msg += `(11) 98092-3986\n`
    msg += `Rua da Cavalgada, 111 - Jd. Julieta - SP\n\n`
    msg += `*${tipoLabel}*\n`
    msg += `----------------------------\n`
    if (clienteNome) msg += `*Cliente:* ${clienteNome}\n`
    if (telefoneCliente) msg += `*Telefone:* ${telefoneCliente}\n`
    msg += `\n*DESCRICAO DOS SERVICOS:*\n`
    linhas.filter(l => l.produto || l.valorTotal).forEach((linha, i) => {
      msg += `${i + 1}. Qtd: *${linha.quantidade || '-'}* | ${linha.produto || '-'}\n`
      msg += `   Unit: ${linha.valorUnit ? `R$ ${fmtBRL(linha.valorUnit)}` : '-'} | Total: *${linha.valorTotal ? `R$ ${fmtBRL(linha.valorTotal)}` : '-'}*\n`
    })
    msg += `----------------------------\n`
    msg += `*VALOR TOTAL: R$ ${valorTotalGeral.toFixed(2).replace('.', ',')}*\n`
    if (obs) msg += `\nObs.: ${obs}\n`
    msg += `\n_Todo o material so sera confeccionado mediante a 50% do valor._`
    msg += `\n_Prazo de entrega: 4 a 6 dias uteis._`
    const phone = telefoneCliente ? '55' + telefoneCliente.replace(/\D/g, '') : '5511980923986'
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="flex flex-col items-center gap-4 py-2">

      <div className="bg-slate-800 text-white border-2 border-slate-600 w-full max-w-xl shadow-2xl rounded-sm">

        {/* Cabecalho: logo esquerda + info centralizada direita */}
        <div className="flex items-center py-3 px-4 border-b-2 border-slate-600 bg-slate-900">
          <img
            src="/logo-rl.png"
            alt="RL Grafica"
            className="h-20 w-auto object-contain shrink-0"
            onError={e => { (e.target as HTMLImageElement).src = '/logo-login.png' }}
          />
          <div className="flex-1 flex flex-col items-center text-center">
            <h1 className="text-2xl font-black tracking-wider text-white">RL GRAFICA</h1>
            <p className="text-sm font-semibold text-gray-200 mt-0.5">(11) 98092-3986 &nbsp;|&nbsp; Desde 1999</p>
            <p className="text-xs text-gray-400 mt-0.5">Rua da Cavalgada, 111 - Jd. Julieta - Sao Paulo</p>
          </div>
        </div>

        {/* Tipo */}
        <div className="flex items-center justify-around py-2 px-4 border-b-2 border-slate-600 bg-slate-700">
          <button type="button" onClick={() => setTipo('orcamento')} className="flex items-center gap-2 select-none">
            <span className={`inline-flex items-center justify-center w-5 h-5 border-2 text-sm font-black ${tipo === 'orcamento' ? 'border-white bg-white text-slate-900' : 'border-slate-400 text-transparent'}`}>X</span>
            <span className="text-base font-black tracking-widest text-white">ORCAMENTO</span>
          </button>
          <button type="button" onClick={() => setTipo('recibo')} className="flex items-center gap-2 select-none">
            <span className={`inline-flex items-center justify-center w-5 h-5 border-2 text-sm font-black ${tipo === 'recibo' ? 'border-white bg-white text-slate-900' : 'border-slate-400 text-transparent'}`}>X</span>
            <span className="text-base font-black tracking-widest text-white">RECIBO</span>
          </button>
        </div>

        {/* Cliente */}
        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-slate-600 text-xs">
          <span className="font-bold whitespace-nowrap text-gray-300">Cliente:</span>
          <div className="flex-1 relative" ref={dropdownRef}>
            <div className="flex items-center gap-1 border-b border-slate-500">
              <Search size={10} className="text-gray-400 shrink-0" />
              <input
                type="text"
                value={buscaCliente}
                onChange={e => { setBuscaCliente(e.target.value); setClienteSelecionado(null); setShowDropdown(true) }}
                onFocus={() => buscaCliente.length >= 1 && setShowDropdown(true)}
                placeholder="Buscar por nome ou numero..."
                className="flex-1 outline-none bg-transparent text-white placeholder-gray-500 text-xs px-1 py-0.5"
              />
              {buscaCliente && (
                <button onClick={handleLimparCliente} className="text-gray-500 hover:text-gray-300"><X size={10} /></button>
              )}
            </div>
            {showDropdown && (clientes as Cliente[])?.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-slate-700 border border-slate-500 shadow-lg z-50 max-h-40 overflow-y-auto rounded-b">
                {(clientes as Cliente[]).map(c => (
                  <button key={c.id} type="button" onClick={() => handleSelecionarCliente(c)}
                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-600 border-b border-slate-600 last:border-0 text-white">
                    <span className="font-medium">{c.nome}</span>
                    {(c.whatsapp || c.telefone) && <span className="text-gray-400 ml-2">{c.whatsapp || c.telefone}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="font-bold whitespace-nowrap ml-2 text-gray-300">Tel:</span>
          <input type="text" value={telefoneCliente} onChange={e => setTelefoneCliente(e.target.value)}
            placeholder="(11) 9..." className="w-28 border-b border-slate-500 outline-none bg-transparent text-white placeholder-gray-500 text-xs px-1" />
        </div>

        {/* Header secao */}
        <div className="bg-slate-900 text-white text-center py-1.5 text-xs font-bold tracking-widest">
          DESCRICAO DOS SERVICOS
        </div>

        {/* Header tabela */}
        <div className="grid grid-cols-[56px_1fr_80px_80px] border-b border-slate-600 text-xs font-bold bg-slate-700 text-gray-200">
          <div className="text-center py-1 border-r border-slate-600">Quant.</div>
          <div className="py-1 px-2 border-r border-slate-600">Produto</div>
          <div className="text-center py-1 border-r border-slate-600">Valor Unit.</div>
          <div className="text-center py-1">Total R$</div>
        </div>

        {/* Linhas */}
        {linhas.map((linha, idx) => (
          <div key={idx} className={`grid grid-cols-[56px_1fr_80px_80px] border-b border-slate-600 ${idx % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/70'}`}>
            <div className="border-r border-slate-600">
              <input type="number" value={linha.quantidade} onChange={e => updateLinha(idx, 'quantidade', e.target.value)}
                className="w-full h-7 text-center text-xs outline-none bg-transparent text-white px-1" min="0" step="any" />
            </div>
            <div className="border-r border-slate-600">
              <input type="text" value={linha.produto} onChange={e => updateLinha(idx, 'produto', e.target.value)}
                className="w-full h-7 text-xs outline-none bg-transparent text-white px-2" />
            </div>
            <div className="border-r border-slate-600">
              <input type="number" value={linha.valorUnit} onChange={e => updateLinha(idx, 'valorUnit', e.target.value)}
                className="w-full h-7 text-right text-xs outline-none bg-transparent text-white px-1" min="0" step="0.01" />
            </div>
            <div>
              <input type="number" value={linha.valorTotal} onChange={e => updateLinha(idx, 'valorTotal', e.target.value)}
                className="w-full h-7 text-right text-xs outline-none bg-transparent text-white px-1" min="0" step="0.01" />
            </div>
          </div>
        ))}

        {/* Total */}
        <div className="flex items-center justify-end gap-2 px-3 py-2 border-b border-slate-600 bg-slate-700">
          <span className="text-xs font-bold text-gray-200">Valor Total R$</span>
          <div className="border border-slate-400 min-w-[80px] text-right text-sm font-bold px-2 py-0.5 text-green-400">
            {valorTotalGeral > 0 ? valorTotalGeral.toFixed(2).replace('.', ',') : '--'}
          </div>
        </div>

        {/* Obs */}
        <div className="flex items-start gap-1 px-2 py-1.5 border-b-2 border-slate-600 min-h-[48px]">
          <span className="text-xs font-bold whitespace-nowrap pt-0.5 text-gray-300">Obs.:</span>
          <textarea value={obs} onChange={e => setObs(e.target.value)} rows={2}
            placeholder="Observacoes..."
            className="flex-1 text-xs outline-none resize-none bg-transparent text-white placeholder-gray-500 leading-tight" />
        </div>

        {/* Rodape */}
        <div className="px-3 py-1 text-center text-xs font-medium border-b border-slate-600 text-gray-300">
          Todo o material so sera confeccionado mediante a 50% do valor
        </div>
        <div className="bg-slate-900 text-white text-center py-1.5 text-xs font-bold tracking-wider">
          PRAZO DE ENTREGA 4 A 6 DIAS UTEIS
        </div>

        {/* Assinatura */}
        <div className="flex justify-center py-4">
          <div className="text-center">
            <p className="text-lg italic text-gray-400 font-serif mb-0.5 leading-none">Raimundo Lima</p>
            <div className="border-t border-slate-500 w-36 mx-auto pt-1">
              <p className="text-xs text-center text-gray-400">Responsavel Grafico</p>
            </div>
          </div>
        </div>
      </div>

      {/* Botoes */}
      <div className="flex gap-3 w-full max-w-xl">
        <button onClick={handleWhatsApp}
          className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-colors text-sm">
          <MessageCircle size={18} /> Enviar pelo WhatsApp
        </button>
        <button onClick={() => window.print()}
          className="flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold py-3 px-5 rounded-lg transition-colors text-sm">
          <Printer size={18} /> Imprimir
        </button>
        <button onClick={handleLimparTudo} title="Limpar formulario"
          className="flex items-center justify-center gap-2 bg-red-600/80 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-sm">
          <X size={18} />
        </button>
      </div>
    </div>
  )
}

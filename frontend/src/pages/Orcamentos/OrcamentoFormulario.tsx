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
    const tipoLabel = tipo === 'orcamento' ? 'ORÇAMENTO' : 'RECIBO'
    let msg = `*RL GRÁFICA* - Desde 1999\n`
    msg += `📱 (11) 98092-3986\n`
    msg += `📍 Rua da Cavalgada, 111 - Jd. Julieta - SP\n\n`
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`
    msg += `          *${tipoLabel}*\n`
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`
    if (clienteNome) msg += `*Cliente:* ${clienteNome}\n`
    if (telefoneCliente) msg += `*Telefone:* ${telefoneCliente}\n`
    msg += `\n*DESCRIÇÃO DOS SERVIÇOS:*\n`
    linhas.filter(l => l.produto || l.valorTotal).forEach((linha, i) => {
      msg += `${i + 1}. Qtd: *${linha.quantidade || '-'}* | ${linha.produto || '-'}\n`
      msg += `   Unit: ${linha.valorUnit ? `R$ ${fmtBRL(linha.valorUnit)}` : '-'} | Total: *${linha.valorTotal ? `R$ ${fmtBRL(linha.valorTotal)}` : '-'}*\n`
    })
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`
    msg += `*VALOR TOTAL: R$ ${valorTotalGeral.toFixed(2).replace('.', ',')}*\n`
    if (obs) msg += `\n📝 *Obs.:* ${obs}\n`
    msg += `\n_Todo o material só será confeccionado mediante a 50% do valor._`
    msg += `\n_Prazo de entrega: 4 a 6 dias úteis._`

    const phone = telefoneCliente
      ? '55' + telefoneCliente.replace(/\D/g, '')
      : '5511980923986'
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="flex flex-col items-center gap-4 py-2">

      {/* Papel */}
      <div className="bg-white text-black border-2 border-black w-full max-w-xl shadow-2xl" id="formulario-papel">

        {/* Cabeçalho */}
        <div className="flex items-stretch border-b-2 border-black">
          <div className="flex items-center justify-center p-2 border-r-2 border-black">
            <img src="/logo-login.png" alt="RL Gráfica" className="h-16 w-16 object-contain" />
          </div>
          <div className="flex-1 flex flex-col justify-center px-3 py-2">
            <h1 className="text-2xl font-black tracking-wider leading-none">RL GRÁFICA</h1>
            <p className="text-sm font-semibold mt-0.5">
              📱 (11) 98092-3986
              <span className="ml-4 text-xs font-normal">Desde 1999</span>
            </p>
            <p className="text-xs mt-0.5">Rua da Cavalgada, 111 - Jd. Julieta - São Paulo</p>
          </div>
        </div>

        {/* Tipo: Orçamento / Recibo */}
        <div className="flex items-center justify-around py-2 border-b-2 border-black px-4">
          <button
            type="button"
            onClick={() => setTipo('orcamento')}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <span className="inline-flex items-center justify-center w-5 h-5 border-2 border-black text-sm font-black">
              {tipo === 'orcamento' ? 'X' : ' '}
            </span>
            <span className="text-base font-black tracking-widest">ORÇAMENTO</span>
          </button>
          <button
            type="button"
            onClick={() => setTipo('recibo')}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <span className="inline-flex items-center justify-center w-5 h-5 border-2 border-black text-sm font-black">
              {tipo === 'recibo' ? 'X' : ' '}
            </span>
            <span className="text-base font-black tracking-widest">RECIBO</span>
          </button>
        </div>

        {/* Cliente */}
        <div className="flex items-center gap-1 px-2 py-1 border-b border-black text-xs">
          <span className="font-bold whitespace-nowrap">Cliente:</span>
          <div className="flex-1 relative" ref={dropdownRef}>
            <div className="flex items-center gap-1 border-b border-gray-400">
              <Search size={10} className="text-gray-400 shrink-0" />
              <input
                type="text"
                value={buscaCliente}
                onChange={e => {
                  setBuscaCliente(e.target.value)
                  setClienteSelecionado(null)
                  setShowDropdown(true)
                }}
                onFocus={() => buscaCliente.length >= 1 && setShowDropdown(true)}
                placeholder="Buscar por número ou nome do cliente..."
                className="flex-1 outline-none bg-transparent text-xs px-1 py-0.5"
              />
              {buscaCliente && (
                <button onClick={handleLimparCliente} className="text-gray-400 hover:text-gray-600">
                  <X size={10} />
                </button>
              )}
            </div>
            {showDropdown && (clientes as Cliente[])?.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 shadow-lg z-50 max-h-40 overflow-y-auto rounded-b">
                {(clientes as Cliente[]).map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelecionarCliente(c)}
                    className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 border-b border-gray-100 last:border-0"
                  >
                    <span className="font-medium">{c.nome}</span>
                    {(c.whatsapp || c.telefone) && (
                      <span className="text-gray-500 ml-2">{c.whatsapp || c.telefone}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="font-bold whitespace-nowrap ml-2">Tel:</span>
          <input
            type="text"
            value={telefoneCliente}
            onChange={e => setTelefoneCliente(e.target.value)}
            placeholder="(11) 9..."
            className="w-28 border-b border-gray-400 outline-none bg-transparent text-xs px-1"
          />
        </div>

        {/* Header da seção */}
        <div className="bg-black text-white text-center py-1 text-xs font-bold tracking-widest">
          DESCRIÇÃO DOS SERVIÇOS
        </div>

        {/* Cabeçalho da tabela */}
        <div className="grid grid-cols-[56px_1fr_80px_80px] border-b border-black text-xs font-bold">
          <div className="text-center py-1 border-r border-black">Quant.</div>
          <div className="py-1 px-2 border-r border-black">Produto</div>
          <div className="text-center py-1 border-r border-black">Valor Unit.</div>
          <div className="text-center py-1">Total R$</div>
        </div>

        {/* Linhas de itens */}
        {linhas.map((linha, idx) => (
          <div key={idx} className="grid grid-cols-[56px_1fr_80px_80px] border-b border-black">
            <div className="border-r border-black">
              <input
                type="number"
                value={linha.quantidade}
                onChange={e => updateLinha(idx, 'quantidade', e.target.value)}
                className="w-full h-7 text-center text-xs outline-none bg-transparent px-1"
                min="0"
                step="any"
              />
            </div>
            <div className="border-r border-black">
              <input
                type="text"
                value={linha.produto}
                onChange={e => updateLinha(idx, 'produto', e.target.value)}
                className="w-full h-7 text-xs outline-none bg-transparent px-2"
              />
            </div>
            <div className="border-r border-black">
              <input
                type="number"
                value={linha.valorUnit}
                onChange={e => updateLinha(idx, 'valorUnit', e.target.value)}
                className="w-full h-7 text-right text-xs outline-none bg-transparent px-1"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <input
                type="number"
                value={linha.valorTotal}
                onChange={e => updateLinha(idx, 'valorTotal', e.target.value)}
                className="w-full h-7 text-right text-xs outline-none bg-transparent px-1"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        ))}

        {/* Valor Total Geral */}
        <div className="flex items-center justify-end gap-2 px-3 py-1.5 border-b border-black">
          <span className="text-xs font-bold">Valor Total R$</span>
          <div className="border border-black min-w-[72px] text-right text-xs font-bold px-1.5 py-0.5">
            {valorTotalGeral > 0 ? valorTotalGeral.toFixed(2).replace('.', ',') : ' '}
          </div>
        </div>

        {/* Observações */}
        <div className="flex items-start gap-1 px-2 py-1 border-b-2 border-black min-h-[48px]">
          <span className="text-xs font-bold whitespace-nowrap pt-0.5">Obs.:</span>
          <textarea
            value={obs}
            onChange={e => setObs(e.target.value)}
            className="flex-1 text-xs outline-none resize-none bg-transparent leading-tight"
            rows={2}
            placeholder="Observações..."
          />
        </div>

        {/* Rodapé */}
        <div className="px-3 py-1 text-center text-xs font-medium border-b border-black">
          Todo o material só será confeccionado mediante a 50% do valor
        </div>
        <div className="bg-black text-white text-center py-1 text-xs font-bold tracking-wider">
          PRAZO DE ENTREGA 4 Á 6 DIAS ÚTEIS
        </div>

        {/* Assinatura */}
        <div className="flex justify-center py-4">
          <div className="text-center">
            <p className="text-lg italic text-gray-500 font-serif mb-0.5 leading-none">Raimundo Lima</p>
            <div className="border-t border-black w-36 mx-auto pt-1">
              <p className="text-xs text-center">Responsável Gráfico</p>
            </div>
          </div>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex gap-3 w-full max-w-xl print:hidden">
        <button
          onClick={handleWhatsApp}
          className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors text-sm"
        >
          <MessageCircle size={18} />
          Enviar pelo WhatsApp
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-3 px-5 rounded-lg transition-colors text-sm"
        >
          <Printer size={18} />
          Imprimir
        </button>
        <button
          onClick={handleLimparTudo}
          className="flex items-center justify-center gap-2 bg-red-600/80 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-sm"
          title="Limpar formulário"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}

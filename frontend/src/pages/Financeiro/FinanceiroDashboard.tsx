import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DollarSign, TrendingDown, TrendingUp, AlertCircle, CheckCircle, FileText, Trash2 } from 'lucide-react'
import { financeiroApi } from '@/services/api'
import { formatCurrency, formatDate } from '@/utils'
import type { ContaReceber, ContaPagar } from '@/types'

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

export default function FinanceiroDashboard() {
  const [aba, setAba] = useState<'receber' | 'pagar' | 'relatorio'>('receber')
  const [mesFiltro, setMesFiltro] = useState(new Date().getMonth() + 1)
  const [anoFiltro, setAnoFiltro] = useState(new Date().getFullYear())
  const qc = useQueryClient()

  const anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  const { data: resumo } = useQuery({
    queryKey: ['financeiro-resumo'],
    queryFn: () => financeiroApi.resumo().then(r => r.data),
  })

  const { data: contasReceber } = useQuery({
    queryKey: ['contas-receber', aba],
    queryFn: () => financeiroApi.receber({ status: 'pendente', per_page: 30 }).then(r => r.data),
    enabled: aba === 'receber',
  })

  const { data: contasPagar } = useQuery({
    queryKey: ['contas-pagar', aba],
    queryFn: () => financeiroApi.pagar({ status: 'pendente', per_page: 30 }).then(r => r.data),
    enabled: aba === 'pagar',
  })

  const { data: relatorio, isFetching: loadingRelatorio } = useQuery({
    queryKey: ['financeiro-relatorio', mesFiltro, anoFiltro],
    queryFn: () => financeiroApi.relatorio({ mes: mesFiltro, ano: anoFiltro }).then(r => r.data),
    enabled: aba === 'relatorio',
  })

  const deleteReceberMutation = useMutation({
    mutationFn: (id: number) => financeiroApi.deleteReceber(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financeiro-relatorio'] })
      qc.invalidateQueries({ queryKey: ['financeiro-resumo'] })
    },
  })

  function confirmarExclusao(id: number, descricao: string) {
    if (!confirm(`Excluir o lançamento "${descricao}"?`)) return
    deleteReceberMutation.mutate(id)
  }

  function numeroCurto(descricao: string): string {
    const partes = descricao.split('-')
    return partes.length >= 2 ? partes[partes.length - 1].slice(-4) : descricao
  }

  const receberMutation = useMutation({
    mutationFn: ({ id, valor_recebido, forma_pagamento }: any) =>
      financeiroApi.registrarRecebimento(id, { valor_recebido, forma_pagamento }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contas-receber'] }); qc.invalidateQueries({ queryKey: ['financeiro-resumo'] }) },
  })

  const pagarMutation = useMutation({
    mutationFn: ({ id, valor_pago, forma_pagamento }: any) =>
      financeiroApi.registrarPagamento(id, { valor_pago, forma_pagamento }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contas-pagar'] }); qc.invalidateQueries({ queryKey: ['financeiro-resumo'] }) },
  })

  const handleReceber = (conta: ContaReceber) => {
    const forma = prompt('Forma de pagamento (pix, dinheiro, cartao_credito, cartao_debito, boleto):', 'pix')
    if (!forma) return
    receberMutation.mutate({ id: conta.id, valor_recebido: conta.valor, forma_pagamento: forma })
  }

  const handlePagar = (conta: ContaPagar) => {
    const forma = prompt('Forma de pagamento (pix, dinheiro, transferencia, boleto):', 'pix')
    if (!forma) return
    pagarMutation.mutate({ id: conta.id, valor_pago: conta.valor, forma_pagamento: forma })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Financeiro</h2>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card border border-green-500/20 bg-green-500/5">
          <div className="flex items-center gap-3">
            <TrendingUp size={20} className="text-green-400" />
            <div>
              <p className="text-xs text-gray-400">A Receber</p>
              <p className="text-lg font-bold text-green-400">{formatCurrency(resumo?.a_receber_total ?? 0)}</p>
            </div>
          </div>
        </div>
        <div className="card border border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-3">
            <TrendingDown size={20} className="text-red-400" />
            <div>
              <p className="text-xs text-gray-400">A Pagar</p>
              <p className="text-lg font-bold text-red-400">{formatCurrency(resumo?.a_pagar_total ?? 0)}</p>
            </div>
          </div>
        </div>
        <div className="card border border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-yellow-400" />
            <div>
              <p className="text-xs text-gray-400">Recebido (Mês)</p>
              <p className="text-lg font-bold text-yellow-400">{formatCurrency(resumo?.recebido_mes ?? 0)}</p>
            </div>
          </div>
        </div>
        <div className="card border border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center gap-3">
            <DollarSign size={20} className="text-blue-400" />
            <div>
              <p className="text-xs text-gray-400">Saldo do Mês</p>
              <p className="text-lg font-bold text-blue-400">
                {formatCurrency(resumo?.saldo_mes?.saldo ?? 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Abas */}
      <div className="flex border-b border-brand-dark-border gap-1">
        {([['receber','Contas a Receber'],['pagar','Contas a Pagar'],['relatorio','Relatório']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setAba(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-1.5 ${
              aba === key
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {key === 'relatorio' && <FileText size={14} />}
            {label}
          </button>
        ))}
      </div>

      {/* Contas a Receber */}
      {aba === 'receber' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Cliente</th>
                <th>Vencimento</th>
                <th>Valor</th>
                <th>Parcela</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {contasReceber?.data?.map((conta: ContaReceber) => (
                <tr key={conta.id}>
                  <td className="text-white">{conta.descricao}</td>
                  <td className="text-gray-300">{conta.cliente?.nome}</td>
                  <td>
                    <span className={new Date(conta.vencimento) < new Date() ? 'text-red-400' : 'text-gray-300'}>
                      {formatDate(conta.vencimento)}
                    </span>
                  </td>
                  <td className="font-semibold text-green-400">{formatCurrency(conta.valor)}</td>
                  <td className="text-gray-400 text-sm">
                    {conta.parcela_numero && conta.parcela_total
                      ? `${conta.parcela_numero}/${conta.parcela_total}`
                      : '—'}
                  </td>
                  <td>
                    <button
                      onClick={() => handleReceber(conta)}
                      className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 px-3 py-1.5 rounded transition-colors"
                    >
                      <CheckCircle size={12} /> Receber
                    </button>
                  </td>
                </tr>
              ))}
              {contasReceber?.data?.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Nenhuma conta pendente.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Relatório Mensal */}
      {aba === 'relatorio' && (
        <div className="space-y-4">
          {/* Seletores mês/ano */}
          <div className="card flex flex-wrap items-center gap-3">
            <FileText size={18} className="text-primary" />
            <span className="text-sm font-bold text-white uppercase tracking-wide">Relatório Financeiro</span>
            <div className="flex items-center gap-2 ml-auto">
              <select
                className="input text-sm py-1.5"
                value={mesFiltro}
                onChange={e => setMesFiltro(Number(e.target.value))}
              >
                {MESES.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
              <select
                className="input text-sm py-1.5 w-28"
                value={anoFiltro}
                onChange={e => setAnoFiltro(Number(e.target.value))}
              >
                {anos.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {loadingRelatorio ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
          ) : relatorio && (
            <>
              {/* Totais do período */}
              <div className="grid grid-cols-3 gap-4">
                <div className="card border border-green-500/20 bg-green-500/5 text-center">
                  <p className="text-xs text-gray-400 uppercase font-bold mb-1">Entradas</p>
                  <p className="text-xl font-black text-green-400">{formatCurrency(relatorio.total_entradas)}</p>
                </div>
                <div className="card border border-red-500/20 bg-red-500/5 text-center">
                  <p className="text-xs text-gray-400 uppercase font-bold mb-1">Saídas</p>
                  <p className="text-xl font-black text-red-400">{formatCurrency(relatorio.total_saidas)}</p>
                </div>
                <div className={`card text-center border ${relatorio.saldo >= 0 ? 'border-blue-500/20 bg-blue-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                  <p className="text-xs text-gray-400 uppercase font-bold mb-1">Saldo</p>
                  <p className={`text-xl font-black ${relatorio.saldo >= 0 ? 'text-blue-400' : 'text-red-400'}`}>{formatCurrency(relatorio.saldo)}</p>
                </div>
              </div>

              {/* Tabela de entradas */}
              <div className="card space-y-3">
                <h4 className="text-sm font-bold text-green-400 uppercase tracking-wide">
                  Entradas — {relatorio.entradas?.length ?? 0} lançamentos
                </h4>
                {relatorio.entradas?.length > 0 ? (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Nº</th>
                          <th>Cliente</th>
                          <th>Data</th>
                          <th>Valor</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {relatorio.entradas.map((e: any) => (
                          <tr key={e.id}>
                            <td className="text-white font-mono">{numeroCurto(e.descricao)}</td>
                            <td className="text-gray-300">{e.cliente?.nome ?? '—'}</td>
                            <td className="text-gray-300">{formatDate(e.recebido_em?.slice(0,10))}</td>
                            <td className="font-semibold text-green-400">{formatCurrency(e.valor_recebido)}</td>
                            <td>
                              <button
                                onClick={() => confirmarExclusao(e.id, e.descricao)}
                                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="text-sm text-gray-500 text-center py-4">Nenhuma entrada neste período.</p>}
              </div>

              {/* Tabela de saídas */}
              <div className="card space-y-3">
                <h4 className="text-sm font-bold text-red-400 uppercase tracking-wide">
                  Saídas — {relatorio.saidas?.length ?? 0} lançamentos
                </h4>
                {relatorio.saidas?.length > 0 ? (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Descrição</th>
                          <th>Fornecedor</th>
                          <th>Data</th>
                          <th>Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relatorio.saidas.map((s: any) => (
                          <tr key={s.id}>
                            <td className="text-white">{s.descricao}</td>
                            <td className="text-gray-300">{s.fornecedor?.nome ?? '—'}</td>
                            <td className="text-gray-300">{formatDate(s.pago_em?.slice(0,10))}</td>
                            <td className="font-semibold text-red-400">{formatCurrency(s.valor_pago)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="text-sm text-gray-500 text-center py-4">Nenhuma saída neste período.</p>}
              </div>
            </>
          )}
        </div>
      )}

      {/* Contas a Pagar */}
      {aba === 'pagar' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Fornecedor</th>
                <th>Categoria</th>
                <th>Vencimento</th>
                <th>Valor</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {contasPagar?.data?.map((conta: ContaPagar) => (
                <tr key={conta.id}>
                  <td className="text-white">{conta.descricao}</td>
                  <td className="text-gray-300">{conta.fornecedor?.nome ?? '—'}</td>
                  <td>
                    <span className="badge bg-white/10 text-gray-300">{conta.categoria ?? '—'}</span>
                  </td>
                  <td>
                    <span className={new Date(conta.vencimento) < new Date() ? 'text-red-400' : 'text-gray-300'}>
                      {formatDate(conta.vencimento)}
                    </span>
                  </td>
                  <td className="font-semibold text-red-400">{formatCurrency(conta.valor)}</td>
                  <td>
                    <button
                      onClick={() => handlePagar(conta)}
                      className="flex items-center gap-1 text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-3 py-1.5 rounded transition-colors"
                    >
                      <CheckCircle size={12} /> Pagar
                    </button>
                  </td>
                </tr>
              ))}
              {contasPagar?.data?.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Nenhuma conta pendente.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

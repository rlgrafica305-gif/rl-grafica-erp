import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DollarSign, TrendingDown, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import { financeiroApi } from '@/services/api'
import { formatCurrency, formatDate, FORMA_PAGAMENTO_LABEL } from '@/utils'
import type { ContaReceber, ContaPagar } from '@/types'

export default function FinanceiroDashboard() {
  const [aba, setAba] = useState<'receber' | 'pagar' | 'fluxo'>('receber')
  const qc = useQueryClient()

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
        {([['receber','Contas a Receber'],['pagar','Contas a Pagar']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setAba(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              aba === key
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
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

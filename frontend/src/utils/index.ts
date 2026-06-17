import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  try {
    const parsed = parseISO(date)
    return isValid(parsed) ? format(parsed, 'dd/MM/yyyy', { locale: ptBR }) : '—'
  } catch { return '—' }
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '—'
  try {
    const parsed = parseISO(date)
    return isValid(parsed) ? format(parsed, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '—'
  } catch { return '—' }
}

export function formatCPFCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  return value
}

export const STATUS_PEDIDO_LABEL: Record<string, string> = {
  recebido:               'Recebido',
  aguardando_arte:        'Aguardando Arte',
  aguardando_aprovacao:   'Aguardando Aprovação',
  em_producao:            'Em Produção',
  finalizado:             'Finalizado',
  entregue:               'Entregue',
  cancelado:              'Cancelado',
}

export const STATUS_PEDIDO_COLOR: Record<string, string> = {
  recebido:               'bg-blue-500/20 text-blue-400',
  aguardando_arte:        'bg-yellow-500/20 text-yellow-400',
  aguardando_aprovacao:   'bg-orange-500/20 text-orange-400',
  em_producao:            'bg-purple-500/20 text-purple-400',
  finalizado:             'bg-green-500/20 text-green-400',
  entregue:               'bg-emerald-500/20 text-emerald-400',
  cancelado:              'bg-red-500/20 text-red-400',
}

export const STATUS_ORCAMENTO_LABEL: Record<string, string> = {
  pendente:   'Pendente',
  enviado:    'Enviado',
  aprovado:   'Aprovado',
  rejeitado:  'Rejeitado',
  convertido: 'Convertido',
  expirado:   'Expirado',
}

export const STATUS_ARTE_LABEL: Record<string, string> = {
  aguardando_envio:      'Aguardando Envio',
  em_desenvolvimento:    'Em Desenvolvimento',
  aguardando_aprovacao:  'Aguardando Aprovação',
  aprovada:              'Aprovada',
  rejeitada:             'Rejeitada',
  reenvio_solicitado:    'Reenvio Solicitado',
}

export const SETOR_LABEL: Record<string, string> = {
  pre_impressao: 'Pré-Impressão',
  impressao:     'Impressão',
  acabamento:    'Acabamento',
  embalagem:     'Embalagem',
  expedicao:     'Expedição',
}

export const FORMA_PAGAMENTO_LABEL: Record<string, string> = {
  dinheiro:        'Dinheiro',
  pix:             'PIX',
  cartao_credito:  'Cartão de Crédito',
  cartao_debito:   'Cartão de Débito',
  boleto:          'Boleto',
  transferencia:   'Transferência',
  a_prazo:         'A Prazo',
  cheque:          'Cheque',
}

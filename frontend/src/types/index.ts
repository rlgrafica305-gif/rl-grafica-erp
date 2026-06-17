export type UserRole = 'admin' | 'vendedor' | 'designer' | 'producao'

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  telefone?: string
  active: boolean
}

export interface Cliente {
  id: number
  nome: string
  tipo_pessoa: 'F' | 'J'
  cpf_cnpj?: string
  telefone?: string
  whatsapp?: string
  email?: string
  cep?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  observacoes?: string
  active: boolean
  total_compras?: number
  total_pedidos?: number
  created_at: string
}

export interface Produto {
  id: number
  nome: string
  categoria_id?: number
  categoria?: { id: number; nome: string }
  descricao?: string
  preco_base: number
  unidade_medida: string
  tempo_producao_dias: number
  personalizado: boolean
  active: boolean
}

export type StatusOrcamento = 'pendente' | 'enviado' | 'aprovado' | 'rejeitado' | 'convertido' | 'expirado'
export type StatusPedido = 'recebido' | 'aguardando_arte' | 'aguardando_aprovacao' | 'em_producao' | 'finalizado' | 'entregue' | 'cancelado'
export type StatusArte = 'aguardando_envio' | 'em_desenvolvimento' | 'aguardando_aprovacao' | 'aprovada' | 'rejeitada' | 'reenvio_solicitado'
export type StatusProducao = 'na_fila' | 'em_andamento' | 'pausado' | 'concluido' | 'cancelado'
export type SetorProducao = 'pre_impressao' | 'impressao' | 'acabamento' | 'embalagem' | 'expedicao'

export interface OrcamentoItem {
  id?: number
  produto_id?: number
  produto?: Produto
  descricao: string
  quantidade: number
  largura?: number
  altura?: number
  cor?: string
  acabamento?: string
  papel_material?: string
  preco_unitario: number
  subtotal: number
  observacoes?: string
}

export interface Orcamento {
  id: number
  numero: string
  cliente_id: number
  cliente?: Cliente
  vendedor_id: number
  vendedor?: { id: number; name: string }
  status: StatusOrcamento
  validade?: string
  subtotal: number
  desconto_percentual: number
  desconto_valor: number
  total: number
  observacoes?: string
  itens: OrcamentoItem[]
  created_at: string
}

export interface PedidoItem extends OrcamentoItem {}

export interface Arte {
  id: number
  pedido_id: number
  pedido?: { numero: string; cliente?: { nome: string } }
  designer_id?: number
  designer?: { id: number; name: string }
  status: StatusArte
  arquivo_cliente?: string
  arquivo_cliente_url?: string
  arquivo_final?: string
  arquivo_final_url?: string
  briefing?: string
  numero_revisao: number
  revisoes?: ArteRevisao[]
  created_at: string
}

export interface ArteRevisao {
  id: number
  numero_revisao: number
  arquivo?: string
  arquivo_url?: string
  comentario?: string
  acao: 'enviou' | 'aprovou' | 'rejeitou' | 'solicitou_revisao'
  autor?: { id: number; name: string }
  created_at: string
}

export interface Pedido {
  id: number
  numero: string
  cliente_id: number
  cliente?: Cliente
  vendedor_id: number
  vendedor?: { id: number; name: string }
  orcamento_id?: number
  status: StatusPedido
  forma_pagamento?: string
  status_pagamento?: string
  prazo_entrega?: string
  subtotal: number
  desconto_percentual: number
  desconto_valor: number
  total: number
  observacoes?: string
  itens: PedidoItem[]
  artes?: Arte[]
  producoes?: Producao[]
  historico?: HistoricoPedido[]
  created_at: string
}

export interface HistoricoPedido {
  id: number
  status_anterior?: string
  status_novo: string
  observacao?: string
  usuario?: { id: number; name: string }
  created_at: string
}

export interface Producao {
  id: number
  pedido_id: number
  pedido?: Pedido
  operador_id?: number
  operador?: { id: number; name: string }
  setor: SetorProducao
  status: StatusProducao
  prioridade: number
  instrucoes?: string
  prazo?: string
  iniciado_em?: string
  concluido_em?: string
  ordem_fila: number
}

export interface Insumo {
  id: number
  fornecedor_id?: number
  fornecedor?: { id: number; nome: string }
  nome: string
  codigo?: string
  unidade_medida: string
  quantidade_atual: number
  estoque_minimo: number
  custo_unitario: number
  active: boolean
  em_alerta?: boolean
}

export interface ContaReceber {
  id: number
  pedido_id?: number
  cliente_id: number
  cliente?: Cliente
  descricao: string
  valor: number
  vencimento: string
  forma_pagamento?: string
  status: 'pendente' | 'recebido' | 'vencido' | 'cancelado'
  recebido_em?: string
  valor_recebido?: number
  parcela_numero?: number
  parcela_total?: number
}

export interface ContaPagar {
  id: number
  fornecedor_id?: number
  fornecedor?: { id: number; nome: string }
  descricao: string
  categoria?: string
  valor: number
  vencimento: string
  forma_pagamento?: string
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado'
  pago_em?: string
  valor_pago?: number
}

export interface Pagination<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface DashboardData {
  kpis: {
    pedidos_hoje: number
    faturamento_mes: number
    em_producao: number
    a_receber: number
    pedidos_atrasados: number
    contas_a_vencer: number
    alertas_estoque: number
  }
  pedidos_por_status: Record<string, number>
  faturamento_mensal: { mes: string; total: number }[]
  ultimos_pedidos: Pedido[]
  saldo_mes: { entradas: number; saidas: number; saldo: number }
}

import axios from 'axios'

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api`,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ─── Auth ───────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/login', { email, password }),
  logout: () => api.post('/logout'),
  me: () => api.get('/me'),
  updateProfile: (data: object) => api.put('/me', data),
}

// ─── Clientes ───────────────────────────────────────────────────────────────
export const clientesApi = {
  list:   (params?: object) => api.get('/clientes', { params }),
  create: (data: object)   => api.post('/clientes', data),
  get:    (id: number)     => api.get(`/clientes/${id}`),
  update: (id: number, data: object) => api.put(`/clientes/${id}`, data),
  delete: (id: number)     => api.delete(`/clientes/${id}`),
  buscarCep: (cep: string) => api.get(`/cep/${cep}`),
}

// ─── Produtos ───────────────────────────────────────────────────────────────
export const produtosApi = {
  list: (params?: object) => api.get('/produtos', { params }),
  categorias: () => api.get('/categorias'),
}

// ─── Orçamentos ─────────────────────────────────────────────────────────────
export const orcamentosApi = {
  list:     (params?: object)           => api.get('/orcamentos', { params }),
  create:   (data: object)              => api.post('/orcamentos', data),
  get:      (id: number)                => api.get(`/orcamentos/${id}`),
  update:   (id: number, data: object)  => api.put(`/orcamentos/${id}`, data),
  delete:   (id: number)                => api.delete(`/orcamentos/${id}`),
  converter: (id: number, data: object) => api.post(`/orcamentos/${id}/converter`, data),
  mudarStatus: (id: number, status: string) => api.patch(`/orcamentos/${id}/status`, { status }),
}

// ─── Pedidos ────────────────────────────────────────────────────────────────
export const pedidosApi = {
  list:     (params?: object)           => api.get('/pedidos', { params }),
  create:   (data: object)              => api.post('/pedidos', data),
  get:      (id: number)                => api.get(`/pedidos/${id}`),
  update:   (id: number, data: object)  => api.put(`/pedidos/${id}`, data),
  delete:   (id: number)                => api.delete(`/pedidos/${id}`),
  mudarStatus: (id: number, status: string, observacao?: string) =>
    api.patch(`/pedidos/${id}/status`, { status, observacao }),
  gerarContaReceber: (id: number, data: object) =>
    api.post(`/pedidos/${id}/conta-receber`, data),
}

// ─── Artes ──────────────────────────────────────────────────────────────────
export const artesApi = {
  list:           (params?: object)          => api.get('/artes', { params }),
  create:         (data: object)             => api.post('/artes', data),
  get:            (id: number)               => api.get(`/artes/${id}`),
  uploadCliente:  (id: number, file: File)   => {
    const form = new FormData()
    form.append('arquivo', file)
    return api.post(`/artes/${id}/upload-cliente`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  uploadFinal:    (id: number, file: File, comentario?: string) => {
    const form = new FormData()
    form.append('arquivo', file)
    if (comentario) form.append('comentario', comentario)
    return api.post(`/artes/${id}/upload-final`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  aprovar:        (id: number, comentario?: string) => api.post(`/artes/${id}/aprovar`, { comentario }),
  rejeitar:       (id: number, comentario: string)  => api.post(`/artes/${id}/rejeitar`, { comentario }),
  atribuir:       (id: number, designer_id: number) => api.post(`/artes/${id}/atribuir`, { designer_id }),
}

// ─── Produção ───────────────────────────────────────────────────────────────
export const producaoApi = {
  list:     (params?: object) => api.get('/producao', { params }),
  fila:     ()               => api.get('/producao/fila'),
  create:   (data: object)   => api.post('/producao', data),
  get:      (id: number)     => api.get(`/producao/${id}`),
  iniciar:  (id: number)     => api.post(`/producao/${id}/iniciar`),
  concluir: (id: number)     => api.post(`/producao/${id}/concluir`),
  atribuir: (id: number, operador_id: number) => api.post(`/producao/${id}/atribuir`, { operador_id }),
  reordenar:(setor: string, ordem: number[]) => api.post('/producao/reordenar', { setor, ordem }),
}

// ─── Estoque ────────────────────────────────────────────────────────────────
export const estoqueApi = {
  insumos:          (params?: object)           => api.get('/estoque/insumos', { params }),
  createInsumo:     (data: object)              => api.post('/estoque/insumos', data),
  updateInsumo:     (id: number, data: object)  => api.put(`/estoque/insumos/${id}`, data),
  movimentar:       (id: number, data: object)  => api.post(`/estoque/insumos/${id}/mover`, data),
  historico:        (id: number)                => api.get(`/estoque/insumos/${id}/historico`),
  alertas:          ()                          => api.get('/estoque/alertas'),
  fornecedores:     (params?: object)           => api.get('/estoque/fornecedores', { params }),
  createFornecedor: (data: object)              => api.post('/estoque/fornecedores', data),
  updateFornecedor: (id: number, data: object)  => api.put(`/estoque/fornecedores/${id}`, data),
  deleteFornecedor: (id: number)                => api.delete(`/estoque/fornecedores/${id}`),
}

// ─── Financeiro ─────────────────────────────────────────────────────────────
export const financeiroApi = {
  resumo:           ()              => api.get('/financeiro/resumo'),
  fluxoCaixa:       (params: object)=> api.get('/financeiro/fluxo-caixa', { params }),
  receber:          (params?: object)=> api.get('/financeiro/receber', { params }),
  storeReceber:     (data: object)  => api.post('/financeiro/receber', data),
  registrarRecebimento: (id: number, data: object) => api.post(`/financeiro/receber/${id}/receber`, data),
  pagar:            (params?: object)=> api.get('/financeiro/pagar', { params }),
  storePagar:       (data: object)  => api.post('/financeiro/pagar', data),
  registrarPagamento:   (id: number, data: object) => api.post(`/financeiro/pagar/${id}/pagar`, data),
  relatorio:            (params?: object)           => api.get('/financeiro/relatorio', { params }),
  deleteReceber:        (id: number)                => api.delete(`/financeiro/receber/${id}`),
}

// ─── Relatórios ─────────────────────────────────────────────────────────────
export const relatoriosApi = {
  produtosMaisVendidos: (params: object) => api.get('/relatorios/produtos-mais-vendidos', { params }),
  clientesTop:          (params: object) => api.get('/relatorios/clientes-top', { params }),
  lucroPeriodo:         (params: object) => api.get('/relatorios/lucro-periodo', { params }),
  desempenhoVendedores: (params: object) => api.get('/relatorios/desempenho-vendedores', { params }),
  statusPedidos:        (params: object) => api.get('/relatorios/status-pedidos', { params }),
}

// ─── Usuários ────────────────────────────────────────────────────────────────
export const usuariosApi = {
  list:   (params?: object)           => api.get('/usuarios', { params }),
  create: (data: object)              => api.post('/usuarios', data),
  get:    (id: number)                => api.get(`/usuarios/${id}`),
  update: (id: number, data: object)  => api.put(`/usuarios/${id}`, data),
  delete: (id: number)                => api.delete(`/usuarios/${id}`),
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const dashboardApi = {
  get: () => api.get('/dashboard'),
}

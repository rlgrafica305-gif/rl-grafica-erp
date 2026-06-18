import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, Loader2, Search, User } from 'lucide-react'
import { clientesApi } from '@/services/api'

interface FormData {
  nome: string
  tipo_pessoa: 'F' | 'J'
  cpf_cnpj: string
  telefone: string
  whatsapp: string
  email: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  observacoes: string
  active: boolean
}

const EMPTY: FormData = {
  nome: '', tipo_pessoa: 'F', cpf_cnpj: '', telefone: '', whatsapp: '',
  email: '', cep: '', logradouro: '', numero: '', complemento: '',
  bairro: '', cidade: '', estado: '', observacoes: '', active: true,
}

export default function ClienteForm() {
  const { id }    = useParams<{ id: string }>()
  const navigate  = useNavigate()
  const qc        = useQueryClient()
  const editando  = !!id

  const [form, setForm]     = useState<FormData>(EMPTY)
  const [cepLoad, setCepLoad] = useState(false)
  const [erro, setErro]     = useState('')

  /* ── Carrega dados se for edição ── */
  const { data: cliente } = useQuery({
    queryKey: ['cliente', id],
    queryFn: () => clientesApi.get(Number(id)).then(r => r.data),
    enabled: editando,
  })

  useEffect(() => {
    if (cliente) setForm({ ...EMPTY, ...cliente })
  }, [cliente])

  /* ── Mutations ── */
  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      editando ? clientesApi.update(Number(id), data) : clientesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes'] })
      navigate('/clientes')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.response?.data?.error
      setErro(msg || 'Erro ao salvar. Verifique os campos.')
    },
  })

  function set(campo: keyof FormData, valor: unknown) {
    setForm(f => ({ ...f, [campo]: valor }))
    setErro('')
  }

  function handleCep(raw: string) {
    const nums = raw.replace(/\D/g, '').slice(0, 8)
    const masked = nums.length > 5 ? `${nums.slice(0,5)}-${nums.slice(5)}` : nums
    set('cep', masked)
    if (nums.length === 8) buscarCepStr(nums)
  }

  async function buscarCepStr(cep: string) {
    setCepLoad(true)
    try {
      const { data } = await clientesApi.buscarCep(cep)
      setForm(f => ({
        ...f,
        logradouro: data.logradouro ?? f.logradouro,
        bairro:     data.bairro     ?? f.bairro,
        cidade:     data.localidade ?? f.cidade,
        estado:     data.uf         ?? f.estado,
      }))
    } catch {/* CEP inválido */}
    finally { setCepLoad(false) }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) { setErro('Nome é obrigatório.'); return }
    mutation.mutate(form)
  }

  const inputCls = `
    w-full bg-white/5 border border-brand-dark-border rounded-lg
    px-3 py-2.5 text-sm text-white placeholder-gray-500
    focus:outline-none focus:border-primary transition-colors
  `
  const labelCls = 'block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5'

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/clientes')}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="bg-primary/20 border border-primary/30 p-2.5 rounded-lg">
          <User size={20} className="text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">
            {editando ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <p className="text-sm text-gray-400">
            {editando ? 'Atualize os dados do cliente' : 'Preencha os dados para cadastrar'}
          </p>
        </div>
      </div>

      {erro && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Dados pessoais ── */}
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide border-b border-brand-dark-border pb-2">
            Dados Pessoais
          </h3>

          {/* Tipo de pessoa */}
          <div>
            <label className={labelCls}>Tipo de Pessoa</label>
            <div className="flex gap-3">
              {(['F', 'J'] as const).map(tipo => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => set('tipo_pessoa', tipo)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                    form.tipo_pessoa === tipo
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-white/3 border-brand-dark-border text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {tipo === 'F' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                </button>
              ))}
            </div>
          </div>

          {/* Nome */}
          <div>
            <label className={labelCls}>
              Nome {form.tipo_pessoa === 'J' ? '/ Razão Social' : ''} <span className="text-red-400">*</span>
            </label>
            <input
              className={inputCls}
              placeholder={form.tipo_pessoa === 'F' ? 'Nome completo' : 'Razão social ou nome fantasia'}
              value={form.nome}
              onChange={e => set('nome', e.target.value)}
            />
          </div>

          {/* CPF/CNPJ */}
          <div>
            <label className={labelCls}>{form.tipo_pessoa === 'F' ? 'CPF' : 'CNPJ'}</label>
            <input
              className={inputCls}
              placeholder={form.tipo_pessoa === 'F' ? '000.000.000-00' : '00.000.000/0001-00'}
              value={form.cpf_cnpj}
              onChange={e => set('cpf_cnpj', e.target.value)}
            />
          </div>

          {/* Contatos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Telefone</label>
              <input
                className={inputCls}
                placeholder="(00) 0000-0000"
                value={form.telefone}
                onChange={e => set('telefone', e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>WhatsApp</label>
              <input
                className={inputCls}
                placeholder="(00) 00000-0000"
                value={form.whatsapp}
                onChange={e => set('whatsapp', e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>E-mail</label>
              <input
                type="email"
                className={inputCls}
                placeholder="email@exemplo.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── Endereço ── */}
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide border-b border-brand-dark-border pb-2">
            Endereço
          </h3>

          {/* CEP com busca */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className={labelCls}>CEP</label>
              <div className="relative">
                <input
                  className={inputCls + ' pr-10'}
                  placeholder="00000-000"
                  value={form.cep}
                  onChange={e => handleCep(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => buscarCepStr(form.cep.replace(/\D/g, ''))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                >
                  {cepLoad
                    ? <Loader2 size={16} className="animate-spin" />
                    : <Search size={16} />
                  }
                </button>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Logradouro</label>
              <input
                className={inputCls}
                placeholder="Rua, Avenida, etc."
                value={form.logradouro}
                onChange={e => set('logradouro', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="col-span-1">
              <label className={labelCls}>Número</label>
              <input
                className={inputCls}
                placeholder="Nº"
                value={form.numero}
                onChange={e => set('numero', e.target.value)}
              />
            </div>
            <div className="col-span-1">
              <label className={labelCls}>Complemento</label>
              <input
                className={inputCls}
                placeholder="Apto, sala..."
                value={form.complemento}
                onChange={e => set('complemento', e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Bairro</label>
              <input
                className={inputCls}
                placeholder="Bairro"
                value={form.bairro}
                onChange={e => set('bairro', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Cidade</label>
              <input
                className={inputCls}
                placeholder="Cidade"
                value={form.cidade}
                onChange={e => set('cidade', e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Estado (UF)</label>
              <input
                className={inputCls}
                placeholder="UF"
                maxLength={2}
                value={form.estado}
                onChange={e => set('estado', e.target.value.toUpperCase())}
              />
            </div>
          </div>
        </div>

        {/* ── Observações + Status ── */}
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide border-b border-brand-dark-border pb-2">
            Informações Adicionais
          </h3>

          <div>
            <label className={labelCls}>Observações</label>
            <textarea
              className={inputCls + ' resize-none'}
              rows={3}
              placeholder="Anotações sobre o cliente..."
              value={form.observacoes}
              onChange={e => set('observacoes', e.target.value)}
            />
          </div>

          {editando && (
            <div>
              <label className={labelCls}>Status</label>
              <div className="flex gap-3">
                {[true, false].map(v => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => set('active', v)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                      form.active === v
                        ? v
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : 'bg-red-500/20 border-red-500 text-red-400'
                        : 'bg-white/3 border-brand-dark-border text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {v ? 'Ativo' : 'Inativo'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Botões ── */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate('/clientes')}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary flex items-center gap-2"
          >
            {mutation.isPending
              ? <><Loader2 size={16} className="animate-spin" /> Salvando...</>
              : <><Save size={16} /> {editando ? 'Salvar Alterações' : 'Cadastrar Cliente'}</>
            }
          </button>
        </div>
      </form>
    </div>
  )
}

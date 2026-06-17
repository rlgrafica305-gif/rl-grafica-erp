import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Settings, Palette, Lock, Save, Check } from 'lucide-react'
import { api } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'

const TEMAS = [
  { nome: 'Rosa/Magenta', valor: '216 27 96',  hex: '#D81B60' },
  { nome: 'Dourado',      valor: '212 160 23',  hex: '#D4A017' },
  { nome: 'Azul',         valor: '21 101 192',  hex: '#1565C0' },
  { nome: 'Verde',        valor: '5 150 105',   hex: '#059669' },
  { nome: 'Roxo',         valor: '139 92 246',  hex: '#8B5CF6' },
  { nome: 'Laranja',      valor: '234 88 12',   hex: '#EA580C' },
]

const TEMA_KEY = 'rl_grafica_tema'

function aplicarTema(valor: string) {
  document.documentElement.style.setProperty('--color-primary', valor)
  localStorage.setItem(TEMA_KEY, valor)
}

export function inicializarTema() {
  const salvo = localStorage.getItem(TEMA_KEY)
  if (salvo) {
    document.documentElement.style.setProperty('--color-primary', salvo)
  }
}

export default function Configuracoes() {
  const { user } = useAuth()
  const [temaSelecionado, setTemaSelecionado] = useState(() => localStorage.getItem(TEMA_KEY) ?? '216 27 96')

  const [nome,           setNome]           = useState(user?.name ?? '')
  const [email,          setEmail]          = useState(user?.email ?? '')
  const [senhaAtual,     setSenhaAtual]     = useState('')
  const [novaSenha,      setNovaSenha]      = useState('')
  const [confirmaSenha,  setConfirmaSenha]  = useState('')
  const [erroSenha,      setErroSenha]      = useState('')
  const [salvoOk,        setSalvoOk]        = useState(false)

  useEffect(() => {
    setNome(user?.name ?? '')
    setEmail(user?.email ?? '')
  }, [user])

  const updateMutation = useMutation({
    mutationFn: (data: object) => api.put('/me', data),
    onSuccess: () => {
      setSalvoOk(true)
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmaSenha('')
      setTimeout(() => setSalvoOk(false), 3000)
    },
  })

  function selecionarTema(valor: string) {
    setTemaSelecionado(valor)
    aplicarTema(valor)
  }

  function salvarConta() {
    setErroSenha('')
    if (novaSenha && novaSenha !== confirmaSenha) {
      setErroSenha('As senhas não coincidem.')
      return
    }
    if (novaSenha && novaSenha.length < 6) {
      setErroSenha('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }

    const payload: Record<string, string> = { name: nome, email }
    if (novaSenha) {
      payload.password = novaSenha
      payload.password_confirmation = confirmaSenha
    }
    updateMutation.mutate(payload)
  }

  const temaAtual = TEMAS.find(t => t.valor === temaSelecionado)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-primary/20 border border-primary/30 p-2.5 rounded-lg">
          <Settings size={22} className="text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Configurações</h2>
          <p className="text-sm text-gray-400">Personalize o sistema</p>
        </div>
      </div>

      {/* Tema */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Palette size={16} className="text-primary" />
          <h3 className="font-semibold text-white">Cor do Tema</h3>
        </div>
        <p className="text-sm text-gray-400">Escolha a cor principal do sistema.</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {TEMAS.map(t => (
            <button
              key={t.valor}
              onClick={() => selecionarTema(t.valor)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all"
              style={{
                borderColor: temaSelecionado === t.valor ? t.hex : 'transparent',
                backgroundColor: temaSelecionado === t.valor ? `${t.hex}15` : 'rgba(255,255,255,0.03)',
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: t.hex }}
              >
                {temaSelecionado === t.valor && <Check size={16} className="text-white" />}
              </div>
              <span className="text-xs text-gray-400 text-center leading-tight">{t.nome}</span>
            </button>
          ))}
        </div>
        {temaAtual && (
          <p className="text-xs text-gray-500">
            Tema atual: <span className="text-white font-medium">{temaAtual.nome}</span>
          </p>
        )}
      </div>

      {/* Conta */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Lock size={16} className="text-primary" />
          <h3 className="font-semibold text-white">Dados de Acesso</h3>
        </div>

        {salvoOk && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm px-4 py-2 rounded-lg flex items-center gap-2">
            <Check size={14} /> Dados salvos com sucesso!
          </div>
        )}

        {updateMutation.isError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2 rounded-lg">
            Erro ao salvar. Verifique os dados e tente novamente.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Nome</label>
            <input
              className="input"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Seu nome"
            />
          </div>
          <div>
            <label className="label">E-mail (login)</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>
        </div>

        <div className="border-t border-brand-dark-border pt-4">
          <p className="text-sm text-gray-400 mb-3">Deixe em branco para não alterar a senha.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nova Senha</label>
              <input
                type="password"
                className="input"
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
                placeholder="••••••"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="label">Confirmar Nova Senha</label>
              <input
                type="password"
                className="input"
                value={confirmaSenha}
                onChange={e => setConfirmaSenha(e.target.value)}
                placeholder="••••••"
                autoComplete="new-password"
              />
            </div>
          </div>
          {erroSenha && (
            <p className="text-xs text-red-400 mt-2">{erroSenha}</p>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={salvarConta}
            disabled={updateMutation.isPending || !nome.trim() || !email.trim()}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={15} />
            {updateMutation.isPending ? 'Salvando...' : 'Salvar Dados'}
          </button>
        </div>
      </div>
    </div>
  )
}

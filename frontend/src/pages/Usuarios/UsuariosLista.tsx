import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Shield } from 'lucide-react'
import { usuariosApi } from '@/services/api'
import { formatDateTime } from '@/utils'
import type { User } from '@/types'

const ROLE_LABEL: Record<string, string> = {
  admin:    'Administrador',
  vendedor: 'Vendedor',
  designer: 'Designer',
  producao: 'Produção',
}

const ROLE_COLOR: Record<string, string> = {
  admin:    'bg-primary/20 text-primary',
  vendedor: 'bg-blue-500/20 text-blue-400',
  designer: 'bg-purple-500/20 text-purple-400',
  producao: 'bg-yellow-500/20 text-yellow-400',
}

export default function UsuariosLista() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', role: 'vendedor', password: '', telefone: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => usuariosApi.list().then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: object) => usuariosApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); setShowForm(false) },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      usuariosApi.update(id, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usuariosApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Usuários</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Novo Usuário
        </button>
      </div>

      {/* Form de criação */}
      {showForm && (
        <div className="card border border-primary/30">
          <h3 className="font-semibold text-white mb-4">Novo Usuário</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nome</label>
              <input className="input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input className="input" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label className="label">Papel</label>
              <select className="select" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                <option value="vendedor">Vendedor</option>
                <option value="designer">Designer</option>
                <option value="producao">Produção</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div>
              <label className="label">Senha</label>
              <input className="input" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => createMutation.mutate(formData)} className="btn-primary">Salvar</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data?.data?.map((user: User) => (
            <div key={user.id} className="card flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-white">{user.name}</p>
                  <p className="text-sm text-gray-400">{user.email}</p>
                  <div className="flex gap-2 mt-1.5">
                    <span className={`badge ${ROLE_COLOR[user.role]}`}>
                      <Shield size={10} className="mr-1" />{ROLE_LABEL[user.role]}
                    </span>
                    <span className={`badge ${user.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {user.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => toggleMutation.mutate({ id: user.id, active: !user.active })}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    user.active
                      ? 'text-yellow-400 hover:bg-yellow-500/10'
                      : 'text-green-400 hover:bg-green-500/10'
                  }`}
                >
                  {user.active ? 'Desativar' : 'Ativar'}
                </button>
                <button
                  onClick={() => { if (confirm(`Excluir "${user.name}"?`)) deleteMutation.mutate(user.id) }}
                  className="text-xs text-red-400 hover:bg-red-500/10 px-2 py-1 rounded transition-colors"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit, Trash2, Phone, Mail, Eye } from 'lucide-react'
import { clientesApi } from '@/services/api'
import { formatCPFCNPJ, formatCurrency } from '@/utils'
import type { Cliente } from '@/types'

export default function ClientesLista() {
  const [busca, setBusca] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['clientes', busca],
    queryFn: () => clientesApi.list({ busca, per_page: 20 }).then(r => r.data),
    placeholderData: prev => prev,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => clientesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes'] }),
  })

  const handleDelete = (cliente: Cliente) => {
    if (!confirm(`Excluir o cliente "${cliente.nome}"?`)) return
    deleteMutation.mutate(cliente.id)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Clientes</h2>
          <p className="text-sm text-gray-400">{data?.total ?? 0} cadastros</p>
        </div>
        <Link to="/clientes/novo" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Novo Cliente
        </Link>
      </div>

      <div className="card">
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF/CNPJ, e-mail, telefone..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="input pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th className="hidden md:table-cell">CPF/CNPJ</th>
                  <th>Contato</th>
                  <th className="hidden md:table-cell">Cidade</th>
                  <th className="hidden sm:table-cell">Total Compras</th>
                  <th className="hidden sm:table-cell">Status</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((cliente: Cliente) => (
                  <tr key={cliente.id}>
                    <td>
                      <div>
                        <p className="font-medium text-white">{cliente.nome}</p>
                        <p className="text-xs text-gray-500">{cliente.tipo_pessoa === 'F' ? 'Pessoa Física' : 'Pessoa Jurídica'}</p>
                      </div>
                    </td>
                    <td className="hidden md:table-cell font-mono text-sm">{cliente.cpf_cnpj ? formatCPFCNPJ(cliente.cpf_cnpj) : '—'}</td>
                    <td>
                      <div className="space-y-0.5">
                        {cliente.telefone && (
                          <a href={`tel:${cliente.telefone}`} className="flex items-center gap-1 text-xs text-gray-300 hover:text-white">
                            <Phone size={12} /> {cliente.telefone}
                          </a>
                        )}
                        {cliente.email && (
                          <a href={`mailto:${cliente.email}`} className="flex items-center gap-1 text-xs text-gray-300 hover:text-white">
                            <Mail size={12} /> {cliente.email}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="hidden md:table-cell text-gray-300">{cliente.cidade ? `${cliente.cidade}/${cliente.estado}` : '—'}</td>
                    <td className="hidden sm:table-cell font-semibold text-green-400">{formatCurrency(cliente.total_compras ?? 0)}</td>
                    <td className="hidden sm:table-cell">
                      <span className={`badge ${cliente.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {cliente.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/clientes/${cliente.id}`} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded">
                          <Eye size={15} />
                        </Link>
                        <Link to={`/clientes/${cliente.id}/editar`} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded">
                          <Edit size={15} />
                        </Link>
                        <button onClick={() => handleDelete(cliente)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.data?.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-500">Nenhum cliente encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

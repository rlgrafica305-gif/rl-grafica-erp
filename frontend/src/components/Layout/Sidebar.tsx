import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, FileText,
  Printer, DollarSign, BarChart2, Settings, LogOut, X, ShoppingBag, ClipboardList, SlidersHorizontal, Upload,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/utils'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const navItems = [
  { to: '/',              label: 'Dashboard',  icon: LayoutDashboard, roles: ['admin','vendedor','designer','producao'] },
  { to: '/venda-rapida',  label: 'Nova Venda', icon: ShoppingBag,     roles: ['admin','vendedor'] },
  { to: '/vendas',        label: 'Vendas',     icon: ClipboardList,   roles: ['admin','vendedor'] },
  { to: '/clientes',          label: 'Clientes',         icon: Users,   roles: ['admin','vendedor'] },
  { to: '/clientes/importar', label: 'Importar Contatos', icon: Upload, roles: ['admin','vendedor'] },
  { to: '/orcamentos',    label: 'Orçamentos', icon: FileText,        roles: ['admin','vendedor'] },
  { to: '/producao',      label: 'Produção',   icon: Printer,         roles: ['admin','producao'] },
  { to: '/financeiro',    label: 'Financeiro', icon: DollarSign,      roles: ['admin'] },
  { to: '/relatorios',    label: 'Relatórios', icon: BarChart2,       roles: ['admin'] },
  { to: '/usuarios',       label: 'Usuários',      icon: Settings,          roles: ['admin'] },
  { to: '/configuracoes',  label: 'Configurações', icon: SlidersHorizontal, roles: ['admin'] },
]

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout, hasRole } = useAuth()

  const visibleItems = navItems.filter(item => hasRole(item.roles))

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        'fixed top-0 left-0 h-full w-72 sm:w-64 bg-brand-dark-card border-r border-brand-dark-border z-30 flex flex-col transition-transform duration-300',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo RL Gráfica */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-brand-dark-border">
          <img
            src="/logo-rl.png"
            alt="RL Gráfica"
            className="h-14 w-auto object-contain"
          />
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5" aria-label="Fechar menu">
            <X size={20} />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {visibleItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-150 group min-h-[44px]',
                isActive
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon size={18} className="shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Usuário + logout */}
        <div className="p-4 border-t border-brand-dark-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>
    </>
  )
}

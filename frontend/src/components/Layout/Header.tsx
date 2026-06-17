import { Menu, Bell } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface HeaderProps {
  onMenuClick: () => void
  title?: string
}

const ROLE_LABEL: Record<string, string> = {
  admin:     'Administrador',
  vendedor:  'Vendedor',
  designer:  'Designer',
  producao:  'Produção',
}

export default function Header({ onMenuClick, title }: HeaderProps) {
  const { user } = useAuth()

  return (
    <header className="h-16 bg-brand-dark-card border-b border-brand-dark-border flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-400 hover:text-white transition-colors"
        >
          <Menu size={22} />
        </button>

        {/* Logo pequeno no header (mobile) */}
        <div className="flex items-center gap-2 lg:hidden">
          <img src="/logo.png" alt="RL" className="h-8 w-auto object-contain" />
        </div>

        {title && (
          <h1 className="text-lg font-semibold text-white hidden sm:block">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="relative text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        </button>

        <div className="flex items-center gap-2.5 pl-3 border-l border-brand-dark-border">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white leading-tight">{user?.name}</p>
            <p className="text-xs text-gray-400">{ROLE_LABEL[user?.role ?? '']}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  )
}

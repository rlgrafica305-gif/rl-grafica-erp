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
    <header className="sticky top-0 z-10 border-b border-white/10 bg-gradient-to-r from-brand-dark-card via-brand-dark-card to-[#151b2d] shadow-sm">
      <div className="flex items-center justify-between px-3 py-2.5 sm:px-4 lg:px-6">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            onClick={onMenuClick}
            className="lg:hidden shrink-0 rounded-lg p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Abrir menu"
          >
            <Menu size={22} />
          </button>

          {/* Logo sempre visível no canto esquerdo */}
          <img
            src="/logo-rl.png"
            alt="RL Gráfica"
            className="h-9 w-auto object-contain shrink-0 sm:h-10 lg:h-11"
          />

          {title && (
            <h1 className="text-sm font-semibold text-white truncate sm:text-base lg:text-lg">{title}</h1>
          )}
        </div>

        <div className="ml-2 flex shrink-0 items-center gap-2 sm:gap-3">
          <button className="relative rounded-lg p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white" aria-label="Notificações">
            <Bell size={20} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
          </button>

          <div className="flex min-w-0 items-center gap-2.5 border-l border-white/10 pl-2 sm:pl-3">
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-gray-400">{ROLE_LABEL[user?.role ?? '']}</p>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/20 text-sm font-bold text-primary">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

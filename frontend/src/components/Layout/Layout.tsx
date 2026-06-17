import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const PAGE_TITLES: Record<string, string> = {
  '/':            'Dashboard',
  '/clientes':    'Clientes',
  '/orcamentos':  'Orçamentos',
  '/pedidos':     'Pedidos',
  '/artes':       'Gestão de Artes',
  '/producao':    'Produção',
  '/estoque':     'Estoque',
  '/financeiro':  'Financeiro',
  '/relatorios':  'Relatórios',
  '/usuarios':    'Usuários',
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()

  const title = PAGE_TITLES[pathname] ??
    PAGE_TITLES[Object.keys(PAGE_TITLES).find(k => pathname.startsWith(k) && k !== '/') ?? '']

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

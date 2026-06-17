import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/Layout/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import ClientesLista from '@/pages/Clientes/ClientesLista'
import PedidosLista from '@/pages/Pedidos/PedidosLista'
import ProducaoKanban from '@/pages/Producao/ProducaoKanban'
import FinanceiroDashboard from '@/pages/Financeiro/FinanceiroDashboard'
import RelatoriosDashboard from '@/pages/Relatorios/RelatoriosDashboard'
import UsuariosLista from '@/pages/Usuarios/UsuariosLista'
import VendaRapida from '@/pages/VendaRapida/VendaRapida'
import OrcamentosLista from '@/pages/Orcamentos/OrcamentosLista'
import ClienteForm from '@/pages/Clientes/ClienteForm'
import ImportarContatos from '@/pages/Clientes/ImportarContatos'
import VendasLista from '@/pages/Vendas/VendasLista'
import PedidoDetalhe from '@/pages/Pedidos/PedidoDetalhe'
import Configuracoes, { inicializarTema } from '@/pages/Configuracoes/Configuracoes'

inicializarTema()

function PrivateRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role) && user.role !== 'admin') {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="venda-rapida" element={<PrivateRoute roles={['admin','vendedor']}><VendaRapida /></PrivateRoute>} />
        <Route path="vendas"       element={<PrivateRoute roles={['admin','vendedor']}><VendasLista /></PrivateRoute>} />
        <Route path="clientes"             element={<PrivateRoute roles={['admin','vendedor']}><ClientesLista /></PrivateRoute>} />
        <Route path="clientes/importar"   element={<PrivateRoute roles={['admin','vendedor']}><ImportarContatos /></PrivateRoute>} />
        <Route path="clientes/novo"       element={<PrivateRoute roles={['admin','vendedor']}><ClienteForm /></PrivateRoute>} />
        <Route path="clientes/:id/editar" element={<PrivateRoute roles={['admin','vendedor']}><ClienteForm /></PrivateRoute>} />
        <Route path="orcamentos"  element={<PrivateRoute roles={['admin','vendedor']}><OrcamentosLista /></PrivateRoute>} />
        <Route path="pedidos"      element={<PedidosLista />} />
        <Route path="pedidos/:id"  element={<PedidoDetalhe />} />
        <Route path="producao"    element={<PrivateRoute roles={['admin','producao']}><ProducaoKanban /></PrivateRoute>} />
        <Route path="financeiro"  element={<PrivateRoute roles={['admin']}><FinanceiroDashboard /></PrivateRoute>} />
        <Route path="relatorios"  element={<PrivateRoute roles={['admin']}><RelatoriosDashboard /></PrivateRoute>} />
        <Route path="usuarios"       element={<PrivateRoute roles={['admin']}><UsuariosLista /></PrivateRoute>} />
        <Route path="configuracoes" element={<PrivateRoute roles={['admin']}><Configuracoes /></PrivateRoute>} />
        <Route path="*"             element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

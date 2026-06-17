# RL Gráfica ERP — Sistema de Gestão Empresarial

## Visão Geral

Sistema ERP web completo desenvolvido para a **RL Gráfica**, cobrindo todo o ciclo operacional da empresa: orçamentos, pedidos, gestão de artes, produção, estoque e financeiro.

## Stack Tecnológica

| Camada       | Tecnologia                            | Versão    |
|--------------|---------------------------------------|-----------|
| Backend      | Laravel (PHP)                         | 11.x      |
| Frontend     | React + TypeScript                    | 18.x      |
| Banco        | MySQL                                 | 8.x       |
| Auth         | Laravel Sanctum (token bearer)        | 4.x       |
| Build Tool   | Vite                                  | 5.x       |
| CSS          | TailwindCSS                           | 3.x       |
| HTTP Client  | Axios                                 | 1.x       |
| Roteamento   | React Router DOM                      | 6.x       |
| Estado       | React Query (TanStack)                | 5.x       |
| Gráficos     | Recharts                              | 2.x       |
| Formulários  | React Hook Form + Zod                 | -         |
| Ícones       | Lucide React                          | -         |

## Módulos do Sistema

- **Dashboard** — visão geral em tempo real com KPIs
- **Clientes** — cadastro completo com histórico de compras
- **Orçamentos** — geração, envio e conversão para pedido
- **Pedidos** — ciclo completo de status por kanban
- **Gestão de Artes** — upload, revisão e aprovação
- **Produção** — fila de impressão por setor
- **Estoque** — insumos, entradas/saídas, alertas
- **Financeiro** — contas a pagar/receber, fluxo de caixa
- **Relatórios** — desempenho, produtos, clientes, lucratividade
- **Usuários** — controle de acesso por papel (RBAC)

## Níveis de Acesso

| Papel       | Acesso                                                       |
|-------------|--------------------------------------------------------------|
| admin       | Acesso total                                                 |
| vendedor    | Clientes, Orçamentos, Pedidos, Financeiro (leitura)          |
| designer    | Pedidos (leitura), Artes                                     |
| producao    | Pedidos (leitura), Produção                                  |

## Requisitos do Ambiente

- PHP >= 8.2
- Composer >= 2.x
- Node.js >= 20.x
- MySQL >= 8.0

## Instalação — Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
# Configure DB_* no .env
php artisan migrate --seed
php artisan storage:link
php artisan serve --port=8000
```

## Instalação — Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Configure VITE_API_URL no .env.local
npm run dev
```

## Usuários Padrão (seed)

| E-mail                      | Senha     | Papel      |
|-----------------------------|-----------|------------|
| admin@rlgrafica.com.br      | admin123  | admin      |
| vendedor@rlgrafica.com.br   | vendas123 | vendedor   |
| designer@rlgrafica.com.br   | arte123   | designer   |
| producao@rlgrafica.com.br   | prod123   | producao   |

## Estrutura de Pastas

```
rl-grafica-erp/
├── backend/                  # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/ # Controladores REST
│   │   ├── Http/Middleware/  # Autenticação, RBAC
│   │   ├── Http/Requests/    # Validação de entrada
│   │   ├── Models/           # Eloquent ORM
│   │   └── Services/         # Lógica de negócio
│   ├── database/
│   │   ├── migrations/       # Estrutura do banco
│   │   └── seeders/          # Dados iniciais
│   └── routes/api.php        # Rotas da API
└── frontend/                 # React SPA
    └── src/
        ├── components/       # Componentes reutilizáveis
        ├── pages/            # Páginas por módulo
        ├── services/         # Chamadas à API
        ├── contexts/         # Auth context
        ├── hooks/            # Hooks customizados
        └── types/            # TypeScript types
```

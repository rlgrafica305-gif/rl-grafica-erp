SHBOARM# Deploy — RL Gráfica ERP

## 1. Logo do Sistema

Antes de fazer o deploy, salve o seu logo:

```
Copie o arquivo do logo RL Gráfica para:
  rl-grafica-erp/frontend/public/logo.png
```

O logo aparecerá automaticamente em:
- Tela de Login (centralizado, grande)
- Sidebar (canto superior esquerdo)
- Header mobile
- Favicon do navegador

---

## 2. Deploy do Banco de Dados + Backend no Railway

### Passo 1 — Criar conta e projeto no Railway

1. Acesse https://railway.app e crie uma conta gratuita
2. Clique em **New Project**
3. Selecione **Empty Project**

### Passo 2 — Banco MySQL no Railway

1. No projeto, clique em **+ Add Service** → **Database** → **MySQL**
2. Aguarde o banco ser criado
3. Clique no serviço MySQL → aba **Variables**
4. Anote os valores:
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`

### Passo 3 — Subir o Backend Laravel

1. No projeto Railway, clique em **+ Add Service** → **GitHub Repo**
2. Autorize o Railway a acessar seu GitHub
3. Faça upload da pasta `backend/` no seu GitHub (ou use Railway CLI)

**Ou via Railway CLI:**
```bash
npm install -g @railway/cli
cd backend
railway login
railway link
railway up
```

### Passo 4 — Variáveis de Ambiente do Backend

No painel Railway → seu serviço Laravel → aba **Variables**, adicione:

```
APP_NAME=RL Gráfica ERP
APP_ENV=production
APP_DEBUG=false
APP_URL=https://seu-backend.railway.app

DB_CONNECTION=mysql
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_DATABASE=${{MySQL.MYSQLDATABASE}}
DB_USERNAME=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}

FRONTEND_URL=https://seu-frontend.vercel.app

SANCTUM_STATEFUL_DOMAINS=seu-frontend.vercel.app
```

> `${{MySQL.MYSQLHOST}}` é a sintaxe do Railway para referenciar variáveis de outro serviço.

### Passo 5 — Configurar o Nixpacks (build Laravel)

Crie o arquivo `backend/nixpacks.toml`:

```toml
[phases.setup]
nixPkgs = ["php82", "php82Extensions.pdo_mysql", "php82Extensions.mbstring", "php82Extensions.xml", "composer"]

[phases.build]
cmds = [
  "composer install --no-dev --optimize-autoloader",
  "php artisan config:cache",
  "php artisan route:cache",
  "php artisan view:cache"
]

[start]
cmd = "php artisan migrate --force && php artisan db:seed --force && php artisan storage:link && php -S 0.0.0.0:$PORT -t public"
```

### Passo 6 — Executar Migrations

Após o deploy, no terminal Railway (ou via CLI):

```bash
railway run php artisan migrate --seed
```

---

## 3. Deploy do Frontend no Vercel

### Passo 1 — Preparar o repositório

1. Faça upload da pasta `frontend/` no GitHub

### Passo 2 — Importar no Vercel

1. Acesse https://vercel.com
2. Clique em **Add New Project**
3. Importe seu repositório GitHub
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend` (se subiu o projeto inteiro)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Passo 3 — Variáveis de Ambiente no Vercel

No painel Vercel → seu projeto → **Settings** → **Environment Variables**:

```
VITE_API_URL=https://seu-backend.railway.app
```

### Passo 4 — Deploy

Clique em **Deploy**. O Vercel fará o build automaticamente.

Após o deploy, você terá:
- **Frontend**: https://rl-grafica-erp.vercel.app
- **Backend**: https://rl-grafica-backend.railway.app

---

## 4. Atualizar a URL do Backend nas Variáveis

Após o deploy do Railway, copie a URL gerada e:
1. No Vercel → altere `VITE_API_URL` para a URL do Railway
2. No Railway (backend) → altere `FRONTEND_URL` para a URL do Vercel
3. Faça um novo deploy de ambos para aplicar

---

## 5. Testando o Sistema

Acesse a URL do Vercel e faça login:

| E-mail                      | Senha     | Papel        |
|-----------------------------|-----------|--------------|
| admin@rlgrafica.com.br      | admin123  | Administrador|
| vendedor@rlgrafica.com.br   | vendas123 | Vendedor     |
| designer@rlgrafica.com.br   | arte123   | Designer     |
| producao@rlgrafica.com.br   | prod123   | Produção     |

---

## 6. Instalação Local (Desenvolvimento)

### Backend
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
# Edite o .env com seus dados MySQL
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# Edite VITE_API_URL=http://localhost:8000
npm run dev
```

Acesse: http://localhost:5173

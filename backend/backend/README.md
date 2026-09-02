# Digital Store — Backend

API REST em Node.js + Express + PostgreSQL (via Prisma) para a Digital Store.

## Stack

- **Node.js** + **Express** — servidor HTTP
- **PostgreSQL** + **Prisma** — banco de dados e ORM
- **JWT** (`jsonwebtoken`) — autenticação
- **bcryptjs** — hash de senhas
- **zod** — validação de dados de entrada

## Como rodar localmente

### 1. Pré-requisitos
- Node.js 18+
- Um banco PostgreSQL rodando (local, Docker, ou um serviço gerenciado como Neon, Supabase ou Railway)

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
```bash
cp .env.example .env
```
Edite o `.env` e preencha `DATABASE_URL` com a string de conexão do seu banco, e troque `JWT_SECRET` por uma chave aleatória (nunca use a de exemplo em produção).

### 4. Rodar as migrations
Isso cria as tabelas no banco a partir do `prisma/schema.prisma`:
```bash
npx prisma migrate dev --name init
```

### 5. (Opcional) Popular o banco com dados de exemplo
```bash
npm run seed
```
Isso cria um usuário admin (`admin@digitalstore.com` / `admin123`) e os produtos de exemplo baseados no mock do front.

### 6. Subir o servidor
```bash
npm run dev
```
A API sobe em `http://localhost:3333` (ou a porta definida em `PORT`).

## Endpoints

### Autenticação (`/api/auth`)
| Método | Rota | Protegida | Descrição |
|---|---|---|---|
| POST | `/register` | Não | Cria um novo usuário |
| POST | `/login` | Não | Autentica e retorna um token JWT |
| GET | `/me` | Sim | Retorna os dados do usuário logado |

### Produtos (`/api/products`)
| Método | Rota | Protegida | Descrição |
|---|---|---|---|
| GET | `/` | Não | Lista produtos (aceita filtros via query string) |
| GET | `/:idOrSlug` | Não | Detalhe de um produto |
| POST | `/` | Admin | Cria um produto |
| PUT | `/:id` | Admin | Atualiza um produto |
| DELETE | `/:id` | Admin | Desativa um produto (soft delete) |

Filtros disponíveis em `GET /api/products`: `category`, `q` (busca por nome), `minPrice`, `maxPrice`, `size`, `color`.

### Carrinho (`/api/cart`) — todas exigem login
| Método | Rota | Descrição |
|---|---|---|
| GET | `/` | Retorna o carrinho do usuário logado |
| POST | `/` | Adiciona um item ao carrinho |
| PUT | `/:itemId` | Atualiza a quantidade de um item |
| DELETE | `/:itemId` | Remove um item do carrinho |

### Pedidos (`/api/orders`) — todas exigem login
| Método | Rota | Descrição |
|---|---|---|
| POST | `/` | Fecha um pedido a partir do carrinho atual |
| GET | `/` | Lista os pedidos do usuário logado |
| GET | `/:id` | Detalhe de um pedido |

## Autenticação nas requisições

Depois de logar, envie o token no header de todas as rotas protegidas:
```
Authorization: Bearer SEU_TOKEN_AQUI
```

## Estrutura de pastas

```
src/
  config/prisma.js       # instância única do Prisma Client
  controllers/            # lógica de cada rota
  routes/                 # definição das rotas Express
  middleware/
    auth.js               # requireAuth / requireAdmin
    errorHandler.js        # tratamento centralizado de erros
  utils/AppError.js       # classe de erro customizada
  app.js                  # configuração do Express (middlewares, rotas)
  server.js               # ponto de entrada, sobe o servidor
prisma/
  schema.prisma           # modelos do banco
  seed.js                 # popula o banco com dados de exemplo
```

## Deploy

Este backend **não pode ser deployado na Vercel como projeto serverless simples** sem ajustes (Prisma + conexões PostgreSQL persistentes não combinam bem com funções serverless sem um connection pooler). Recomendado usar:
- **Railway** ou **Render** — mais simples para APIs Express tradicionais com banco
- Se insistir em Vercel: usar **Vercel Postgres** ou **Neon** com o adapter de conexão serverless do Prisma (`@prisma/adapter-neon`), e converter as rotas para funções serverless

O **front-end** (que já está na Vercel) deve apontar para a URL pública dessa API através de uma variável de ambiente, por exemplo:
```
VITE_API_URL=https://sua-api.up.railway.app
```

## Conectando com o front-end

No front, crie um `.env` com:
```
VITE_API_URL=http://localhost:3333
```
E troque os imports de `src/data/products.js` por chamadas `fetch(`${import.meta.env.VITE_API_URL}/api/products`)`, mantendo o mesmo formato de dados que os componentes já esperam.

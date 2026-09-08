# Digital Store — Backend

API REST em Node.js + Express + PostgreSQL (via Prisma) para a Digital Store.

## Stack

- **Node.js** + **Express** — servidor HTTP
- **PostgreSQL** + **Prisma** — banco de dados e ORM
- **JWT** (`jsonwebtoken`) — autenticação
- **bcryptjs** — hash de senhas
- **zod** — validação de dados de entrada
- **express-rate-limit** — limita tentativas em rotas sensíveis
- **Resend** (via `fetch`) — envio do e-mail de recuperação de senha
- **Vitest** — testes automatizados

## Como rodar localmente

### 1. Pré-requisitos
- Node.js 18+
- Um banco PostgreSQL (local, Docker, ou um serviço gerenciado como Supabase, Neon ou Railway)

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
```bash
cp .env.example .env
```

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | Sim | Connection string do Postgres (com pooler, ex: porta 6543 no Supabase) |
| `DIRECT_URL` | Sim | Connection string direta do Postgres (usada pelas migrations) |
| `JWT_SECRET` | Sim | Chave aleatória para assinar os tokens — **nunca reaproveite a de exemplo** |
| `JWT_EXPIRES_IN` | Não | Validade do token (padrão `7d`) |
| `PORT` | Não | Porta do servidor (padrão `3333`; o Render define a dele automaticamente) |
| `FRONTEND_URL` | Sim | URL do frontend — usada no CORS e no link do e-mail de redefinição de senha |
| `RESEND_API_KEY` | Não | Chave da API do [Resend](https://resend.com). Sem ela, o link de redefinição de senha só é impresso no console (bom para testar localmente) |
| `EMAIL_FROM` | Não | Remetente do e-mail (padrão `Digital Store <onboarding@resend.dev>`) |

### 4. Rodar as migrations
Cria as tabelas no banco a partir do `prisma/schema.prisma`:
```bash
npx prisma migrate dev
```

### 5. (Opcional) Popular o banco com dados de exemplo
```bash
npm run seed
```
Cria um usuário admin (`admin@digitalstore.com` / `admin123`) e um catálogo
de produtos variados (marca, categoria, gênero e desconto diferentes entre si).

### 6. Subir o servidor
```bash
npm run dev
```
A API sobe em `http://localhost:3333` (ou a porta definida em `PORT`).

### 7. Rodar os testes
```bash
npm test
```

## Endpoints

### Autenticação (`/api/auth`)
| Método | Rota | Protegida | Descrição |
|---|---|---|---|
| POST | `/register` | Não | Cria um novo usuário (rate limit: 20/hora por IP) |
| POST | `/login` | Não | Autentica e retorna um token JWT (rate limit: 10/15min por IP) |
| GET | `/me` | Sim | Retorna os dados do usuário logado |
| POST | `/forgot-password` | Não | Envia (ou loga no console) um link de redefinição de senha. Sempre responde com sucesso genérico, exista ou não o e-mail (rate limit: 5/15min por IP) |
| POST | `/reset-password` | Não | Troca a senha usando o token recebido por e-mail (válido por 1h, uso único) |

### Produtos (`/api/products`)
| Método | Rota | Protegida | Descrição |
|---|---|---|---|
| GET | `/` | Não | Lista produtos paginados (aceita filtros via query string) |
| GET | `/:idOrSlug` | Não | Detalhe de um produto (por id ou slug) |
| POST | `/` | Admin | Cria um produto |
| PUT | `/:id` | Admin | Atualiza um produto |
| DELETE | `/:id` | Admin | Desativa um produto (soft delete) |

Filtros disponíveis em `GET /api/products`: `category`, `brand`, `gender`,
`q` (busca por nome), `minPrice`, `maxPrice`, `size`, `color`, `page`, `limit`
(máximo 60 por página, padrão 12).

### Carrinho (`/api/cart`) — todas exigem login
| Método | Rota | Descrição |
|---|---|---|
| GET | `/` | Retorna o carrinho do usuário logado |
| POST | `/` | Adiciona um item (valida se a quantidade final não passa do estoque) |
| PUT | `/:itemId` | Atualiza a quantidade de um item (mesma validação de estoque) |
| DELETE | `/:itemId` | Remove um item do carrinho |

### Pedidos (`/api/orders`) — todas exigem login
| Método | Rota | Descrição |
|---|---|---|
| POST | `/` | Fecha um pedido a partir do carrinho atual (transação: cria o pedido, abate o estoque de cada item e limpa o carrinho) |
| GET | `/` | Lista os pedidos do usuário logado |
| GET | `/:id` | Detalhe de um pedido (dono do pedido ou admin) |

### Lista de desejos (`/api/wishlist`) — todas exigem login
| Método | Rota | Descrição |
|---|---|---|
| GET | `/` | Lista os favoritos do usuário logado |
| POST | `/` | Adiciona um produto (idempotente — adicionar de novo não duplica) |
| DELETE | `/:productId` | Remove um produto dos favoritos |

## Autenticação nas requisições

Depois de logar, envie o token no header de todas as rotas protegidas:
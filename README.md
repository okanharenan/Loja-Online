# 🛍️ Digital Store

Um e-commerce full-stack de tênis e streetwear desenvolvido como projeto de estudo e portfólio. A aplicação oferece um catálogo completo de produtos, carrinho de compras, autenticação de usuários, lista de desejos e um painel administrativo para gerenciamento de produtos.

O projeto foi desenvolvido com uma arquitetura separando **frontend** e **backend** em aplicações independentes dentro do mesmo repositório.

---

## 🚀 Demonstração

- 🌐 **Loja:** https://loja-online-smoky.vercel.app
- ⚙️ **API:** https://loja-online-0crz.onrender.com/api/health

> **Observação:** O backend está hospedado no plano gratuito do Render. Caso fique um período sem acessos, a primeira requisição pode levar cerca de **30 segundos** para responder enquanto o servidor é inicializado.

---

## 🛠️ Tecnologias Utilizadas

| Camada | Tecnologias |
|--------|-------------|
| **Frontend** | React, Vite, React Router, CSS |
| **Backend** | Node.js, Express.js, Prisma ORM |
| **Banco de Dados** | PostgreSQL (Supabase) |
| **Autenticação** | JWT + bcrypt |
| **Testes** | Vitest |
| **Deploy** | Vercel + Render |
| **E-mail** | Resend |

---

## ✨ Funcionalidades

### 🛒 Loja

- Catálogo de produtos
- Busca por produtos
- Filtros por marca, categoria e gênero
- Paginação
- Página de detalhes do produto
- Galeria de imagens com navegação por botões, teclado e swipe (mobile)
- Lista de desejos (Favoritos)
- Carrinho de compras
- Checkout
- Histórico de pedidos

### 👤 Autenticação

- Cadastro de usuários
- Login com JWT
- Recuperação de senha por e-mail
- Senhas criptografadas com bcrypt

### 🔐 Administração

- Cadastro de produtos
- Edição de produtos
- Exclusão de produtos

### 🛡️ Segurança

- Rate Limiting nas rotas de login, cadastro e recuperação de senha
- Validação de dados
- Autenticação com JWT

---

## 📁 Estrutura do Projeto

```text
Digital-Store/
│
├── backend/
│   └── backend/
│       ├── prisma/
│       ├── src/
│       ├── tests/
│       └── package.json
│
├── frontend/
│   └── frontend/
│       ├── public/
│       ├── src/
│       └── package.json
│
└── README.md
```

---

## ▶️ Como executar

### Clone o repositório

```bash
git clone https://github.com/seu-usuario/digital-store.git
```

### Backend

```bash
cd backend/backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend/frontend
npm install
npm run dev
```

---

## 📚 Objetivos do Projeto

Este projeto foi desenvolvido para consolidar conhecimentos em desenvolvimento Full Stack, abordando conceitos como:

- Desenvolvimento de APIs REST
- React e Vite
- Node.js e Express
- Prisma ORM
- PostgreSQL
- Autenticação com JWT
- Integração com serviços externos
- Boas práticas de organização de código
- Deploy em produção

---

## 📄 Licença

Projeto desenvolvido para fins de estudo e portfólio.

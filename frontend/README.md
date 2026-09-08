# Digital Store — Frontend

Aplicação React (Vite) do e-commerce Digital Store — consome a API do
[backend](../backend/backend/README.md) e não guarda nenhuma lógica de
negócio própria (estoque, preço, permissões etc. são sempre validados no
servidor; o front só reflete isso na UI).

## Stack

- **React 18** + **Vite** — build e dev server
- **React Router** — roteamento client-side (SPA)
- **lucide-react** — ícones
- CSS puro por componente (sem framework de UI), com tokens de design
  centralizados em `src/index.css` (cores, sombras, raios de borda)

## Como rodar localmente

### 1. Pré-requisitos
- Node.js 18+
- O [backend](../backend/backend/README.md) rodando (local ou já publicado)

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
Crie um arquivo `.env` na raiz desta pasta:
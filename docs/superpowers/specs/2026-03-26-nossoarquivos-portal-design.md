# NossoArquivos — Portal de Gerenciamento de Arquivos MinIO

## Objetivo

Portal web interno para gerenciar arquivos em um bucket MinIO, permitindo upload, organização em pastas e geração de URLs públicas permanentes para compartilhar com clientes externos — sem expor o MinIO diretamente.

## Requisitos

- Usuários internos autenticados via API do NossoGerenciador (Bearer token + X-API-KEY)
- Um bucket fixo configurado via `.env` (não cria/gerencia buckets)
- CRUD de pastas dentro do bucket
- Upload de arquivos (multipart, múltiplos)
- URLs públicas permanentes (sem autenticação) para arquivos
- MinIO totalmente isolado — todo tráfego passa pelo backend
- Deploy via Docker Compose

## Stack

- **Backend:** Node.js + Fastify + @aws-sdk/client-s3
- **Frontend:** Vite + React + TypeScript + Tailwind CSS + TanStack Query
- **Infra:** Docker Compose (nginx + backend), rede interna

## Arquitetura

```
┌─────────────────────────────────────────────────┐
│  Docker Network (nossoarquivos_net)              │
│                                                  │
│  ┌──────────┐    ┌──────────┐    ┌───────────┐  │
│  │  Nginx   │───▶│ Backend  │───▶│  MinIO    │  │
│  │ :80      │    │ Fastify  │    │ 10.80.1.15│  │
│  │ (exposto │    │ :3000    │    │ (externo) │  │
│  │  :8080)  │    │ (interno)│    │           │  │
│  └──────────┘    └──────────┘    └───────────┘  │
│       │               │                         │
│  serve build     proxy auth ──▶ API NossoGerenc.│
│  proxy /api/*    CRUD S3                        │
│  proxy /public/*                                │
└─────────────────────────────────────────────────┘
```

**Fluxos:**
- `GET /api/*` → nginx proxy → backend (requer auth) → MinIO
- `POST /api/*` → nginx proxy → backend (requer auth) → MinIO
- `GET /public/*` → nginx proxy → backend (sem auth) → MinIO → serve arquivo
- `/*` → nginx serve React build (SPA)

## Backend — Rotas

### Autenticadas (`/api/*`)

Todas validam token repassando `Authorization` e `X-API-KEY` pra API do NossoGerenciador.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/folders` | Lista pastas/arquivos na raiz |
| GET | `/api/folders/:path(*)` | Lista conteúdo de uma pasta |
| POST | `/api/folders` | Cria pasta `{ path: "clientes/joao" }` |
| DELETE | `/api/folders/:path(*)` | Remove pasta e todo conteúdo |
| POST | `/api/upload` | Upload multipart `{ path?, files[] }` |
| DELETE | `/api/files/:path(*)` | Remove arquivo |
| GET | `/api/files/:path(*)/info` | Metadados (tamanho, data, tipo) |

### Pública

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/public/*` | Serve arquivo do MinIO sem auth |

### Middleware de Auth

1. Extrai headers `Authorization` e `X-API-KEY` da request
2. Faz GET/POST pra API do NossoGerenciador pra validar o token
3. Se resposta != 2xx → retorna 401
4. Se ok → prossegue com a request

## Backend — Variáveis de Ambiente

```env
MINIO_ENDPOINT=10.80.1.15
MINIO_PORT=9000
MINIO_ACCESS_KEY=xxx
MINIO_SECRET_KEY=xxx
MINIO_BUCKET=nome-do-bucket
MINIO_USE_SSL=false
AUTH_API_URL=https://homologacaogerenciador.obtersolucoes.app.br
AUTH_API_KEY=3f2d12f1-92a6-4e45-97d7-3d83ae88b0c6
```

## Frontend — Telas

### Login

- Mesma lógica do NossoGerenciadorV2
- Username + password → POST `/token/gerencial` (via backend proxy ou direto)
- Salva token, user info e login_time no localStorage
- Redireciona pro gerenciador

### Gerenciador de Arquivos (tela principal)

- **Barra superior:** nome do usuário, botão logout
- **Breadcrumb:** navegação hierárquica (ex: `/ > clientes > joao > contratos`)
- **Botões de ação:** "Nova Pasta", "Upload"
- **Tabela de conteúdo:**
  - Ícone (pasta/arquivo)
  - Nome
  - Tamanho (só arquivos)
  - Data de modificação
  - Ações: copiar link público, download, excluir
- **Comportamentos:**
  - Clicar em pasta → navega pra dentro
  - Upload com drag & drop + botão de seleção
  - Upload múltiplo com barra de progresso
  - "Copiar link público" → copia URL pro clipboard
  - Confirmação antes de excluir
  - Toast de feedback (sucesso/erro)

## Frontend — Stack

- React Router (navegação)
- TanStack Query (chamadas API + cache)
- Fetch API (mesmo padrão NossoGerenciadorV2)
- Tailwind CSS (estilização)
- Lucide React (ícones)

## Docker

### docker-compose.yml

```yaml
services:
  frontend:
    build: ./frontend
    ports:
      - "8080:80"
    networks:
      - nossoarquivos_net
    depends_on:
      - backend

  backend:
    build: ./backend
    expose:
      - "3000"
    env_file: .env
    networks:
      - nossoarquivos_net

networks:
  nossoarquivos_net:
    driver: bridge
```

### Frontend Dockerfile

Multi-stage build:
1. Stage 1: `node:20-alpine` → `npm install && npm run build`
2. Stage 2: `nginx:alpine` → copia build + nginx.conf

### Backend Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
CMD ["node", "src/server.js"]
```

### nginx.conf

```nginx
server {
    listen 80;

    location /api/ {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 100M;
    }

    location /public/ {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
    }

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
}
```

## Estrutura de Arquivos

```
NossoArquivos/
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/
│   │   │   ├── folders.js
│   │   │   ├── files.js
│   │   │   └── public.js
│   │   ├── services/
│   │   │   └── minio.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   └── config/
│   │       └── env.js
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   └── FileManager.tsx
│   │   ├── components/
│   │   │   ├── Breadcrumb.tsx
│   │   │   ├── FileTable.tsx
│   │   │   ├── UploadModal.tsx
│   │   │   ├── NewFolderModal.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── Toast.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── useFiles.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── authApi.ts
│   │   └── types/
│   │       └── index.ts
│   ├── nginx/
│   │   └── nginx.conf
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml
├── .env
├── .env.example
└── .gitignore
```

## URL Pública

Formato: `http://<dominio>:8080/public/<caminho-no-bucket>`

Exemplo: upload de `contratos/2024/contrato.pdf` gera URL:
`http://dominio:8080/public/contratos/2024/contrato.pdf`

O backend recebe o request em `/public/*`, busca o objeto no MinIO e faz stream da resposta com os headers corretos (`Content-Type`, `Content-Disposition`).

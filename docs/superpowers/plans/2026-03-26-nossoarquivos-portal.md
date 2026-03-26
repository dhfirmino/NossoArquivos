# NossoArquivos Portal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Portal web para gerenciar arquivos em bucket MinIO com URLs públicas permanentes, autenticação via NossoGerenciador.

**Architecture:** Monorepo com backend Fastify (proxy S3 + auth) e frontend React (SPA). Nginx serve o build e faz proxy para o backend. Tudo roda em Docker Compose com rede interna — MinIO e backend nunca ficam expostos.

**Tech Stack:** Node.js 20, Fastify, @aws-sdk/client-s3, @fastify/multipart, React 18, Vite, TypeScript, Tailwind CSS, TanStack Query, Lucide React, Docker, Nginx.

---

## File Structure

### Backend (`backend/`)

| File | Responsibility |
|------|---------------|
| `src/server.js` | Fastify bootstrap, registra plugins e rotas |
| `src/config/env.js` | Lê e valida variáveis de ambiente |
| `src/services/minio.js` | S3Client singleton + helpers (list, put, get, delete) |
| `src/middleware/auth.js` | Fastify plugin que valida token via API NossoGerenciador |
| `src/routes/folders.js` | Rotas GET/POST/DELETE para pastas |
| `src/routes/files.js` | Rotas POST upload, DELETE, GET info |
| `src/routes/public.js` | Rota GET pública para servir arquivos sem auth |
| `package.json` | Dependências e scripts |
| `Dockerfile` | Container Node.js Alpine |

### Frontend (`frontend/`)

| File | Responsibility |
|------|---------------|
| `src/main.tsx` | Entrypoint React + QueryClientProvider |
| `src/App.tsx` | Router com rotas públicas e protegidas |
| `src/types/index.ts` | Tipos compartilhados (FileItem, FolderContent, User) |
| `src/services/api.ts` | Fetch wrapper com auth headers e tratamento de erros |
| `src/services/authApi.ts` | Login endpoint |
| `src/hooks/useAuth.ts` | Hook de autenticação (login, logout, estado) |
| `src/hooks/useFiles.ts` | Hooks TanStack Query para CRUD de arquivos/pastas |
| `src/components/ProtectedRoute.tsx` | Wrapper que redireciona se não autenticado |
| `src/pages/Login.tsx` | Tela de login |
| `src/pages/FileManager.tsx` | Tela principal — gerenciador de arquivos |
| `src/components/Breadcrumb.tsx` | Navegação hierárquica de pastas |
| `src/components/FileTable.tsx` | Tabela com lista de pastas/arquivos |
| `src/components/UploadModal.tsx` | Modal de upload com drag & drop |
| `src/components/NewFolderModal.tsx` | Modal para criar nova pasta |
| `src/components/Toast.tsx` | Notificações de feedback |
| `nginx/nginx.conf` | Config nginx (proxy + SPA fallback) |
| `Dockerfile` | Multi-stage build (node → nginx) |
| `tailwind.config.js` | Config Tailwind |
| `vite.config.ts` | Config Vite |

### Root

| File | Responsibility |
|------|---------------|
| `docker-compose.yml` | Orquestra frontend + backend |
| `.env.example` | Template de variáveis de ambiente |
| `.gitignore` | Ignora node_modules, .env, dist |

---

## Task 1: Project Scaffolding & Config

**Files:**
- Create: `.gitignore`
- Create: `.env.example`
- Create: `backend/package.json`
- Create: `backend/src/config/env.js`

- [ ] **Step 1: Inicializar git**

```bash
cd C:/projetos/NossoArquivos
git init
```

- [ ] **Step 2: Criar .gitignore**

Create `.gitignore`:

```
node_modules/
dist/
.env
*.log
```

- [ ] **Step 3: Criar .env.example**

Create `.env.example`:

```env
MINIO_ENDPOINT=10.80.1.15
MINIO_PORT=9000
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
MINIO_BUCKET=your-bucket-name
MINIO_USE_SSL=false
AUTH_API_URL=https://homologacaogerenciador.obtersolucoes.app.br
AUTH_API_KEY=your-api-key
```

- [ ] **Step 4: Criar backend/package.json**

Create `backend/package.json`:

```json
{
  "name": "nossoarquivos-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js"
  },
  "dependencies": {
    "fastify": "^5.3.3",
    "@fastify/cors": "^10.0.3",
    "@fastify/multipart": "^9.0.5",
    "@aws-sdk/client-s3": "^3.800.0",
    "@aws-sdk/lib-storage": "^3.800.0"
  }
}
```

- [ ] **Step 5: Criar backend/src/config/env.js**

Create `backend/src/config/env.js`:

```js
const required = [
  'MINIO_ENDPOINT',
  'MINIO_PORT',
  'MINIO_ACCESS_KEY',
  'MINIO_SECRET_KEY',
  'MINIO_BUCKET',
  'AUTH_API_URL',
  'AUTH_API_KEY',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

export const config = {
  minio: {
    endpoint: process.env.MINIO_ENDPOINT,
    port: parseInt(process.env.MINIO_PORT, 10),
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    bucket: process.env.MINIO_BUCKET,
    useSSL: process.env.MINIO_USE_SSL === 'true',
  },
  auth: {
    apiUrl: process.env.AUTH_API_URL,
    apiKey: process.env.AUTH_API_KEY,
  },
};
```

- [ ] **Step 6: Instalar dependências do backend**

```bash
cd C:/projetos/NossoArquivos/backend
npm install
```

- [ ] **Step 7: Commit**

```bash
cd C:/projetos/NossoArquivos
git add .gitignore .env.example backend/package.json backend/src/config/env.js backend/package-lock.json
git commit -m "chore: scaffold backend project with config"
```

---

## Task 2: MinIO Service (S3 Client)

**Files:**
- Create: `backend/src/services/minio.js`

- [ ] **Step 1: Criar backend/src/services/minio.js**

Create `backend/src/services/minio.js`:

```js
import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { config } from '../config/env.js';

const protocol = config.minio.useSSL ? 'https' : 'http';

const s3 = new S3Client({
  endpoint: `${protocol}://${config.minio.endpoint}:${config.minio.port}`,
  region: 'us-east-1',
  credentials: {
    accessKeyId: config.minio.accessKey,
    secretAccessKey: config.minio.secretKey,
  },
  forcePathStyle: true,
});

const bucket = config.minio.bucket;

export async function listObjects(prefix = '') {
  const normalizedPrefix = prefix ? (prefix.endsWith('/') ? prefix : prefix + '/') : '';
  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: normalizedPrefix,
    Delimiter: '/',
  });
  const response = await s3.send(command);

  const folders = (response.CommonPrefixes || []).map((p) => ({
    name: p.Prefix.replace(normalizedPrefix, '').replace(/\/$/, ''),
    path: p.Prefix.replace(/\/$/, ''),
    type: 'folder',
  }));

  const files = (response.Contents || [])
    .filter((obj) => obj.Key !== normalizedPrefix)
    .map((obj) => ({
      name: obj.Key.replace(normalizedPrefix, ''),
      path: obj.Key,
      type: 'file',
      size: obj.Size,
      lastModified: obj.LastModified,
    }));

  return { folders, files };
}

export async function createFolder(path) {
  const key = path.endsWith('/') ? path : path + '/';
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: '',
  });
  await s3.send(command);
}

export async function uploadFile(key, body, contentType) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  await s3.send(command);
}

export async function deleteFile(key) {
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  await s3.send(command);
}

export async function deleteFolder(prefix) {
  const normalizedPrefix = prefix.endsWith('/') ? prefix : prefix + '/';
  const listCommand = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: normalizedPrefix,
  });
  const response = await s3.send(listCommand);
  const objects = response.Contents || [];

  if (objects.length === 0) return;

  const deleteCommand = new DeleteObjectsCommand({
    Bucket: bucket,
    Delete: {
      Objects: objects.map((obj) => ({ Key: obj.Key })),
    },
  });
  await s3.send(deleteCommand);
}

export async function getObject(key) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  return s3.send(command);
}

export async function getObjectInfo(key) {
  const command = new HeadObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  const response = await s3.send(command);
  return {
    size: response.ContentLength,
    contentType: response.ContentType,
    lastModified: response.LastModified,
  };
}
```

- [ ] **Step 2: Commit**

```bash
cd C:/projetos/NossoArquivos
git add backend/src/services/minio.js
git commit -m "feat: add MinIO S3 service with CRUD operations"
```

---

## Task 3: Auth Middleware

**Files:**
- Create: `backend/src/middleware/auth.js`

- [ ] **Step 1: Criar backend/src/middleware/auth.js**

Create `backend/src/middleware/auth.js`:

```js
import { config } from '../config/env.js';

export async function authMiddleware(request, reply) {
  const authorization = request.headers['authorization'];

  if (!authorization) {
    return reply.status(401).send({ error: 'Token não fornecido' });
  }

  try {
    const response = await fetch(`${config.auth.apiUrl}/api/v2/nossogerenciadorweb/usuario/me`, {
      method: 'GET',
      headers: {
        'Authorization': authorization,
        'X-API-KEY': config.auth.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return reply.status(401).send({ error: 'Token inválido ou expirado' });
    }
  } catch {
    return reply.status(502).send({ error: 'Erro ao validar autenticação' });
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd C:/projetos/NossoArquivos
git add backend/src/middleware/auth.js
git commit -m "feat: add auth middleware with NossoGerenciador token validation"
```

---

## Task 4: Backend Routes (Folders, Files, Public)

**Files:**
- Create: `backend/src/routes/folders.js`
- Create: `backend/src/routes/files.js`
- Create: `backend/src/routes/public.js`

- [ ] **Step 1: Criar backend/src/routes/folders.js**

Create `backend/src/routes/folders.js`:

```js
import { listObjects, createFolder, deleteFolder } from '../services/minio.js';

export async function folderRoutes(fastify) {
  fastify.get('/api/folders', async () => {
    return listObjects('');
  });

  fastify.get('/api/folders/*', async (request) => {
    const path = request.params['*'];
    return listObjects(path);
  });

  fastify.post('/api/folders', async (request, reply) => {
    const { path } = request.body;
    if (!path || typeof path !== 'string') {
      return reply.status(400).send({ error: 'Campo "path" é obrigatório' });
    }
    await createFolder(path);
    return { message: 'Pasta criada', path };
  });

  fastify.delete('/api/folders/*', async (request) => {
    const path = request.params['*'];
    await deleteFolder(path);
    return { message: 'Pasta removida', path };
  });
}
```

- [ ] **Step 2: Criar backend/src/routes/files.js**

Create `backend/src/routes/files.js`:

```js
import { uploadFile, deleteFile, getObjectInfo } from '../services/minio.js';

export async function fileRoutes(fastify) {
  fastify.post('/api/upload', async (request, reply) => {
    const parts = request.parts();
    let uploadPath = '';
    const uploaded = [];

    for await (const part of parts) {
      if (part.type === 'field' && part.fieldname === 'path') {
        uploadPath = part.value;
      }
      if (part.type === 'file') {
        const key = uploadPath
          ? `${uploadPath}/${part.filename}`
          : part.filename;
        const chunks = [];
        for await (const chunk of part.file) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        await uploadFile(key, buffer, part.mimetype);
        uploaded.push({ name: part.filename, path: key });
      }
    }

    if (uploaded.length === 0) {
      return reply.status(400).send({ error: 'Nenhum arquivo enviado' });
    }

    return { message: `${uploaded.length} arquivo(s) enviado(s)`, files: uploaded };
  });

  fastify.delete('/api/files/*', async (request) => {
    const path = request.params['*'];
    await deleteFile(path);
    return { message: 'Arquivo removido', path };
  });

  fastify.get('/api/files/*/info', async (request) => {
    const path = request.params['*'];
    const info = await getObjectInfo(path);
    return { path, ...info };
  });
}
```

- [ ] **Step 3: Criar backend/src/routes/public.js**

Create `backend/src/routes/public.js`:

```js
import { getObject } from '../services/minio.js';
import path from 'node:path';

const MIME_TYPES = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.zip': 'application/zip',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
};

export async function publicRoutes(fastify) {
  fastify.get('/public/*', async (request, reply) => {
    const key = request.params['*'];

    if (!key) {
      return reply.status(400).send({ error: 'Caminho do arquivo é obrigatório' });
    }

    try {
      const response = await getObject(key);
      const ext = path.extname(key).toLowerCase();
      const contentType = response.ContentType || MIME_TYPES[ext] || 'application/octet-stream';
      const filename = path.basename(key);

      reply.header('Content-Type', contentType);
      reply.header('Content-Disposition', `inline; filename="${filename}"`);

      if (response.ContentLength) {
        reply.header('Content-Length', response.ContentLength);
      }

      return reply.send(response.Body);
    } catch (err) {
      if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
        return reply.status(404).send({ error: 'Arquivo não encontrado' });
      }
      throw err;
    }
  });
}
```

- [ ] **Step 4: Commit**

```bash
cd C:/projetos/NossoArquivos
git add backend/src/routes/
git commit -m "feat: add folder, file, and public routes"
```

---

## Task 5: Fastify Server Bootstrap

**Files:**
- Create: `backend/src/server.js`

- [ ] **Step 1: Criar backend/src/server.js**

Create `backend/src/server.js`:

```js
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { authMiddleware } from './middleware/auth.js';
import { folderRoutes } from './routes/folders.js';
import { fileRoutes } from './routes/files.js';
import { publicRoutes } from './routes/public.js';

const fastify = Fastify({
  logger: true,
  bodyLimit: 104857600, // 100MB
});

await fastify.register(cors);
await fastify.register(multipart, {
  limits: {
    fileSize: 104857600, // 100MB
  },
});

// Public routes (no auth)
await fastify.register(publicRoutes);

// Authenticated routes
await fastify.register(async function authedRoutes(instance) {
  instance.addHook('preHandler', authMiddleware);
  await instance.register(folderRoutes);
  await instance.register(fileRoutes);
});

// Health check
fastify.get('/api/health', async () => ({ status: 'ok' }));

try {
  await fastify.listen({ port: 3000, host: '0.0.0.0' });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
```

- [ ] **Step 2: Verificar que o backend inicia sem erros (precisa do .env)**

```bash
cd C:/projetos/NossoArquivos/backend
# Testar sintaxe sem rodar (dry check)
node --check src/server.js && echo "Syntax OK"
```

- [ ] **Step 3: Commit**

```bash
cd C:/projetos/NossoArquivos
git add backend/src/server.js
git commit -m "feat: add Fastify server bootstrap with auth plugin"
```

---

## Task 6: Backend Docker

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/.dockerignore`

- [ ] **Step 1: Criar backend/Dockerfile**

Create `backend/Dockerfile`:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY src ./src
EXPOSE 3000
CMD ["node", "src/server.js"]
```

- [ ] **Step 2: Criar backend/.dockerignore**

Create `backend/.dockerignore`:

```
node_modules
npm-debug.log
```

- [ ] **Step 3: Commit**

```bash
cd C:/projetos/NossoArquivos
git add backend/Dockerfile backend/.dockerignore
git commit -m "chore: add backend Dockerfile"
```

---

## Task 7: Frontend Scaffolding (Vite + React + TS + Tailwind)

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tsconfig.app.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/index.css`
- Create: `frontend/src/vite-env.d.ts`

- [ ] **Step 1: Scaffold com Vite**

```bash
cd C:/projetos/NossoArquivos
npm create vite@latest frontend -- --template react-ts
```

- [ ] **Step 2: Instalar dependências**

```bash
cd C:/projetos/NossoArquivos/frontend
npm install react-router-dom @tanstack/react-query lucide-react
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 3: Configurar Tailwind — atualizar vite.config.ts**

Replace `frontend/vite.config.ts` with:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/public': 'http://localhost:3000',
    },
  },
});
```

- [ ] **Step 4: Configurar CSS — substituir src/index.css**

Replace `frontend/src/index.css` with:

```css
@import 'tailwindcss';
```

- [ ] **Step 5: Limpar App.tsx padrão**

Replace `frontend/src/App.tsx` with:

```tsx
function App() {
  return <div className="min-h-screen bg-gray-50 text-gray-900">NossoArquivos</div>;
}

export default App;
```

- [ ] **Step 6: Configurar main.tsx com providers**

Replace `frontend/src/main.tsx` with:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
```

- [ ] **Step 7: Verificar que o frontend compila**

```bash
cd C:/projetos/NossoArquivos/frontend
npm run build
```

Expected: Build sem erros, gera `dist/`.

- [ ] **Step 8: Remover arquivos desnecessários do scaffold**

```bash
cd C:/projetos/NossoArquivos/frontend
rm -f src/App.css src/assets/react.svg public/vite.svg
```

- [ ] **Step 9: Commit**

```bash
cd C:/projetos/NossoArquivos
git add frontend/
git commit -m "chore: scaffold frontend with Vite, React, TS, Tailwind"
```

---

## Task 8: Frontend Types & API Service

**Files:**
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/services/api.ts`
- Create: `frontend/src/services/authApi.ts`

- [ ] **Step 1: Criar types**

Create `frontend/src/types/index.ts`:

```ts
export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  lastModified?: string;
}

export interface FolderContent {
  folders: FileItem[];
  files: FileItem[];
}

export interface UploadResponse {
  message: string;
  files: { name: string; path: string }[];
}

export interface User {
  access_token: string;
  token_type: string;
  nome_colaborador: string;
  id_usuario: string;
  id_colaborador: string;
  id_revenda: string;
  expires_in: number;
  login_time: number;
}
```

- [ ] **Step 2: Criar API service**

Create `frontend/src/services/api.ts`:

```ts
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('access_token');

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    localStorage.clear();
    window.location.href = '/login';
    throw new ApiError(401, 'Sessão expirada');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, body.error || 'Erro desconhecido');
  }

  return response.json();
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};
```

- [ ] **Step 3: Criar authApi**

Create `frontend/src/services/authApi.ts`:

```ts
import type { User } from '../types';

interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  nome_colaborador: string;
  id_usuario: string;
  id_colaborador: string;
  id_revenda: string;
}

export async function login(username: string, password: string): Promise<User> {
  const body = new URLSearchParams({
    username,
    password,
    grant_type: 'password',
  });

  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Credenciais inválidas');
  }

  const data: LoginResponse = await response.json();

  const user: User = {
    ...data,
    login_time: Date.now(),
  };

  localStorage.setItem('access_token', user.access_token);
  localStorage.setItem('token_type', user.token_type);
  localStorage.setItem('nome_colaborador', user.nome_colaborador);
  localStorage.setItem('id_usuario', user.id_usuario);
  localStorage.setItem('id_colaborador', user.id_colaborador);
  localStorage.setItem('id_revenda', user.id_revenda || '');
  localStorage.setItem('expires_in', user.expires_in.toString());
  localStorage.setItem('login_time', user.login_time.toString());

  return user;
}
```

- [ ] **Step 4: Commit**

```bash
cd C:/projetos/NossoArquivos
git add frontend/src/types/ frontend/src/services/
git commit -m "feat: add frontend types, API service, and auth API"
```

---

## Task 9: Backend Auth Login Proxy Route

O frontend precisa de uma rota no backend que faça proxy do login pro NossoGerenciador, pois o frontend não pode falar direto com a API externa (CORS + credenciais).

**Files:**
- Create: `backend/src/routes/auth.js`
- Modify: `backend/src/server.js`

- [ ] **Step 1: Criar backend/src/routes/auth.js**

Create `backend/src/routes/auth.js`:

```js
import { config } from '../config/env.js';

export async function authRoutes(fastify) {
  fastify.post('/api/auth/login', async (request, reply) => {
    try {
      const response = await fetch(`${config.auth.apiUrl}/token/gerencial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-API-KEY': config.auth.apiKey,
        },
        body: request.body,
      });

      const data = await response.text();
      reply
        .status(response.status)
        .header('Content-Type', response.headers.get('content-type') || 'application/json')
        .send(data);
    } catch {
      reply.status(502).send({ error: 'Erro ao conectar com servidor de autenticação' });
    }
  });
}
```

- [ ] **Step 2: Registrar rota no server.js**

Add to `backend/src/server.js` — import and register `authRoutes` alongside `publicRoutes` (before the authed routes block):

```js
import { authRoutes } from './routes/auth.js';
```

And register it without auth:

```js
// Public routes (no auth)
await fastify.register(publicRoutes);
await fastify.register(authRoutes);
```

- [ ] **Step 3: Configurar Fastify para aceitar body raw (url-encoded)**

Add content type parser to `backend/src/server.js` before route registration:

```js
// Parse url-encoded body as raw string for auth proxy
fastify.addContentTypeParser(
  'application/x-www-form-urlencoded',
  { parseAs: 'string' },
  (req, body, done) => done(null, body),
);
```

- [ ] **Step 4: Commit**

```bash
cd C:/projetos/NossoArquivos
git add backend/src/routes/auth.js backend/src/server.js
git commit -m "feat: add auth login proxy route"
```

---

## Task 10: Frontend Auth Hook & Protected Route

**Files:**
- Create: `frontend/src/hooks/useAuth.ts`
- Create: `frontend/src/components/ProtectedRoute.tsx`

- [ ] **Step 1: Criar useAuth hook**

Create `frontend/src/hooks/useAuth.ts`:

```ts
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types';
import { login as loginApi } from '../services/authApi';

function loadUser(): User | null {
  const token = localStorage.getItem('access_token');
  if (!token) return null;

  const loginTime = parseInt(localStorage.getItem('login_time') || '0', 10);
  const expiresIn = parseInt(localStorage.getItem('expires_in') || '0', 10);

  if (Date.now() >= loginTime + expiresIn * 1000) {
    localStorage.clear();
    return null;
  }

  return {
    access_token: token,
    token_type: localStorage.getItem('token_type') || 'bearer',
    nome_colaborador: localStorage.getItem('nome_colaborador') || '',
    id_usuario: localStorage.getItem('id_usuario') || '',
    id_colaborador: localStorage.getItem('id_colaborador') || '',
    id_revenda: localStorage.getItem('id_revenda') || '',
    expires_in: expiresIn,
    login_time: loginTime,
  };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(loadUser);
  const navigate = useNavigate();

  const login = useCallback(
    async (username: string, password: string) => {
      const loggedUser = await loginApi(username, password);
      setUser(loggedUser);
      navigate('/');
    },
    [navigate],
  );

  const logout = useCallback(() => {
    localStorage.clear();
    setUser(null);
    navigate('/login');
  }, [navigate]);

  return {
    user,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
```

- [ ] **Step 2: Criar ProtectedRoute**

Create `frontend/src/components/ProtectedRoute.tsx`:

```tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

- [ ] **Step 3: Commit**

```bash
cd C:/projetos/NossoArquivos
git add frontend/src/hooks/useAuth.ts frontend/src/components/ProtectedRoute.tsx
git commit -m "feat: add useAuth hook and ProtectedRoute component"
```

---

## Task 11: Frontend Login Page

**Files:**
- Create: `frontend/src/pages/Login.tsx`

- [ ] **Step 1: Criar Login.tsx**

Create `frontend/src/pages/Login.tsx`:

```tsx
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogIn } from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <LogIn className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-800">NossoArquivos</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Usuário
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd C:/projetos/NossoArquivos
git add frontend/src/pages/Login.tsx
git commit -m "feat: add Login page"
```

---

## Task 12: Frontend useFiles Hook

**Files:**
- Create: `frontend/src/hooks/useFiles.ts`

- [ ] **Step 1: Criar useFiles hook**

Create `frontend/src/hooks/useFiles.ts`:

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { FolderContent, UploadResponse } from '../types';

export function useListFolder(path: string) {
  return useQuery({
    queryKey: ['folder', path],
    queryFn: () => {
      const url = path ? `/api/folders/${path}` : '/api/folders';
      return api.get<FolderContent>(url);
    },
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (path: string) =>
      api.post<{ message: string; path: string }>('/api/folders', { path }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folder'] });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (path: string) =>
      api.delete<{ message: string }>(`/api/folders/${path}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folder'] });
    },
  });
}

export function useUploadFiles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ path, files }: { path: string; files: File[] }) => {
      const formData = new FormData();
      if (path) formData.append('path', path);
      files.forEach((file) => formData.append('files', file));
      return api.post<UploadResponse>('/api/upload', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folder'] });
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (path: string) =>
      api.delete<{ message: string }>(`/api/files/${path}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folder'] });
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
cd C:/projetos/NossoArquivos
git add frontend/src/hooks/useFiles.ts
git commit -m "feat: add useFiles hooks for folder/file CRUD"
```

---

## Task 13: Frontend Components (Breadcrumb, Toast, NewFolderModal)

**Files:**
- Create: `frontend/src/components/Breadcrumb.tsx`
- Create: `frontend/src/components/Toast.tsx`
- Create: `frontend/src/components/NewFolderModal.tsx`

- [ ] **Step 1: Criar Breadcrumb**

Create `frontend/src/components/Breadcrumb.tsx`:

```tsx
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbProps {
  path: string;
  onNavigate: (path: string) => void;
}

export function Breadcrumb({ path, onNavigate }: BreadcrumbProps) {
  const parts = path ? path.split('/') : [];

  return (
    <nav className="flex items-center gap-1 text-sm text-gray-600">
      <button
        onClick={() => onNavigate('')}
        className="flex items-center gap-1 hover:text-blue-600"
      >
        <Home className="w-4 h-4" />
        <span>Raiz</span>
      </button>

      {parts.map((part, i) => {
        const partPath = parts.slice(0, i + 1).join('/');
        return (
          <span key={partPath} className="flex items-center gap-1">
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <button
              onClick={() => onNavigate(partPath)}
              className="hover:text-blue-600"
            >
              {part}
            </button>
          </span>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: Criar Toast**

Create `frontend/src/components/Toast.tsx`:

```tsx
import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white ${
          type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}
      >
        {type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
        <span className="text-sm">{message}</span>
        <button onClick={onClose} className="ml-2">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Criar NewFolderModal**

Create `frontend/src/components/NewFolderModal.tsx`:

```tsx
import { useState } from 'react';
import { X } from 'lucide-react';

interface NewFolderModalProps {
  currentPath: string;
  onConfirm: (fullPath: string) => void;
  onClose: () => void;
}

export function NewFolderModal({ currentPath, onConfirm, onClose }: NewFolderModalProps) {
  const [name, setName] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const fullPath = currentPath ? `${currentPath}/${trimmed}` : trimmed;
    onConfirm(fullPath);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Nova Pasta</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome da pasta"
            autoFocus
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Criar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd C:/projetos/NossoArquivos
git add frontend/src/components/Breadcrumb.tsx frontend/src/components/Toast.tsx frontend/src/components/NewFolderModal.tsx
git commit -m "feat: add Breadcrumb, Toast, and NewFolderModal components"
```

---

## Task 14: Frontend Components (UploadModal, FileTable)

**Files:**
- Create: `frontend/src/components/UploadModal.tsx`
- Create: `frontend/src/components/FileTable.tsx`

- [ ] **Step 1: Criar UploadModal**

Create `frontend/src/components/UploadModal.tsx`:

```tsx
import { useState, useCallback } from 'react';
import { X, Upload, FileIcon } from 'lucide-react';

interface UploadModalProps {
  currentPath: string;
  onUpload: (files: File[]) => void;
  onClose: () => void;
  isUploading: boolean;
}

export function UploadModal({ currentPath, onUpload, onClose, isUploading }: UploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) return;
    onUpload(files);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Upload de Arquivos</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {currentPath && (
          <p className="text-sm text-gray-500 mb-3">
            Destino: <span className="font-medium">{currentPath}/</span>
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">
              Arraste arquivos aqui ou clique para selecionar
            </p>
            <input
              id="file-input"
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {files.length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-1">
              {files.map((file, i) => (
                <div key={`${file.name}-${i}`} className="flex items-center justify-between text-sm py-1 px-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2 truncate">
                    <FileIcon className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate">{file.name}</span>
                    <span className="text-gray-400 shrink-0">
                      ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                  <button type="button" onClick={() => removeFile(i)}>
                    <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={files.length === 0 || isUploading}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isUploading ? 'Enviando...' : `Enviar (${files.length})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Criar FileTable**

Create `frontend/src/components/FileTable.tsx`:

```tsx
import { Folder, FileIcon, Trash2, Copy, Download } from 'lucide-react';
import type { FileItem } from '../types';

interface FileTableProps {
  items: FileItem[];
  onFolderClick: (path: string) => void;
  onDelete: (item: FileItem) => void;
  onCopyLink: (item: FileItem) => void;
}

function formatSize(bytes?: number): string {
  if (bytes === undefined) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('pt-BR');
}

export function FileTable({ items, onFolderClick, onDelete, onCopyLink }: FileTableProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Folder className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p>Pasta vazia</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="py-3 px-4 font-medium">Nome</th>
            <th className="py-3 px-4 font-medium w-28">Tamanho</th>
            <th className="py-3 px-4 font-medium w-44">Modificado</th>
            <th className="py-3 px-4 font-medium w-28 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.path} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4">
                {item.type === 'folder' ? (
                  <button
                    onClick={() => onFolderClick(item.path)}
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    <Folder className="w-5 h-5 text-yellow-500" />
                    {item.name}
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <FileIcon className="w-5 h-5 text-gray-400" />
                    {item.name}
                  </div>
                )}
              </td>
              <td className="py-3 px-4 text-gray-500">{formatSize(item.size)}</td>
              <td className="py-3 px-4 text-gray-500">{formatDate(item.lastModified)}</td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-1">
                  {item.type === 'file' && (
                    <>
                      <button
                        onClick={() => onCopyLink(item)}
                        title="Copiar link público"
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <a
                        href={`/public/${item.path}`}
                        download
                        title="Download"
                        className="p-1.5 text-gray-400 hover:text-green-600 rounded hover:bg-green-50"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </>
                  )}
                  <button
                    onClick={() => onDelete(item)}
                    title="Excluir"
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd C:/projetos/NossoArquivos
git add frontend/src/components/UploadModal.tsx frontend/src/components/FileTable.tsx
git commit -m "feat: add UploadModal and FileTable components"
```

---

## Task 15: Frontend FileManager Page

**Files:**
- Create: `frontend/src/pages/FileManager.tsx`

- [ ] **Step 1: Criar FileManager.tsx**

Create `frontend/src/pages/FileManager.tsx`:

```tsx
import { useState, useCallback } from 'react';
import { FolderPlus, Upload, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useListFolder, useCreateFolder, useDeleteFolder, useUploadFiles, useDeleteFile } from '../hooks/useFiles';
import { Breadcrumb } from '../components/Breadcrumb';
import { FileTable } from '../components/FileTable';
import { NewFolderModal } from '../components/NewFolderModal';
import { UploadModal } from '../components/UploadModal';
import { Toast } from '../components/Toast';
import type { FileItem } from '../types';

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

export function FileManager() {
  const { user, logout } = useAuth();
  const [currentPath, setCurrentPath] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<FileItem | null>(null);

  const { data, isLoading, error } = useListFolder(currentPath);
  const createFolder = useCreateFolder();
  const deleteFolderMut = useDeleteFolder();
  const uploadFiles = useUploadFiles();
  const deleteFileMut = useDeleteFile();

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);

  async function handleCreateFolder(fullPath: string) {
    try {
      await createFolder.mutateAsync(fullPath);
      showToast('Pasta criada com sucesso', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao criar pasta', 'error');
    }
    setShowNewFolder(false);
  }

  async function handleUpload(files: File[]) {
    try {
      await uploadFiles.mutateAsync({ path: currentPath, files });
      showToast(`${files.length} arquivo(s) enviado(s)`, 'success');
      setShowUpload(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro no upload', 'error');
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'folder') {
        await deleteFolderMut.mutateAsync(deleteConfirm.path);
      } else {
        await deleteFileMut.mutateAsync(deleteConfirm.path);
      }
      showToast('Removido com sucesso', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao remover', 'error');
    }
    setDeleteConfirm(null);
  }

  function handleCopyLink(item: FileItem) {
    const url = `${window.location.origin}/public/${item.path}`;
    navigator.clipboard.writeText(url);
    showToast('Link copiado!', 'success');
  }

  const items = [...(data?.folders || []), ...(data?.files || [])];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">NossoArquivos</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{user?.nome_colaborador}</span>
          <button
            onClick={logout}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="px-6 py-4 flex items-center justify-between">
        <Breadcrumb path={currentPath} onNavigate={setCurrentPath} />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewFolder(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <FolderPlus className="w-4 h-4" />
            Nova Pasta
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6">
        <div className="bg-white rounded-lg border border-gray-200">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Carregando...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              Erro ao carregar: {error instanceof Error ? error.message : 'Erro desconhecido'}
            </div>
          ) : (
            <FileTable
              items={items}
              onFolderClick={setCurrentPath}
              onDelete={setDeleteConfirm}
              onCopyLink={handleCopyLink}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {showNewFolder && (
        <NewFolderModal
          currentPath={currentPath}
          onConfirm={handleCreateFolder}
          onClose={() => setShowNewFolder(false)}
        />
      )}

      {showUpload && (
        <UploadModal
          currentPath={currentPath}
          onUpload={handleUpload}
          onClose={() => setShowUpload(false)}
          isUploading={uploadFiles.isPending}
        />
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-2">Confirmar exclusão</h2>
            <p className="text-sm text-gray-600 mb-4">
              Tem certeza que deseja excluir{' '}
              <span className="font-medium">{deleteConfirm.name}</span>
              {deleteConfirm.type === 'folder' && ' e todo seu conteúdo'}?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd C:/projetos/NossoArquivos
git add frontend/src/pages/FileManager.tsx
git commit -m "feat: add FileManager page with full CRUD UI"
```

---

## Task 16: Frontend App Router

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Atualizar App.tsx com rotas**

Replace `frontend/src/App.tsx` with:

```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { FileManager } from './pages/FileManager';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <FileManager />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
```

- [ ] **Step 2: Verificar build do frontend**

```bash
cd C:/projetos/NossoArquivos/frontend
npm run build
```

Expected: Build sem erros.

- [ ] **Step 3: Commit**

```bash
cd C:/projetos/NossoArquivos
git add frontend/src/App.tsx
git commit -m "feat: add App router with login and protected file manager"
```

---

## Task 17: Frontend Docker (Nginx + Multi-stage Build)

**Files:**
- Create: `frontend/nginx/nginx.conf`
- Create: `frontend/Dockerfile`
- Create: `frontend/.dockerignore`

- [ ] **Step 1: Criar nginx.conf**

Create `frontend/nginx/nginx.conf`:

```nginx
server {
    listen 80;

    location /api/ {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 100M;
    }

    location /public/ {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
}
```

- [ ] **Step 2: Criar Dockerfile**

Create `frontend/Dockerfile`:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

- [ ] **Step 3: Criar .dockerignore**

Create `frontend/.dockerignore`:

```
node_modules
dist
npm-debug.log
```

- [ ] **Step 4: Commit**

```bash
cd C:/projetos/NossoArquivos
git add frontend/nginx/ frontend/Dockerfile frontend/.dockerignore
git commit -m "chore: add frontend Dockerfile with nginx config"
```

---

## Task 18: Docker Compose

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Criar docker-compose.yml**

Create `docker-compose.yml`:

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
    restart: unless-stopped

  backend:
    build: ./backend
    expose:
      - "3000"
    env_file: .env
    networks:
      - nossoarquivos_net
    restart: unless-stopped

networks:
  nossoarquivos_net:
    driver: bridge
```

- [ ] **Step 2: Commit**

```bash
cd C:/projetos/NossoArquivos
git add docker-compose.yml
git commit -m "chore: add docker-compose with frontend and backend services"
```

---

## Task 19: Build & Smoke Test

- [ ] **Step 1: Criar arquivo .env real** (copiar de .env.example e preencher credenciais)

```bash
cd C:/projetos/NossoArquivos
cp .env.example .env
# Editar .env com credenciais reais do MinIO
```

- [ ] **Step 2: Build com Docker Compose**

```bash
cd C:/projetos/NossoArquivos
docker compose build
```

Expected: Build dos dois containers sem erros.

- [ ] **Step 3: Subir os serviços**

```bash
cd C:/projetos/NossoArquivos
docker compose up -d
```

- [ ] **Step 4: Testar health check**

```bash
curl http://localhost:8080/api/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 5: Testar acesso ao frontend**

Abrir `http://localhost:8080` no navegador. Deve redirecionar para `/login`.

- [ ] **Step 6: Testar login com credenciais do NossoGerenciador**

Fazer login — deve redirecionar para o gerenciador de arquivos.

- [ ] **Step 7: Testar upload de arquivo**

Clicar em "Upload", selecionar um arquivo, enviar. Verificar que aparece na lista.

- [ ] **Step 8: Testar URL pública**

Copiar link público do arquivo enviado. Abrir em aba anônima. Deve baixar/exibir o arquivo sem pedir login.

- [ ] **Step 9: Commit final**

```bash
cd C:/projetos/NossoArquivos
git add -A
git commit -m "chore: finalize NossoArquivos portal v1"
```

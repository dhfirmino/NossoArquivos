import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { authMiddleware } from './middleware/auth.js';
import { folderRoutes } from './routes/folders.js';
import { fileRoutes } from './routes/files.js';
import { publicRoutes } from './routes/public.js';
import { authRoutes } from './routes/auth.js';

const fastify = Fastify({
  logger: true,
  bodyLimit: 1073741824, // 1GB
});

await fastify.register(cors);
await fastify.register(multipart, {
  limits: {
    fileSize: 1073741824, // 1GB
  },
});

// Parse url-encoded body as raw string for auth proxy
fastify.addContentTypeParser(
  'application/x-www-form-urlencoded',
  { parseAs: 'string' },
  (req, body, done) => done(null, body),
);

// Public routes (no auth)
await fastify.register(publicRoutes);
await fastify.register(authRoutes);

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

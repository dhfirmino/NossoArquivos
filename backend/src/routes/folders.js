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

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

  fastify.get('/api/files-info/*', async (request) => {
    const path = request.params['*'];
    const info = await getObjectInfo(path);
    return { path, ...info };
  });
}

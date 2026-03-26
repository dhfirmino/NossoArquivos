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

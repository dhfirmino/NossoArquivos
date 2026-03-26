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

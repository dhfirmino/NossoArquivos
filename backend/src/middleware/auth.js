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

import { config } from '../config/env.js';

// Cache de tokens validados (token -> timestamp de validação)
const tokenCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function cleanExpiredTokens() {
  const now = Date.now();
  for (const [token, timestamp] of tokenCache) {
    if (now - timestamp > CACHE_TTL) {
      tokenCache.delete(token);
    }
  }
}

// Limpa cache a cada 10 minutos
setInterval(cleanExpiredTokens, 10 * 60 * 1000);

export async function authMiddleware(request, reply) {
  const authorization = request.headers['authorization'];

  if (!authorization) {
    return reply.status(401).send({ error: 'Token não fornecido' });
  }

  // Verifica cache
  const cached = tokenCache.get(authorization);
  if (cached && Date.now() - cached < CACHE_TTL) {
    return; // Token válido no cache
  }

  try {
    const response = await fetch(`${config.auth.apiUrl}/api/v2/nossogerenciadorweb/usuario`, {
      method: 'GET',
      headers: {
        'Authorization': authorization,
        'X-API-KEY': config.auth.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      tokenCache.delete(authorization);
      request.log.warn({ status: response.status }, 'Auth validation failed');
      return reply.status(401).send({ error: 'Token inválido ou expirado' });
    }

    // Cacheia token válido
    tokenCache.set(authorization, Date.now());
  } catch (err) {
    request.log.error({ err }, 'Auth validation error');
    return reply.status(502).send({ error: 'Erro ao validar autenticação' });
  }
}

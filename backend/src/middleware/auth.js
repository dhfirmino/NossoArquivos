export async function authMiddleware(request, reply) {
  const authorization = request.headers['authorization'];

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Token não fornecido' });
  }

  const token = authorization.slice(7);
  if (!token) {
    return reply.status(401).send({ error: 'Token inválido' });
  }
}

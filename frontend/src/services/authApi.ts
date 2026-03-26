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

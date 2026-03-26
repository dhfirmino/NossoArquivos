import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types/index.ts';
import { login as loginApi } from '../services/authApi.ts';

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

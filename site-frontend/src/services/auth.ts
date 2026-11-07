import api from './api';

export interface UsuarioSema {
  nome: string;
  email: string;
}

interface SessionResponse {
  usuario: UsuarioSema;
}

export async function login(email: string, senha: string): Promise<UsuarioSema> {
  const response = await api.post<SessionResponse>('/auth/login', { email, senha });
  return response.data.usuario;
}

export async function getSession(): Promise<UsuarioSema> {
  const response = await api.get<SessionResponse>('/auth/me');
  return response.data.usuario;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

import api from './api';

export interface UsuarioSema {
  nome: string;
  email: string;
}

interface LoginResponse {
  access_token: string;
  usuario: UsuarioSema;
}

export async function login(
  email: string,
  senha: string
): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', {
    email,
    senha
  });

  localStorage.setItem('token_sema', response.data.access_token);
  localStorage.setItem(
    'usuario_sema',
    JSON.stringify(response.data.usuario)
  );

  return response.data;
}

export function getToken(): string | null {
  return localStorage.getItem('token_sema');
}

export function getUsuario(): UsuarioSema | null {
  const usuario = localStorage.getItem('usuario_sema');

  if (!usuario) {
    return null;
  }

  try {
    return JSON.parse(usuario) as UsuarioSema;
  } catch {
    return null;
  }
}

export function logout(): void {
  localStorage.removeItem('token_sema');
  localStorage.removeItem('usuario_sema');
}
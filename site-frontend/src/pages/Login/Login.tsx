import React, { useState } from 'react';
import axios from 'axios';

import styles from './Login.module.css';

interface UsuarioSema {
  nome: string;
  email: string;
}

interface LoginProps {
  onLoginSuccess: (token: string, usuario: UsuarioSema) => void;
}

interface LoginResponse {
  access_token: string;
  usuario: UsuarioSema;
}

export default function Login({
  onLoginSuccess
}: LoginProps): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const API_URL =
    (import.meta.env.VITE_API_URL as string) ||
    'http://localhost:3001/api/v1';

  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    setErro(null);
    setCarregando(true);

    try {
      const response = await axios.post<LoginResponse>(
        `${API_URL}/auth/login`,
        {
          email,
          senha
        }
      );

      const { access_token, usuario } = response.data;

      localStorage.setItem('token_sema', access_token);

      localStorage.setItem(
        'usuario_sema',
        JSON.stringify(usuario)
      );

      onLoginSuccess(access_token, usuario);
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);

      if (error.response?.data?.message) {
        const mensagem = Array.isArray(error.response.data.message)
          ? error.response.data.message.join(', ')
          : error.response.data.message;

        setErro(mensagem);
      } else {
        setErro('Erro ao conectar com o servidor da prefeitura.');
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            Acesso Restrito
          </h2>

          <p className={styles.subtitle}>
            Painel de Controle Administrativo SEMA
          </p>
        </div>

        {erro && (
          <div className={styles.error}>
            {erro}
          </div>
        )}

        <form
          onSubmit={handleLogin}
          className={styles.form}
        >
          <div className={styles.field}>
            <label className={styles.label}>
              E-mail:
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
              placeholder="admin@admin-sema.com"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Senha de Acesso:
            </label>

            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className={styles.input}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className={styles.button}
          >
            {carregando ? 'Autenticando...' : 'Entrar no Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}
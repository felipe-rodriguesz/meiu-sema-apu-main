import React, { useState } from 'react';
import axios from 'axios';
import { login } from '../../services/auth';
import type { UsuarioSema } from '../../services/auth';

import styles from './Login.module.css';

interface LoginProps {
  onLoginSuccess: (usuario: UsuarioSema) => void;
}

export default function Login({
  onLoginSuccess
}: LoginProps): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    setErro(null);
    setCarregando(true);

    try {
      const usuario = await login(email, senha);
      setSenha('');
      onLoginSuccess(usuario);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
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

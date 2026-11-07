import React from 'react';
import styles from './Navbar.module.css';

interface UsuarioSema {
  nome: string;
  email: string;
}

interface NavbarProps {
  usuario: UsuarioSema | null;
  onLogout: () => void;
}

export default function Navbar({
  usuario,
  onLogout
}: NavbarProps): React.JSX.Element {
  return (
    <header className={styles.header}>
      <div className={styles.brandArea}>
        <div className={styles.logoBox}>
          S
        </div>

        <div>
          <h1 className={styles.title}>
            Painel SEMA
          </h1>

          <p className={styles.subtitle}>
            Município de Apucarana • Gestão de Resíduos Têxteis
          </p>
        </div>
      </div>

      {usuario && (
        <div className={styles.userArea}>
          <div className={styles.userInfo}>
            <span className={styles.greeting}>
              Olá,
            </span>

            <strong className={styles.userName}>
              {usuario.nome}
            </strong>

            <span className={styles.userEmail}>
              {usuario.email}
            </span>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className={styles.logoutButton}
          >
            Sair
          </button>
        </div>
      )}
    </header>
  );
}

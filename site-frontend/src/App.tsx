import React, { useState } from 'react';

import Navbar from './components/Navbar/Navbar';

import MapaCadastro from './pages/CadastroPontoColeta/CadastroPontoColeta';
import PedidosColeta from './pages/PedidosColeta/PedidosColeta';
import Login from './pages/Login/Login';

import {
  getToken,
  getUsuario,
  logout,
  UsuarioSema
} from './services/auth';

type PaginaAdmin = 'pontos' | 'pedidos';

export default function App(): React.JSX.Element {
  const [token, setToken] = useState<string | null>(
    getToken()
  );

  const [usuario, setUsuario] =
    useState<UsuarioSema | null>(
      getUsuario()
    );

  const [paginaAtual, setPaginaAtual] =
    useState<PaginaAdmin>('pontos');

  const handleLoginSuccess = (
    novoToken: string,
    novoUsuario: UsuarioSema
  ): void => {
    setToken(novoToken);
    setUsuario(novoUsuario);
  };

  const handleLogout = (): void => {
    logout();

    setToken(null);
    setUsuario(null);
    setPaginaAtual('pontos');
  };

  return (
    <div
      style={{
        backgroundColor: '#f9f9f9',
        minHeight: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      {token && (
        <Navbar
          usuario={usuario}
          token={token}
          onLogout={handleLogout}
        />
      )}

      <main
          style={{
            padding: '24px',
            width: '100%',
            maxWidth: '100vw',
            boxSizing: 'border-box',
            overflowX: 'hidden'
          }}
        >
        {token ? (
          <>
            <nav
              style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '24px',
                flexWrap: 'wrap'
              }}
            >
              <button
                type="button"
                onClick={() => setPaginaAtual('pontos')}
                style={{
                  padding: '10px 16px',
                  borderRadius: '6px',
                  border:
                    paginaAtual === 'pontos'
                      ? '1px solid #1b4332'
                      : '1px solid #ccc',
                  backgroundColor:
                    paginaAtual === 'pontos'
                      ? '#1b4332'
                      : '#fff',
                  color:
                    paginaAtual === 'pontos'
                      ? '#fff'
                      : '#1b4332',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                Pontos de coleta
              </button>

              <button
                type="button"
                onClick={() => setPaginaAtual('pedidos')}
                style={{
                  padding: '10px 16px',
                  borderRadius: '6px',
                  border:
                    paginaAtual === 'pedidos'
                      ? '1px solid #1b4332'
                      : '1px solid #ccc',
                  backgroundColor:
                    paginaAtual === 'pedidos'
                      ? '#1b4332'
                      : '#fff',
                  color:
                    paginaAtual === 'pedidos'
                      ? '#fff'
                      : '#1b4332',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                Pedidos de coleta
              </button>
            </nav>

            {paginaAtual === 'pontos' ? (
              <MapaCadastro />
            ) : (
              <PedidosColeta />
            )}
          </>
        ) : (
          <Login
            onLoginSuccess={
              handleLoginSuccess
            }
          />
        )}
      </main>
    </div>
  );
}
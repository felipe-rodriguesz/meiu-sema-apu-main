import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar/Navbar';
import MapaCadastro from './pages/CadastroPontoColeta/CadastroPontoColeta';
import PedidosColeta from './pages/PedidosColeta/PedidosColeta';
import Login from './pages/Login/Login';
import Relatorios from './pages/Relatorios/Relatorios';
import { getSession, logout } from './services/auth';
import type { UsuarioSema } from './services/auth';
import './App.css';

type PaginaAdmin = 'pontos' | 'pedidos' | 'relatorios';

export default function App(): React.JSX.Element {
  const [usuario, setUsuario] = useState<UsuarioSema | null>(null);
  const [verificando, setVerificando] = useState(true);
  const [erroSaida, setErroSaida] = useState('');
  const [paginaAtual, setPaginaAtual] = useState<PaginaAdmin>(() =>
    new URLSearchParams(location.search).has('protocolo') ? 'pedidos' : 'pontos'
  );

  useEffect(() => {
    let active = true;
    try { localStorage.removeItem('token_sema'); localStorage.removeItem('usuario_sema'); } catch { /* Navegação privada pode bloquear armazenamento. */ }
    void getSession().then(user => { if (active) setUsuario(user); })
      .catch(() => { if (active) setUsuario(null); })
      .finally(() => { if (active) setVerificando(false); });
    const expired = () => setUsuario(null);
    window.addEventListener('sema:session-expired', expired);
    return () => { active = false; window.removeEventListener('sema:session-expired', expired); };
  }, []);

  const handleLoginSuccess = (novoUsuario: UsuarioSema): void => {
    setUsuario(novoUsuario);
    setErroSaida('');
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      setUsuario(null);
      setPaginaAtual(new URLSearchParams(location.search).has('protocolo') ? 'pedidos' : 'pontos');
    } catch {
      setErroSaida('Não foi possível encerrar a sessão. Tente novamente.');
    }
  };

  return (
    <div className="sema-app">
      {usuario && <Navbar usuario={usuario} onLogout={() => { void handleLogout(); }} />}
      <main className={usuario ? 'sema-main' : 'sema-main sema-main--login'}>
        {verificando ? <p role="status">Verificando acesso...</p> : usuario ? (
          <>
            {erroSaida && <p role="alert">{erroSaida}</p>}
            <nav className="sema-nav" aria-label="Seções do painel">
              <button type="button" aria-pressed={paginaAtual === 'pontos'} onClick={() => setPaginaAtual('pontos')}>
                Pontos de coleta
              </button>
              <button type="button" aria-pressed={paginaAtual === 'pedidos'} onClick={() => setPaginaAtual('pedidos')}>
                Pedidos de coleta
              </button>
              <button type="button" aria-pressed={paginaAtual === 'relatorios'} onClick={() => setPaginaAtual('relatorios')}>Relatórios</button>
            </nav>
            {paginaAtual === 'pontos' ? <MapaCadastro /> : paginaAtual === 'pedidos' ? <PedidosColeta /> : <Relatorios />}
          </>
        ) : <Login onLoginSuccess={handleLoginSuccess} />}
      </main>
    </div>
  );
}

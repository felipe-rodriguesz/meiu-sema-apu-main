import { useCallback, useEffect, useState } from 'react';
import { listarPontosColeta } from '../services/pontosColetaService';
import type { PontoColeta } from '../types/questionario.types';

export function usePontosColeta() {
  const [pontos, setPontos] = useState<PontoColeta[]>([]);
  const [erroPontos, setErroPontos] = useState('');
  const [carregandoPontos, setCarregandoPontos] = useState(true);
  const carregarPontos = useCallback(async () => {
    setCarregandoPontos(true); setErroPontos('');
    try {
      setPontos((await listarPontosColeta()).filter(p => p.status !== 'INATIVO'));
    } catch { setPontos([]); setErroPontos('Não foi possível carregar os pontos de coleta.'); }
    finally { setCarregandoPontos(false); }
  }, []);
  useEffect(() => {
    let ativo = true;
    listarPontosColeta()
      .then(data => { if (ativo) setPontos(data.filter(p => p.status !== 'INATIVO')); })
      .catch(() => { if (ativo) setErroPontos('Não foi possível carregar os pontos de coleta.'); })
      .finally(() => { if (ativo) setCarregandoPontos(false); });
    return () => { ativo = false; };
  }, []);
  return { pontos, erroPontos, carregandoPontos, carregarPontos };
}

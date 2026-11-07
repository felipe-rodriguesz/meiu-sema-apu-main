import { useEffect, useState } from 'react';
import type { LocalizacaoUsuario } from '../types/questionario.types';

export function useLocalizacaoAtual() {
  const [localizacao, setLocalizacao] = useState<LocalizacaoUsuario | null>(null);
  const [erroLocalizacao, setErroLocalizacao] = useState(() => navigator.geolocation ? '' : 'Localização indisponível. Escolha o ponto pela lista ou pelo mapa.');
  useEffect(() => {
    let ativo = true;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      p => { if (ativo) setLocalizacao({ lat: p.coords.latitude, lon: p.coords.longitude }); },
      () => { if (ativo) setErroLocalizacao('Localização indisponível. Escolha o ponto pela lista ou pelo mapa.'); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
    return () => { ativo = false; };
  }, []);
  return { localizacao, erroLocalizacao };
}

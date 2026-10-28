import { useEffect, useState } from "react";
import type { LocalizacaoUsuario } from "../types/questionario.types";

export function useLocalizacaoAtual() {
  const [localizacao, setLocalizacao] = useState<LocalizacaoUsuario | null>(
    null
  );
  const [erroLocalizacao, setErroLocalizacao] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) {
      setErroLocalizacao("Geolocalização não disponível.");
      setLocalizacao({
        lat: -23.5504,
        lon: -51.4635,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocalizacao({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      () => {
        setErroLocalizacao("Não foi possível obter a localização atual.");
        setLocalizacao({
          lat: -23.5504,
          lon: -51.4635,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }, []);

  return {
    localizacao,
    erroLocalizacao,
  };
}
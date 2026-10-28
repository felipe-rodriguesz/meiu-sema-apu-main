import { useEffect, useState } from "react";
import { listarPontosColeta } from "../services/pontosColetaService";
import type { PontoColeta } from "../types/questionario.types";

export function usePontosColeta() {
  const [pontos, setPontos] = useState<PontoColeta[]>([]);
  const [erroPontos, setErroPontos] = useState("");
  const [carregandoPontos, setCarregandoPontos] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const data = await listarPontosColeta();

        setPontos(
          data.filter(
            (ponto) =>
              ponto.status !== "INATIVO" &&
              ponto.lat !== undefined &&
              ponto.lon !== undefined
          )
        );
      } catch {
        setErroPontos("Não foi possível carregar os pontos de coleta.");
      } finally {
        setCarregandoPontos(false);
      }
    }

    carregar();
  }, []);

  return {
    pontos,
    erroPontos,
    carregandoPontos,
  };
}
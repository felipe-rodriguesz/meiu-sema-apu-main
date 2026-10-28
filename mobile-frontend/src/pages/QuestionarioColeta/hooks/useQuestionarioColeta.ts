import { useMemo, useState } from "react";

import { criarDescarte } from "../services/descartesService";
import { useLocalizacaoAtual } from "./useLocalizacaoAtual";
import { usePontosColeta } from "./usePontosColeta";
import { calcularDistanciaKm } from "../utils/distancia";
import type {
  EtapaQuestionario,
  FormularioDescarte,
  PontoColeta,
} from "../types/questionario.types";

const initialForm: FormularioDescarte = {
  eh_mistura: null,
  residuo_principal: "",
  quantidade_kg: "",
  frequencia_dias: "7",
  material: "",
  estado_material: "",
  tipo_tecido: "",
};

export function useQuestionarioColeta() {
  const [etapa, setEtapa] = useState<EtapaQuestionario>(1);
  const [form, setForm] = useState<FormularioDescarte>(initialForm);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [protocolo, setProtocolo] = useState("");
  const [pontoSelecionado, setPontoSelecionado] = useState<PontoColeta | null>(
    null
  );

  const { localizacao } = useLocalizacaoAtual();
  const { pontos } = usePontosColeta();

  const pontosOrdenados = useMemo(() => {
    if (!localizacao) return pontos;

    return [...pontos].sort((a, b) => {
      const distanciaA = calcularDistanciaKm(localizacao, {
        lat: Number(a.lat),
        lon: Number(a.lon),
      });

      const distanciaB = calcularDistanciaKm(localizacao, {
        lat: Number(b.lat),
        lon: Number(b.lon),
      });

      return distanciaA - distanciaB;
    });
  }, [pontos, localizacao]);

  function atualizarCampo<K extends keyof FormularioDescarte>(
    campo: K,
    valor: FormularioDescarte[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  function validarEtapaAtual() {
    if (etapa === 1 && form.eh_mistura === null) {
      return "Informe se o resíduo é uma mistura.";
    }

    if (etapa === 2 && !form.residuo_principal) {
      return "Selecione o tipo principal do resíduo.";
    }

    if (etapa === 3 && (!form.quantidade_kg || !form.frequencia_dias)) {
      return "Informe a quantidade e a frequência.";
    }

    if (
      etapa === 4 &&
      (!form.material || !form.estado_material || !form.tipo_tecido)
    ) {
      return "Preencha os detalhes técnicos ou selecione 'Não sei informar'.";
    }

    return "";
  }

  function proximo() {
    const erroValidacao = validarEtapaAtual();

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setErro("");
    setEtapa((prev) => Math.min(prev + 1, 5) as EtapaQuestionario);
  }

  function voltar() {
    setErro("");
    setEtapa((prev) => Math.max(prev - 1, 1) as EtapaQuestionario);
  }

  async function gerarPedido() {
    setErro("");

    if (!localizacao) {
      setErro("A localização ainda não foi carregada.");
      return;
    }

    if (!pontoSelecionado) {
      setErro("Escolha um ponto de coleta.");
      return;
    }

    setCarregando(true);

    try {
      const payload = {
        eh_mistura: Boolean(form.eh_mistura),
        residuo_principal: form.residuo_principal,
        quantidade_kg: Number(form.quantidade_kg),
        frequencia_dias: Number(form.frequencia_dias),
        material: form.material,
        estado_material: form.estado_material,
        tipo_tecido: form.tipo_tecido,
        lat: localizacao.lat,
        lon: localizacao.lon,
        ponto_coleta_id: pontoSelecionado.id,
      };

      const resposta = await criarDescarte(payload);

      localStorage.setItem(
        `pedido-coleta-${resposta.protocolo}`,
        JSON.stringify({
          protocolo: resposta.protocolo,
          descarte: payload,
          pontoSelecionado,
          criadoEm: new Date().toISOString(),
          observacao:
            "Ponto de coleta enviado ao backend por meio do campo ponto_coleta_id.",
        })
      );

      setProtocolo(resposta.protocolo);
    } catch {
      setErro("Não foi possível gerar o pedido de coleta.");
    } finally {
      setCarregando(false);
    }
  }

  function resetar() {
    setEtapa(1);
    setForm(initialForm);
    setErro("");
    setCarregando(false);
    setProtocolo("");
    setPontoSelecionado(null);
  }

  return {
    etapa,
    form,
    erro,
    carregando,
    protocolo,
    localizacao,
    pontosOrdenados,
    pontoSelecionado,
    setPontoSelecionado,
    atualizarCampo,
    proximo,
    voltar,
    gerarPedido,
    resetar,
  };
}
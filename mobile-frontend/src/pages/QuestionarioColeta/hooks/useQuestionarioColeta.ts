import { useMemo, useRef, useState } from "react";

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
  const envio = useRef(false);
  const [pontoSelecionado, setPontoSelecionado] = useState<PontoColeta | null>(
    null
  );

  const { localizacao } = useLocalizacaoAtual();
  const { pontos, erroPontos, carregandoPontos, carregarPontos } = usePontosColeta();

  const pontosOrdenados = useMemo(() => {
    if (!localizacao) return pontos;

    return [...pontos].sort((a, b) => {
      const distanciaA = a.lat == null || a.lon == null ? Infinity : calcularDistanciaKm(localizacao, {
        lat: Number(a.lat),
        lon: Number(a.lon),
      });

      const distanciaB = b.lat == null || b.lon == null ? Infinity : calcularDistanciaKm(localizacao, {
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
    if (etapa === 3) {
      const peso = form.quantidade_kg.trim().replace(',', '.');
      if (!/^\d+(\.\d{1,3})?$/.test(peso) || Number(peso) <= 0 || Number(peso) > 999999999.999) {
        return 'Informe um peso positivo em kg, com até três casas decimais.';
      }
      const frequencia = Number(form.frequencia_dias);
      if (!Number.isInteger(frequencia) || frequencia <= 0 || frequencia > 2147483647) return 'Informe uma frequência inteira positiva em dias.';
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
    if (envio.current) return;
    setErro("");

    if (!pontoSelecionado) {
      setErro("Escolha um ponto de coleta.");
      return;
    }
    if (!pontos.some(p => p.id === pontoSelecionado.id) || carregandoPontos || erroPontos) {
      setErro('Atualize a lista e escolha um ponto disponível.'); return;
    }
    const peso = Number(form.quantidade_kg.trim().replace(',', '.'));
    if (pontoSelecionado.limite_kg_por_pedido != null && peso > Number(pontoSelecionado.limite_kg_por_pedido)) {
      setErro('A quantidade excede o limite por pedido deste ponto. Ajuste a quantidade ou escolha outro ponto.'); return;
    }

    envio.current = true;
    setCarregando(true);

    try {
      const payload = {
        eh_mistura: Boolean(form.eh_mistura),
        residuo_principal: form.residuo_principal,
        quantidade_kg: peso,
        frequencia_dias: Number(form.frequencia_dias),
        material: form.material,
        estado_material: form.estado_material,
        tipo_tecido: form.tipo_tecido,
        ponto_coleta_id: pontoSelecionado.id,
      };

      const resposta = await criarDescarte(payload);

      // A localização do dispositivo serve apenas para ordenar os pontos.
      // A confirmação não depende do armazenamento opcional no navegador.
      setProtocolo(resposta.protocolo);
      try { localStorage.setItem(`pedido-coleta-${resposta.protocolo}`, JSON.stringify({ protocolo: resposta.protocolo, pontoSelecionado, criadoEm: new Date().toISOString() })); } catch { /* Protocolo já confirmado na API. */ }
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível gerar o pedido de coleta.");
    } finally {
      envio.current = false;
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
    void carregarPontos();
  }

  return {
    etapa,
    form,
    erro,
    carregando,
    protocolo,
    localizacao,
    pontosOrdenados,
    erroPontos,
    carregandoPontos,
    carregarPontos,
    pontoSelecionado,
    setPontoSelecionado,
    atualizarCampo,
    proximo,
    voltar,
    gerarPedido,
    resetar,
  };
}

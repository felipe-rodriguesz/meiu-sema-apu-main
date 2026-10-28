import type { FormularioDescarte } from "../types/questionario.types";
import {
  opcoesEstado,
  opcoesMaterial,
  opcoesTecido,
} from "../constants/opcoesQuestionario";

type StepDetalhesTecnicosProps = {
  form: FormularioDescarte;
  onChange: <K extends keyof FormularioDescarte>(
    campo: K,
    valor: FormularioDescarte[K]
  ) => void;
};

export function StepDetalhesTecnicos({
  form,
  onChange,
}: StepDetalhesTecnicosProps) {
  return (
    <section className="step-card">
      <h1>Detalhes técnicos</h1>

      <p>
        Esta etapa ajuda a melhorar a destinação. Caso não saiba, selecione
        “Não sei informar”.
      </p>

      <label className="field">
        <span>Composição principal</span>
        <select
          value={form.material}
          onChange={(event) => onChange("material", event.target.value)}
        >
          <option value="">Selecione</option>
          {opcoesMaterial.map((opcao) => (
            <option key={opcao} value={opcao}>
              {opcao}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Estado do material</span>
        <select
          value={form.estado_material}
          onChange={(event) =>
            onChange("estado_material", event.target.value)
          }
        >
          <option value="">Selecione</option>
          {opcoesEstado.map((opcao) => (
            <option key={opcao} value={opcao}>
              {opcao}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Tipo de tecido / aplicação</span>
        <select
          value={form.tipo_tecido}
          onChange={(event) => onChange("tipo_tecido", event.target.value)}
        >
          <option value="">Selecione</option>
          {opcoesTecido.map((opcao) => (
            <option key={opcao} value={opcao}>
              {opcao}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
import type { FormularioDescarte } from "../types/questionario.types";

type StepQuantidadeProps = {
  quantidadeKg: string;
  frequenciaDias: string;
  onChange: <K extends keyof FormularioDescarte>(
    campo: K,
    valor: FormularioDescarte[K]
  ) => void;
};

export function StepQuantidade({
  quantidadeKg,
  frequenciaDias,
  onChange,
}: StepQuantidadeProps) {
  return (
    <section className="step-card">
      <h1>Quantidade e frequência</h1>

      <label className="field">
        <span>Quantidade aproximada em kg</span>
        <input
          type="text"
          inputMode="decimal"
          placeholder="Ex: 2,5"
          value={quantidadeKg}
          onChange={(event) =>
            onChange("quantidade_kg", event.target.value)
          }
        />
        <small>Quantidade positiva em kg, com até três casas decimais.</small>
      </label>

      <label className="field">
        <span>Frequência de geração</span>
        <select
          value={frequenciaDias}
          onChange={(event) =>
            onChange("frequencia_dias", event.target.value)
          }
        >
          <option value="1">Diária</option>
          <option value="7">Semanal</option>
          <option value="30">Mensal</option>
          <option value="90">Trimestral</option>
          <option value="180">Semestral</option>
        </select>
      </label>
    </section>
  );
}

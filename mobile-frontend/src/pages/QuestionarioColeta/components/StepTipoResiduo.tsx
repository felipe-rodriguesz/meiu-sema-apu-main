import { opcoesResiduo } from "../constants/opcoesQuestionario";

type StepTipoResiduoProps = {
  valor: string;
  onChange: (valor: string) => void;
};

export function StepTipoResiduo({ valor, onChange }: StepTipoResiduoProps) {
  return (
    <section className="step-card">
      <h1>Qual é o principal tipo de resíduo?</h1>

      <p>Escolha a opção que melhor representa o material descartado.</p>

      <div className="options-grid">
        {opcoesResiduo.map((opcao) => (
          <button
            key={opcao}
            className={valor === opcao ? "option active" : "option"}
            onClick={() => onChange(opcao)}
          >
            {opcao}
          </button>
        ))}
      </div>
    </section>
  );
}
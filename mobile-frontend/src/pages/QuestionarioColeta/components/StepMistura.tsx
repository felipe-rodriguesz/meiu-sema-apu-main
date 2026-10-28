type StepMisturaProps = {
  valor: boolean | null;
  onChange: (valor: boolean) => void;
};

export function StepMistura({ valor, onChange }: StepMisturaProps) {
  return (
    <section className="step-card">
      <h1>O material é uma mistura?</h1>

      <p>
        Essa informação ajuda a entender se o lote possui vários tipos de
        resíduos juntos.
      </p>

      <button
        className={valor === true ? "option active" : "option"}
        onClick={() => onChange(true)}
      >
        Sim, é uma mistura
      </button>

      <button
        className={valor === false ? "option active" : "option"}
        onClick={() => onChange(false)}
      >
        Não, é um tipo só
      </button>
    </section>
  );
}
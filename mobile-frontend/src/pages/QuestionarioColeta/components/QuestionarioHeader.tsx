import type { EtapaQuestionario } from "../types/questionario.types";

type QuestionarioHeaderProps = {
  etapa: EtapaQuestionario;
};

export function QuestionarioHeader({ etapa }: QuestionarioHeaderProps) {
  return (
    <>
      <header className="questionario-header">
        <span>Novo descarte</span>
        <strong>Etapa {etapa}/5</strong>
      </header>

      <div className="progress">
        <div
          className="progress-fill"
          style={{ width: `${(etapa / 5) * 100}%` }}
        />
      </div>
    </>
  );
}
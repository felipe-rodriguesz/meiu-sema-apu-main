import "./QuestionarioColeta.css";
import { useQuestionarioColeta } from "./hooks/useQuestionarioColeta";
import { QuestionarioHeader } from "./components/QuestionarioHeader";
import { StepMistura } from "./components/StepMistura";
import { StepTipoResiduo } from "./components/StepTipoResiduo";
import { StepQuantidade } from "./components/StepQuantidade";
import { StepDetalhesTecnicos } from "./components/StepDetalhesTecnicos";
import { StepMapaColeta } from "./components/StepMapaColeta";
import { TelaSucesso } from "./components/TelaSucesso";

export function QuestionarioColeta() {
  const questionario = useQuestionarioColeta();

  if (questionario.protocolo) {
    return (
      <TelaSucesso
        protocolo={questionario.protocolo}
        pontoSelecionado={questionario.pontoSelecionado}
        onNovoDescarte={questionario.resetar}
      />
    );
  }

  return (
    <main className="questionario-page">
      <QuestionarioHeader etapa={questionario.etapa} />

      {questionario.erro && (
        <div className="error-box" role="alert">{questionario.erro}</div>
      )}

      {questionario.etapa === 1 && (
        <StepMistura
          valor={questionario.form.eh_mistura}
          onChange={(valor) => questionario.atualizarCampo("eh_mistura", valor)}
        />
      )}

      {questionario.etapa === 2 && (
        <StepTipoResiduo
          valor={questionario.form.residuo_principal}
          onChange={(valor) =>
            questionario.atualizarCampo("residuo_principal", valor)
          }
        />
      )}

      {questionario.etapa === 3 && (
        <StepQuantidade
          quantidadeKg={questionario.form.quantidade_kg}
          frequenciaDias={questionario.form.frequencia_dias}
          onChange={questionario.atualizarCampo}
        />
      )}

      {questionario.etapa === 4 && (
        <StepDetalhesTecnicos
          form={questionario.form}
          onChange={questionario.atualizarCampo}
        />
      )}

      {questionario.etapa === 5 && (
        <><div aria-live="polite">
          {questionario.carregandoPontos && <p>Carregando pontos...</p>}
          {questionario.erroPontos && <p role="alert">{questionario.erroPontos}</p>}
          <button type="button" className="secondary-button" disabled={questionario.carregandoPontos} onClick={() => void questionario.carregarPontos()}>Atualizar pontos</button>
        </div><StepMapaColeta
          localizacao={questionario.localizacao}
          pontos={questionario.pontosOrdenados}
          pontoSelecionado={questionario.pontoSelecionado}
          onSelecionarPonto={questionario.setPontoSelecionado}
        /></>
      )}

      <footer className="questionario-footer">
        {questionario.etapa > 1 && (
          <button className="secondary-button" disabled={questionario.carregando} onClick={questionario.voltar}>
            Voltar
          </button>
        )}

        {questionario.etapa < 5 ? (
          <button className="primary-button" onClick={questionario.proximo}>
            Próximo
          </button>
        ) : (
          <button
            className="primary-button"
            onClick={questionario.gerarPedido}
            disabled={questionario.carregando || questionario.carregandoPontos || !!questionario.erroPontos}
          >
            {questionario.carregando ? "Gerando..." : "Gerar pedido"}
          </button>
        )}
      </footer>
    </main>
  );
}

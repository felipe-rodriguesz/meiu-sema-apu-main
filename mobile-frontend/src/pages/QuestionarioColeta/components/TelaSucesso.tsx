import type { PontoColeta } from "../types/questionario.types";

type TelaSucessoProps = {
  protocolo: string;
  pontoSelecionado: PontoColeta | null;
  onNovoDescarte: () => void;
};

export function TelaSucesso({
  protocolo,
  pontoSelecionado,
  onNovoDescarte,
}: TelaSucessoProps) {
  return (
    <main className="questionario-page success-page">
      <section className="success-hero">
        <div className="success-icon">✓</div>

        <span className="success-label">Pedido enviado</span>

        <h1>Seu descarte foi registrado</h1>

        <p>
          O pedido de coleta foi gerado com sucesso. Guarde o protocolo abaixo
          para acompanhar ou comprovar o registro.
        </p>
      </section>

      <section className="receipt-card">
        <div className="receipt-header">
          <span>Protocolo</span>
          <strong>{protocolo}</strong>
        </div>

        <div className="receipt-divider" />

        <div className="receipt-row">
          <span>Status</span>
          <strong>Pendente de coleta</strong>
        </div>

        <div className="receipt-row">
          <span>Registro</span>
          <strong>{new Date().toLocaleDateString("pt-BR")}</strong>
        </div>

        {pontoSelecionado && (
          <div className="receipt-point">
            <span>Ponto escolhido</span>
            <strong>{pontoSelecionado.nome}</strong>
            <p>
              {pontoSelecionado.endereco ||
                pontoSelecionado.bairro ||
                "Endereço não informado"}
            </p>
          </div>
        )}
      </section>

      <section className="next-steps-card">
        <h2>Próximos passos</h2>

        <div className="timeline-item active">
          <div className="timeline-dot">1</div>
          <div>
            <strong>Pedido registrado</strong>
            <p>As informações do descarte foram salvas no sistema.</p>
          </div>
        </div>

        <div className="timeline-item">
          <div className="timeline-dot">2</div>
          <div>
            <strong>Análise da coleta</strong>
            <p>A equipe poderá consultar os dados para organização logística.</p>
          </div>
        </div>

        <div className="timeline-item">
          <div className="timeline-dot">3</div>
          <div>
            <strong>Destinação adequada</strong>
            <p>O resíduo poderá ser direcionado para reaproveitamento.</p>
          </div>
        </div>
      </section>

      <section className="success-actions">
        <button type="button" className="primary-button" onClick={onNovoDescarte}>
          Registrar outro descarte
        </button>
      </section>
    </main>
  );
}
import "./Aviso.css";

type AvisoProps = {
  onContinue: () => void;
};

export function Aviso({ onContinue }: AvisoProps) {
  return (
    <main className="aviso-page">
      <section className="aviso-card">
        <div className="aviso-icon">♻️</div>

        <h1>Resíduo Têxtil Apucarana</h1>

        <p className="aviso-subtitle">
          Antes de registrar um descarte, leia o aviso sobre anonimato e uso das
          informações.
        </p>
      </section>

      <section className="disclaimer-card">
        <h2>Aviso de anonimato</h2>

        <p>
          O registro de descarte é anônimo. Não solicitamos nome, CPF, CNPJ ou
          endereço completo do usuário.
        </p>

        <p>
          Para gerar o registro de coleta, algumas informações técnicas do
          dispositivo poderão ser coletadas, como data, horário, localização
          aproximada e dados necessários para criar o protocolo do descarte.
        </p>

        <p>
          Essas informações serão utilizadas apenas para organizar os descartes,
          gerar estatísticas ambientais e apoiar o planejamento da coleta de
          resíduos têxteis no município.
        </p>
      </section>

      <section className="aviso-actions">
        <button className="primary-button" onClick={onContinue}>
          Entendi e quero continuar
        </button>
      </section>
    </main>
  );
}
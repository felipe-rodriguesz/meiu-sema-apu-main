import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { PontoColeta } from '../types/questionario.types';
import { CondicoesAtendimento } from './CondicoesAtendimento';

export function TelaSucesso({ protocolo, pontoSelecionado, onNovoDescarte }: {
  protocolo: string; pontoSelecionado: PontoColeta | null; onNovoDescarte: () => void;
}) {
  const [qr, setQr] = useState('');
  const [falhaQr, setFalhaQr] = useState(false);
  useEffect(() => {
    let ativo = true;
    const endereco = import.meta.env.VITE_PAINEL_URL || (import.meta.env.DEV ? window.location.protocol + '//' + window.location.hostname + ':5173/' : '/admin/');
    const link = new URL(endereco, window.location.origin);
    link.search = ''; link.hash = ''; link.searchParams.set('protocolo', protocolo);
    QRCode.toDataURL(link.href, { width: 320, margin: 4, errorCorrectionLevel: 'M' })
      .then(url => { if (ativo) setQr(url); }).catch(() => { if (ativo) setFalhaQr(true); });
    return () => { ativo = false; };
  }, [protocolo]);
  return <main className="questionario-page success-page">
    <section className="success-hero"><div className="success-icon">✓</div>
      <span className="success-label">Registro confirmado</span><h1>Seu descarte foi registrado</h1>
      <p>O registro é automático. Guarde este protocolo ou o QR Code e apresente no ponto escolhido.</p>
    </section>
    <section className="receipt-card">
      <div className="receipt-header"><span>Protocolo</span><strong>{protocolo}</strong></div>
      <p><strong>Pendente de recebimento</strong> — o registro ainda não comprova a entrega ou a destinação do material.</p>
      {qr && <div className="qr-protocolo"><img src={qr} alt="QR Code do protocolo para consulta pelo operador" width={320} height={320} />
        <a href={qr} download={protocolo + '.png'}>Baixar QR Code</a></div>}
      {falhaQr && <p role="status">Não foi possível gerar o QR Code. O operador também pode localizar pelo protocolo acima.</p>}
      <p>O QR abre a consulta no painel da SEMA e exige login do operador.</p>
      {pontoSelecionado && <div className="receipt-point"><span>Ponto escolhido</span><strong>{pontoSelecionado.nome}</strong>
        <p>{pontoSelecionado.endereco || pontoSelecionado.bairro || 'Endereço não informado'}</p>
        <CondicoesAtendimento ponto={pontoSelecionado} /></div>}
    </section>
    <section className="next-steps-card"><h2>Como fazer a entrega</h2>
      <ol><li>Confira os dias, horários, materiais aceitos e orientações do ponto.</li>
        <li>Leve o material e apresente o protocolo ou o QR Code ao atendente. Não é necessária aprovação prévia pelo sistema.</li>
        <li>O atendente confere, pesa e registra o recebimento. O peso informado no formulário é preservado separadamente.</li></ol>
      <p>O material está sujeito às condições de recebimento do ponto. Não deixe resíduos no local sem atendimento.</p>
    </section>
    <section className="success-actions"><button type="button" className="primary-button" onClick={onNovoDescarte}>Registrar outro descarte</button></section>
  </main>;
}

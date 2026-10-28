import React, { useEffect, useMemo, useState } from 'react';

import api from '../../services/api';

import styles from './PedidosColeta.module.css';

interface PontoColeta {
  id: string;
  nome: string;
  tipo: string;
  bairro?: string;
  endereco?: string;
  status?: string;
}

interface Descarte {
  id: string;
  criado_em: string;
  protocolo: string;
  situacao: string;
  eh_mistura: boolean;
  residuo_principal: string;
  quantidade_kg: number;
  frequencia_dias: number;
  material: string;
  estado_material: string;
  tipo_tecido: string;
  lat?: number;
  lon?: number;
  ponto_coleta_id?: string;
  ponto_coleta?: PontoColeta;
}

export default function PedidosColeta(): React.JSX.Element {
  const [descartes, setDescartes] = useState<Descarte[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [situacaoFiltro, setSituacaoFiltro] = useState('TODOS');
  const [pedidoSelecionado, setPedidoSelecionado] =
    useState<Descarte | null>(null);

  const buscarDescartes = async (): Promise<void> => {
    setCarregando(true);
    setErro(null);

    try {
      const response = await api.get<Descarte[]>('/descartes');
      setDescartes(response.data);
    } catch (error) {
      console.error('Erro ao buscar pedidos de coleta:', error);
      setErro('Não foi possível carregar os pedidos de coleta.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarDescartes();
  }, []);

  const descartesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return descartes.filter((descarte) => {
      const passaSituacao =
        situacaoFiltro === 'TODOS' ||
        descarte.situacao === situacaoFiltro;

      const passaBusca =
        !termo ||
        descarte.protocolo?.toLowerCase().includes(termo) ||
        descarte.residuo_principal?.toLowerCase().includes(termo) ||
        descarte.material?.toLowerCase().includes(termo) ||
        descarte.ponto_coleta?.nome?.toLowerCase().includes(termo) ||
        descarte.ponto_coleta?.bairro?.toLowerCase().includes(termo);

      return passaSituacao && passaBusca;
    });
  }, [descartes, busca, situacaoFiltro]);

  const totalKg = useMemo(() => {
    return descartesFiltrados.reduce(
      (total, descarte) => total + Number(descarte.quantidade_kg || 0),
      0
    );
  }, [descartesFiltrados]);

  const formatarData = (data?: string): string => {
    if (!data) return '-';

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(data));
  };

  return (
    <div className={styles.container}>
      <section className={styles.header}>
        <div>
          <h2 className={styles.title}>Pedidos de Coleta</h2>

          <p className={styles.description}>
            Visualize os descartes cadastrados pelos usuários e acompanhe
            protocolo, material, quantidade, situação e ponto de coleta.
          </p>
        </div>

        <button
          type="button"
          onClick={buscarDescartes}
          className={styles.refreshButton}
          disabled={carregando}
        >
          {carregando ? 'Atualizando...' : 'Atualizar'}
        </button>
      </section>

      <section className={styles.cards}>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Pedidos exibidos</span>
          <strong className={styles.cardValue}>
            {descartesFiltrados.length}
          </strong>
        </div>

        <div className={styles.card}>
          <span className={styles.cardLabel}>Total estimado</span>
          <strong className={styles.cardValue}>
            {totalKg} kg
          </strong>
        </div>

        <div className={styles.card}>
          <span className={styles.cardLabel}>Total cadastrado</span>
          <strong className={styles.cardValue}>
            {descartes.length}
          </strong>
        </div>
      </section>

      <section className={styles.filters}>
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por protocolo, resíduo, material, bairro..."
          className={styles.input}
        />

        <select
          value={situacaoFiltro}
          onChange={(e) => setSituacaoFiltro(e.target.value)}
          className={styles.select}
        >
          <option value="TODOS">Todas as situações</option>
          <option value="PENDENTE">Pendente</option>
          <option value="EM_ANALISE">Em análise</option>
          <option value="APROVADO">Aprovado</option>
          <option value="REJEITADO">Rejeitado</option>
          <option value="CONCLUIDO">Concluído</option>
        </select>
      </section>

      {erro && (
        <div className={styles.error}>
          {erro}
        </div>
      )}

      <section className={styles.tableContainer}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHeadRow}>
                <th className={styles.th}>Protocolo</th>
                <th className={styles.th}>Data</th>
                <th className={styles.th}>Resíduo</th>
                <th className={styles.th}>Quantidade</th>
                <th className={styles.th}>Material</th>
                <th className={styles.th}>Ponto de coleta</th>
                <th className={styles.th}>Situação</th>
                <th className={styles.thCenter}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {carregando && (
                <tr>
                  <td colSpan={8} className={styles.emptyRow}>
                    Carregando pedidos...
                  </td>
                </tr>
              )}

              {!carregando && descartesFiltrados.length === 0 && (
                <tr>
                  <td colSpan={8} className={styles.emptyRow}>
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              )}

              {!carregando &&
                descartesFiltrados.map((descarte) => (
                  <tr key={descarte.id} className={styles.tableRow}>
                    <td className={styles.td}>
                      <strong>{descarte.protocolo}</strong>
                    </td>

                    <td className={styles.td}>
                      {formatarData(descarte.criado_em)}
                    </td>

                    <td className={styles.td}>
                      <strong>{descarte.residuo_principal}</strong>
                      <span className={styles.smallText}>
                        {descarte.eh_mistura ? 'Mistura' : 'Material único'}
                      </span>
                    </td>

                    <td className={styles.td}>
                      {descarte.quantidade_kg} kg
                      <span className={styles.smallText}>
                        A cada {descarte.frequencia_dias} dias
                      </span>
                    </td>

                    <td className={styles.td}>
                      {descarte.material}
                      <span className={styles.smallText}>
                        {descarte.estado_material}
                      </span>
                    </td>

                    <td className={styles.td}>
                      {descarte.ponto_coleta?.nome || 'Não informado'}
                      <span className={styles.smallText}>
                        {descarte.ponto_coleta?.bairro || '-'}
                      </span>
                    </td>

                    <td className={styles.td}>
                      <span className={styles.statusBadge}>
                        {descarte.situacao}
                      </span>
                    </td>

                    <td className={styles.actions}>
                      <button
                        type="button"
                        onClick={() => setPedidoSelecionado(descarte)}
                        className={styles.detailsButton}
                      >
                        Detalhes
                      </button>

                      <button
                        type="button"
                        className={styles.disabledButton}
                        disabled
                        title="O backend atual ainda não possui rota para editar pedidos."
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className={styles.disabledButton}
                        disabled
                        title="O backend atual ainda não possui rota para excluir pedidos."
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {pedidoSelecionado && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>
                  Pedido {pedidoSelecionado.protocolo}
                </h3>

                <p className={styles.modalSubtitle}>
                  Cadastrado em {formatarData(pedidoSelecionado.criado_em)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPedidoSelecionado(null)}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>

            <div className={styles.detailsGrid}>
              <div>
                <span className={styles.detailLabel}>Situação</span>
                <strong>{pedidoSelecionado.situacao}</strong>
              </div>

              <div>
                <span className={styles.detailLabel}>Resíduo principal</span>
                <strong>{pedidoSelecionado.residuo_principal}</strong>
              </div>

              <div>
                <span className={styles.detailLabel}>Quantidade</span>
                <strong>{pedidoSelecionado.quantidade_kg} kg</strong>
              </div>

              <div>
                <span className={styles.detailLabel}>Frequência</span>
                <strong>
                  A cada {pedidoSelecionado.frequencia_dias} dias
                </strong>
              </div>

              <div>
                <span className={styles.detailLabel}>Material</span>
                <strong>{pedidoSelecionado.material}</strong>
              </div>

              <div>
                <span className={styles.detailLabel}>Estado do material</span>
                <strong>{pedidoSelecionado.estado_material}</strong>
              </div>

              <div>
                <span className={styles.detailLabel}>Tipo de tecido</span>
                <strong>{pedidoSelecionado.tipo_tecido}</strong>
              </div>

              <div>
                <span className={styles.detailLabel}>Mistura?</span>
                <strong>
                  {pedidoSelecionado.eh_mistura ? 'Sim' : 'Não'}
                </strong>
              </div>

              <div>
                <span className={styles.detailLabel}>Latitude</span>
                <strong>{pedidoSelecionado.lat || '-'}</strong>
              </div>

              <div>
                <span className={styles.detailLabel}>Longitude</span>
                <strong>{pedidoSelecionado.lon || '-'}</strong>
              </div>
            </div>

            <div className={styles.pointBox}>
              <h4>Ponto de coleta vinculado</h4>

              {pedidoSelecionado.ponto_coleta ? (
                <>
                  <p>
                    <strong>{pedidoSelecionado.ponto_coleta.nome}</strong>
                  </p>
                  <p>{pedidoSelecionado.ponto_coleta.endereco || '-'}</p>
                  <p>
                    Bairro: {pedidoSelecionado.ponto_coleta.bairro || '-'}
                  </p>
                  <p>
                    Status: {pedidoSelecionado.ponto_coleta.status || '-'}
                  </p>
                </>
              ) : (
                <p>Nenhum ponto de coleta vinculado.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
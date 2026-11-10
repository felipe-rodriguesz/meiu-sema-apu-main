import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap
} from 'react-leaflet';

import L from 'leaflet';
import axios from 'axios';
import api from '../../services/api';
import { geocodificarPonto } from '../../services/geocodificacao';

import 'leaflet/dist/leaflet.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

import styles from './CadastroPontoColeta.module.css';
import { CondicoesPonto } from './CondicoesPonto';
import { condicoesVazias } from './condicoes';
import type { Condicoes } from './condicoes';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface PontoColeta {
  id: string | number;
  nome: string;
  tipo: string;
  bairro: string;
  endereco: string;
  lat?: number;
  lon?: number;
  latitude?: number;
  longitude?: number;
  status: string;
  criado_em?: string;
  dias_semana?: number[];
  horarios_semana?: { dia: number; inicio: string | null; fim: string | null }[];
  materiais_lista?: string[];
  data_inicio?: string | null;
  data_fim?: string | null;
  horario_inicio?: string | null;
  horario_fim?: string | null;
  materiais_aceitos?: string | null;
  limite_kg_por_pedido?: number | null;
  orientacoes?: string | null;
}

interface FormDataState {
  nome: string;
  tipo: string;
  bairro: string;
  endereco: string;
}

const centroApucarana: [number, number] = [-23.5522, -51.46];

function CentroEdicao({ pos }: { pos: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => { if (pos) map.setView([pos.lat, pos.lng], 16); }, [pos, map]);
  return null;
}

function MapClickHandler({
  setMarcador,
  buscarEndereco
}: {
  setMarcador: (pos: { lat: number; lng: number }) => void;
  buscarEndereco: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;

      setMarcador({ lat, lng });
      buscarEndereco(lat, lng);
    }
  });

  return null;
}

export default function CadastroPontoColeta(): React.JSX.Element {
  const [marcador, setMarcador] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [pontos, setPontos] = useState<PontoColeta[]>([]);
  const [condicoes, setCondicoes] = useState<Condicoes>(condicoesVazias);
  const [editando, setEditando] = useState<string | number | null>(null);
  const [posEdicao, setPosEdicao] = useState<{lat: number; lng: number} | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroPontos, setErroPontos] = useState('');
  const [carregandoPontos, setCarregandoPontos] = useState(true);
  const [buscaPontos, setBuscaPontos] = useState('');
  const [situacaoPontos, setSituacaoPontos] = useState('');
  const [versaoEditor, setVersaoEditor] = useState(0);
  const [sucesso, setSucesso] = useState('');
  const pontosFiltrados = pontos.filter(p => (!situacaoPontos || p.status?.toUpperCase() === situacaoPontos)
    && [p.nome, p.bairro, p.endereco].join(' ').toLocaleLowerCase('pt-BR').includes(buscaPontos.trim().toLocaleLowerCase('pt-BR')));
  const envio = useRef(false);
  const [buscandoEndereco, setBuscandoEndereco] = useState(false);
  const [mensagemEndereco, setMensagemEndereco] = useState('');
  const consultaEndereco = useRef<AbortController | null>(null);
  const camposEditados = useRef({ bairro: false, endereco: false });

  const [formData, setFormData] = useState<FormDataState>({
    nome: '',
    tipo: 'Ponto Fixo',
    bairro: '',
    endereco: ''
  });

  const consultarPontos = useCallback((): Promise<void> => {
    return api.get<PontoColeta[]>('/pontos-coleta/admin')
      .then(response => { setPontos(response.data); })
      .catch(error => {
        setErroPontos('Não foi possível carregar os pontos. Tente atualizar a lista.');
        console.error('Erro ao buscar pontos:', error);
      })
      .finally(() => { setCarregandoPontos(false); });
  }, []);

  const buscarPontos = () => {
    setCarregandoPontos(true); setErroPontos('');
    return consultarPontos();
  };

  useEffect(() => {
    void consultarPontos();
  }, [consultarPontos]);

  useEffect(() => () => consultaEndereco.current?.abort(), []);

  function limpar() {
    setVersaoEditor(v => v + 1);
    consultaEndereco.current?.abort();
    setBuscandoEndereco(false);
    setEditando(null); setMarcador(null); setPosEdicao(null);
    setCondicoes(condicoesVazias); setMensagemEndereco('');
    setFormData({ nome: '', tipo: 'Ponto Fixo', bairro: '', endereco: '' });
  }

  function editar(ponto: PontoColeta) {
    setVersaoEditor(v => v + 1); setSucesso('');
    consultaEndereco.current?.abort();
    setBuscandoEndereco(false); setMensagemEndereco('');
    setEditando(ponto.id);
    setFormData({ nome: ponto.nome, tipo: ponto.tipo, bairro: ponto.bairro || '', endereco: ponto.endereco || '' });
    setCondicoes({
      horarios_semana: (ponto.horarios_semana ?? (ponto.dias_semana || []).map(dia => ({ dia, inicio: ponto.horario_inicio, fim: ponto.horario_fim }))).map(h => ({ dia: h.dia, inicio: h.inicio || '', fim: h.fim || '' })),
      materiais_lista: ponto.materiais_lista ?? (ponto.materiais_aceitos ? [ponto.materiais_aceitos] : []),
      orientacoes: ponto.orientacoes || '',
      limite_kg_por_pedido: ponto.limite_kg_por_pedido == null ? '' : String(ponto.limite_kg_por_pedido).replace('.', ','),
    });
    const pos = ponto.lat != null && ponto.lon != null ? { lat: Number(ponto.lat), lng: Number(ponto.lon) } : null;
    setMarcador(pos); setPosEdicao(pos);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const buscarEndereco = async (
    lat: number,
    lng: number
  ): Promise<void> => {
    consultaEndereco.current?.abort();
    const consulta = new AbortController();
    consultaEndereco.current = consulta;
    camposEditados.current = { bairro: false, endereco: false };
    setFormData(prev => ({ ...prev, bairro: '', endereco: '' }));
    setBuscandoEndereco(true);
    setMensagemEndereco('Buscando endereço e bairro do local selecionado...');
    try {
      const resultado = await geocodificarPonto(lat, lng, consulta.signal);
      if (consulta.signal.aborted) return;
      setFormData((prev) => ({
        ...prev,
        endereco: camposEditados.current.endereco ? prev.endereco : resultado.endereco,
        bairro: camposEditados.current.bairro ? prev.bairro : resultado.bairro
      }));
      setMensagemEndereco(resultado.bairro
        ? 'Endereço e bairro encontrados. Confira os dados e ajuste se necessário.'
        : 'Endereço encontrado, mas o mapa não informou o bairro. Preencha o bairro manualmente.');
    } catch {
      if (consulta.signal.aborted) return;
      setMensagemEndereco('Não foi possível buscar o endereço e o bairro. Preencha os campos manualmente.');
    } finally {
      if (!consulta.signal.aborted) setBuscandoEndereco(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    if (name === 'bairro' || name === 'endereco') camposEditados.current[name] = true;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    if (buscandoEndereco || envio.current) return;

    const limite = condicoes.limite_kg_por_pedido.trim().replace(',', '.');
    if (limite && (!/^\d+(\.\d{1,3})?$/.test(limite) || Number(limite) <= 0 || Number(limite) > 999999999.999)) {
      alert('Informe um limite positivo em kg, com até três casas decimais.'); return;
    }
    if (condicoes.horarios_semana.some(h => !h.inicio || !h.fim || h.inicio >= h.fim)) {
      alert('Informe início e fim para cada dia selecionado, com término posterior ao início no mesmo dia.'); return;
    }

    if (!marcador) {
      alert('Por favor, selecione um local clicando no mapa!');
      return;
    }

    envio.current = true; setSalvando(true);
    try {
      const payload = {
        ...formData,
        ...condicoes,
        limite_kg_por_pedido: limite ? Number(limite) : null,
        lat: marcador.lat,
        lon: marcador.lng
      };

      await api.request({ method: editando == null ? 'POST' : 'PUT', url: editando == null ? '/pontos-coleta' : `/pontos-coleta/${editando}`, data: payload });

      setSucesso(editando == null ? 'Ponto de coleta registrado com sucesso!' : 'Ponto de coleta atualizado com sucesso!');
      limpar();
      void buscarPontos();
    } catch (error: unknown) {
      console.error(error);

      const resposta = axios.isAxiosError<{ message?: string | string[] }>(error) ? error.response : undefined;
      if (resposta?.status === 401 || resposta?.status === 403) {
        alert(
          'Sua sessão expirou. Por favor, saia e faça login novamente.'
        );
      } else {
        alert([resposta?.data?.message || 'Erro ao salvar o ponto de coleta.'].flat().join(' '));
      }
    } finally { envio.current = false; setSalvando(false); }
  };

  const handleSoftDelete = async (
    id: string | number
  ): Promise<void> => {
    const confirmar = window.confirm(
      'Deseja desativar este ponto? Ele deixará de aparecer como ativo.'
    );

    if (!confirmar) return;

    try {
      await api.delete(`/pontos-coleta/${id}?tipo=soft`);

      buscarPontos();
    } catch (error) {
      console.error(error);
      alert('Erro ao desativar o ponto.');
    }
  };

  const handleReativar = async (
    id: string | number
  ): Promise<void> => {
    const confirmar = window.confirm(
      'Deseja reativar este ponto? Ele voltará a ficar disponível como ativo.'
    );

    if (!confirmar) return;

    try {
      await api.delete(`/pontos-coleta/${id}?tipo=reativar`);

      buscarPontos();
    } catch (error) {
      console.error(error);
      alert('Erro ao reativar o ponto.');
    }
  };

  const handleHardDelete = async (
    id: string | number
  ): Promise<void> => {
    const confirmar = window.confirm(
      'ATENÇÃO: deseja remover permanentemente este ponto do banco de dados?'
    );

    if (!confirmar) return;

    try {
      await api.delete(`/pontos-coleta/${id}?tipo=hard`);

      buscarPontos();
    } catch (error) {
      console.error(error);
      alert(axios.isAxiosError(error) ? error.response?.data?.message || 'Erro ao remover o ponto.' : 'Erro ao remover o ponto.');
    }
  };

  return (
    <div className={styles.container}>
      <header className="painel-cabecalho"><div><h2>Pontos de coleta</h2><p>Cadastre os locais e mantenha as informações de atendimento atualizadas para os geradores.</p></div>
        <a className="painel-link" href="#pontos-cadastrados">Ver pontos cadastrados ↓</a>
      </header>
      {sucesso && <p className="painel-sucesso" role="status">{sucesso}</p>}
      <form onSubmit={handleSubmit} className={styles.cadastroForm}>
      <div className={styles.topContainer}>
        <div className={styles.mapSection}>
          <h2 className={styles.title}>
            Selecione o Local no Mapa
          </h2>

          <p className={styles.description}>
            Clique no local do atendimento. Confira o endereço e o bairro ao lado.
          </p>

          <MapContainer
            center={centroApucarana}
            zoom={14}
            className={styles.map}
          >
            <CentroEdicao pos={posEdicao} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {marcador && (
              <Marker position={[marcador.lat, marcador.lng]} />
            )}

            <MapClickHandler
              setMarcador={setMarcador}
              buscarEndereco={buscarEndereco}
            />
          </MapContainer>
        </div>

        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>
            {editando == null ? 'Dados Cadastrais da SEMA' : 'Editar ponto de coleta'}
          </h2>

          <div className={styles.form}>
            <div>
              <label className={styles.label} htmlFor="ponto-nome">
                Nome Identificador:
              </label>

              <input
                type="text"
                name="nome"
                id="ponto-nome"
                maxLength={200}
                value={formData.nome}
                onChange={handleChange}
                required
                className={styles.input}
                placeholder="Ex: Cooperativa Têxtil - Barracão Norte"
              />
            </div>

            <div>
              <label className={styles.label} htmlFor="ponto-tipo">
                Modalidade de Coleta:
              </label>

              <select
                name="tipo"
                id="ponto-tipo"
                value={formData.tipo}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="Ponto Fixo">
                  Ponto Fixo (Ecoponto/Caçamba)
                </option>

                <option value="Rota Semanal">
                  Rota Semanal (Caminhão Coletor)
                </option>
              </select>
            </div>

            <div>
              <label className={styles.label} htmlFor="ponto-bairro">
                Bairro:
              </label>

              <input
                type="text"
                id="ponto-bairro"
                name="bairro"
                aria-describedby="localizacao-status"
                value={formData.bairro}
                onChange={handleChange}
                required
                className={styles.input}
                placeholder="Selecione no mapa ou informe o bairro"
              />
            </div>

            <div>
              <label className={styles.label} htmlFor="ponto-endereco">
                Endereço Geocodificado:
              </label>

              <input
                type="text"
                id="ponto-endereco"
                name="endereco"
                value={formData.endereco}
                onChange={handleChange}
                required
                className={styles.input}
                placeholder="Preenchido automaticamente pelo OpenStreetMap"
              />
            </div>

            <p id="localizacao-status" className={styles.locationFeedback} role="status" aria-live="polite">
              {mensagemEndereco}
            </p>

            <div className={styles.coordinatesContainer}>
              <div className={styles.coordinateBox}>
                <label className={styles.coordinateLabel}>
                  Latitude:
                </label>

                <input
                  type="text"
                  disabled
                  value={marcador ? marcador.lat.toFixed(6) : ''}
                  className={styles.coordinateInput}
                  placeholder="0.000000"
                />
              </div>

              <div className={styles.coordinateBox}>
                <label className={styles.coordinateLabel}>
                  Longitude:
                </label>

                <input
                  type="text"
                  disabled
                  value={marcador ? marcador.lng.toFixed(6) : ''}
                  className={styles.coordinateInput}
                  placeholder="0.000000"
                />
              </div>
            </div>

          </div>
        </div>
      </div>
      <CondicoesPonto key={String(editando ?? 'novo') + '-' + versaoEditor} value={condicoes} onChange={setCondicoes} />
      <div className={styles.formActions}>
        {editando != null && <button type="button" className={styles.cancelButton} onClick={limpar} disabled={salvando}>Cancelar edição</button>}
        <button type="submit" className={styles.submitButton} disabled={buscandoEndereco || salvando}>
          {salvando ? 'Salvando...' : buscandoEndereco ? 'Buscando endereço...' : editando == null ? 'Gravar Ponto no Sistema' : 'Salvar alterações'}
        </button>
      </div>
      </form>

      <div className={styles.tableContainer} id="pontos-cadastrados">
        {erroPontos && <p role="alert">{erroPontos} <button type="button" onClick={() => void buscarPontos()}>Atualizar lista</button></p>}
        <h2 className={styles.title}>
          Pontos cadastrados
        </h2>

        <div className="painel-filtros">
          <label>Buscar ponto<input value={buscaPontos} onChange={e => setBuscaPontos(e.target.value)} placeholder="Nome, bairro ou endereço" /></label>
          <label>Situação do ponto<select value={situacaoPontos} onChange={e => setSituacaoPontos(e.target.value)}><option value="">Todas</option><option value="ATIVO">Ativo</option><option value="INATIVO">Inativo</option></select></label>
          {(buscaPontos || situacaoPontos) && <button type="button" className="painel-secundario" onClick={() => { setBuscaPontos(''); setSituacaoPontos(''); }}>Limpar filtros</button>}
        </div>
        <p className="painel-ajuda" role="status">{carregandoPontos ? 'Atualizando pontos...' : pontosFiltrados.length + ' de ' + pontos.length + ' pontos'} · Pontos ativos ficam disponíveis no formulário público.</p>
        <p className="painel-rolagem">Deslize a tabela para ver todas as informações e ações.</p>
        <div className={styles.tableWrapper} tabIndex={0} role="region" aria-label="Lista de pontos de coleta">
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHeadRow}>
                <th className={styles.th}>Nome Identificador</th>
                <th className={styles.th}>Modalidade</th>
                <th className={styles.th}>Bairro</th>
                <th className={styles.th}>Endereço Completo</th>
                <th className={styles.th}>Situação</th>
                <th className={`${styles.th} ${styles.center}`}>
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {pontosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyRow}>
                    {carregandoPontos ? 'Carregando pontos...' : erroPontos ? 'Lista indisponível. Tente novamente.' : pontos.length ? 'Nenhum ponto corresponde aos filtros.' : 'Nenhum ponto cadastrado. Use o formulário acima para começar.'}
                  </td>
                </tr>
              ) : (
                pontosFiltrados.map((ponto) => {
                  const statusNormalizado =
                    ponto.status?.toUpperCase();

                  return (
                    <tr
                      key={ponto.id}
                      className={`${styles.tableRow} ${
                        statusNormalizado === 'INATIVO'
                          ? styles.inactiveRow
                          : ''
                      }`}
                    >
                      <td className={`${styles.td} ${styles.bold}`}>
                        {ponto.nome}
                      </td>

                      <td className={styles.td}>
                        {ponto.tipo}
                      </td>

                      <td className={styles.td}>
                        {ponto.bairro}
                      </td>

                      <td className={`${styles.td} ${styles.smallText}`}>
                        {ponto.endereco}
                      </td>

                      <td className={styles.td}>
                        <span
                          className={`${styles.statusBadge} ${
                            statusNormalizado === 'ATIVO'
                              ? styles.activeBadge
                              : styles.inactiveBadge
                          }`}
                        >
                          {statusNormalizado}
                        </span>
                      </td>

                      <td className={styles.actions}>
                        <button type="button" onClick={() => editar(ponto)} className={styles.reactivateButton}>Editar ponto</button>
                        {statusNormalizado === 'ATIVO' ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleSoftDelete(ponto.id)
                            }
                            className={styles.softDeleteButton}
                          >
                            Desativar Ponto
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleReativar(ponto.id)
                            }
                            className={styles.reactivateButton}
                          >
                            Reativar Ponto
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            handleHardDelete(ponto.id)
                          }
                          className={styles.hardDeleteButton}
                        >
                          Remover do Banco
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

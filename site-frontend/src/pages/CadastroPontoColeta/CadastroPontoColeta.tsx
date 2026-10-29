import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents
} from 'react-leaflet';

import L from 'leaflet';
import axios from 'axios';
import api from '../../services/api';

import 'leaflet/dist/leaflet.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

import styles from './CadastroPontoColeta.module.css';

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
}

interface FormDataState {
  nome: string;
  tipo: string;
  bairro: string;
  endereco: string;
}

const centroApucarana: [number, number] = [-23.5522, -51.46];

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

  const [formData, setFormData] = useState<FormDataState>({
    nome: '',
    tipo: 'Ponto Fixo',
    bairro: '',
    endereco: ''
  });

  const API_URL =
    (import.meta.env.VITE_API_URL as string) ||
    'http://localhost:3001/api/v1';

  const buscarPontos = async (): Promise<void> => {
    try {
      const response = await api.get<PontoColeta[]>('/pontos-coleta/admin');

      setPontos(response.data);
    } catch (error) {
      console.error('Erro ao buscar pontos:', error);
    }
  };

  useEffect(() => {
    buscarPontos();
  }, []);

  const buscarEndereco = async (
    lat: number,
    lng: number
  ): Promise<void> => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );

      const { address, display_name } = response.data;

      const nomeBairro =
        address.suburb ||
        address.neighbourhood ||
        address.city_district ||
        address.village ||
        '';

      setFormData((prev) => ({
        ...prev,
        endereco: display_name,
        bairro: nomeBairro || prev.bairro
      }));
    } catch (error) {
      console.error('Erro ao buscar endereço no Nominatim:', error);

      alert(
        'Não foi possível carregar o endereço automático. Você pode preencher manualmente.'
      );
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    if (!marcador) {
      alert('Por favor, selecione um local clicando no mapa!');
      return;
    }

    const token = localStorage.getItem('token_sema');

    try {
      const payload = {
        ...formData,
        lat: marcador.lat,
        lon: marcador.lng
      };

      await axios.post(`${API_URL}/pontos-coleta`, payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      alert('Ponto de coleta registrado com sucesso!');

      setMarcador(null);

      setFormData({
        nome: '',
        tipo: 'Ponto Fixo',
        bairro: '',
        endereco: ''
      });

      buscarPontos();
    } catch (error: any) {
      console.error(error);

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        alert(
          'Sua sessão expirou. Por favor, saia e faça login novamente.'
        );
      } else {
        alert('Erro ao salvar o ponto de coleta.');
      }
    }
  };

  const handleSoftDelete = async (
    id: string | number
  ): Promise<void> => {
    const confirmar = window.confirm(
      'Deseja desativar este ponto? Ele deixará de aparecer como ativo.'
    );

    if (!confirmar) return;

    const token = localStorage.getItem('token_sema');

    try {
      await axios.delete(
        `${API_URL}/pontos-coleta/${id}?tipo=soft`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

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

    const token = localStorage.getItem('token_sema');

    try {
      await axios.delete(
        `${API_URL}/pontos-coleta/${id}?tipo=reativar`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

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

    const token = localStorage.getItem('token_sema');

    try {
      await axios.delete(
        `${API_URL}/pontos-coleta/${id}?tipo=hard`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      buscarPontos();
    } catch (error) {
      console.error(error);
      alert('Erro ao remover o ponto do banco.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.topContainer}>
        <div className={styles.mapSection}>
          <h2 className={styles.title}>
            Selecione o Local no Mapa
          </h2>

          <p className={styles.description}>
            Clique sobre a localização exata da calçada, ecoponto ou
            rota para extrair as coordenadas geográficas.
          </p>

          <MapContainer
            center={centroApucarana}
            zoom={14}
            className={styles.map}
          >
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
            Dados Cadastrais da SEMA
          </h2>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div>
              <label className={styles.label}>
                Nome Identificador:
              </label>

              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                className={styles.input}
                placeholder="Ex: Cooperativa Têxtil - Barracão Norte"
              />
            </div>

            <div>
              <label className={styles.label}>
                Modalidade de Coleta:
              </label>

              <select
                name="tipo"
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
              <label className={styles.label}>
                Bairro:
              </label>

              <input
                type="text"
                name="bairro"
                value={formData.bairro}
                onChange={handleChange}
                required
                className={styles.input}
                placeholder="Preenchido ao clicar no mapa"
              />
            </div>

            <div>
              <label className={styles.label}>
                Endereço Geocodificado:
              </label>

              <input
                type="text"
                name="endereco"
                value={formData.endereco}
                onChange={handleChange}
                required
                className={styles.input}
                placeholder="Preenchido automaticamente pelo OpenStreetMap"
              />
            </div>

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

            <button type="submit" className={styles.submitButton}>
              Gravar Ponto no Sistema
            </button>
          </form>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <h2 className={styles.title}>
          Pontos Auditados (Histórico Municipal)
        </h2>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHeadRow}>
                <th className={styles.th}>Nome Identificador</th>
                <th className={styles.th}>Modalidade</th>
                <th className={styles.th}>Bairro</th>
                <th className={styles.th}>Endereço Completo</th>
                <th className={styles.th}>Situação</th>
                <th className={`${styles.th} ${styles.center}`}>
                  Operações de Controle
                </th>
              </tr>
            </thead>

            <tbody>
              {pontos.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyRow}>
                    Nenhum ponto registrado na base de dados da prefeitura.
                  </td>
                </tr>
              ) : (
                pontos.map((ponto) => {
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

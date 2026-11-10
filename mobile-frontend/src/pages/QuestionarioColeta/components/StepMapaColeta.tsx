import { useEffect, useRef } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import type {
  LocalizacaoUsuario,
  PontoColeta,
} from "../types/questionario.types";
import { calcularDistanciaKm } from "../utils/distancia";
import { CondicoesAtendimento } from './CondicoesAtendimento';

const temCoordenadas = (p: PontoColeta) => p.lat != null && p.lon != null && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lon));

type StepMapaColetaProps = {
  localizacao: LocalizacaoUsuario | null;
  pontos: PontoColeta[];
  pontoSelecionado: PontoColeta | null;
  onSelecionarPonto: (ponto: PontoColeta) => void;
};

const pontoIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const usuarioIcon = L.divIcon({
  className: "user-location-marker",
  html: "📍",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function RecenterMap({ lat, lon }: LocalizacaoUsuario) {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lon], 14);
  }, [lat, lon, map]);

  return null;
}

function formatarDistancia(
  localizacao: LocalizacaoUsuario | null,
  ponto: PontoColeta
) {
  if (!localizacao || !temCoordenadas(ponto)) {
    return null;
  }

  const lat = Number(ponto.lat);
  const lon = Number(ponto.lon);

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return null;
  }

  const distancia = calcularDistanciaKm(localizacao, { lat, lon });

  if (distancia < 1) {
    return `${Math.round(distancia * 1000)} m`;
  }

  return `${distancia.toFixed(1)} km`;
}

export function StepMapaColeta({
  localizacao,
  pontos,
  pontoSelecionado,
  onSelecionarPonto,
}: StepMapaColetaProps) {
  const mapRef = useRef<LeafletMap | null>(null);

  const pontosComCoordenadas = pontos.filter(temCoordenadas);
  const primeiro = pontosComCoordenadas[0];
  const centro = localizacao || (primeiro ? { lat: Number(primeiro.lat), lon: Number(primeiro.lon) } : { lat: -23.5522, lon: -51.46 });

  function selecionarPonto(ponto: PontoColeta) {
    onSelecionarPonto(ponto);

    const lat = Number(ponto.lat);
    const lon = Number(ponto.lon);

    if (temCoordenadas(ponto) && mapRef.current) {
      mapRef.current.flyTo([lat, lon], 16, {
        animate: true,
        duration: 0.8,
      });
    }
  }

  return (
    <section className="step-card">
      <h1>Escolha um ponto de coleta</h1>

      <p>
        Confira as condições de atendimento e selecione um ponto. A localização do aparelho, quando disponível, serve apenas para ordenar os pontos por proximidade.
      </p>

      {!localizacao && (
        <div className="info-box">
          Você pode continuar sem compartilhar a localização. Escolha o ponto na lista ou no mapa.
        </div>
      )}

      {(
        <div className="map-wrapper compact-map">
          <MapContainer
            center={[centro.lat, centro.lon]}
            zoom={14}
            className="leaflet-map"
            scrollWheelZoom={false}
            ref={mapRef}
          >
            <RecenterMap lat={centro.lat} lon={centro.lon} />

            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {localizacao && <Marker
              position={[localizacao.lat, localizacao.lon]}
              icon={usuarioIcon}
            >
              <Popup>Localização aproximada do aparelho</Popup>
            </Marker>}

            {pontosComCoordenadas.map((ponto) => {
              const lat = Number(ponto.lat);
              const lon = Number(ponto.lon);

              return (
                <Marker
                  key={ponto.id}
                  position={[lat, lon]}
                  icon={pontoIcon}
                  eventHandlers={{
                    click: () => selecionarPonto(ponto),
                  }}
                >
                  <Popup>
                    <div className="popup-content">
                      <strong>{ponto.nome}</strong>
                      <span>{ponto.tipo}</span>
                      <small>
                        {ponto.endereco ||
                          ponto.bairro ||
                          "Endereço não informado"}
                      </small>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      )}

      {pontoSelecionado && (
        <div className="selected-point-banner">
          <span>Ponto selecionado</span>
          <strong>{pontoSelecionado.nome}</strong>
        </div>
      )}

      <div className="collection-list-header">
        <strong>Pontos disponíveis</strong>
        <span>{pontos.length} encontrados</span>
      </div>

      <div className="collection-points-list">
        {pontos.length === 0 && (
          <div className="error-box">
            Nenhum ponto de coleta disponível no momento.
          </div>
        )}

        {pontos.map((ponto, index) => {
          const selecionado = pontoSelecionado?.id === ponto.id;
          const distancia = formatarDistancia(localizacao, ponto);

          return (
            <article
              key={ponto.id}
              className={
                selecionado
                  ? "collection-point-card selected"
                  : "collection-point-card"
              }
            >
              <div className="point-rank">
                {selecionado ? "✓" : index + 1}
              </div>

              <div className="point-info">
                <strong>{ponto.nome}</strong>

                <div className="point-meta">
                  <span>{ponto.tipo}</span>
                  {distancia && <span>{distancia}</span>}
                </div>

                <p>
                  {ponto.endereco ||
                    ponto.bairro ||
                    "Endereço não informado"}
                </p>
                <CondicoesAtendimento ponto={ponto} />
              </div>

              <button
                type="button"
                className={
                  selecionado
                    ? "select-point-button active"
                    : "select-point-button"
                }
                onClick={() => selecionarPonto(ponto)}
              >
                {selecionado ? "Selecionado" : "Selecionar"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

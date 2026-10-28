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
  if (!localizacao || ponto.lat === undefined || ponto.lon === undefined) {
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

  const pontosComCoordenadas = pontos.filter((ponto) => {
    const lat = Number(ponto.lat);
    const lon = Number(ponto.lon);

    return !Number.isNaN(lat) && !Number.isNaN(lon);
  });

  function selecionarPonto(ponto: PontoColeta) {
    onSelecionarPonto(ponto);

    const lat = Number(ponto.lat);
    const lon = Number(ponto.lon);

    if (!Number.isNaN(lat) && !Number.isNaN(lon) && mapRef.current) {
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
        Veja os pontos próximos no mapa e selecione uma opção na lista abaixo.
      </p>

      <div className="tech-debt-box">
        <strong>Débito técnico declarado:</strong>
        <span>
          nesta versão, todos os pontos próximos são exibidos. O questionário
          ainda não filtra o ponto ideal por tipo de resíduo.
        </span>
      </div>

      {!localizacao && (
        <div className="info-box">
          Obtendo localização aproximada do dispositivo...
        </div>
      )}

      {localizacao && (
        <div className="map-wrapper compact-map">
          <MapContainer
            center={[localizacao.lat, localizacao.lon]}
            zoom={14}
            className="leaflet-map"
            scrollWheelZoom={false}
            ref={mapRef}
          >
            <RecenterMap lat={localizacao.lat} lon={localizacao.lon} />

            <TileLayer
              attribution="&copy; OpenStreetMap"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker
              position={[localizacao.lat, localizacao.lon]}
              icon={usuarioIcon}
            >
              <Popup>Você está aqui</Popup>
            </Marker>

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
        <span>{pontosComCoordenadas.length} encontrados</span>
      </div>

      <div className="collection-points-list">
        {pontosComCoordenadas.length === 0 && (
          <div className="error-box">
            Nenhum ponto de coleta com coordenadas foi encontrado.
          </div>
        )}

        {pontosComCoordenadas.slice(0, 8).map((ponto, index) => {
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
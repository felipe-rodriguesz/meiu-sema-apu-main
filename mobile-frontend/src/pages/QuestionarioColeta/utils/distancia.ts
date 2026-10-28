import type { LocalizacaoUsuario } from "../types/questionario.types";

export function calcularDistanciaKm(
  origem: LocalizacaoUsuario,
  destino: LocalizacaoUsuario
) {
  const raioTerraKm = 6371;

  const dLat = ((destino.lat - origem.lat) * Math.PI) / 180;
  const dLon = ((destino.lon - origem.lon) * Math.PI) / 180;

  const lat1 = (origem.lat * Math.PI) / 180;
  const lat2 = (destino.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return raioTerraKm * c;
}
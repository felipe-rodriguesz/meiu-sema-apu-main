import type { PontoColeta } from "../types/questionario.types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3001/api/v1";

export async function listarPontosColeta() {
  const response = await fetch(`${API_BASE_URL}/pontos-coleta`);

  if (!response.ok) {
    throw new Error("Erro ao buscar pontos de coleta.");
  }

  return response.json() as Promise<PontoColeta[]>;
}
import type {
  CriarDescartePayload,
  CriarDescarteResponse,
} from "../types/questionario.types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3001/api/v1";

export async function criarDescarte(payload: CriarDescartePayload) {
  const response = await fetch(`${API_BASE_URL}/descartes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Erro ao criar descarte.");
  }

  return response.json() as Promise<CriarDescarteResponse>;
}
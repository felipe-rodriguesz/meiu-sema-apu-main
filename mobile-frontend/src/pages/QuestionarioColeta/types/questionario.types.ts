export type EtapaQuestionario = 1 | 2 | 3 | 4 | 5;

export type LocalizacaoUsuario = {
  lat: number;
  lon: number;
};

export type PontoColeta = {
  id: string;
  nome: string;
  tipo: string;
  bairro?: string;
  endereco?: string;
  lat?: number;
  lon?: number;
  status?: string;
};

export type FormularioDescarte = {
  eh_mistura: boolean | null;
  residuo_principal: string;
  quantidade_kg: string;
  frequencia_dias: string;
  material: string;
  estado_material: string;
  tipo_tecido: string;
};

export type CriarDescartePayload = {
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
};

export type CriarDescarteResponse = {
  protocolo: string;
  status: string;
  ponto_coleta_id?: string;
};
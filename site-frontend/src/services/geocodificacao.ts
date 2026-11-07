import axios from 'axios';

interface EnderecoGeocodificado {
  endereco: string;
  bairro: string;
}

interface GeocodeJson {
  features?: Array<{
    properties?: {
      geocoding?: {
        label?: string;
        locality?: string;
        district?: string;
        city?: string;
      };
    };
  }>;
}

const cache = new Map<string, EnderecoGeocodificado>();
let ultimaConsulta = 0;
let fila = Promise.resolve();

function aguardar(ms: number, signal: AbortSignal): Promise<void> {
  signal.throwIfAborted();
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const cancelar = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', cancelar);
      resolve();
    }, ms);
    signal.addEventListener('abort', cancelar, { once: true });
  });
}

function extrairBairro(locality?: string, district?: string, city?: string): string {
  const cidade = city?.trim().toLocaleLowerCase('pt-BR');
  for (const valor of [locality, district]) {
    if (!valor?.trim()) continue;
    const partes = valor.split(',').map(parte => parte.trim()).filter(Boolean);
    // Algumas localidades incluem a cidade no próprio nome: "Centro, Apucarana".
    if (cidade && partes[partes.length - 1]?.toLocaleLowerCase('pt-BR') === cidade) partes.pop();
    const bairro = partes.join(', ');
    if (bairro) return bairro;
  }
  return '';
}

export async function geocodificarPonto(lat: number, lon: number, signal: AbortSignal): Promise<EnderecoGeocodificado> {
  const chave = lat.toFixed(6) + ',' + lon.toFixed(6);
  const anterior = fila;
  let liberar!: () => void;
  fila = new Promise<void>(resolve => { liberar = resolve; });
  await anterior;
  try {
    signal.throwIfAborted();
    const salvo = cache.get(chave);
    if (salvo) return salvo;

    // Serializa consultas e reutiliza resultados para evitar rajadas ao clicar no mapa.
    await aguardar(1100 - (Date.now() - ultimaConsulta), signal);
    signal.throwIfAborted();
    ultimaConsulta = Date.now();
    const response = await axios.get<GeocodeJson>('https://nominatim.openstreetmap.org/reverse', {
      params: { format: 'geocodejson', lat, lon, zoom: 18, addressdetails: 1, 'accept-language': 'pt-BR', layer: 'address' },
      signal,
      timeout: 15000
    });
    const dados = response.data.features?.[0]?.properties?.geocoding;
    if (!dados?.label?.trim()) throw new Error('Endereço não encontrado.');
    const resultado = {
      endereco: dados.label.trim(),
      bairro: extrairBairro(dados.locality, dados.district, dados.city)
    };
    if (cache.size >= 100) cache.delete(cache.keys().next().value!);
    cache.set(chave, resultado);
    return resultado;
  } finally {
    liberar();
  }
}

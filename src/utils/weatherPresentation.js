export const WEATHER_ICON_VARIANTS = Object.freeze({
  ceu_limpo: 'clear',
  predominantemente_limpo: 'partly-cloudy',
  parcialmente_nublado: 'partly-cloudy',
  encoberto: 'cloudy',
  nevoeiro: 'fog',
  nevoeiro_com_geada: 'fog',
  garoa_fraca: 'drizzle',
  garoa_moderada: 'drizzle',
  garoa_intensa: 'drizzle',
  garoa_congelante_fraca: 'freezing-rain',
  garoa_congelante_intensa: 'freezing-rain',
  chuva_fraca: 'rain',
  chuva_moderada: 'rain',
  chuva_forte: 'rain',
  chuva_congelante_fraca: 'freezing-rain',
  chuva_congelante_forte: 'freezing-rain',
  neve_fraca: 'snow',
  neve_moderada: 'snow',
  neve_forte: 'snow',
  graos_de_neve: 'snow',
  pancadas_de_chuva_fracas: 'showers',
  pancadas_de_chuva_moderadas: 'showers',
  pancadas_de_chuva_fortes: 'showers',
  pancadas_de_neve_fracas: 'snow',
  pancadas_de_neve_fortes: 'snow',
  tempestade: 'storm',
  tempestade_com_granizo_fraco: 'storm',
  tempestade_com_granizo_forte: 'storm',
  condicao_desconhecida: 'unknown',
})

export function getWeatherIconVariant(iconKey) {
  return WEATHER_ICON_VARIANTS[iconKey] ?? 'unknown'
}

const CLIMATE_ERROR_PRESENTATIONS = Object.freeze({
  coordenadas_indisponiveis: Object.freeze({
    title: 'Clima indisponível para este local',
    message:
      'Este destino não possui coordenadas válidas para a consulta meteorológica.',
    canRetry: false,
  }),
  clima_indisponivel: Object.freeze({
    title: 'Serviço de clima temporariamente indisponível',
    message:
      'Não foi possível consultar as condições meteorológicas agora. Tente novamente em instantes.',
    canRetry: true,
  }),
  banco_indisponivel: Object.freeze({
    title: 'Dados do clima temporariamente indisponíveis',
    message:
      'A consulta ao local não pôde ser concluída agora. Tente novamente em instantes.',
    canRetry: true,
  }),
})

const DEFAULT_CLIMATE_ERROR_PRESENTATION = Object.freeze({
  title: 'Não foi possível carregar o clima',
  message:
    'As demais informações do local continuam disponíveis. Tente novamente em instantes.',
  canRetry: true,
})

export function getClimateErrorPresentation(code) {
  return CLIMATE_ERROR_PRESENTATIONS[code] ?? DEFAULT_CLIMATE_ERROR_PRESENTATION
}

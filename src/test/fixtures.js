export function makeRawLocal(overrides = {}) {
  return {
    id: 1,
    slug: 'arpoador',
    nome: 'Arpoador',
    categoria: 'praias',
    descricao: 'Encontro do mar com a pedra e o pôr do sol.',
    cidade: 'Rio de Janeiro',
    bairro: 'Ipanema',
    regiao: 'Zona Sul',
    imagem: '/imagens/locais/arpoador.jpg',
    destaque: true,
    latitude: -22.9887,
    longitude: -43.1913,
    nota_media: 4.5,
    total_avaliacoes: 2,
    ...overrides,
  }
}

export function makeLocal(overrides = {}) {
  return {
    id: 1,
    slug: 'arpoador',
    nome: 'Arpoador',
    categoria: 'praias',
    categoriaLabel: 'Praias',
    descricao: 'Encontro do mar com a pedra e o pôr do sol.',
    cidade: 'Rio de Janeiro',
    bairro: 'Ipanema',
    regiao: 'Zona Sul',
    imagem: '/imagens/locais/arpoador.jpg',
    destaque: true,
    latitude: -22.9887,
    longitude: -43.1913,
    nota: 4.5,
    totalAvaliacoes: 2,
    ...overrides,
  }
}

export function makeRawReview(overrides = {}) {
  return {
    id: 10,
    local_id: 1,
    autor: 'Ana',
    nota: 5,
    comentario: 'Vista inesquecível.',
    criado_em: '2026-09-20T12:00:00Z',
    ...overrides,
  }
}

export function makeReview(overrides = {}) {
  return {
    id: 10,
    localId: 1,
    autor: 'Ana',
    nota: 5,
    comentario: 'Vista inesquecível.',
    data: '2026-09-20T12:00:00Z',
    ...overrides,
  }
}

export function makeRawClimate(overrides = {}) {
  return {
    local: { slug: 'arpoador', nome: 'Arpoador' },
    timezone: 'America/Sao_Paulo',
    atual: {
      observado_em: '2026-09-20T09:00:00-03:00',
      temperatura_c: 24.5,
      sensacao_termica_c: 25.1,
      precipitacao_mm: 0,
      velocidade_vento_kmh: 12.4,
      codigo_meteorologico: 1,
      descricao: 'Predominantemente limpo',
      icone: 'predominantemente_limpo',
    },
    previsao: [
      {
        data: '2026-09-21',
        temperatura_max_c: 27,
        temperatura_min_c: 19,
        probabilidade_precipitacao_max_pct: 10,
        codigo_meteorologico: 0,
        descricao: 'Céu limpo',
        icone: 'ceu_limpo',
      },
      {
        data: '2026-09-22',
        temperatura_max_c: 25,
        temperatura_min_c: 18,
        probabilidade_precipitacao_max_pct: 35,
        codigo_meteorologico: 2,
        descricao: 'Parcialmente nublado',
        icone: 'parcialmente_nublado',
      },
      {
        data: '2026-09-23',
        temperatura_max_c: 23,
        temperatura_min_c: 17,
        probabilidade_precipitacao_max_pct: 60,
        codigo_meteorologico: 61,
        descricao: 'Chuva fraca',
        icone: 'chuva_fraca',
      },
    ],
    atualizado_em: '2026-09-20T12:01:00Z',
    cache: {
      utilizado: false,
      expira_em: '2026-09-20T12:31:00Z',
    },
    ...overrides,
  }
}

export function makeClimate(overrides = {}) {
  return {
    local: { slug: 'arpoador', nome: 'Arpoador' },
    timezone: 'America/Sao_Paulo',
    atual: {
      observadoEm: '2026-09-20T09:00:00-03:00',
      temperaturaC: 24.5,
      sensacaoTermicaC: 25.1,
      precipitacaoMm: 0,
      velocidadeVentoKmh: 12.4,
      codigoMeteorologico: 1,
      descricao: 'Predominantemente limpo',
      icone: 'predominantemente_limpo',
    },
    previsao: [
      {
        data: '2026-09-21',
        temperaturaMaxC: 27,
        temperaturaMinC: 19,
        probabilidadePrecipitacaoMaxPct: 10,
        codigoMeteorologico: 0,
        descricao: 'Céu limpo',
        icone: 'ceu_limpo',
      },
      {
        data: '2026-09-22',
        temperaturaMaxC: 25,
        temperaturaMinC: 18,
        probabilidadePrecipitacaoMaxPct: 35,
        codigoMeteorologico: 2,
        descricao: 'Parcialmente nublado',
        icone: 'parcialmente_nublado',
      },
      {
        data: '2026-09-23',
        temperaturaMaxC: 23,
        temperaturaMinC: 17,
        probabilidadePrecipitacaoMaxPct: 60,
        codigoMeteorologico: 61,
        descricao: 'Chuva fraca',
        icone: 'chuva_fraca',
      },
    ],
    atualizadoEm: '2026-09-20T12:01:00Z',
    cache: {
      utilizado: false,
      expiraEm: '2026-09-20T12:31:00Z',
    },
    ...overrides,
  }
}

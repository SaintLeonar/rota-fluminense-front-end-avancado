import { ApiError } from './apiClient.js'

const CONTRACT_ERROR_MESSAGE =
  'A API retornou dados incompatíveis com o contrato esperado.'
const FIELD_ERROR_MESSAGE = 'O campo retornado pela API é inválido.'
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const ICON_PATTERN = /^[a-z0-9]+(?:_[a-z0-9]+)*$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const OFFSET_DATETIME_PATTERN = /[+-]\d{2}:\d{2}$/
const UTC_DATETIME_PATTERN = /Z$/

export const LOCAL_CATEGORY_LABELS = Object.freeze({
  praias: 'Praias',
  parques: 'Parques',
  museus: 'Museus',
  mirantes: 'Mirantes',
})

function createContractError(field) {
  return new ApiError(CONTRACT_ERROR_MESSAGE, {
    code: 'resposta_api_invalida',
    details: [
      {
        campo: field,
        codigo: 'resposta_invalida',
        mensagem: FIELD_ERROR_MESSAGE,
      },
    ],
  })
}

function requireRecord(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw createContractError(field)
  }

  return value
}

function requireArray(value, field) {
  if (!Array.isArray(value)) {
    throw createContractError(field)
  }

  return value
}

function requireString(value, field, { pattern } = {}) {
  if (typeof value !== 'string' || !value.trim()) {
    throw createContractError(field)
  }

  if (pattern && !pattern.test(value)) {
    throw createContractError(field)
  }

  return value
}

function requireNullableString(value, field) {
  if (value === null) {
    return null
  }

  return requireString(value, field)
}

function requireNumber(
  value,
  field,
  { integer = false, min = -Infinity, max = Infinity } = {},
) {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    (integer && !Number.isInteger(value)) ||
    value < min ||
    value > max
  ) {
    throw createContractError(field)
  }

  return value
}

function requireNullableNumber(value, field, limits) {
  if (value === null) {
    return null
  }

  return requireNumber(value, field, limits)
}

function requireBoolean(value, field) {
  if (typeof value !== 'boolean') {
    throw createContractError(field)
  }

  return value
}

function requireDate(value, field) {
  const date = requireString(value, field, { pattern: DATE_PATTERN })
  const parsedDate = new Date(`${date}T00:00:00Z`)

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date
  ) {
    throw createContractError(field)
  }

  return date
}

function requireDateTime(value, field, { utc = false, offset = false } = {}) {
  const dateTime = requireString(value, field)

  if (
    Number.isNaN(Date.parse(dateTime)) ||
    (utc && !UTC_DATETIME_PATTERN.test(dateTime)) ||
    (offset && !OFFSET_DATETIME_PATTERN.test(dateTime))
  ) {
    throw createContractError(field)
  }

  return dateTime
}

function requirePublicImage(value, field) {
  const image = requireString(value, field)

  if (image.startsWith('/') && !image.startsWith('//')) {
    return image
  }

  let imageUrl

  try {
    imageUrl = new URL(image)
  } catch {
    throw createContractError(field)
  }

  if (
    !['http:', 'https:'].includes(imageUrl.protocol) ||
    imageUrl.username ||
    imageUrl.password
  ) {
    throw createContractError(field)
  }

  return image
}

function adaptClimateCondition(payload, field) {
  const condition = requireRecord(payload, field)

  return {
    codigoMeteorologico: requireNumber(
      condition.codigo_meteorologico,
      `${field}.codigo_meteorologico`,
      { integer: true },
    ),
    descricao: requireString(condition.descricao, `${field}.descricao`),
    icone: requireString(condition.icone, `${field}.icone`, {
      pattern: ICON_PATTERN,
    }),
  }
}

export function adaptLocal(payload, field = 'local') {
  const local = requireRecord(payload, field)
  const categoria = requireString(local.categoria, `${field}.categoria`)
  const categoriaLabel = LOCAL_CATEGORY_LABELS[categoria]

  if (!categoriaLabel) {
    throw createContractError(`${field}.categoria`)
  }

  return {
    id: requireNumber(local.id, `${field}.id`, { integer: true, min: 1 }),
    slug: requireString(local.slug, `${field}.slug`, {
      pattern: SLUG_PATTERN,
    }),
    nome: requireString(local.nome, `${field}.nome`),
    categoria,
    categoriaLabel,
    descricao: requireString(local.descricao, `${field}.descricao`),
    cidade: requireString(local.cidade, `${field}.cidade`),
    bairro: requireString(local.bairro, `${field}.bairro`),
    regiao: requireString(local.regiao, `${field}.regiao`),
    imagem: requirePublicImage(local.imagem, `${field}.imagem`),
    destaque: requireBoolean(local.destaque, `${field}.destaque`),
    latitude: requireNumber(local.latitude, `${field}.latitude`, {
      min: -90,
      max: 90,
    }),
    longitude: requireNumber(local.longitude, `${field}.longitude`, {
      min: -180,
      max: 180,
    }),
    nota: requireNullableNumber(local.nota_media, `${field}.nota_media`, {
      min: 1,
      max: 5,
    }),
    totalAvaliacoes: requireNumber(
      local.total_avaliacoes,
      `${field}.total_avaliacoes`,
      { integer: true, min: 0 },
    ),
  }
}

export function adaptPagination(payload, field = 'paginacao') {
  const pagination = requireRecord(payload, field)

  return {
    pagina: requireNumber(pagination.pagina, `${field}.pagina`, {
      integer: true,
      min: 1,
    }),
    porPagina: requireNumber(pagination.por_pagina, `${field}.por_pagina`, {
      integer: true,
      min: 1,
      max: 100,
    }),
    totalItens: requireNumber(
      pagination.total_itens,
      `${field}.total_itens`,
      { integer: true, min: 0 },
    ),
    totalPaginas: requireNumber(
      pagination.total_paginas,
      `${field}.total_paginas`,
      { integer: true, min: 0 },
    ),
  }
}

export function adaptLocaisResponse(payload) {
  const response = requireRecord(payload, 'resposta')
  const locais = requireArray(response.locais, 'locais').map((local, index) =>
    adaptLocal(local, `locais.${index}`),
  )

  return {
    locais,
    paginacao: adaptPagination(response.paginacao),
  }
}

export function adaptAvaliacao(payload, field = 'avaliacao') {
  const avaliacao = requireRecord(payload, field)

  return {
    id: requireNumber(avaliacao.id, `${field}.id`, {
      integer: true,
      min: 1,
    }),
    localId: requireNumber(avaliacao.local_id, `${field}.local_id`, {
      integer: true,
      min: 1,
    }),
    autor: requireString(avaliacao.autor, `${field}.autor`),
    nota: requireNumber(avaliacao.nota, `${field}.nota`, {
      integer: true,
      min: 1,
      max: 5,
    }),
    comentario: requireNullableString(
      avaliacao.comentario,
      `${field}.comentario`,
    ),
    data: requireDateTime(avaliacao.criado_em, `${field}.criado_em`, {
      utc: true,
    }),
  }
}

export function adaptAvaliacoesResponse(payload) {
  const response = requireRecord(payload, 'resposta')

  return {
    avaliacoes: requireArray(response.avaliacoes, 'avaliacoes').map(
      (avaliacao, index) => adaptAvaliacao(avaliacao, `avaliacoes.${index}`),
    ),
  }
}

function adaptCurrentWeather(payload) {
  const current = requireRecord(payload, 'atual')

  return {
    observadoEm: requireDateTime(current.observado_em, 'atual.observado_em', {
      offset: true,
    }),
    temperaturaC: requireNumber(current.temperatura_c, 'atual.temperatura_c'),
    sensacaoTermicaC: requireNumber(
      current.sensacao_termica_c,
      'atual.sensacao_termica_c',
    ),
    precipitacaoMm: requireNumber(
      current.precipitacao_mm,
      'atual.precipitacao_mm',
      { min: 0 },
    ),
    velocidadeVentoKmh: requireNumber(
      current.velocidade_vento_kmh,
      'atual.velocidade_vento_kmh',
      { min: 0 },
    ),
    ...adaptClimateCondition(current, 'atual'),
  }
}

function adaptDailyWeather(payload, index) {
  const field = `previsao.${index}`
  const daily = requireRecord(payload, field)

  return {
    data: requireDate(daily.data, `${field}.data`),
    temperaturaMaxC: requireNumber(
      daily.temperatura_max_c,
      `${field}.temperatura_max_c`,
    ),
    temperaturaMinC: requireNumber(
      daily.temperatura_min_c,
      `${field}.temperatura_min_c`,
    ),
    probabilidadePrecipitacaoMaxPct: requireNumber(
      daily.probabilidade_precipitacao_max_pct,
      `${field}.probabilidade_precipitacao_max_pct`,
      { min: 0, max: 100 },
    ),
    ...adaptClimateCondition(daily, field),
  }
}

export function adaptClimaResponse(payload) {
  const response = requireRecord(payload, 'resposta')
  const local = requireRecord(response.local, 'local')
  const timezone = requireString(response.timezone, 'timezone')

  if (timezone !== 'America/Sao_Paulo') {
    throw createContractError('timezone')
  }

  const rawForecast = requireArray(response.previsao, 'previsao')

  if (rawForecast.length !== 3) {
    throw createContractError('previsao')
  }

  const previsao = rawForecast.map(adaptDailyWeather)
  const forecastDates = previsao.map((item) => item.data)
  const sortedDates = [...forecastDates].sort()

  if (
    new Set(forecastDates).size !== forecastDates.length ||
    forecastDates.some((date, index) => date !== sortedDates[index])
  ) {
    throw createContractError('previsao')
  }

  const atualizadoEm = requireDateTime(
    response.atualizado_em,
    'atualizado_em',
    { utc: true },
  )
  const cache = requireRecord(response.cache, 'cache')
  const expiraEm = requireDateTime(cache.expira_em, 'cache.expira_em', {
    utc: true,
  })

  if (Date.parse(expiraEm) <= Date.parse(atualizadoEm)) {
    throw createContractError('cache.expira_em')
  }

  return {
    local: {
      slug: requireString(local.slug, 'local.slug', { pattern: SLUG_PATTERN }),
      nome: requireString(local.nome, 'local.nome'),
    },
    timezone,
    atual: adaptCurrentWeather(response.atual),
    previsao,
    atualizadoEm,
    cache: {
      utilizado: requireBoolean(cache.utilizado, 'cache.utilizado'),
      expiraEm,
    },
  }
}

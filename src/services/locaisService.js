import { adaptLocal, adaptLocaisResponse } from './apiAdapters.js'
import { ApiError, apiRequest } from './apiClient.js'

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const CATEGORIES = new Set(['praias', 'parques', 'museus', 'mirantes'])
const SORT_OPTIONS = new Set([
  'nome_asc',
  'nome_desc',
  'nota_media_desc',
  'total_avaliacoes_desc',
  'destaque_desc',
])
const REQUEST_ERROR_MESSAGE = 'Não foi possível preparar a consulta de locais.'

function createRequestError(field) {
  return new ApiError(REQUEST_ERROR_MESSAGE, {
    code: 'requisicao_cliente_invalida',
    details: [
      {
        campo: field,
        codigo: 'valor_invalido',
        mensagem: 'O valor informado para a consulta é inválido.',
      },
    ],
  })
}

function requireOptions(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw createRequestError('opcoes')
  }

  return options
}

function requireOptionalText(value, field) {
  if (value === undefined) {
    return undefined
  }

  if (typeof value !== 'string' || !value.trim()) {
    throw createRequestError(field)
  }

  return value.trim()
}

function requireInteger(value, field, { min, max } = {}) {
  if (
    !Number.isInteger(value) ||
    (min !== undefined && value < min) ||
    (max !== undefined && value > max)
  ) {
    throw createRequestError(field)
  }

  return value
}

function buildListPath(options) {
  const {
    cidade,
    categoria,
    destaque,
    pagina = 1,
    porPagina = 100,
    ordenarPor = 'nome_asc',
  } = requireOptions(options)
  const normalizedCity = requireOptionalText(cidade, 'cidade')

  if (categoria !== undefined && !CATEGORIES.has(categoria)) {
    throw createRequestError('categoria')
  }

  if (destaque !== undefined && typeof destaque !== 'boolean') {
    throw createRequestError('destaque')
  }

  requireInteger(pagina, 'pagina', { min: 1 })
  requireInteger(porPagina, 'porPagina', { min: 1, max: 100 })

  if (!SORT_OPTIONS.has(ordenarPor)) {
    throw createRequestError('ordenarPor')
  }

  const query = new URLSearchParams()

  if (normalizedCity !== undefined) {
    query.set('cidade', normalizedCity)
  }

  if (categoria !== undefined) {
    query.set('categoria', categoria)
  }

  if (destaque !== undefined) {
    query.set('destaque', String(destaque))
  }

  query.set('pagina', String(pagina))
  query.set('por_pagina', String(porPagina))
  query.set('ordenar_por', ordenarPor)

  return '/locais?' + query.toString()
}

function requireSlug(slug) {
  if (
    typeof slug !== 'string' ||
    slug.length > 120 ||
    !SLUG_PATTERN.test(slug)
  ) {
    throw createRequestError('slug')
  }

  return slug
}

export function createLocaisService({ request = apiRequest } = {}) {
  if (typeof request !== 'function') {
    throw createRequestError('request')
  }

  async function listLocais(options = {}) {
    const resolvedOptions = requireOptions(options)
    const payload = await request(buildListPath(resolvedOptions), {
      signal: resolvedOptions.signal,
    })

    return adaptLocaisResponse(payload)
  }

  async function findLocalBySlug(slug, options = {}) {
    const resolvedOptions = requireOptions(options)
    const normalizedSlug = requireSlug(slug)
    const payload = await request(
      '/locais/' + encodeURIComponent(normalizedSlug),
      { signal: resolvedOptions.signal },
    )

    return adaptLocal(payload)
  }

  return Object.freeze({
    listLocais,
    findLocalBySlug,
  })
}

const locaisService = createLocaisService()

export const { listLocais, findLocalBySlug } = locaisService

import { adaptClimaResponse } from './apiAdapters.js'
import { ApiError, apiRequest } from './apiClient.js'

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const REQUEST_ERROR_MESSAGE = 'Não foi possível preparar a consulta de clima.'

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

export function createClimaService({ request = apiRequest } = {}) {
  if (typeof request !== 'function') {
    throw createRequestError('request')
  }

  async function getClimaBySlug(slug, options = {}) {
    const resolvedOptions = requireOptions(options)
    const normalizedSlug = requireSlug(slug)
    const payload = await request(
      '/locais/' + encodeURIComponent(normalizedSlug) + '/clima',
      { signal: resolvedOptions.signal },
    )

    return adaptClimaResponse(payload)
  }

  return Object.freeze({ getClimaBySlug })
}

const climaService = createClimaService()

export const { getClimaBySlug } = climaService

import locais from '../data/locais.json'
import { simulateAsyncResult } from './serviceUtils'

export function listLocais(options = {}) {
  return simulateAsyncResult([...locais], options)
}

export function findLocalByIdOrSlug(identifier, options = {}) {
  const normalizedIdentifier =
    typeof identifier === 'string' ? identifier.toLowerCase() : identifier

  const local =
    locais.find((item) => item.id === Number(identifier)) ||
    locais.find((item) => item.slug.toLowerCase() === normalizedIdentifier)

  return simulateAsyncResult(local ?? null, options)
}

export function filterLocaisByCategoria(categoria, options = {}) {
  if (!categoria || categoria.toLowerCase() === 'todos') {
    return simulateAsyncResult([...locais], options)
  }

  const categoriaNormalizada = categoria.toLowerCase()
  const filtrados = locais.filter(
    (item) => item.categoria.toLowerCase() === categoriaNormalizada,
  )

  return simulateAsyncResult(filtrados, options)
}

export function readLocais(options = {}) {
  return listLocais(options)
}

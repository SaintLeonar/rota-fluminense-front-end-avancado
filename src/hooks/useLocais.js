import { useCallback, useEffect, useState } from 'react'

import { isRequestCanceled } from '../services/apiClient.js'
import { listLocais } from '../services/locaisService.js'

const ALL_CATEGORIES = 'todos'
const ALL_CATEGORIES_OPTION = Object.freeze({
  value: ALL_CATEGORIES,
  label: 'Todos',
})

function normalizeSearchValue(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}

export function useLocais() {
  const [locais, setLocais] = useState([])
  const [pagination, setPagination] = useState(null)
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES)
  const [requestVersion, setRequestVersion] = useState(0)

  const retry = useCallback(() => {
    setRequestVersion((currentVersion) => currentVersion + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    let isActive = true

    async function loadLocais() {
      setStatus('loading')
      setErrorMessage('')

      try {
        const { locais: data, paginacao } = await listLocais({
          signal: controller.signal,
        })

        if (!isActive) {
          return
        }

        setLocais(data)
        setPagination(paginacao)
        setStatus('success')
      } catch (error) {
        if (!isActive || isRequestCanceled(error)) {
          return
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar os dados no momento.',
        )
        setStatus('error')
      }
    }

    loadLocais()

    return () => {
      isActive = false
      controller.abort()
    }
  }, [requestVersion])

  const categoryLabels = new Map(
    locais.map((local) => [local.categoria, local.categoriaLabel]),
  )
  const categories = [
    ALL_CATEGORIES_OPTION,
    ...Array.from(categoryLabels, ([value, label]) => ({ value, label })),
  ]
  const normalizedSearch = normalizeSearchValue(searchTerm.trim())
  const visibleLocais = locais.filter((local) => {
    const matchesCategory =
      activeCategory === ALL_CATEGORIES || local.categoria === activeCategory

    if (!matchesCategory) {
      return false
    }

    if (!normalizedSearch) {
      return true
    }

    return [
      local.nome,
      local.cidade,
      local.bairro,
      local.regiao,
      local.categoria,
      local.categoriaLabel,
    ].some((value) => normalizeSearchValue(value).includes(normalizedSearch))
  })
  const hasLocais = locais.length > 0
  const hasActiveFilters =
    normalizedSearch.length > 0 || activeCategory !== ALL_CATEGORIES
  const resultCount = hasActiveFilters
    ? visibleLocais.length
    : (pagination?.totalItens ?? locais.length)

  return {
    locais,
    pagination,
    status,
    errorMessage,
    retry,
    searchTerm,
    setSearchTerm,
    activeCategory,
    setActiveCategory,
    categories,
    visibleLocais,
    hasLocais,
    hasActiveFilters,
    resultCount,
  }
}

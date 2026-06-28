import { useEffect, useState } from 'react'

import { listLocais } from '../services/locaisService'

export function useLocais() {
  const [locais, setLocais] = useState([])
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('Todos')

  useEffect(() => {
    let isMounted = true

    async function loadLocais() {
      setStatus('loading')
      setErrorMessage('')

      try {
        const data = await listLocais()

        if (!isMounted) {
          return
        }

        setLocais(data)
        setStatus('success')
      } catch (error) {
        if (!isMounted) {
          return
        }

        setErrorMessage(error.message)
        setStatus('error')
      }
    }

    loadLocais()

    return () => {
      isMounted = false
    }
  }, [])

  const categories = ['Todos', ...new Set(locais.map((local) => local.categoria))]
  const normalizedSearch = searchTerm.trim().toLowerCase()
  const visibleLocais = locais.filter((local) => {
    const matchesCategory =
      activeCategory === 'Todos' || local.categoria === activeCategory

    if (!matchesCategory) {
      return false
    }

    if (!normalizedSearch) {
      return true
    }

    return [local.nome, local.bairro, local.categoria, local.regiao].some((value) =>
      value.toLowerCase().includes(normalizedSearch),
    )
  })

  return {
    status,
    errorMessage,
    searchTerm,
    setSearchTerm,
    activeCategory,
    setActiveCategory,
    categories,
    visibleLocais,
  }
}

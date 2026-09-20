import { useCallback, useEffect, useState } from 'react'

import {
  isApiError,
  isRequestCanceled,
} from '../services/apiClient.js'
import { getClimaBySlug } from '../services/climaService.js'

function normalizeClimateError(error) {
  return {
    code: isApiError(error) ? error.code : 'erro_desconhecido',
    message:
      error instanceof Error
        ? error.message
        : 'Não foi possível carregar o clima no momento.',
    status: isApiError(error) ? error.status : null,
    requestId: isApiError(error) ? error.requestId : null,
  }
}

export function useClimaLocal(slug) {
  const [clima, setClima] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [requestVersion, setRequestVersion] = useState(0)

  const retry = useCallback(() => {
    setRequestVersion((currentVersion) => currentVersion + 1)
  }, [])

  useEffect(() => {

    const controller = new AbortController()
    let isActive = true

    async function loadClimate() {
      setClima(null)
      setStatus('loading')
      setError(null)

      try {
        const climateData = await getClimaBySlug(slug, {
          signal: controller.signal,
        })

        if (!isActive) {
          return
        }

        setClima(climateData)
        setStatus('success')
      } catch (requestError) {
        if (!isActive || isRequestCanceled(requestError)) {
          return
        }

        setClima(null)
        setError(normalizeClimateError(requestError))
        setStatus('error')
      }
    }

    loadClimate()

    return () => {
      isActive = false
      controller.abort()
    }
  }, [requestVersion, slug])

  return {
    clima,
    status,
    error,
    retry,
  }
}

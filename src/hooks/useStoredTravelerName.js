import { useState } from 'react'

const STORAGE_KEY = 'rota-fluminense-user-name'

function normalizeTravelerName(value) {
  return value.trim()
}

export function readStoredTravelerName() {
  if (typeof window === 'undefined') {
    return ''
  }

  const storedValue = window.localStorage.getItem(STORAGE_KEY)
  return storedValue ? normalizeTravelerName(storedValue) : ''
}

export function saveStoredTravelerName(value) {
  if (typeof window === 'undefined') {
    return
  }

  const normalizedValue = normalizeTravelerName(value)

  if (normalizedValue) {
    window.localStorage.setItem(STORAGE_KEY, normalizedValue)
    return
  }

  window.localStorage.removeItem(STORAGE_KEY)
}

export function clearStoredTravelerName() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(STORAGE_KEY)
}

export function useStoredTravelerName() {
  const [userName, setUserName] = useState(() => readStoredTravelerName())

  function persistUserName(value = userName) {
    const normalizedValue = normalizeTravelerName(value)
    saveStoredTravelerName(normalizedValue)
    setUserName(normalizedValue)
    return normalizedValue
  }

  function clearUserName() {
    clearStoredTravelerName()
    setUserName('')
  }

  return {
    userName,
    setUserName,
    persistUserName,
    clearUserName,
  }
}

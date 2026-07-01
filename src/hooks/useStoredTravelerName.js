import { useState } from 'react'

const STORAGE_KEY = 'rota-fluminense-user-name'
export const MAX_TRAVELER_NAME_LENGTH = 32

function sanitizeTravelerNameInput(value) {
  return value
    .replace(/[^\p{L}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('pt-BR')
    .replace(/(^|\s)(\p{L})/gu, (match, leading, letter) => (
      leading + letter.toLocaleUpperCase('pt-BR')
    ))
    .slice(0, MAX_TRAVELER_NAME_LENGTH)
}

function normalizeTravelerName(value) {
  return sanitizeTravelerNameInput(value).trim()
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

  function updateUserName(value) {
    setUserName(sanitizeTravelerNameInput(value))
  }

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
    setUserName: updateUserName,
    persistUserName,
    clearUserName,
  }
}

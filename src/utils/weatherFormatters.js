const decimalFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 1,
})

const observedAtFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
})

const forecastDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  timeZone: 'America/Sao_Paulo',
})

export function formatTemperature(value) {
  return `${decimalFormatter.format(value)} °C`
}

export function formatPrecipitation(value) {
  return `${decimalFormatter.format(value)} mm`
}

export function formatWindSpeed(value) {
  return `${decimalFormatter.format(value)} km/h`
}

export function formatObservedAt(value) {
  return observedAtFormatter.format(new Date(value))
}

export function formatUpdatedAt(value) {
  return observedAtFormatter.format(new Date(value))
}

export function formatForecastDate(value) {
  return forecastDateFormatter.format(new Date(`${value}T12:00:00Z`))
}

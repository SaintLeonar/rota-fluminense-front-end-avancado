import { getWeatherIconVariant } from '../utils/weatherPresentation.js'
import styles from './WeatherIcon.module.css'

function Sun() {
  return (
    <>
      <circle cx="24" cy="24" r="7" />
      <path d="M24 5v5M24 38v5M5 24h5M38 24h5M10.6 10.6l3.6 3.6M33.8 33.8l3.6 3.6M37.4 10.6l-3.6 3.6M14.2 33.8l-3.6 3.6" />
    </>
  )
}

function Cloud({ offset = 0 }) {
  return (
    <path
      d={`M${9 + offset} 30h24a7 7 0 0 0 .5-14A11 11 0 0 0 12 18.5 6 6 0 0 0 ${9 + offset} 30Z`}
    />
  )
}

function WeatherGlyph({ variant }) {
  if (variant === 'clear') {
    return <Sun />
  }

  if (variant === 'partly-cloudy') {
    return (
      <>
        <circle cx="17" cy="17" r="6" />
        <path d="M17 5v4M5 17h4M8.5 8.5l2.8 2.8M25.5 8.5l-2.8 2.8" />
        <Cloud offset={2} />
      </>
    )
  }

  if (variant === 'fog') {
    return (
      <>
        <Cloud />
        <path d="M10 35h26M14 40h22" />
      </>
    )
  }

  if (variant === 'drizzle') {
    return (
      <>
        <Cloud />
        <path d="M16 35v2M24 35v2M32 35v2" />
      </>
    )
  }

  if (variant === 'rain' || variant === 'showers') {
    return (
      <>
        {variant === 'showers' ? <path d="M12 11h6M15 8v6" /> : null}
        <Cloud />
        <path d="m16 35-2 4M25 35l-2 4M34 35l-2 4" />
      </>
    )
  }

  if (variant === 'freezing-rain') {
    return (
      <>
        <Cloud />
        <path d="m16 35-2 4M31 35l-2 4M23 37h4M25 35v4M23.5 35.5l3 3M26.5 35.5l-3 3" />
      </>
    )
  }

  if (variant === 'snow') {
    return (
      <>
        <Cloud />
        <path d="M16 35v6M13.5 36.5l5 3M18.5 36.5l-5 3M32 35v6M29.5 36.5l5 3M34.5 36.5l-5 3" />
      </>
    )
  }

  if (variant === 'storm') {
    return (
      <>
        <Cloud />
        <path className={styles.lightning} d="m25 33-5 8h5l-2 5 8-10h-5l2-3Z" />
      </>
    )
  }

  if (variant === 'cloudy') {
    return <Cloud />
  }

  return (
    <>
      <circle cx="24" cy="24" r="17" />
      <path d="M19.5 18a5 5 0 0 1 9 3c0 4-4.5 4-4.5 8M24 35h.01" />
    </>
  )
}

export default function WeatherIcon({ iconKey, label, size = 'medium' }) {
  const variant = getWeatherIconVariant(iconKey)
  const accessibleLabel =
    variant === 'unknown'
      ? `${label || 'Condição meteorológica'}; ícone genérico`
      : label || 'Condição meteorológica'

  return (
    <span
      className={[styles.weatherIcon, styles[size]].filter(Boolean).join(' ')}
      role="img"
      aria-label={accessibleLabel}
      data-weather-icon={variant}
    >
      <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <WeatherGlyph variant={variant} />
      </svg>
    </span>
  )
}

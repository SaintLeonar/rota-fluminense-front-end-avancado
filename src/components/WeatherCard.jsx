import { useId } from 'react'

import { useClimaLocal } from '../hooks/useClimaLocal.js'
import {
  formatForecastDate,
  formatObservedAt,
  formatPrecipitation,
  formatTemperature,
  formatUpdatedAt,
  formatWindSpeed,
} from '../utils/weatherFormatters.js'
import { getClimateErrorPresentation } from '../utils/weatherPresentation.js'
import FeedbackAlert from './FeedbackAlert.jsx'
import LoadingState from './LoadingState.jsx'
import SecondaryButton from './SecondaryButton.jsx'
import WeatherIcon from './WeatherIcon.jsx'
import styles from './WeatherCard.module.css'

function CurrentMetric({ label, value }) {
  return (
    <div className={styles.currentMetric}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function ForecastDay({ forecast }) {
  return (
    <li className={styles.forecastDay}>
      <div className={styles.forecastHeading}>
        <p className={styles.forecastDate}>{formatForecastDate(forecast.data)}</p>
        <WeatherIcon
          iconKey={forecast.icone}
          label={forecast.descricao}
          size="small"
        />
      </div>
      <p className={styles.forecastCondition}>{forecast.descricao}</p>
      <dl className={styles.forecastMetrics}>
        <div>
          <dt>Mín.</dt>
          <dd>{formatTemperature(forecast.temperaturaMinC)}</dd>
        </div>
        <div>
          <dt>Máx.</dt>
          <dd>{formatTemperature(forecast.temperaturaMaxC)}</dd>
        </div>
        <div>
          <dt>Chuva</dt>
          <dd>{forecast.probabilidadePrecipitacaoMaxPct}%</dd>
        </div>
      </dl>
    </li>
  )
}

export default function WeatherCard({ slug }) {
  const titleId = useId()
  const { clima, status, error, retry } = useClimaLocal(slug)

  if (status === 'loading' || status === 'idle') {
    return (
      <div className={styles.stateContainer}>
        <LoadingState
          title="Carregando clima"
          description="Consultando as condições atuais e a previsão dos próximos dias."
        />
      </div>
    )
  }

  if (status === 'error') {
    const errorPresentation = getClimateErrorPresentation(error?.code)

    return (
      <div className={styles.stateContainer}>
        <FeedbackAlert
          variant="error"
          title={errorPresentation.title}
          message={errorPresentation.message}
        />
        {errorPresentation.canRetry ? (
          <SecondaryButton className={styles.retryButton} onClick={retry}>
            Tentar novamente
          </SecondaryButton>
        ) : null}
      </div>
    )
  }

  if (status !== 'success' || !clima) {
    return null
  }

  return (
    <section className={styles.weatherCard} aria-labelledby={titleId}>
      <div className={styles.currentWeather}>
        <div className={styles.currentHeading}>
          <div>
            <p className={styles.eyebrow}>Clima agora</p>
            <h2 id={titleId}>{clima.atual.descricao}</h2>
          </div>
          <div className={styles.currentVisual}>
            <WeatherIcon
              iconKey={clima.atual.icone}
              label={clima.atual.descricao}
              size="large"
            />
            <p className={styles.currentTemperature}>
              {formatTemperature(clima.atual.temperaturaC)}
            </p>
          </div>
        </div>

        <dl className={styles.currentMetrics}>
          <CurrentMetric
            label="Sensação térmica"
            value={formatTemperature(clima.atual.sensacaoTermicaC)}
          />
          <CurrentMetric
            label="Precipitação"
            value={formatPrecipitation(clima.atual.precipitacaoMm)}
          />
          <CurrentMetric
            label="Vento"
            value={formatWindSpeed(clima.atual.velocidadeVentoKmh)}
          />
        </dl>

        <p className={styles.observedAt}>
          Observado em {formatObservedAt(clima.atual.observadoEm)}
        </p>
      </div>

      <div className={styles.forecast}>
        <h3>Próximos três dias</h3>
        <ul className={styles.forecastList}>
          {clima.previsao.map((forecast) => (
            <ForecastDay key={forecast.data} forecast={forecast} />
          ))}
        </ul>
      </div>

      <footer className={styles.weatherFooter}>
        <div className={styles.weatherMetadata}>
          <p>
            Dados atualizados em{' '}
            <time dateTime={clima.atualizadoEm}>
              {formatUpdatedAt(clima.atualizadoEm)}
            </time>
          </p>
          <p>
            {clima.cache.utilizado
              ? 'Resposta fornecida pelo cache válido da API.'
              : 'Resposta obtida em consulta meteorológica recente.'}
          </p>
        </div>

        <p className={styles.attribution}>
          Dados meteorológicos por{' '}
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noreferrer"
          >
            Open-Meteo.com
          </a>
        </p>
      </footer>
    </section>
  )
}

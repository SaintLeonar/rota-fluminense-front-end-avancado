import { describe, expect, it } from 'vitest'

import {
  calculateReviewAggregates,
  mergeReviewNewestFirst,
} from './reviewState.js'
import {
  formatForecastDate,
  formatObservedAt,
  formatPrecipitation,
  formatTemperature,
  formatWindSpeed,
} from './weatherFormatters.js'
import {
  getClimateErrorPresentation,
  getWeatherIconVariant,
  WEATHER_ICON_VARIANTS,
} from './weatherPresentation.js'
import { makeReview } from '../test/fixtures.js'

describe('estado de avaliações', () => {
  it('insere, deduplica e ordena da mais recente para a mais antiga', () => {
    const reviews = [
      makeReview({ id: 1, data: '2026-09-18T10:00:00Z' }),
      makeReview({ id: 2, data: '2026-09-19T10:00:00Z' }),
    ]
    const created = makeReview({ id: 1, data: '2026-09-20T10:00:00Z' })

    expect(mergeReviewNewestFirst(reviews, created).map((review) => review.id))
      .toEqual([1, 2])
  })

  it('calcula total, média nula e arredondamento bancário em uma casa', () => {
    expect(calculateReviewAggregates([])).toEqual({
      totalReviews: 0,
      averageRating: null,
    })
    expect(
      calculateReviewAggregates([
        makeReview({ nota: 4 }),
        makeReview({ id: 11, nota: 5 }),
      ]),
    ).toEqual({ totalReviews: 2, averageRating: 4.5 })
    expect(
      calculateReviewAggregates([
        makeReview({ nota: 4 }),
        makeReview({ id: 11, nota: 5 }),
        makeReview({ id: 12, nota: 5 }),
        makeReview({ id: 13, nota: 4 }),
      ]).averageRating,
    ).toBe(4.5)
  })
})

describe('apresentação climática', () => {
  it('mapeia todas as chaves conhecidas e usa fallback desconhecido', () => {
    expect(Object.keys(WEATHER_ICON_VARIANTS)).toHaveLength(29)
    expect(getWeatherIconVariant('ceu_limpo')).toBe('clear')
    expect(getWeatherIconVariant('tempestade_com_granizo_forte')).toBe('storm')
    expect(getWeatherIconVariant('nova_condicao')).toBe('unknown')
  })

  it('distingue erros repetíveis de coordenadas permanentes', () => {
    expect(getClimateErrorPresentation('coordenadas_indisponiveis'))
      .toMatchObject({ canRetry: false })
    expect(getClimateErrorPresentation('clima_indisponivel'))
      .toMatchObject({ canRetry: true })
    expect(getClimateErrorPresentation('codigo_novo'))
      .toMatchObject({ canRetry: true })
  })

  it('formata números e datas em pt-BR e America/Sao_Paulo', () => {
    expect(formatTemperature(23.5)).toBe('23,5 °C')
    expect(formatPrecipitation(1.2)).toBe('1,2 mm')
    expect(formatWindSpeed(15.4)).toBe('15,4 km/h')
    expect(formatObservedAt('2026-09-20T15:30:00Z')).toContain('12:30')
    expect(formatForecastDate('2026-09-21')).toMatch(/21 de set\./)
  })
})

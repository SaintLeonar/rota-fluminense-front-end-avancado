import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import WeatherCard from './WeatherCard.jsx'
import WeatherIcon from './WeatherIcon.jsx'
import { useClimaLocal } from '../hooks/useClimaLocal.js'
import { makeClimate } from '../test/fixtures.js'

vi.mock('../hooks/useClimaLocal.js', () => ({
  useClimaLocal: vi.fn(),
}))

describe('WeatherCard', () => {
  beforeEach(() => {
    useClimaLocal.mockReturnValue({
      clima: null,
      status: 'loading',
      error: null,
      retry: vi.fn(),
    })
  })

  it('apresenta carregamento independente', () => {
    render(<WeatherCard slug="arpoador" />)
    expect(screen.getByRole('status')).toHaveTextContent('Carregando clima')
  })

  it('apresenta erro repetível e aciona nova tentativa', async () => {
    const retry = vi.fn()
    useClimaLocal.mockReturnValue({
      clima: null,
      status: 'error',
      error: { code: 'clima_indisponivel' },
      retry,
    })
    const user = userEvent.setup()
    render(<WeatherCard slug="arpoador" />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Serviço de clima temporariamente indisponível',
    )
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(retry).toHaveBeenCalledOnce()
  })

  it('não oferece repetição para coordenadas ausentes', () => {
    useClimaLocal.mockReturnValue({
      clima: null,
      status: 'error',
      error: { code: 'coordenadas_indisponiveis' },
      retry: vi.fn(),
    })
    render(<WeatherCard slug="arpoador" />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Clima indisponível para este local',
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renderiza condição, três dias, cache e atribuição protegida', () => {
    useClimaLocal.mockReturnValue({
      clima: makeClimate({
        cache: {
          utilizado: true,
          expiraEm: '2026-09-20T12:31:00Z',
        },
      }),
      status: 'success',
      error: null,
      retry: vi.fn(),
    })
    render(<WeatherCard slug="arpoador" />)

    expect(screen.getByRole('heading', { name: 'Predominantemente limpo' }))
      .toBeInTheDocument()
    expect(screen.getByText('24,5 °C')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByText(/cache válido da API/i)).toBeInTheDocument()
    const attribution = screen.getByRole('link', { name: 'Open-Meteo.com' })
    expect(attribution).toHaveAttribute('href', 'https://open-meteo.com/')
    expect(attribution).toHaveAttribute('target', '_blank')
    expect(attribution).toHaveAttribute('rel', 'noreferrer')
  })

  it('usa ícone genérico acessível para chave desconhecida', () => {
    render(<WeatherIcon iconKey="condicao_nova" label="Condição nova" />)

    const icon = screen.getByRole('img', {
      name: 'Condição nova; ícone genérico',
    })
    expect(icon).toHaveAttribute('data-weather-icon', 'unknown')
  })
})

import { describe, expect, it } from 'vitest'

import { ApiError } from './apiClient.js'
import {
  adaptAvaliacao,
  adaptAvaliacoesResponse,
  adaptClimaResponse,
  adaptLocal,
  adaptLocaisResponse,
  adaptPagination,
} from './apiAdapters.js'
import {
  makeRawClimate,
  makeRawLocal,
  makeRawReview,
} from '../test/fixtures.js'

function expectContractError(callback, field) {
  let error

  try {
    callback()
  } catch (caught) {
    error = caught
  }

  expect(error).toBeInstanceOf(ApiError)
  expect(error).toMatchObject({ code: 'resposta_api_invalida' })
  expect(error.details[0]).toMatchObject({ campo: field })
}

describe('adaptadores da API', () => {
  it('adapta local e aceita média nula', () => {
    const local = adaptLocal(makeRawLocal({ nota_media: null }))

    expect(local).toMatchObject({
      id: 1,
      slug: 'arpoador',
      categoria: 'praias',
      categoriaLabel: 'Praias',
      nota: null,
      totalAvaliacoes: 2,
    })
    expect(local).not.toHaveProperty('nota_media')
  })

  it.each([
    ['id', { id: 0 }, 'local.id'],
    ['slug', { slug: 'Arpoador' }, 'local.slug'],
    ['categoria', { categoria: 'trilhas' }, 'local.categoria'],
    ['imagem', { imagem: 'javascript:alert(1)' }, 'local.imagem'],
    ['latitude', { latitude: -91 }, 'local.latitude'],
    ['nota', { nota_media: 6 }, 'local.nota_media'],
  ])('rejeita campo inválido do local: %s', (_label, override, field) => {
    expectContractError(() => adaptLocal(makeRawLocal(override)), field)
  })

  it('adapta envelope paginado e rejeita envelope incompleto', () => {
    const response = adaptLocaisResponse({
      locais: [makeRawLocal()],
      paginacao: {
        pagina: 1,
        por_pagina: 20,
        total_itens: 1,
        total_paginas: 1,
      },
    })

    expect(response.locais).toHaveLength(1)
    expect(response.paginacao).toEqual({
      pagina: 1,
      porPagina: 20,
      totalItens: 1,
      totalPaginas: 1,
    })
    expectContractError(
      () => adaptLocaisResponse({ locais: [] }),
      'paginacao',
    )
  })

  it('valida limites de paginação', () => {
    expectContractError(
      () =>
        adaptPagination({
          pagina: 1,
          por_pagina: 101,
          total_itens: 0,
          total_paginas: 0,
        }),
      'paginacao.por_pagina',
    )
  })

  it('adapta avaliação com comentário nulo e lista envelopada', () => {
    const review = adaptAvaliacao(makeRawReview({ comentario: null }))

    expect(review).toEqual({
      id: 10,
      localId: 1,
      autor: 'Ana',
      nota: 5,
      comentario: null,
      data: '2026-09-20T12:00:00Z',
    })
    expect(adaptAvaliacoesResponse({ avaliacoes: [makeRawReview()] }).avaliacoes)
      .toHaveLength(1)
  })

  it.each([
    [{ nota: 0 }, 'avaliacao.nota'],
    [{ comentario: '' }, 'avaliacao.comentario'],
    [{ criado_em: '2026-09-20T12:00:00-03:00' }, 'avaliacao.criado_em'],
  ])('rejeita avaliação incompatível', (override, field) => {
    expectContractError(() => adaptAvaliacao(makeRawReview(override)), field)
  })

  it('adapta clima completo e preserva metadados de cache', () => {
    const climate = adaptClimaResponse(makeRawClimate())

    expect(climate).toMatchObject({
      local: { slug: 'arpoador', nome: 'Arpoador' },
      timezone: 'America/Sao_Paulo',
      atualizadoEm: '2026-09-20T12:01:00Z',
      cache: {
        utilizado: false,
        expiraEm: '2026-09-20T12:31:00Z',
      },
    })
    expect(climate.atual).toMatchObject({
      temperaturaC: 24.5,
      icone: 'predominantemente_limpo',
    })
    expect(climate.previsao).toHaveLength(3)
  })

  it('rejeita timezone, quantidade e ordem de previsão inválidos', () => {
    expectContractError(
      () => adaptClimaResponse(makeRawClimate({ timezone: 'UTC' })),
      'timezone',
    )
    expectContractError(
      () => adaptClimaResponse(makeRawClimate({ previsao: [] })),
      'previsao',
    )
    const reversed = [...makeRawClimate().previsao].reverse()
    expectContractError(
      () => adaptClimaResponse(makeRawClimate({ previsao: reversed })),
      'previsao',
    )
  })

  it('rejeita datas, percentuais e cache expirado', () => {
    const invalidDate = makeRawClimate()
    invalidDate.previsao[0].data = '2026-02-30'
    expectContractError(() => adaptClimaResponse(invalidDate), 'previsao.0.data')

    const invalidRain = makeRawClimate()
    invalidRain.previsao[0].probabilidade_precipitacao_max_pct = 101
    expectContractError(
      () => adaptClimaResponse(invalidRain),
      'previsao.0.probabilidade_precipitacao_max_pct',
    )

    const expired = makeRawClimate({
      cache: { utilizado: true, expira_em: '2026-09-20T12:00:00Z' },
    })
    expectContractError(
      () => adaptClimaResponse(expired),
      'cache.expira_em',
    )
  })
})

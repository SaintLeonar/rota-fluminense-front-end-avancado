import { describe, expect, it, vi } from 'vitest'

import { createAvaliacoesService } from './avaliacoesService.js'
import { createClimaService } from './climaService.js'
import { createLocaisService } from './locaisService.js'
import {
  makeRawClimate,
  makeRawLocal,
  makeRawReview,
} from '../test/fixtures.js'

function pagination(total = 1) {
  return {
    pagina: 1,
    por_pagina: 100,
    total_itens: total,
    total_paginas: total > 0 ? 1 : 0,
  }
}

describe('locaisService', () => {
  it('compõe filtros, paginação e ordenação e adapta o envelope', async () => {
    const request = vi.fn().mockResolvedValue({
      locais: [makeRawLocal()],
      paginacao: pagination(),
    })
    const signal = new AbortController().signal
    const service = createLocaisService({ request })

    const result = await service.listLocais({
      cidade: ' Rio de Janeiro ',
      categoria: 'praias',
      destaque: true,
      pagina: 1,
      porPagina: 100,
      ordenarPor: 'nota_media_desc',
      signal,
    })

    expect(request).toHaveBeenCalledWith(
      '/locais?cidade=Rio+de+Janeiro&categoria=praias&destaque=true&pagina=1&por_pagina=100&ordenar_por=nota_media_desc',
      { signal },
    )
    expect(result.locais[0]).toMatchObject({ slug: 'arpoador', nota: 4.5 })
  })

  it('usa parâmetros padrão na listagem', async () => {
    const request = vi.fn().mockResolvedValue({
      locais: [],
      paginacao: pagination(0),
    })
    const service = createLocaisService({ request })

    await service.listLocais()

    expect(request).toHaveBeenCalledWith(
      '/locais?pagina=1&por_pagina=100&ordenar_por=nome_asc',
      { signal: undefined },
    )
  })

  it('consulta detalhe exclusivamente pelo slug', async () => {
    const request = vi.fn().mockResolvedValue(makeRawLocal())
    const service = createLocaisService({ request })

    await expect(service.findLocalBySlug('arpoador')).resolves.toMatchObject({
      slug: 'arpoador',
    })
    expect(request).toHaveBeenCalledWith('/locais/arpoador', {
      signal: undefined,
    })
  })

  it.each([
    ['categoria', { categoria: 'trilhas' }],
    ['página', { pagina: 0 }],
    ['por página', { porPagina: 101 }],
    ['ordenação', { ordenarPor: 'aleatoria' }],
    ['destaque', { destaque: 'true' }],
    ['cidade', { cidade: ' ' }],
  ])('rejeita parâmetro inválido: %s', async (_label, options) => {
    const request = vi.fn()
    const service = createLocaisService({ request })

    await expect(service.listLocais(options)).rejects.toMatchObject({
      code: 'requisicao_cliente_invalida',
    })
    expect(request).not.toHaveBeenCalled()
  })

  it('aceita slug público composto apenas por dígitos', async () => {
    const request = vi.fn().mockResolvedValue(makeRawLocal({ slug: '1' }))
    const service = createLocaisService({ request })

    await expect(service.findLocalBySlug('1')).resolves.toMatchObject({ slug: '1' })
    expect(request).toHaveBeenCalledWith('/locais/1', { signal: undefined })
  })

  it.each(['Arpoador', '../arpoador', ''])(
    'rejeita slug não canônico: %s',
    async (slug) => {
      const service = createLocaisService({ request: vi.fn() })
      await expect(service.findLocalBySlug(slug)).rejects.toMatchObject({
        code: 'requisicao_cliente_invalida',
      })
    },
  )
})

describe('avaliacoesService', () => {
  it('lista avaliações pelo slug e adapta o envelope', async () => {
    const request = vi.fn().mockResolvedValue({ avaliacoes: [makeRawReview()] })
    const service = createAvaliacoesService({ request })

    const reviews = await service.listAvaliacoesBySlug('arpoador')

    expect(request).toHaveBeenCalledWith('/locais/arpoador/avaliacoes', {
      signal: undefined,
    })
    expect(reviews[0]).toMatchObject({ autor: 'Ana', localId: 1 })
  })

  it('normaliza e envia somente os campos aceitos', async () => {
    const request = vi.fn().mockResolvedValue(makeRawReview())
    const service = createAvaliacoesService({ request })
    const signal = new AbortController().signal

    await service.createAvaliacao(
      'arpoador',
      { autor: ' Ana ', nota: 5, comentario: ' Excelente ' },
      { signal },
    )

    expect(request).toHaveBeenCalledWith('/locais/arpoador/avaliacoes', {
      method: 'POST',
      body: { autor: 'Ana', nota: 5, comentario: 'Excelente' },
      signal,
    })
  })

  it('converte comentário ausente em null', async () => {
    const request = vi.fn().mockResolvedValue(makeRawReview({ comentario: null }))
    const service = createAvaliacoesService({ request })

    await service.createAvaliacao('arpoador', { autor: 'Ana', nota: 4 })

    expect(request.mock.calls[0][1].body.comentario).toBeNull()
  })

  it.each([
    [{ autor: '', nota: 5 }, 'autor'],
    [{ autor: 'Ana', nota: 6 }, 'nota'],
    [{ autor: 'Ana', nota: 5, comentario: '' }, 'comentario'],
    [{ autor: 'Ana', nota: 5, extra: true }, 'extra'],
  ])('rejeita payload inválido antes da rede', async (payload, field) => {
    const request = vi.fn()
    const service = createAvaliacoesService({ request })
    const error = await service
      .createAvaliacao('arpoador', payload)
      .catch((caught) => caught)

    expect(error).toMatchObject({ code: 'requisicao_cliente_invalida' })
    expect(error.details[0].campo).toBe(field)
    expect(request).not.toHaveBeenCalled()
  })
})

describe('climaService', () => {
  it('consulta o endpoint climático e adapta o contrato', async () => {
    const request = vi.fn().mockResolvedValue(makeRawClimate())
    const service = createClimaService({ request })
    const signal = new AbortController().signal

    const climate = await service.getClimaBySlug('arpoador', { signal })

    expect(request).toHaveBeenCalledWith('/locais/arpoador/clima', { signal })
    expect(climate).toMatchObject({
      timezone: 'America/Sao_Paulo',
      local: { slug: 'arpoador' },
    })
    expect(climate.previsao).toHaveLength(3)
  })

  it('rejeita slug e opções inválidos antes da rede', async () => {
    const request = vi.fn()
    const service = createClimaService({ request })

    await expect(service.getClimaBySlug('Arpoador')).rejects.toMatchObject({
      code: 'requisicao_cliente_invalida',
    })
    await expect(
      service.getClimaBySlug('arpoador', null),
    ).rejects.toMatchObject({ code: 'requisicao_cliente_invalida' })
    expect(request).not.toHaveBeenCalled()
  })
})

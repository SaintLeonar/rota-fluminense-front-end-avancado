import avaliacoes from '../data/avaliacoes.json'
import { simulateAsyncResult } from './serviceUtils'

const avaliacoesStore = [...avaliacoes]

export function listAvaliacoesByLocal(localId, options = {}) {
  const filtradas = avaliacoesStore.filter(
    (avaliacao) => avaliacao.localId === Number(localId),
  )

  return simulateAsyncResult(filtradas, options)
}

export function createAvaliacao(payload, options = {}) {
  const novoId =
    avaliacoesStore.length > 0
      ? Math.max(...avaliacoesStore.map((avaliacao) => avaliacao.id)) + 1
      : 1

  const novaAvaliacao = {
    id: novoId,
    localId: Number(payload.localId),
    autor: payload.autor,
    assinatura: payload.assinatura,
    data: payload.data ?? new Date().toISOString().slice(0, 10),
    nota: Number(payload.nota),
    comentario: payload.comentario ?? '',
  }

  return simulateAsyncResult(novaAvaliacao, options).then((avaliacaoCriada) => {
    avaliacoesStore.unshift(avaliacaoCriada)
    return avaliacaoCriada
  })
}

export function readAvaliacoes(options = {}) {
  return simulateAsyncResult([...avaliacoesStore], options)
}

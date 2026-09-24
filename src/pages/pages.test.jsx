import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import DetalheLocal from './DetalheLocal.jsx'
import Locais from './Locais.jsx'
import { useDetalheLocal } from '../hooks/useDetalheLocal.js'
import { useLocais } from '../hooks/useLocais.js'
import { makeLocal, makeReview } from '../test/fixtures.js'

vi.mock('../hooks/useLocais.js', () => ({
  useLocais: vi.fn(),
}))

vi.mock('../hooks/useDetalheLocal.js', () => ({
  useDetalheLocal: vi.fn(),
}))

vi.mock('../components/WeatherCard.jsx', () => ({
  default: ({ slug }) => (
    <section aria-label="Clima isolado">
      Clima indisponível para {slug}
    </section>
  ),
}))

function locaisState(overrides = {}) {
  return {
    status: 'success',
    errorMessage: '',
    retry: vi.fn(),
    searchTerm: '',
    setSearchTerm: vi.fn(),
    activeCategory: 'todos',
    setActiveCategory: vi.fn(),
    categories: [
      { value: 'todos', label: 'Todos' },
      { value: 'praias', label: 'Praias' },
    ],
    visibleLocais: [makeLocal()],
    hasLocais: true,
    hasActiveFilters: false,
    resultCount: 1,
    ...overrides,
  }
}

function detalheState(overrides = {}) {
  return {
    local: makeLocal(),
    avaliacoes: [makeReview()],
    status: 'success',
    errorMessage: '',
    retryDetail: vi.fn(),
    reviewsStatus: 'success',
    reviewsErrorMessage: '',
    retryReviews: vi.fn(),
    isFormOpen: false,
    reviewValues: { autor: 'Ana', nota: 5, comentario: '' },
    isSubmittingReview: false,
    reviewFieldErrors: {},
    submitFeedback: null,
    editingReviewId: null,
    editReviewValues: null,
    editReviewFieldErrors: {},
    deleteConfirmationId: null,
    reviewMutation: null,
    reviewMutationFeedback: null,
    isReviewMutationPending: false,
    totalReviews: 2,
    averageRating: 4.5,
    handleReviewChange: vi.fn(),
    handleOpenReviewForm: vi.fn(),
    handleCancelReviewForm: vi.fn(),
    handleReviewSubmit: vi.fn(),
    handleStartReviewEdit: vi.fn(),
    handleEditReviewChange: vi.fn(),
    handleCancelReviewEdit: vi.fn(),
    handleReviewUpdateSubmit: vi.fn(),
    handleRequestReviewDelete: vi.fn(),
    handleCancelReviewDelete: vi.fn(),
    handleConfirmReviewDelete: vi.fn(),
    ...overrides,
  }
}

describe('página de locais', () => {
  beforeEach(() => {
    useLocais.mockReturnValue(locaisState())
  })

  it('renderiza resumo e navega pelo slug do cartão', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/locais']}>
        <Routes>
          <Route path="/locais" element={<Locais />} />
          <Route path="/locais/:slug" element={<p>Destino aberto</p>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '1 lugar para explorar' }))
      .toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Arpoador/i }))
    expect(screen.getByText('Destino aberto')).toBeInTheDocument()
  })

  it('encaminha busca e categoria pelos controles acessíveis', async () => {
    const setSearchTerm = vi.fn()
    const setActiveCategory = vi.fn()
    useLocais.mockReturnValue(locaisState({ setSearchTerm, setActiveCategory }))
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Locais />
      </MemoryRouter>,
    )

    await user.type(
      screen.getByRole('searchbox', {
        name: 'Buscar por nome, bairro ou categoria',
      }),
      'museu',
    )
    await user.click(screen.getByRole('button', { name: 'Filtrar por Praias' }))

    expect(setSearchTerm).toHaveBeenCalled()
    expect(setActiveCategory).toHaveBeenCalledWith('praias')
  })

  it('distingue coleção vazia de filtro sem resultado', () => {
    useLocais.mockReturnValue(
      locaisState({
        visibleLocais: [],
        hasLocais: false,
        resultCount: 0,
      }),
    )
    const { rerender } = render(
      <MemoryRouter>
        <Locais />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Nenhum local disponível' }))
      .toBeInTheDocument()

    useLocais.mockReturnValue(
      locaisState({
        visibleLocais: [],
        hasActiveFilters: true,
        resultCount: 0,
      }),
    )
    rerender(
      <MemoryRouter>
        <Locais />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', {
        name: 'Nenhum resultado para estes filtros',
      }),
    ).toBeInTheDocument()
  })
})

describe('página de detalhe', () => {
  beforeEach(() => {
    useDetalheLocal.mockReturnValue(detalheState())
  })

  it('apresenta slug inexistente sem renderizar detalhe', () => {
    useDetalheLocal.mockReturnValue(
      detalheState({ local: null, status: 'not-found', avaliacoes: [] }),
    )
    render(
      <MemoryRouter initialEntries={['/locais/local-inexistente']}>
        <Routes>
          <Route path="/locais/:slug" element={<DetalheLocal />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Local não encontrado' }))
      .toBeInTheDocument()
    expect(screen.getByText('local-inexistente')).toBeInTheDocument()
  })

  it('mantém detalhe e avaliações quando o clima isolado falha', () => {
    render(
      <MemoryRouter initialEntries={['/locais/arpoador']}>
        <Routes>
          <Route path="/locais/:slug" element={<DetalheLocal />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Arpoador' })).toBeInTheDocument()
    expect(screen.getByText('Vista inesquecível.')).toBeInTheDocument()
    expect(screen.getByLabelText('Clima isolado')).toHaveTextContent(
      'Clima indisponível para arpoador',
    )
  })

  it('mantém avaliações durante falha de recarga e repete isoladamente', async () => {
    const retryReviews = vi.fn()
    useDetalheLocal.mockReturnValue(
      detalheState({
        reviewsStatus: 'error',
        reviewsErrorMessage: 'Falha nas avaliações',
        retryReviews,
      }),
    )
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/locais/arpoador']}>
        <Routes>
          <Route path="/locais/:slug" element={<DetalheLocal />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Vista inesquecível.')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Falha nas avaliações')
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(retryReviews).toHaveBeenCalledOnce()
  })

  it('encaminha edição e pedido de exclusão pelo identificador da avaliação', async () => {
    const handleStartReviewEdit = vi.fn()
    const handleRequestReviewDelete = vi.fn()
    useDetalheLocal.mockReturnValue(
      detalheState({
        handleStartReviewEdit,
        handleRequestReviewDelete,
      }),
    )
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/locais/arpoador']}>
        <Routes>
          <Route path="/locais/:slug" element={<DetalheLocal />} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(
      screen.getByRole('button', { name: 'Editar avaliação de Ana' }),
    )
    await user.click(
      screen.getByRole('button', { name: 'Excluir avaliação de Ana' }),
    )

    expect(handleStartReviewEdit).toHaveBeenCalledWith(10)
    expect(handleRequestReviewDelete).toHaveBeenCalledWith(10)
  })

  it('renderiza o formulário de edição com valores atuais', () => {
    useDetalheLocal.mockReturnValue(
      detalheState({
        editingReviewId: 10,
        editReviewValues: {
          autor: 'Ana',
          nota: 5,
          comentario: 'Vista inesquecível.',
        },
      }),
    )
    render(
      <MemoryRouter initialEntries={['/locais/arpoador']}>
        <Routes>
          <Route path="/locais/:slug" element={<DetalheLocal />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: 'Editar avaliação de Ana' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Seu nome' })).toHaveValue('Ana')
    expect(
      screen.getByRole('button', { name: 'Salvar alterações' }),
    ).toBeInTheDocument()
  })

  it('só dispara DELETE após a confirmação visível', async () => {
    const handleConfirmReviewDelete = vi.fn()
    useDetalheLocal.mockReturnValue(
      detalheState({
        deleteConfirmationId: 10,
        handleConfirmReviewDelete,
      }),
    )
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/locais/arpoador']}>
        <Routes>
          <Route path="/locais/:slug" element={<DetalheLocal />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('alertdialog', { name: 'Excluir esta avaliação?' }),
    ).toBeInTheDocument()
    expect(handleConfirmReviewDelete).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole('button', { name: 'Excluir avaliação' }),
    )

    expect(handleConfirmReviewDelete).toHaveBeenCalledWith(10)
  })

  it('anuncia erro de mutação sem remover as avaliações', () => {
    useDetalheLocal.mockReturnValue(
      detalheState({
        reviewMutationFeedback: {
          variant: 'error',
          title: 'Não foi possível atualizar a avaliação',
          message: 'Tente novamente.',
          reviewId: 10,
        },
      }),
    )
    render(
      <MemoryRouter initialEntries={['/locais/arpoador']}>
        <Routes>
          <Route path="/locais/:slug" element={<DetalheLocal />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível atualizar a avaliação',
    )
    expect(screen.getByText('Vista inesquecível.')).toBeInTheDocument()
  })

  it('restaura o foco no diário após mutação concluída', () => {
    useDetalheLocal.mockReturnValue(
      detalheState({
        reviewMutationFeedback: {
          variant: 'success',
          message: 'Avaliação atualizada com sucesso.',
          reviewId: 10,
        },
      }),
    )
    render(
      <MemoryRouter initialEntries={['/locais/arpoador']}>
        <Routes>
          <Route path="/locais/:slug" element={<DetalheLocal />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: 'Diario de visitas' }),
    ).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Avaliação atualizada com sucesso.',
    )
  })
})

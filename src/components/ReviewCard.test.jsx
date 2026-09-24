import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import ReviewCard from './ReviewCard.jsx'
import { makeReview } from '../test/fixtures.js'

function ControlledCard({ onEdit = vi.fn(), onConfirmDelete = vi.fn() }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <ReviewCard
      review={makeReview()}
      onEdit={onEdit}
      onRequestDelete={() => setIsOpen(true)}
      onCancelDelete={() => setIsOpen(false)}
      onConfirmDelete={onConfirmDelete}
      isDeleteConfirmationOpen={isOpen}
    />
  )
}

describe('ReviewCard', () => {
  it('expõe ações acessíveis e encaminha o identificador para edição', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(<ControlledCard onEdit={onEdit} />)

    await user.click(
      screen.getByRole('button', { name: 'Editar avaliação de Ana' }),
    )

    expect(onEdit).toHaveBeenCalledWith(10)
    expect(
      screen.getByLabelText('Ações da avaliação de Ana'),
    ).toBeInTheDocument()
  })

  it('exige confirmação, move o foco e permite cancelar sem excluir', async () => {
    const user = userEvent.setup()
    const onConfirmDelete = vi.fn()
    render(<ControlledCard onConfirmDelete={onConfirmDelete} />)

    const deleteButton = screen.getByRole('button', {
      name: 'Excluir avaliação de Ana',
    })
    await user.click(deleteButton)

    const dialog = screen.getByRole('alertdialog', {
      name: 'Excluir esta avaliação?',
    })
    const confirmButton = screen.getByRole('button', {
      name: 'Excluir avaliação',
    })
    expect(dialog).toHaveAccessibleDescription(
      'Esta ação não pode ser desfeita.',
    )
    expect(confirmButton).toHaveFocus()
    expect(onConfirmDelete).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(deleteButton).toHaveFocus()
    expect(onConfirmDelete).not.toHaveBeenCalled()
  })

  it('confirma o identificador e bloqueia controles durante o DELETE', async () => {
    const user = userEvent.setup()
    const onConfirmDelete = vi.fn()
    const { rerender } = render(
      <ReviewCard
        review={makeReview()}
        onEdit={vi.fn()}
        onRequestDelete={vi.fn()}
        onCancelDelete={vi.fn()}
        onConfirmDelete={onConfirmDelete}
        isDeleteConfirmationOpen
      />,
    )

    await user.click(
      screen.getByRole('button', { name: 'Excluir avaliação' }),
    )
    expect(onConfirmDelete).toHaveBeenCalledWith(10)

    rerender(
      <ReviewCard
        review={makeReview()}
        onEdit={vi.fn()}
        onRequestDelete={vi.fn()}
        onCancelDelete={vi.fn()}
        onConfirmDelete={onConfirmDelete}
        isDeleteConfirmationOpen
        isMutationPending
        isDeleting
      />,
    )

    expect(screen.getByRole('article')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('button', { name: 'Excluindo...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Editar avaliação de Ana' }),
    ).toBeDisabled()
  })
})

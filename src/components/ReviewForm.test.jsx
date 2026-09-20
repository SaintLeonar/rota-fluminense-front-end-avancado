import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import ReviewForm from './ReviewForm.jsx'

function renderForm(overrides = {}) {
  const props = {
    values: { autor: 'Ana', nota: 5, comentario: '' },
    onChange: vi.fn(),
    onSubmit: vi.fn((event) => event.preventDefault()),
    onCancel: vi.fn(),
    ...overrides,
  }

  render(<ReviewForm {...props} />)
  return props
}

describe('ReviewForm', () => {
  it('encaminha alterações de nome, comentário e nota', async () => {
    const user = userEvent.setup()
    const props = renderForm()

    await user.type(screen.getByRole('textbox', { name: 'Seu nome' }), ' B')
    await user.type(
      screen.getByRole('textbox', { name: 'Comentário (opcional)' }),
      'Ótimo',
    )
    await user.click(screen.getByRole('button', { name: 'Nota 3 de 5' }))

    expect(props.onChange).toHaveBeenCalledWith('autor', expect.any(String))
    expect(props.onChange).toHaveBeenCalledWith('comentario', expect.any(String))
    expect(props.onChange).toHaveBeenCalledWith('nota', 3)
  })

  it('associa erros aos campos e os anuncia', () => {
    renderForm({
      fieldErrors: {
        autor: 'Informe seu nome.',
        nota: 'Escolha uma nota.',
        comentario: 'Comentário muito longo.',
      },
    })

    const author = screen.getByRole('textbox', { name: 'Seu nome' })
    const comment = screen.getByRole('textbox', {
      name: 'Comentário (opcional)',
    })
    expect(author).toHaveAttribute('aria-invalid', 'true')
    expect(author).toHaveAccessibleDescription('Informe seu nome.')
    expect(comment).toHaveAccessibleDescription('Comentário muito longo.')
    expect(screen.getAllByRole('alert')).toHaveLength(3)
  })

  it('desabilita todos os controles durante o envio', () => {
    renderForm({ isSubmitting: true })

    expect(screen.getByRole('form')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('textbox', { name: 'Seu nome' })).toBeDisabled()
    expect(screen.getByRole('textbox', { name: 'Comentário (opcional)' }))
      .toBeDisabled()
    expect(screen.getByRole('button', { name: 'Nota 5 de 5' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Postando...' })).toBeDisabled()
  })
})

import PrimaryButton from './PrimaryButton'
import SecondaryButton from './SecondaryButton'

const ratingOptions = [1, 2, 3, 4, 5]

export default function ReviewForm({
  values,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting = false,
  className = '',
  title = 'Escrever uma nota',
}) {
  const resolvedClassName = ['review-form', className].filter(Boolean).join(' ')

  function handleFieldChange(event) {
    const { name, value } = event.target
    onChange(name, value)
  }

  return (
    <form className={resolvedClassName} onSubmit={onSubmit}>
      <h3 className="review-form-title">{title}</h3>

      <label className="review-form-field">
        <span className="review-form-label">Seu nome</span>
        <input
          className="review-form-input"
          type="text"
          name="autor"
          value={values.autor}
          onChange={handleFieldChange}
          placeholder="Como assinar?"
          required
        />
      </label>

      <fieldset className="review-form-rating">
        <legend className="review-form-label">Sua nota</legend>

        <div className="review-form-stars">
          {ratingOptions.map((option) => {
            const isActive = Number(values.nota) >= option

            return (
              <button
                key={option}
                type="button"
                className={`review-form-star ${isActive ? 'is-active' : ''}`}
                onClick={() => onChange('nota', option)}
                aria-pressed={Number(values.nota) === option}
              >
                <span aria-hidden="true" className="review-form-star-icon">
                  <svg viewBox="0 0 24 24" focusable="false">
                    <path
                      d="m12 3.6l2.57 5.21l5.75.84l-4.16 4.05l.98 5.73L12 16.73l-5.14 2.7l.98-5.73L3.68 9.65l5.75-.84L12 3.6Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <label className="review-form-field">
        <span className="review-form-label">Comentário (opcional)</span>
        <textarea
          className="review-form-input review-form-textarea"
          name="comentario"
          value={values.comentario}
          onChange={handleFieldChange}
          placeholder="O que achou do passeio?"
          rows="4"
        />
      </label>

      <div className="review-form-actions">
        <SecondaryButton
          className="review-form-cancel"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </SecondaryButton>

        <PrimaryButton
          className="review-form-submit"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Postando...' : 'Postar'}
        </PrimaryButton>
      </div>
    </form>
  )
}

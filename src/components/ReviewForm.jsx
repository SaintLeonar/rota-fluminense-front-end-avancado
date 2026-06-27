import PrimaryButton from './PrimaryButton'
import SecondaryButton from './SecondaryButton'

const ratingOptions = [1, 2, 3, 4, 5]

export default function ReviewForm({
  values,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) {
  function handleFieldChange(event) {
    const { name, value } = event.target
    onChange(name, value)
  }

  return (
    <form className="review-form" onSubmit={onSubmit}>
      <div className="review-form-grid">
        <label className="field">
          <span className="field-label">Nome</span>
          <input
            className="field-input"
            type="text"
            name="autor"
            value={values.autor}
            onChange={handleFieldChange}
            placeholder="Como voce quer aparecer?"
            required
          />
        </label>

        <label className="field">
          <span className="field-label">Assinatura</span>
          <input
            className="field-input"
            type="text"
            name="assinatura"
            value={values.assinatura}
            onChange={handleFieldChange}
            placeholder="Ex.: Ana em um passeio de domingo"
            required
          />
        </label>
      </div>

      <fieldset className="review-form-rating">
        <legend className="field-label">Nota em estrelas</legend>

        <div className="review-form-stars">
          {ratingOptions.map((option) => {
            const isActive = Number(values.nota) === option

            return (
              <button
                key={option}
                type="button"
                className={`review-form-star ${isActive ? 'is-active' : ''}`}
                onClick={() => onChange('nota', option)}
                aria-pressed={isActive}
              >
                <span aria-hidden="true">★</span>
                <span>{option}</span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <label className="field">
        <span className="field-label">Comentario</span>
        <textarea
          className="field-input review-form-textarea"
          name="comentario"
          value={values.comentario}
          onChange={handleFieldChange}
          placeholder="Conte como foi sua experiencia nesse local."
          rows="5"
        />
      </label>

      <div className="button-row">
        <SecondaryButton onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </SecondaryButton>

        <PrimaryButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Postando...' : 'Postar avaliacao'}
        </PrimaryButton>
      </div>
    </form>
  )
}

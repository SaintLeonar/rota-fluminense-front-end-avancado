import PrimaryButton from './PrimaryButton'
import styles from './ReviewForm.module.css'
import SecondaryButton from './SecondaryButton'
import ValidationHint from './ValidationHint'

const ratingOptions = [1, 2, 3, 4, 5]

export default function ReviewForm({
  values,
  onChange,
  onSubmit,
  onCancel,
  isAuthorInvalid = false,
  isSubmitting = false,
  className = '',
  title = 'Escrever uma nota',
}) {
  const resolvedClassName = ['review-form', styles.reviewForm, className]
    .filter(Boolean)
    .join(' ')

  function handleFieldChange(event) {
    const { name, value } = event.target
    onChange(name, value)
  }

  return (
    <form
      className={resolvedClassName}
      onSubmit={onSubmit}
      autoComplete="off"
      noValidate
    >
      <h3 className={['review-form-title', styles.reviewFormTitle].join(' ')}>
        {title}
      </h3>

      <label className={['review-form-field', styles.reviewFormField].join(' ')}>
        <span className={['review-form-label', styles.reviewFormLabel].join(' ')}>
          Seu nome
        </span>
        <div className={['review-form-input-row', styles.reviewFormInputRow].join(' ')}>
          <input
            className={[
              'review-form-input',
              styles.reviewFormInput,
              isAuthorInvalid ? 'is-invalid' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            type="text"
            name="autor"
            value={values.autor}
            onChange={handleFieldChange}
            placeholder="Como assinar?"
            autoComplete="off"
            aria-invalid={isAuthorInvalid}
          />

          {isAuthorInvalid ? (
            <ValidationHint
              className={['review-form-input-hint', styles.reviewFormInputHint].join(' ')}
              message="Informe seu nome antes de postar."
            />
          ) : null}
        </div>
      </label>

      <fieldset className={['review-form-rating', styles.reviewFormRating].join(' ')}>
        <legend className={['review-form-label', styles.reviewFormLabel].join(' ')}>
          Sua nota
        </legend>

        <div className={['review-form-stars', styles.reviewFormStars].join(' ')}>
          {ratingOptions.map((option) => {
            const isActive = Number(values.nota) >= option

            return (
              <button
                key={option}
                type="button"
                className={[
                  'review-form-star',
                  styles.reviewFormStar,
                  isActive ? 'is-active' : '',
                  isActive ? styles.isActive : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onChange('nota', option)}
                aria-pressed={Number(values.nota) === option}
              >
                <span
                  aria-hidden="true"
                  className={['review-form-star-icon', styles.reviewFormStarIcon].join(' ')}
                >
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

      <label className={['review-form-field', styles.reviewFormField].join(' ')}>
        <span className={['review-form-label', styles.reviewFormLabel].join(' ')}>
          Comentario (opcional)
        </span>
        <textarea
          className={[
            'review-form-input',
            styles.reviewFormInput,
            'review-form-textarea',
            styles.reviewFormTextarea,
          ].join(' ')}
          name="comentario"
          value={values.comentario}
          onChange={handleFieldChange}
          placeholder="O que achou do passeio?"
          autoComplete="off"
          rows="4"
        />
      </label>

      <div className={['review-form-actions', styles.reviewFormActions].join(' ')}>
        <SecondaryButton
          className="review-form-cancel"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </SecondaryButton>

        <div className={['review-form-submit-stack', styles.reviewFormSubmitStack].join(' ')}>
          <PrimaryButton
            className="review-form-submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Postando...' : 'Postar'}
          </PrimaryButton>
        </div>
      </div>
    </form>
  )
}

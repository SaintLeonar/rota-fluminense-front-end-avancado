import RatingBadge from './RatingBadge'

export default function LocalCard({ local, onSelect }) {
  return (
    <button className="local-card" type="button" onClick={() => onSelect(local)}>
      <div className="local-card-image-wrap">
        <img
          className="local-card-image"
          src={local.imagem}
          alt={`Vista de ${local.nome}`}
        />
      </div>

      <div className="local-card-body">
        <span className="card-eyebrow">{local.categoria}</span>
        <strong className="local-card-title">{local.nome}</strong>
        <span className="local-card-location">
          {local.bairro} • {local.regiao}
        </span>
        <RatingBadge rating={local.nota} />
      </div>
    </button>
  )
}

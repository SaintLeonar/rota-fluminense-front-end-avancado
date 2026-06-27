export default function BrandHeader({ eyebrow, title, subtitle }) {
  return (
    <header className="brand-header">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      {title ? <h1>{title}</h1> : null}
      {subtitle ? <p className="brand-subtitle">{subtitle}</p> : null}
    </header>
  )
}

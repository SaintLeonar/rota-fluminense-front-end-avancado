import PageContainer from '../components/PageContainer'

export default function NotFound() {
  return (
    <PageContainer eyebrow="Erro de rota" title="Pagina nao encontrada">
        <p className="lead">
          A rota nao foi localizada. Esta tela sera refinada quando 
          implementar a experiencia completa de 404.
        </p>
    </PageContainer>
  )
}

export default function App() {
  return (
    <main className="app-root">
      <section className="app-shell">
        <p className="eyebrow">MVP em preparacao</p>
        <h1>Rota Fluminense</h1>
        <p className="lead">
          A base do projeto foi limpa e organizada para receber a navegacao,
          os dados locais e a identidade visual editorial do produto.
        </p>

        <section className="status-card" aria-labelledby="status-title">
          <h2 id="status-title">Estrutura pronta para a proxima fase</h2>
          <ul>
            <li>Projeto mantido em Vite + React</li>
            <li>Pastas principais do MVP presentes em src</li>
            <li>Boilerplate generico removido da entrada da aplicacao</li>
            <li>Nomenclatura orientada ao dominio Rota Fluminense</li>
          </ul>
        </section>
      </section>
    </main>
  )
}

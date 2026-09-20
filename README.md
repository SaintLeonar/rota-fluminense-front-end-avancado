# Rota Fluminense — Front-end integrado

Aplicação React e Vite do MVP Rota Fluminense. O front-end consome a API Flask e apresenta destinos turísticos, busca e filtro por categoria, detalhe por `slug`, avaliações persistidas no MySQL e clima atual com previsão de três dias.

## Funcionalidades

- Listagem de destinos fornecida por `GET /locais`.
- Busca textual e filtro pelas categorias canônicas da API.
- Navegação pública por `/locais/<slug>`.
- Leitura e criação de avaliações persistidas no MySQL.
- Atualização da lista, média e total após uma nova avaliação.
- Card climático independente, com tratamento de indisponibilidade e atribuição ao Open-Meteo.
- Estados de carregamento, erro, vazio, não encontrado e repetição.

Não existe fallback para os JSONs simulados quando a API, o banco ou o serviço climático estão indisponíveis.

## Pré-requisitos

- Node.js `24.16.x` e npm.
- API `rota-fluminense-backend` em execução.
- MySQL do backend saudável, migrado e com o seed aplicado.

Por padrão, a API é esperada em `http://localhost:5000` e o Vite usa `http://localhost:5173`.

## Configuração do ambiente

Crie o arquivo local a partir do exemplo versionado:

```powershell
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
```

O conteúdo esperado é:

```dotenv
VITE_API_URL=http://localhost:5000
```

Variáveis com prefixo `VITE_` são públicas e incorporadas ao bundle. Nunca coloque senha, token, URL de banco ou outro segredo nesse arquivo. Reinicie o Vite após alterar a configuração.

## Instalação e execução

```powershell
npm install
npm run dev
```

Abra `http://localhost:5173`. Para o fluxo principal, acesse `http://localhost:5173/locais`.

Ordem recomendada do ambiente integrado:

1. Subir o MySQL no projeto backend.
2. Aplicar as migrações e executar o seed.
3. Iniciar a API Flask na porta 5000.
4. Iniciar este front-end na porta 5173.

Os comandos completos do backend estão em `docs/COMANDOS.md` no projeto `rota-fluminense-backend`.

## Rotas da interface

| Rota | Finalidade |
| --- | --- |
| `/` | Apresentação inicial. |
| `/locais` | Listagem, busca e filtro por categoria. |
| `/locais/<slug>` | Detalhe, avaliações e clima do destino. |

## Endpoints consumidos

| Método | Endpoint | Uso |
| --- | --- | --- |
| `GET` | `/locais` | Listagem e paginação. |
| `GET` | `/locais/<slug>` | Detalhe do destino. |
| `GET` | `/locais/<slug>/avaliacoes` | Avaliações persistidas. |
| `POST` | `/locais/<slug>/avaliacoes` | Criação de avaliação. |
| `GET` | `/locais/<slug>/clima` | Condição atual e previsão. |

O navegador nunca consulta o Open-Meteo diretamente. O backend controla integração, timeout e cache climático.

## Testes e qualidade

```powershell
npm test
npm run test:watch
npm run test:coverage
npm run lint
npm run build
```

A suíte usa fronteiras HTTP simuladas e não depende de MySQL, API ou internet reais. A cobertura é gravada em `coverage/`, que permanece fora do versionamento.

Para conferir o build localmente:

```powershell
npm run build
npm run preview
```

## Smoke test integrado

Com MySQL, API e Vite ativos:

1. Abra `/locais` e confirme que os cards são carregados.
2. Busque por parte do nome ou da localização.
3. Selecione uma categoria e depois limpe o filtro.
4. Abra um destino e confirme que a URL usa o `slug`.
5. Confira detalhe, avaliações e o card de clima com três dias.
6. Envie uma avaliação e confirme a atualização da lista, média e total.
7. Recarregue a página e confirme que a avaliação continua visível.

O envio modifica o banco local. Use dados de teste identificáveis e remova-os pela API administrativa somente quando necessário.

## Diagnóstico

- **Configuração da API inválida:** confira `VITE_API_URL` em `.env.local` e reinicie o Vite.
- **Falha de rede ou API indisponível:** confirme `http://localhost:5000/locais` e o estado do MySQL.
- **Erro de CORS:** abra o front por `http://localhost:5173` e confira `CORS_ALLOWED_ORIGINS` no backend.
- **Local não encontrado:** confirme o `slug`; identificador numérico não é aceito como fallback.
- **Avaliações indisponíveis:** o detalhe deve continuar visível e oferecer nova tentativa na região de avaliações.
- **Clima indisponível:** o detalhe, as avaliações e o formulário permanecem utilizáveis; confira conectividade e logs seguros da API.
- **Imagem ausente:** verifique se o caminho retornado pela API existe em `public/imagens/locais/`.

Os erros são interpretados pelo código canônico da API. Não há fallback silencioso para mocks.

## Segurança e limitações do MVP

As rotas de escrita do backend ainda não possuem autenticação ou autorização. Execute o conjunto somente em ambiente local ou controlado de demonstração. Dockerização completa, endurecimento de CORS e segurança de produção permanecem fora do Dia 5.

Dados meteorológicos por [Open-Meteo.com](https://open-meteo.com/).

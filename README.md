# Rota Fluminense — Front-end integrado

Aplicação React e Vite do MVP Rota Fluminense. O front-end consome a API Flask e apresenta destinos turísticos, busca e filtro por categoria, detalhe por `slug`, criação, edição e exclusão de avaliações persistidas no MySQL e clima atual com previsão de três dias.

## Tecnologias e arquitetura

| Camada | Tecnologias principais |
| --- | --- |
| Interface | React 19 e React Router 7 |
| Build e desenvolvimento | Vite 8 e Node.js 24.16 |
| Testes | Vitest 5, Testing Library e jsdom |
| Produção local | Nginx em contêiner Docker |

![Diagrama da arquitetura do Rota Fluminense](docs/arquitetura/arquitetura-rota-fluminense.svg)

O navegador carrega os arquivos estáticos do Nginx em
`http://localhost:5173` e consulta a API definida por `VITE_API_URL`. A API
Flask é a única responsável por acessar o MySQL e o Open-Meteo. No fluxo
Compose, o repositório `rota-fluminense-backend` concentra a orquestração, o
contrato OpenAPI e as instruções operacionais da arquitetura completa.

## Funcionalidades

- Listagem de destinos fornecida por `GET /locais`.
- Busca textual e filtro pelas categorias canônicas da API.
- Navegação pública por `/locais/<slug>`.
- Leitura, criação, edição e exclusão de avaliações persistidas no MySQL.
- Atualização imediata da lista, média e total após POST, PATCH ou DELETE, seguida de reconciliação com a API.
- Confirmação visível antes da exclusão e bloqueio de mutações duplicadas.
- Card climático independente, com tratamento de indisponibilidade e atribuição ao Open-Meteo.
- Estados de carregamento, erro, vazio, não encontrado, cancelamento e repetição.

Não existe fallback para os JSONs simulados quando a API, o banco ou o serviço climático estão indisponíveis.

## Pré-requisitos

- Docker Desktop ou Docker Engine com o plugin Compose para o fluxo recomendado.
- Node.js `24.16.x` e npm para testes ou execução nativa.
- API `rota-fluminense-backend` e MySQL, iniciados automaticamente pelo Compose no fluxo principal.

Mantenha este repositório e `rota-fluminense-backend` como diretórios irmãos.
O `docker-compose.yml` fica no back-end e usa este diretório como contexto de
build do serviço `frontend`.

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

### Contrato do build conteinerizado

`VITE_API_URL` é uma configuração pública lida pelo Vite durante o build, e não uma variável de execução do servidor estático. O `Dockerfile` do front-end expõe o argumento público `VITE_API_URL`, com valor padrão `http://localhost:5000`, e disponibilizá-lo ao comando `npm run build`. O Compose fornece o mesmo valor por `build.args`.

A URL incorporada é resolvida pelo navegador no host. Portanto, deve apontar para a porta publicada da API em `http://localhost:5000`; o hostname `backend`, embora válido entre contêineres na rede do Compose, não é resolvível pelo navegador e não pode entrar no bundle.

Alterar `VITE_API_URL` depois que a imagem estiver construída não modifica os arquivos estáticos. Para usar outro endereço público da API, é necessário reconstruir a imagem. Nenhuma credencial ou configuração interna deve ser passada por argumentos `VITE_*`.

## Execução recomendada via Docker Compose

Na raiz do repositório irmão `rota-fluminense-backend`, prepare o `.env` e suba
a pilha completa:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
docker compose --env-file .env up --build --detach --wait
docker compose --env-file .env ps
```


Aguarde `frontend`, `backend` e `mysql` ficarem `healthy`. Acesse
`http://localhost:5173`; o fluxo principal está em `/locais`. A API e o Swagger
ficam em `http://localhost:5000` e `http://localhost:5000/openapi/`.

Para diagnóstico, ainda na raiz do back-end:

```powershell
docker compose --env-file .env logs -f frontend
docker compose --env-file .env logs -f backend
```


Para encerrar preservando o MySQL:

```powershell
docker compose --env-file .env down
```


Não use `--volumes` nesse encerramento rotineiro: ele remove o volume e apaga os
dados persistidos.

## Instalação e execução nativa alternativa

```powershell
npm ci
npm run dev
```


Abra `http://localhost:5173`. Para o fluxo principal, acesse `http://localhost:5173/locais`.

No fluxo nativo alternativo, use esta ordem:

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
| `PATCH` | `/avaliacoes/<avaliacao_id>` | Edição dos campos mutáveis de uma avaliação. |
| `DELETE` | `/avaliacoes/<avaliacao_id>` | Exclusão confirmada de uma avaliação. |
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


A suíte usa fronteiras HTTP simuladas e não depende de MySQL, API ou internet
reais. A Fase B do Dia 8 aprovou 112 testes, lint e build, com 82,75% de
statements, 74,82% de branches, 84,03% de funções e 82,54% de linhas. A
cobertura é gravada em `coverage/`, que permanece fora do versionamento.

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
7. Edite essa avaliação e confirme a requisição PATCH e os agregados atualizados.
8. Solicite a exclusão, cancele uma vez e depois confirme o DELETE.
9. Recarregue a página e confirme que a avaliação excluída não reaparece.

As mutações modificam o banco local. Use dados de teste identificáveis e exclua exatamente a avaliação criada para a demonstração.

## Diagnóstico

- **Configuração da API inválida:** no Compose, reconstrua a imagem após alterar `build.args.VITE_API_URL`; no fluxo nativo, confira `.env.local` e reinicie o Vite.
- **Contêiner não saudável:** execute `docker compose --env-file .env ps` e `docker compose --env-file .env logs frontend` na raiz do back-end.
- **Falha de rede ou API indisponível:** confirme `http://localhost:5000/locais` e o estado do MySQL.
- **Erro de CORS:** abra o front por `http://localhost:5173` e confira `CORS_ALLOWED_ORIGINS` no backend.
- **Local não encontrado:** confirme o `slug`; identificador numérico não é aceito como fallback.
- **Avaliações indisponíveis:** o detalhe deve continuar visível e oferecer nova tentativa na região de avaliações.
- **Clima indisponível:** o detalhe, as avaliações e o formulário permanecem utilizáveis; confira conectividade e logs seguros da API.
- **Imagem ausente:** verifique se o caminho retornado pela API existe em `public/imagens/locais/`.

Os erros são interpretados pelo código canônico da API. Não há fallback silencioso para mocks.

## Acessibilidade

A navegação usa títulos, landmarks, breadcrumbs, rótulos associados aos campos,
mensagens de estado e foco visível. A edição recebe foco no primeiro campo; a
exclusão usa confirmação com papel de diálogo de alerta; cancelamentos restauram
o foco na ação de origem; e mutações concluídas retornam o foco ao título do
diário. Os estados de carregamento, erro, vazio e sucesso não dependem apenas de
cor. Antes de uma publicação, valide novamente teclado, leitor de tela, contraste
e zoom nos navegadores-alvo; o MVP não declara conformidade formal com WCAG.

## Segurança e limitações do MVP

As rotas de escrita do backend ainda não possuem autenticação ou autorização.
Os controles de editar e excluir não comprovam autoria nem restringem acesso;
servem exclusivamente à demonstração controlada do contrato HTTP. Execute o
conjunto somente em ambiente local ou controlado de demonstração.
`CORS_ALLOWED_ORIGINS` no backend deve conter a origem pública do front-end
(por padrão, `http://localhost:5173`); uma origem negada não recebe autorização
CORS. Essa política protege apenas a fronteira do navegador e não substitui
autenticação, autorização, TLS ou rate limiting. As portas públicas do Compose
são vinculadas ao loopback e o MySQL não publica porta por padrão, mas gestão
externa de segredos e endurecimento de produção permanecem fora do escopo.

Dados meteorológicos por [Open-Meteo.com](https://open-meteo.com/).

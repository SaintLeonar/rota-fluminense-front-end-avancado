# Rota Fluminense - Front-end

Interface web do projeto Rota Fluminense para consulta de locais turísticos do
estado do Rio de Janeiro, avaliações de visitantes e previsão do tempo. A
aplicação React consome a API Flask do back-end.

## Tecnologias utilizadas

| Camada | Tecnologias |
| --- | --- |
| Interface | React 19 e React Router 7 |
| Build e desenvolvimento | Node.js 24.16 e Vite 8 |
| Testes | Vitest e Testing Library |
| Servidor web | Nginx |
| Infraestrutura | Docker e Docker Compose |

## Documentação

A documentação complementar está disponível no diretório `docs/` deste
repositório:

- [Arquitetura Rota Fluminense](<docs/Arquitetura Rota Fluminense.pdf>):
  diagrama da arquitetura e da comunicação entre os componentes do projeto;
- [Integração com o Open-Meteo](docs/INTEGRACAO_OPEN_METEO.pdf):
  informações sobre a API externa, licença, cadastro e rotas utilizadas;
- [Instruções de teste do MVP](docs/INSTRUCOES_TESTE_MVP.pdf):
  passos para iniciar, validar e encerrar a aplicação.

## Pré-requisitos

- Docker Desktop ou Docker Engine com o plugin Compose para o fluxo recomendado.
- Node.js `24.16.x` e npm para testes ou execução nativa.
- Git para clonar os repositórios.
- Back-end `rota-fluminense-backend` e MySQL, iniciados automaticamente pelo
  Compose no fluxo principal.

Mantenha este repositório e `rota-fluminense-backend` como diretórios irmãos.
O `docker-compose.yml` de entrega fica na raiz deste front-end e usa o
repositório irmão como contexto de build do serviço `backend`. O back-end
conserva um Compose equivalente para compatibilidade operacional.

Por padrão, a API é esperada em `http://localhost:5000` e a interface é
publicada em `http://localhost:5173`.

## Instalação e execução

1. Clone os repositórios do back-end e do front-end no mesmo diretório:

```text
<diretorio-de-trabalho>/
├── rota-fluminense-backend/
└── rota-fluminense-front-end-avancado/
```

2. Entre no diretório do front-end, onde está o Compose de entrega:

```powershell
cd rota-fluminense-front-end-avancado
```

3. Crie o arquivo de configuração local:

```powershell
Copy-Item ../rota-fluminense-backend/.env.example ../rota-fluminense-backend/.env
```

Revise os valores de `../rota-fluminense-backend/.env`, principalmente usuário e senha do MySQL.

4. Construa as imagens e inicie a aplicação:

```powershell
docker compose --env-file ../rota-fluminense-backend/.env up --build --detach --wait
```

O Docker instala as dependências e inicia o front-end, o back-end e o MySQL.
Durante a inicialização, o back-end aplica as migrações e executa o seed
automaticamente. Não é necessário rodar um comando separado.

5. Acesse a aplicação:

- Interface: `http://localhost:5173`;
- API: `http://localhost:5000`;
- Swagger: `http://localhost:5000/openapi/`.

Para encerrar:

```powershell
docker compose --env-file ../rota-fluminense-backend/.env down
```

## Inicialização com inspeção HTTPS do antivírus

Use esta opção somente se um antivírus com inspeção de tráfego substituir o
certificado HTTPS do Open-Meteo e a consulta de clima apresentar erro de
certificado.

1. Abra o gerenciador de certificados do Windows com `certmgr.msc`.
2. Localize, em **Autoridades de Certificação Raiz Confiáveis**, o certificado
   usado pelo antivírus para inspeção HTTPS.
3. Exporte somente a parte pública, sem chave privada, no formato
   **X.509 codificado em Base-64**.
4. Salve o certificado fora dos repositórios, por exemplo em
   `C:\certificados\antivirus-root-ca.crt`.
5. No arquivo `.env` do back-end, informe o caminho usando barras `/`:

```dotenv
OPEN_METEO_CA_HOST_PATH=C:/certificados/antivirus-root-ca.crt
```

6. Na raiz do front-end, inicie a aplicação com a configuração adicional do back-end:

```powershell
docker compose --env-file ../rota-fluminense-backend/.env -f docker-compose.yml -f ../rota-fluminense-backend/compose.custom-ca.example.yml up --build --detach --wait
```

Esse modo monta o certificado somente no back-end e o adiciona às autoridades
confiáveis usadas na conexão com o Open-Meteo. A validação TLS permanece ativa.
Não versione o certificado e não desabilite a verificação HTTPS.

Para encerrar essa execução:

```powershell
docker compose --env-file ../rota-fluminense-backend/.env -f docker-compose.yml -f ../rota-fluminense-backend/compose.custom-ca.example.yml down
```

## Segurança e limitações do MVP

As rotas de escrita da API ainda não possuem autenticação ou autorização. Os
controles de editar e excluir não comprovam autoria nem restringem acesso;
servem exclusivamente à demonstração controlada do contrato HTTP. Execute o
conjunto somente em ambiente local ou controlado de demonstração.

Dados meteorológicos por [Open-Meteo.com](https://open-meteo.com/).

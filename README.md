# QBFT Network

<<<<<<< HEAD
Topologia 1 da pesquisa: rede Besu/QBFT local usada para exploração do consenso, entendimento da infraestrutura permissionada e validação inicial da camada de auditabilidade do QRCheck.

Este repositório não tenta ser o ambiente mais replicável do projeto. A base Docker segue de perto o tutorial do Besu para uma rede QBFT local; o valor deste repo está no recorte experimental: como batches de check-ins podem ser representados por fingerprints criptográficos, ancorados em uma blockchain permissionada e consultados por um contrato.

## Papel Na Pesquisa

Foram trabalhadas duas topologias. Esta é a primeira:

- **Topologia 1 - exploratória:** rede local Besu/QBFT, quatro validadores, foco em consenso, deploy do contrato e testes de ancoragem de batches.
- **Topologia 2 - integração:** repositório complementar, com maior preocupação de organização/reprodutibilidade e comunicação com a aplicação QRCheck.

Assim, este repo funciona como laboratório de entendimento: ele isola a blockchain permissionada e valida o desenho de registro on-chain antes de conectar a solução a um fluxo mais completo.
=======
Projeto experimental para testar uma camada de auditabilidade baseada em blockchain permissionada Besu/QBFT. A ideia central é registrar apenas fingerprints criptograficos de batches de check-ins, mantendo os dados completos fora da blockchain.

Este repositório é usado como prova de conceito para um projeto pessoal/acadêmico. A rede é local, de testes, e não representa uma infraestrutura de produção.

O ambiente experimental utiliza chaves públicas de exemplo e configuração de rede permissiva (host-allowlist e CORS abertos), adequadas a uma prova de conceito isolada e não expostas a terceiros. Uma implantação em produção exigiria geração segura de chaves de validador (idealmente em HSM ou cofre de segredos), chave de conta operacional privada e gerenciada via variável de ambiente, e restrição de acesso ao RPC — itens fora do escopo desta prova de conceito.
>>>>>>> 2e879ca92a86337ff6edccc47ee1c1fe52094b24

## Objetivo

O fluxo simula a camada de auditabilidade para check-ins do QRCheck:

<<<<<<< HEAD
1. Um CSV local de check-ins é usado como fonte de dados.
2. Cada linha é convertida para um registro canônico, sem PII direta.
3. Os registros do batch geram um fingerprint SHA-256 incremental.
4. O fingerprint é ancorado na rede Besu/QBFT.
5. A verificação recalcula o fingerprint off-chain e compara com o valor registrado.
6. O contrato `RegistroDeBatches` organiza o registro por `batchId`, timestamp, tamanho e autor.

A blockchain guarda apenas evidências criptográficas. Os dados completos continuam fora da rede, em armazenamento off-chain.

## Arquitetura

```text
QRCheck / CSV local
        |
        v
Agregador de batch
        |
        v
Fingerprint SHA-256
        |
        +--> tx-test: ancoragem direta no campo data da transação
        |
        +--> qrcheck-contrato: registro via smart contract
                            |
                            v
                    Rede Besu/QBFT Docker
```
=======
1. Um CSV de check-ins é lido localmente.
2. Cada linha é convertida para um registro canônico sem PII direta.
3. Os registros do batch geram um fingerprint SHA-256 incremental.
4. Apenas o fingerprint é enviado para a rede Besu/QBFT.
5. A verificação recalcula o fingerprint e compara com o valor gravado on-chain.
6. Uma evidência local pode ser gerada para auditoria, mas não deve ser versionada.
>>>>>>> 2e879ca92a86337ff6edccc47ee1c1fe52094b24

## Estrutura

```text
.
<<<<<<< HEAD
├── docker-compose.yml       # Rede local com 4 nós Besu/QBFT
├── genesis.json             # Genesis da rede local
├── qbftConfigFile.json      # Configuração usada na geração QBFT
├── tx-test/                 # Scripts de hash, transação e ancoragem direta
└── qrcheck-contrato/        # Contrato Solidity, testes e deploy Hardhat
```

O diretório `tx-test` guarda a etapa exploratória de transações: primeiro hashes simples, depois envio de transação e, por fim, ancoragem de um batch realista. O diretório `qrcheck-contrato` concentra a parte principal para a pesquisa: o contrato `RegistroDeBatches`.
=======
├── genesis.json          # Genesis da rede local
├── qbftConfigFile.json   # Configuração QBFT
├── tx-test/              # Scripts de ancoragem e transações
└── qrcheck-contrato/     # Contrato Solidity, testes e deploy
```

O `tx-test` concentra a prova de ancoragem direta: lê o CSV local, calcula o fingerprint do batch e grava esse hash na rede. O `qrcheck-contrato` contém a versão com smart contract, onde os fingerprints são registrados e consultados pelo contrato `RegistroDeBatches`.
>>>>>>> 2e879ca92a86337ff6edccc47ee1c1fe52094b24

## Rede Docker

<<<<<<< HEAD
A rede local usa quatro containers Besu em QBFT:
=======
O arquivo `tx-test/anchorBatch.js` executa a etapa sem smart contract: o hash do batch é gravado diretamente no campo `data` de uma transação.

Para rodar:
>>>>>>> 2e879ca92a86337ff6edccc47ee1c1fe52094b24

```shell
docker compose up -d
```

RPCs expostos:

```text
node1: http://127.0.0.1:8545
node2: http://127.0.0.1:8546
node3: http://127.0.0.1:8547
node4: http://127.0.0.1:8548
```

<<<<<<< HEAD
O estado dos nós fica em `Node-*/data/` e não deve ser versionado.
=======
Esse arquivo não é versionado.
>>>>>>> 2e879ca92a86337ff6edccc47ee1c1fe52094b24

## Contrato

<<<<<<< HEAD
O contrato `RegistroDeBatches` registra fingerprints de batches produzidos fora da blockchain. Ele permite:

- registrar um batch por `batchId`;
- armazenar `fingerprint`, timestamp de bloco, tamanho do batch e conta registradora;
- consultar um batch por identificador;
- consultar ids de batches por intervalo temporal;
- restringir registro a organizadores autorizados;
- delegar a administradores a gestão de organizadores.
=======
O projeto `qrcheck-contrato` contém o contrato `RegistroDeBatches`, que evolui a prova de conceito para um modelo com smart contract.

O contrato permite:

- registrar um batch por `batchId`;
- armazenar `fingerprint`, timestamp, tamanho e autor do registro;
- consultar batch por identificador;
- consultar batches por intervalo temporal;
- controlar permissão de organizadores por administradores.
>>>>>>> 2e879ca92a86337ff6edccc47ee1c1fe52094b24

Comandos principais:

```shell
cd qrcheck-contrato
npm install
npm test
npm run compile
```

Deploy na rede Besu local:

```shell
PRIVATE_KEY=0x... npm run deploy:besu
```

O deploy usa o RPC `http://127.0.0.1:8545`. A chave privada deve vir de um `.env` local ou do ambiente e não deve ser versionada.

## Teste De Ancoragem

O script `tx-test/anchorBatch.js` executa a prova sem smart contract: lê um CSV local, canonicaliza os registros, calcula o fingerprint incremental do batch e grava esse hash no campo `data` de uma transação.

```shell
cd tx-test
npm install
PRIVATE_KEY=0x... node anchorBatch.js
```

<<<<<<< HEAD
O CSV esperado fica em `tx-test/dados/` e não é versionado. As evidências geradas ficam em `tx-test/evidencias/`, também fora do Git.

## Comunicação Com A Topologia 2

A comunicação entre este repo e o repositório complementar deve ser entendida pelo contrato de dados, não por acoplamento direto de código:

- entrada off-chain: batches de check-ins já normalizados/canonicalizados;
- saída off-chain: `batchId`, `fingerprint`, `batchSize`, `txHash`, `blockNumber` e endereço do contrato quando aplicável;
- estado on-chain: fingerprints e metadados mínimos registrados no `RegistroDeBatches`;
- verificação: recálculo do fingerprint no outro repositório e comparação com o valor consultado na rede.

Na prática, este repositório define e valida o modelo de auditabilidade. O outro repositório pode consumir esse modelo ao enviar batches para o contrato e ao consultar evidências on-chain.

## Limites

- Rede local e experimental, sem pretensão de produção.
- A topologia replica a estrutura base do tutorial Besu/QBFT, com adaptações para a pesquisa.
- Os dados completos dos check-ins permanecem off-chain.
- A pseudonimização atual usa SHA-256 simples para prova de conceito; em produção, o correto seria HMAC com segredo do servidor para reduzir risco de reidentificação por dicionário.
=======
O `.env` é ignorado pelo Git.

Também ficam fora do Git os CSVs locais, evidências geradas, estado dos nós Besu, `node_modules`, cachê e artifacts do Hardhat.

## Observações

- A rede Besu/QBFT usada aqui é local e experimental.
- Os fingerprints on-chain não substituem o armazenamento off-chain dos dados originais.
- A pseudonimização atual usa SHA-256 simples para fins de prova de conceito. Em um ambiente real, o ideal seria usar HMAC com segredo do servidor para reduzir risco de reidentificação por dicionário.
>>>>>>> 2e879ca92a86337ff6edccc47ee1c1fe52094b24

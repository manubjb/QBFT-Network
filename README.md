# QBFT Network

Topologia 1 da pesquisa: rede Besu/QBFT local usada para exploração do consenso, entendimento da infraestrutura permissionada e validação inicial da camada de auditabilidade do QRCheck.

Este repositório não tenta ser o ambiente mais replicável do projeto. A base Docker segue de perto o tutorial do Besu para uma rede QBFT local; o valor deste repo está no recorte experimental: como batches de check-ins podem ser representados por fingerprints criptográficos, ancorados em uma blockchain permissionada e consultados por um contrato.

## Papel Na Pesquisa

Foram trabalhadas duas topologias. Esta é a primeira:

- **Topologia 1 - exploratória:** rede local Besu/QBFT, quatro validadores, foco em consenso, deploy do contrato e testes de ancoragem de batches.
- **Topologia 2 - integração:** repositório complementar, com maior preocupação de organização/reprodutibilidade e comunicação com a aplicação QRCheck.

Assim, este repo funciona como laboratório de entendimento: ele isola a blockchain permissionada e valida o desenho de registro on-chain antes de conectar a solução a um fluxo mais completo.

## Objetivo

O fluxo simula a camada de auditabilidade para check-ins do QRCheck:

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

## Estrutura

```text
.
├── docker-compose.yml       # Rede local com 4 nós Besu/QBFT
├── genesis.json             # Genesis da rede local
├── qbftConfigFile.json      # Configuração usada na geração QBFT
├── tx-test/                 # Scripts de hash, transação e ancoragem direta
└── qrcheck-contrato/        # Contrato Solidity, testes e deploy Hardhat
```

O diretório `tx-test` guarda a etapa exploratória de transações: primeiro hashes simples, depois envio de transação e, por fim, ancoragem de um batch realista. O diretório `qrcheck-contrato` concentra a parte principal para a pesquisa: o contrato `RegistroDeBatches`.

## Rede Docker

A rede local usa quatro containers Besu em QBFT:

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

O estado dos nós fica em `Node-*/data/` e não deve ser versionado.

## Contrato

O contrato `RegistroDeBatches` registra fingerprints de batches produzidos fora da blockchain. Ele permite:

- registrar um batch por `batchId`;
- armazenar `fingerprint`, timestamp de bloco, tamanho do batch e conta registradora;
- consultar um batch por identificador;
- consultar ids de batches por intervalo temporal;
- restringir registro a organizadores autorizados;
- delegar a administradores a gestão de organizadores.

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

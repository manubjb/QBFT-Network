# QBFT Network

Topologia 1 da pesquisa: rede Besu/QBFT local usada para explorar o consenso, testar a infraestrutura permissionada e validar a camada inicial de auditabilidade do QRCheck.

Este repositório funciona como laboratório. A rede Docker segue de perto o tutorial do Besu/QBFT; o foco aqui é o contrato, a ancoragem de fingerprints de batches e o entendimento do fluxo on-chain/off-chain.

## Papel Na Pesquisa

- **Topologia 1:** ambiente exploratório local com quatro validadores Besu/QBFT.
- **Topologia 2:** ambiente complementar, mais voltado à integração e reprodutibilidade.

Nesta topologia, a blockchain registra apenas evidências criptográficas. Os dados completos dos check-ins permanecem fora da rede.

## Fluxo

1. Um CSV local de check-ins é lido.
2. Cada linha é convertida para um registro canônico, sem PII direta.
3. O batch gera um fingerprint SHA-256 incremental.
4. O fingerprint é ancorado na rede Besu/QBFT.
5. A verificação recalcula o fingerprint off-chain e compara com o valor registrado.

```text
QRCheck / CSV local
        |
        v
Agregador de batch
        |
        v
Fingerprint SHA-256
        |
        +--> tx-test: transação direta com hash no campo data
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

## Rede Docker

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

O contrato `RegistroDeBatches` registra fingerprints de batches produzidos fora da blockchain.

Ele permite:

- registrar um batch por `batchId`;
- armazenar `fingerprint`, timestamp de bloco, tamanho do batch e conta registradora;
- consultar um batch por identificador;
- consultar batches por intervalo temporal;
- restringir registros a organizadores autorizados.

Comandos:

```shell
cd qrcheck-contrato
npm install
npm test
npm run compile
PRIVATE_KEY=0x... npm run deploy:besu
```

## Teste De Ancoragem

O script `tx-test/anchorBatch.js` executa a prova sem smart contract: lê um CSV local, calcula o fingerprint incremental do batch e grava esse hash no campo `data` de uma transação.

```shell
cd tx-test
npm install
PRIVATE_KEY=0x... node anchorBatch.js
```

O CSV esperado fica em `tx-test/dados/`. Evidências geradas ficam em `tx-test/evidencias/`. Ambos ficam fora do Git.

## Integração

A comunicação com a outra topologia acontece pelo contrato de dados:

- entrada off-chain: batches de check-ins normalizados/canonicalizados;
- saída off-chain: `batchId`, `fingerprint`, `batchSize`, `txHash`, `blockNumber` e endereço do contrato;
- estado on-chain: fingerprints e metadados mínimos no `RegistroDeBatches`;
- verificação: recálculo do fingerprint e comparação com o valor consultado na rede.

## Limites

- Rede local e experimental, sem pretensão de produção.
- Chaves e configuração permissiva de RPC/CORS são adequadas apenas para prova de conceito isolada.
- Os dados completos permanecem off-chain.
- A pseudonimização usa SHA-256 simples; em produção, o ideal seria HMAC com segredo do servidor.

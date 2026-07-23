# QBFT Network

Projeto experimental para testar uma camada de auditabilidade baseada em blockchain permissionada Besu/QBFT. A ideia central e registrar apenas fingerprints criptograficos de batches de check-ins, mantendo os dados completos fora da blockchain.

Este repositorio e usado como prova de conceito para um projeto pessoal/academico. A rede e local, de testes, e nao representa uma infraestrutura de producao.

## Objetivo

O fluxo simula a ancoragem de registros do QRCheck em uma rede blockchain local:

1. Um CSV de check-ins e lido localmente.
2. Cada linha e convertida para um registro canonico sem PII direta.
3. Os registros do batch geram um fingerprint SHA-256 incremental.
4. Apenas o fingerprint e enviado para a rede Besu/QBFT.
5. A verificacao recalcula o fingerprint e compara com o valor gravado on-chain.
6. Uma evidencia local pode ser gerada para auditoria, mas nao deve ser versionada.

## Estrutura

```text
.
├── genesis.json          # Genesis da rede local
├── qbftConfigFile.json   # Configuracao QBFT
├── tx-test/              # Scripts de ancoragem e transacoes
└── qrcheck-contrato/     # Contrato Solidity, testes e deploy
```

O `tx-test` concentra a prova de ancoragem direta: le o CSV local, calcula o fingerprint do batch e grava esse hash na rede. O `qrcheck-contrato` contem a versao com smart contract, onde os fingerprints sao registrados e consultados pelo contrato `RegistroDeBatches`.

## Scripts de Ancoragem

O arquivo `tx-test/anchorBatch.js` executa a etapa sem smart contract: o hash do batch e gravado diretamente no campo `data` de uma transacao.

Para rodar:

```shell
cd tx-test
npm install
PRIVATE_KEY=0x... node anchorBatch.js
```

O CSV esperado fica em:

```text
tx-test/dados/evento-xyz.csv
```

Esse arquivo nao e versionado.

## Contrato Solidity

O projeto `qrcheck-contrato` contem o contrato `RegistroDeBatches`, que evolui a prova de conceito para um modelo com smart contract.

O contrato permite:

- registrar um batch por `batchId`;
- armazenar `fingerprint`, timestamp, tamanho e autor do registro;
- consultar batch por identificador;
- consultar batches por intervalo temporal;
- controlar permissao de organizadores por administradores.

Comandos:

```shell
cd qrcheck-contrato
npm install
npm test
npm run compile
```

Deploy na rede Besu local:

```shell
npm run deploy:besu
```

O deploy usa `PRIVATE_KEY` do arquivo `.env` local:

```text
PRIVATE_KEY=0x...
```

O `.env` e ignorado pelo Git.

Tambem ficam fora do Git os CSVs locais, evidencias geradas, estado dos nos Besu, `node_modules`, cache e artifacts do Hardhat.

## Observacoes

- A rede Besu/QBFT usada aqui e local e experimental.
- Os fingerprints on-chain nao substituem o armazenamento off-chain dos dados originais.
- A pseudonimizacao atual usa SHA-256 simples para fins de prova de conceito. Em um ambiente real, o ideal seria usar HMAC com segredo do servidor para reduzir risco de reidentificacao por dicionario.

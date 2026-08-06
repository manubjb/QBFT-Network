# QBFT Network

Projeto experimental para testar uma camada de auditabilidade baseada em blockchain permissionada Besu/QBFT. A ideia central é registrar apenas fingerprints criptograficos de batches de check-ins, mantendo os dados completos fora da blockchain.

Este repositório é usado como prova de conceito para um projeto pessoal/acadêmico. A rede é local, de testes, e não representa uma infraestrutura de produção.

O ambiente experimental utiliza chaves públicas de exemplo e configuração de rede permissiva (host-allowlist e CORS abertos), adequadas a uma prova de conceito isolada e não expostas a terceiros. Uma implantação em produção exigiria geração segura de chaves de validador (idealmente em HSM ou cofre de segredos), chave de conta operacional privada e gerenciada via variável de ambiente, e restrição de acesso ao RPC — itens fora do escopo desta prova de conceito.

## Objetivo

O fluxo simula a ancoragem de registros do QRCheck em uma rede blockchain local:

1. Um CSV de check-ins é lido localmente.
2. Cada linha é convertida para um registro canônico sem PII direta.
3. Os registros do batch geram um fingerprint SHA-256 incremental.
4. Apenas o fingerprint é enviado para a rede Besu/QBFT.
5. A verificação recalcula o fingerprint e compara com o valor gravado on-chain.
6. Uma evidência local pode ser gerada para auditoria, mas não deve ser versionada.

## Estrutura

```text
.
├── genesis.json          # Genesis da rede local
├── qbftConfigFile.json   # Configuração QBFT
├── tx-test/              # Scripts de ancoragem e transações
└── qrcheck-contrato/     # Contrato Solidity, testes e deploy
```

O `tx-test` concentra a prova de ancoragem direta: lê o CSV local, calcula o fingerprint do batch e grava esse hash na rede. O `qrcheck-contrato` contém a versão com smart contract, onde os fingerprints são registrados e consultados pelo contrato `RegistroDeBatches`.

## Scripts de Ancoragem

O arquivo `tx-test/anchorBatch.js` executa a etapa sem smart contract: o hash do batch é gravado diretamente no campo `data` de uma transação.

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

Esse arquivo não é versionado.

## Contrato Solidity

O projeto `qrcheck-contrato` contém o contrato `RegistroDeBatches`, que evolui a prova de conceito para um modelo com smart contract.

O contrato permite:

- registrar um batch por `batchId`;
- armazenar `fingerprint`, timestamp, tamanho e autor do registro;
- consultar batch por identificador;
- consultar batches por intervalo temporal;
- controlar permissão de organizadores por administradores.

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

O `.env` é ignorado pelo Git.

Também ficam fora do Git os CSVs locais, evidências geradas, estado dos nós Besu, `node_modules`, cachê e artifacts do Hardhat.

## Observações

- A rede Besu/QBFT usada aqui é local e experimental.
- Os fingerprints on-chain não substituem o armazenamento off-chain dos dados originais.
- A pseudonimização atual usa SHA-256 simples para fins de prova de conceito. Em um ambiente real, o ideal seria usar HMAC com segredo do servidor para reduzir risco de reidentificação por dicionário.

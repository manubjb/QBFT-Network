# QBFT Network

## O que é

Topologia exploratória da pesquisa: uma rede Hyperledger Besu/QBFT nativa, sem contêineres, com quatro validadores. Foi usada na validação funcional com os check-ins reais da JACITEC 2025, com a ancoragem do lote `B-8eaafaa1` registrada em [`ancoragem/ANCORAGEM.md`](ancoragem/ANCORAGEM.md).

## Versão citada

A tag `latinoware2026` é a versão citada como referência [13] no artigo publicado no Latin Science 2026. O nome da tag foi mantido para não quebrar a citação.

## Benchmark

A caracterização de desempenho com Hyperledger Caliper está no repositório <https://github.com/manubjb/QBFT-network-docker> (referência [14] do artigo).

## Estrutura

```text
.
├── nodes/                # node-1 a node-4: chaves e bases de dados dos nós (fora do Git)
├── ancoragem/            # agregador e ancoragem do lote; registro das execuções em ANCORAGEM.md
├── contrato/             # contrato RegistroDeBatches, testes Hardhat e módulo de deploy Ignition
├── exploratorio/         # testes iniciais de hash e de transação
├── genesis.json          # genesis da rede
└── qbftConfigFile.json   # configuração de entrada da geração da rede QBFT
```

As pastas `nodes/node-1` a `nodes/node-4`, com as chaves e as bases de dados dos nós, são criadas localmente e ficam fora do Git.

## Como a rede foi executada

Besu 26.6.0 nativo, com um processo por pasta `nodes/node-N`, executado de dentro dela. O node-1 é o bootnode. As portas P2P vão de 30303 a 30306 e as portas RPC HTTP, de 8545 a 8548.

Exemplo para o node-2:

```shell
cd nodes/node-2
besu --data-path=data --genesis-file=../../genesis.json --bootnodes=<enode do node-1> \
  --p2p-port=30304 --rpc-http-enabled --rpc-http-api=ETH,NET,QBFT \
  --host-allowlist="*" --rpc-http-cors-origins="all" --rpc-http-port=8546 \
  --profile=ENTERPRISE
```

O node-1 usa o mesmo comando sem `--bootnodes`, com P2P 30303 e RPC 8545.

## Como reproduzir

### Ancoragem

Rodar de dentro de `ancoragem/`, porque o caminho do CSV é relativo:

```shell
cd ancoragem
npm install
mkdir -p evidencias
PRIVATE_KEY=0x... node anchorBatch.js
```

O CSV de entrada fica em `ancoragem/dados/` e as evidências geradas, em `ancoragem/evidencias/`. As duas pastas ficam fora do Git. O CSV não é distribuído porque contém dados pessoais pseudonimizados.

A ancoragem `B-8eaafaa1` citada no artigo se reproduz pela tag `latinoware2026` (`git checkout latinoware2026`). Nessa tag vale a estrutura antiga: a ancoragem fica em `tx-test/` e os nós, em `Node-1` a `Node-4`.

### Contrato

```shell
cd contrato
npm install
npm test
```

Os testes do Hardhat rodam em rede local própria, sem depender dos nós Besu.

### Benchmark

A rede conteinerizada, os parâmetros do Caliper e os relatórios de cada execução usados no artigo estão em [QBFT-network-docker, tag latinoware2026](https://github.com/manubjb/QBFT-network-docker/tree/latinoware2026). As instruções de execução estão no README daquele repositório.

## Nota sobre o genesis

O `genesis.json` versionado abre a cadeia em que está a ancoragem citada no artigo: o hash do bloco 0 é `0x4a3cc3493a1eeebeab220695578b59838447e301af71c78a2e4e320d9fd50c0f`, conferido em 02/11/2026 (ver `ancoragem/ANCORAGEM.md`).

## Segurança

As chaves são de exemplo e a rede é local e isolada (chainId 1337). Elas não devem ser reutilizadas em nenhuma outra rede. As chaves dos nós continuam no histórico do repositório (commit `edd97b7`).

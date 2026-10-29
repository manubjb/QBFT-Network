# QBFT Network

## O que é

Topologia exploratória da pesquisa: uma rede Hyperledger Besu/QBFT nativa, sem contêineres, com quatro validadores. Foi usada na validação funcional com os check-ins reais da JACITEC 2025, com a ancoragem do lote `B-8eaafaa1` registrada em [`tx-test/ANCORAGEM.md`](tx-test/ANCORAGEM.md).

## Versão citada

A tag `latinoware2026` é a versão citada como referência [13] no artigo publicado no Latin Science 2026. O nome da tag foi mantido para não quebrar a citação.

## Benchmark

A caracterização de desempenho com Hyperledger Caliper está no repositório <https://github.com/manubjb/QBFT-network-docker> (referência [14] do artigo).

## Estrutura

```text
.
├── tx-test/              # agregador e ancoragem do lote; registro das execuções em ANCORAGEM.md
├── qrcheck-contrato/     # contrato RegistroDeBatches, testes Hardhat e módulo de deploy Ignition
├── genesis.json          # genesis da rede
└── qbftConfigFile.json   # configuração de entrada da geração da rede QBFT
```

Os diretórios `Node-1` a `Node-4`, com as chaves e as bases de dados dos nós, são criados localmente e ficam fora do Git.

## Como a rede foi executada

Besu 26.6.0 nativo, com um processo por pasta `Node-N`, executado de dentro dela. O Node-1 é o bootnode. As portas P2P vão de 30303 a 30306 e as portas RPC HTTP, de 8545 a 8548.

Exemplo para o Node-2:

```shell
cd Node-2
besu --data-path=data --genesis-file=../genesis.json --bootnodes=<enode do Node-1> \
  --p2p-port=30304 --rpc-http-enabled --rpc-http-api=ETH,NET,QBFT \
  --host-allowlist="*" --rpc-http-cors-origins="all" --rpc-http-port=8546 \
  --profile=ENTERPRISE
```

O Node-1 usa o mesmo comando sem `--bootnodes`, com P2P 30303 e RPC 8545.

## Como reproduzir

### Ancoragem

Rodar de dentro de `tx-test/`, porque o caminho do CSV é relativo:

```shell
cd tx-test
npm install
mkdir -p evidencias
PRIVATE_KEY=0x... node anchorBatch.js
```

O CSV de entrada fica em `tx-test/dados/` e as evidências geradas, em `tx-test/evidencias/`. As duas pastas ficam fora do Git. O CSV não é distribuído porque contém dados pessoais pseudonimizados.

### Contrato

```shell
cd qrcheck-contrato
npm install
npm test
```

Os testes do Hardhat rodam em rede local própria, sem depender dos nós Besu.

### Benchmark

A rede conteinerizada, os parâmetros do Caliper e os relatórios de cada execução usados no artigo estão em [QBFT-network-docker, tag latinoware2026](https://github.com/manubjb/QBFT-network-docker/tree/latinoware2026). As instruções de execução estão no README daquele repositório.

## Nota sobre o genesis

O `genesis.json` versionado foi alterado no commit `8952ac4` (19/08/2026), depois da criação das bases dos nós (10/06/2026). A execução registrada em `tx-test/ANCORAGEM.md` pode ter usado a configuração anterior.

## Segurança

As chaves são de exemplo e a rede é local e isolada (chainId 1337). Elas não devem ser reutilizadas em nenhuma outra rede. As chaves dos nós continuam no histórico do repositório (commit `edd97b7`).

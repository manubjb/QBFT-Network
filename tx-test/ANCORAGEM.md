# Ancoragem do batch de check-ins da JACITEC 2025

Registro da execução do `anchorBatch.js`. Nenhum dado pessoal neste arquivo: só contagens, hashes e
identificadores da transação.

## Execução

| Item | Valor |
|---|---|
| Data e hora | 02/10/2026 14:22:09 (horário de Brasília) — `geradoEm` 2026-10-02T17:22:09.069Z |
| Commit do repositório | `420aae6` ("docs: simplify root README"); o `anchorBatch.js` desta execução ainda não estava commitado |
| Rede | Besu/QBFT local deste repositório, 4 validadores, chainId 1337, RPC em `http://127.0.0.1:8545` |
| Versão do Besu | **26.6.0 nativo** (`besu/v26.6.0/osx-aarch_64/openjdk-java-25`), um processo por `Node-N/`, que é a mesma versão que criou as bases em `Node-*/data` |
| Observação sobre o Docker | O `docker-compose.yml` deste repositório declara `hyperledger/besu:latest` e **não foi usado**: os nós 2 a 4 ainda apontam para um bootnode de exemplo (`COLE_AQUI_O_ENODE_DO_NODE1`) e a tag `latest` abriria as bases criadas pelo 26.6.0 |

## Resultado

| Item | Valor |
|---|---|
| N (check-ins no batch) | 1864 |
| Participantes distintos | 633 |
| Organizadores distintos | 16 |
| batchId | `B-eaa56291` |
| fingerprint | `0xeaa56291a2932a9c1d99e0315a89b9a42ad28282065cf204580f1c35d70f29c4` |
| txHash | `0x8f67e62d3d7832d371311003b4e0efb8bf69ebfbd89c47b2ecfd987f5e5ec845` |
| Bloco | 52951 |
| Evidência gerada | `tx-test/evidencias/evidencia_B-eaa56291.json` (fora do Git) |

## Verificação

| Checagem | Resultado |
|---|---|
| Hash recuperado do ledger confere com o ancorado | sim |
| Fingerprint recalculado off-chain confere | sim |
| Adulteração de 1 check-in (1 segundo a mais) é detectada | sim |

Antes do cálculo do fingerprint, o script valida o identificador público: as 1864 linhas do CSV passaram
no formato UUID v4 e nenhuma linha ficou vazia ou inválida. Se alguma falhasse, a execução abortaria antes
de ancorar.

## Identificadores

- **Participante:** é o identificador público do QRCheck, um UUID v4, usado diretamente com o prefixo `P-`,
  sem hash. O UUID v4 já é aleatório, então hashear não acrescentaria proteção. Quem tiver o identificador
  público consegue ligar os registros; o conteúdo completo e os dados pessoais continuam fora do ledger.
- **Organizador:** ainda é identificado por hash SHA-256 do **nome** que aparece na coluna `Feito por`, sem
  chave. O conjunto de organizadores é pequeno e os nomes são adivinháveis, então esse identificador precisa
  do mesmo tratamento do participante, ou de HMAC com segredo do servidor, numa próxima versão.
- **Ancoragem anterior:** a de 09/07/2026 (batch `B-9b27a1b6`, bloco 13744) usava hash SHA-256 do **e-mail**
  do participante. Ela continua em `tx-test/evidencias/evidencia_B-9b27a1b6.json` e não é reproduzível a
  partir do CSV atual, porque o identificador de origem mudou. As duas ancoragens estão na mesma cadeia.

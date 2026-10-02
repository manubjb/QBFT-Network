# Ancoragem do batch de check-ins da JACITEC 2025

Registro das execuções do `anchorBatch.js`. Nenhum dado pessoal neste arquivo: só contagens, hashes e
identificadores da transação.

## Ancoragem de referência

| Item | Valor |
|---|---|
| Data e hora | 02/10/2026 14:54:16 (horário de Brasília) — `geradoEm` 2026-10-02T17:54:16.474Z |
| Commit do repositório | `420aae6` ("docs: simplify root README"); o `anchorBatch.js` desta execução ainda não estava commitado |
| Rede | Besu/QBFT local deste repositório, 4 validadores, chainId 1337, RPC em `http://127.0.0.1:8545` |
| Versão do Besu | **26.6.0 nativo** (`besu/v26.6.0/osx-aarch_64/openjdk-java-25`), um processo por `Node-N/`, que é a mesma versão que criou as bases em `Node-*/data` |
| Observação sobre o Docker | O `docker-compose.yml` deste repositório declara `hyperledger/besu:latest` e **não foi usado**: os nós 2 a 4 ainda apontam para um bootnode de exemplo (`COLE_AQUI_O_ENODE_DO_NODE1`) e a tag `latest` abriria as bases criadas pelo 26.6.0 |

### Critério do batch

Entram apenas os check-ins **realizados no período do evento, de 22 a 24/10/2025** (limites inclusive),
definido no script pelas constantes `EVENTO_INICIO` e `EVENTO_FIM`. O relatório exportado traz 1864
linhas; **3 foram excluídas por estarem fora desse período** (lançamentos posteriores à JACITEC), e
1861 entraram no batch. A checagem do identificador público roda depois do recorte: as 1861 linhas
passaram no formato UUID v4 e nenhuma ficou vazia ou inválida. Se alguma falhasse, a execução abortaria
antes de ancorar.

### Resultado

| Item | Valor |
|---|---|
| Linhas lidas do CSV | 1864 |
| Excluídas (fora do período) | 3 |
| N (check-ins no batch) | 1861 |
| Participantes distintos | 633 |
| Organizadores distintos | 16 |
| batchId | `B-8eaafaa1` |
| fingerprint | `0x8eaafaa1ebfa1e73cd52e45f2b2f12827b71d79ed00f24fc754d90b744dc5242` |
| txHash | `0x42d1ac8ceff61362aaaef29b9b96e5c26fbafbf23c8f5afa5ca8374993f805ff` |
| Bloco | 53010 |
| Evidência gerada | `tx-test/evidencias/evidencia_B-8eaafaa1.json` (fora do Git) |

### Verificação

| Checagem | Resultado |
|---|---|
| Hash recuperado do ledger confere com o ancorado | sim |
| Fingerprint recalculado off-chain confere | sim |
| Adulteração de 1 check-in (1 segundo a mais) é detectada | sim |

## Identificadores

- **Participante:** é o identificador público do QRCheck, um UUID v4, usado diretamente com o prefixo `P-`,
  sem hash. O UUID v4 já é aleatório, então hashear não acrescentaria proteção. Quem tiver o identificador
  público consegue ligar os registros; o conteúdo completo e os dados pessoais continuam fora do ledger.
- **Organizador:** ainda é identificado por hash SHA-256 do **nome** que aparece na coluna `Feito por`, sem
  chave. O conjunto de organizadores é pequeno e os nomes são adivinháveis, então esse identificador precisa
  do mesmo tratamento do participante, ou de HMAC com segredo do servidor, numa próxima versão.

## Ancoragens anteriores

- **02/10/2026, mesma data, substituída por esta:** ancoragem do relatório completo, sem recorte de período
  (N = 1864, batch `B-eaa56291`, bloco 52951, tx `0x8f67e62d…c845`).
- **09/07/2026:** batch `B-9b27a1b6`, N = 1864, bloco 13744, tx `0xe87de51c…a6fa`. Usava hash SHA-256 do
  **e-mail** do participante e não é reproduzível a partir do CSV atual, porque o identificador de origem
  mudou.

As três ancoragens estão na mesma cadeia, e as evidências das três continuam em `tx-test/evidencias/`.

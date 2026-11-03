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

## Verificação independente no ledger — 02/11/2026

- Nó consultado: Node-1 isolado (sem consenso, só leitura), Besu 26.6.0 nativo.
- Genesis que abre a cadeia: `genesis.json` versionado. Hash do bloco 0: `0x4a3cc3493a1eeebeab220695578b59838447e301af71c78a2e4e320d9fd50c0f`.
- `eth_getTransactionByHash(0x42d1ac8ceff61362aaaef29b9b96e5c26fbafbf23c8f5afa5ca8374993f805ff)`: bloco 53010 (`0xcf12`), timestamp do bloco 2026-10-02 17:54:13 UTC, `from` = `to` = `0x627306090abab3a6e1400e9345bc60c78a8bef57`, nonce 7, gasPrice 0.
- `input` da transação = `0x8eaafaa1ebfa1e73cd52e45f2b2f12827b71d79ed00f24fc754d90b744dc5242`, idêntico ao `fingerprint` de `evidencias/evidencia_B-8eaafaa1.json`.
- Consulta feita diretamente ao RPC, sem o script de ancoragem.

## Ancoragem com operador identificado por UUID público — 03/11/2026

Ancoragem **adicional**: não altera nem substitui a ancoragem de referência `B-8eaafaa1`, que continua sendo
a citada no artigo e se reproduz pela tag `latinoware2026`. Muda só o identificador do operador do check-in;
semente, recorte de período, ordem do lote e transação direta no campo `data` são os mesmos.

| Item | Valor |
|---|---|
| Data e hora | 03/11/2026 12:40:27 (horário de Brasília) — `geradoEm` 2026-11-03T15:40:27.276Z |
| Commit do repositório | `439d441` ("ancoragem: operador identificado pelo UUID público e conversão de fuso da nova extração") |
| Rede | a mesma cadeia: Besu/QBFT local, 4 validadores, chainId 1337, RPC em `http://127.0.0.1:8545` |
| Versão do Besu | 26.6.0 nativo (`besu/v26.6.0/osx-aarch_64/openjdk-java-25`), um processo por `Node-N/` |
| Genesis | `genesis.json` versionado; hash do bloco 0 `0x4a3cc3493a1eeebeab220695578b59838447e301af71c78a2e4e320d9fd50c0f` |
| Conta | `0x627306090abab3a6e1400e9345bc60c78a8bef57` (a mesma da ancoragem de referência), nonce 8 |

### Fonte

- CSV: `tx-test/dados/jacitec2025_checkins_operador_uuid.csv` (fora do Git), SHA-256
  `ba53c89eb0b00a7aa91efb8d543fd22e31aa9bb7f7da87c24fb50edbb1e21518`. É idêntico ao `checkins_2025.csv`
  de `QBFT-network-docker/demo-verificacao/dados/Relatórios/`.
- Extração: `query_2025.sql` da mesma pasta, SHA-256
  `921f146f5122a8cf396a0a504dcf75036db7495a8c663f5dab5058fb321d9d72`. Colunas `participante_id_public`,
  `atividade_nome`, `data_hora`, `feito_por_id` e `feito_por_role`.
- **Fuso:** a query formata `horario_checkin` sem fuso e a exportação saiu em UTC. As 1864 linhas estão
  exatamente 3 h à frente do CSV usado na ancoragem de referência, com os mesmos participantes e atividades
  na mesma ordem. O script converte `data_hora` de UTC para −03:00 antes do recorte de período e antes de
  montar o `ts`. Sem essa conversão, 68 check-ins da noite de 24/10 cairiam em 25/10 e ficariam fora do
  batch.

### Identificador do operador

- **Organizador:** `O-` + UUID v4 público do operador (`feito_por_id`), sem hash, como já é feito com o
  participante. O papel vem de `feito_por_role`, em minúsculas (`coordenador`, `auxiliar`). O script
  aborta se um UUID preenchido estiver fora do formato v4 ou vier sem papel.
- **Linha sem operador:** 1 linha do batch (o primeiro check-in em ordem cronológica) não tem
  `feito_por_id` nem `feito_por_role` e foi registrada como `O-desconhecido` / `desconhecido`. Na
  exportação anterior essa linha aparecia com o papel **Admin**. O QRCheck não guarda a autoria de
  check-ins feitos por admin.

### Resultado

| Item | Valor |
|---|---|
| Linhas lidas do CSV | 1864 |
| Excluídas (fora do período, após a conversão de fuso) | 3 |
| N (check-ins no batch) | 1861 |
| Participantes distintos | 633 |
| Organizadores distintos | 16, mais 1 linha sem operador |
| Papéis | coordenador 1078, auxiliar 782, desconhecido 1 |
| batchId | `B-82bbe349` |
| fingerprint | `0x82bbe34934ec491a932f5156ab5b06ca46181b84cc0ed23df1723c1476d4001e` |
| txHash | `0x7e8cb7abf1043b5f3000104f3550775268673d4ee5710e1dd8781edceab5c703` |
| Bloco | 53082 (timestamp 2026-11-03 15:40:24 UTC) |
| Evidência gerada | `tx-test/evidencias/evidencia_B-82bbe349.json` (fora do Git), SHA-256 `fc40f4baadd2f69f64d9df4e53c40daf4108d58a87f94babe57e3de0f78b8e1f` |

### Comparação com a ancoragem de referência

O script compara o batch com `evidencias/evidencia_B-8eaafaa1.json` antes de enviar a transação e aborta
se houver diferença fora dos campos do organizador. Resultado, posição a posição nos 1861 registros:

| Campo | Posições diferentes de `B-8eaafaa1` |
|---|---|
| `tipo`, `eventoId`, `participanteId`, `atividade`, `ts` | 0 |
| `organizadorId` | 1861 (hash do nome → UUID público) |
| `organizadorPapel` | 1861 (`Coordenador`/`Auxiliar`/`Admin` → `coordenador`/`auxiliar`/`desconhecido`) |

A evidência `evidencia_B-8eaafaa1.json` só foi lida; o script não sobrescreve evidência existente.

### Verificação

| Checagem | Resultado |
|---|---|
| Pré-voo: 4 nós com o mesmo bloco 0, chainId 1337, 3 pares cada, 4 validadores, blocos avançando | sim |
| Pré-voo: tx de `B-8eaafaa1` recuperada no bloco 53010 com o `input` publicado, mesmo hash do bloco 53010 nos 4 nós | sim |
| Hash recuperado do ledger confere com o ancorado | sim |
| Fingerprint recalculado off-chain confere | sim |
| Adulteração de 1 check-in (1 segundo a mais) é detectada | sim |
| `eth_getTransactionByHash` nos 4 nós: bloco 53082, mesmo hash de bloco, `from` = `to` = conta acima, `input` igual ao fingerprint | sim |
| Recibo da transação | `status` 0x1 |

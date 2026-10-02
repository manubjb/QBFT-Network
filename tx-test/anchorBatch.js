/**
 * anchorBatch.js — Etapa 1 (prova de infraestrutura fiel à Figura 1)
 *
 * Pipeline (miniatura da camada de auditabilidade, com N fixo e sem smart contract):
 *   FONTES  -> lê o CSV de check-ins do QRCheck
 *   AGREGADOR -> mapeia cada linha para um registro CANÔNICO com identificadores OPACOS
 *                (a PII fica fora do que é hasheado), acumula num BATCH e calcula o
 *                FINGERPRINT SHA-256 INCREMENTAL (h_i = SHA256(h_{i-1} || doc_i))
 *   BESU/QBFT -> ancora SÓ o fingerprint do batch no campo data de uma transação
 *   VERIFICAÇÃO -> recupera o hash do ledger, recalcula o fingerprint e compara
 *   ARMAZENAMENTO -> grava o conteúdo canônico do batch num JSON local (modela o BD off-ledger)
 *
 * O que evolui nas próximas etapas (documentado como delta, não como contradição):
 *   - campo data da transação  ->  smart contract Solidity (registrar/consultar por id/por intervalo)
 *   - batch único (N = todos)  ->  varredura do Batch Size na avaliação experimental
 *
 * Requisitos:  npm install ethers csv-parse
 */

const fs = require("fs");
const crypto = require("crypto");
const { parse } = require("csv-parse/sync");
const { JsonRpcProvider, Wallet } = require("ethers");

// ==================== AJUSTE ESTES VALORES ====================
const RPC_URL     = "http://127.0.0.1:8545";                 
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CSV_PATH    = "./dados/jacitec2025_checkins_id_publico.csv";
const EVENTO_ID   = "xiv-jornada-academica-ciencia-tecnologia-cultura";
const FP_SEED     = "QRCHECK-BATCH-v1";                       // domínio do fingerprint (evita colisão entre contextos)
// Recorte do batch: só entram os check-ins realizados no período do evento (limites inclusive).
// O relatório exportado também traz lançamentos feitos depois da JACITEC, que ficam fora do batch.
const EVENTO_INICIO = "2025-10-22";                           // 22/10/2025, primeiro dia do evento
const EVENTO_FIM    = "2025-10-24";                           // 24/10/2025, último dia do evento
// =============================================================

const sha256Hex = s => crypto.createHash("sha256").update(s, "utf8").digest("hex");

// Pseudonimização: identificador opaco e estável, derivado do valor real.
// (Em produção, troque por HMAC com segredo do servidor para não ser reversível por dicionário.)
const opaque = (prefix, value) =>
  prefix + "-" + sha256Hex(String(value).trim().toLowerCase()).slice(0, 12);

// "24/10/2025 21:33" -> "2025-10-24": só a data, para comparar com o período do evento.
const dataISO = br => {
  const [date] = String(br).trim().split(/\s+/);
  const [d, m, y] = date.split("/");
  return `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
};
const noPeriodoDoEvento = row => {
  const d = dataISO(row["Data/Hora Check-in"]);
  return d >= EVENTO_INICIO && d <= EVENTO_FIM;
};

// Formato esperado do "ID Participante": UUID v4 gerado pelo QRCheck.
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Serialização canônica: chaves ordenadas recursivamente -> a verificação recalcula o MESMO valor.
const sortKeys = v =>
  Array.isArray(v) ? v.map(sortKeys)
  : (v && typeof v === "object")
    ? Object.keys(v).sort().reduce((o, k) => { o[k] = sortKeys(v[k]); return o; }, {})
    : v;
const canon = o => JSON.stringify(sortKeys(o));

// "24/10/2025 21:33" -> "2025-10-24T21:33:00-03:00" (America/Sao_Paulo, sem DST)
function toISO(br) {
  const [date, time = "00:00"] = String(br).trim().split(/\s+/);
  const [d, m, y] = date.split("/");
  const [hh, mm] = time.split(":");
  return `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}T${hh.padStart(2,"0")}:${mm.padStart(2,"0")}:00-03:00`;
}

// Linha crua do CSV -> registro canônico do evento de check-in (sem PII)
function toCanonical(row) {
  const fp = String(row["Feito por"] || "");
  const mm = fp.match(/^(.*?)\s*\[(.*?)\]\s*$/);   // "Fulano [Auxiliar]" -> nome + papel
  return {
    tipo: "check-in",
    eventoId: EVENTO_ID,
    atividade: String(row["Atividade"] || "").trim(),   // título público, não é PII
    participanteId: "P-" + String(row["ID Participante"]).trim(),   // id público (UUID v4) do QRCheck: já é aleatório, não precisa de hash
    // ATENÇÃO: o organizador ainda é identificado por hash do NOME, que é adivinhável
    // num conjunto pequeno. Numa próxima versão ele precisa do mesmo tratamento do
    // participante (id público) ou de HMAC com segredo do servidor.
    organizadorId:  opaque("O", mm ? mm[1] : fp),
    organizadorPapel: mm ? mm[2] : "desconhecido",
    ts: toISO(row["Data/Hora Check-in"])
  };
}

// FINGERPRINT SHA-256 INCREMENTAL do batch (a ordem FIFO importa)
function batchFingerprint(docs, seed = FP_SEED) {
  let acc = sha256Hex(seed);
  for (const d of docs) acc = sha256Hex(acc + canon(d));
  return acc;
}

async function main() {
  if (!PRIVATE_KEY) {
    throw new Error("Defina PRIVATE_KEY no ambiente antes de rodar este script.");
  }

  // ---------- FONTES + AGREGADOR ----------
  const raw = fs.readFileSync(CSV_PATH, "utf8");
  const rows = parse(raw, { columns: true, skip_empty_lines: true, bom: true, trim: true });

  // ---------- RECORTE PELO PERÍODO DO EVENTO ----------
  const linhas = rows.filter(noPeriodoDoEvento);
  const foraDoPeriodo = rows.length - linhas.length;
  console.log("Linhas lidas do CSV    :", rows.length);
  console.log("No período do evento   :", linhas.length, `(${EVENTO_INICIO} a ${EVENTO_FIM})`);
  console.log("Excluídas (fora dele)  :", foraDoPeriodo);

  // ---------- CHECAGEM DO IDENTIFICADOR PÚBLICO (aborta antes de ancorar) ----------
  const ids = linhas.map(r => String(r["ID Participante"] ?? "").trim());
  const validos = ids.filter(id => UUID_V4.test(id));
  const invalidas = linhas.length - validos.length;
  console.log("Com id público válido  :", validos.length);
  console.log("Participantes distintos:", new Set(validos).size);
  if (invalidas > 0) {
    throw new Error(
      `${invalidas} linha(s) com "ID Participante" vazio ou fora do formato UUID v4. Ancoragem abortada.`
    );
  }

  const registros = linhas.map(toCanonical);               // batch único = todas as linhas do período (N fixo)
  const fingerprint = batchFingerprint(registros);
  const batchId = "B-" + fingerprint.slice(0, 8);          // id endereçado ao conteúdo
  const data = "0x" + fingerprint;                         // 32 bytes -> só o hash vai on-chain

  console.log("Evento        :", EVENTO_ID);
  console.log("Check-ins (N) :", registros.length);
  console.log("Batch         :", batchId);
  console.log("Fingerprint   :", "0x" + fingerprint);

  // ---------- BESU/QBFT: ancoragem ----------
  const provider = new JsonRpcProvider(RPC_URL);
  const wallet = new Wallet(PRIVATE_KEY, provider);
  const tx = await wallet.sendTransaction({ to: wallet.address, value: 0, data });
  const receipt = await tx.wait();
  console.log("\n[ANCORAGEM] txHash :", tx.hash);
  console.log("[ANCORAGEM] bloco  :", receipt.blockNumber);

  // ---------- VERIFICAÇÃO: recupera do ledger e compara ----------
  const onChain = await provider.getTransaction(tx.hash);
  const igualLedger = onChain.data.toLowerCase() === data.toLowerCase();
  const recalculado = batchFingerprint(registros);
  const igualRecalc = ("0x" + recalculado) === data;
  console.log("\n[VERIFICAÇÃO] hash no ledger confere?   ", igualLedger);
  console.log("[VERIFICAÇÃO] fingerprint recalculado?  ", igualRecalc);

  // ---------- Demonstração de detecção de adulteração ----------
  const adulterado = JSON.parse(JSON.stringify(registros));
  adulterado[0].ts = adulterado[0].ts.replace(/:00-03:00$/, ":01-03:00"); // muda 1 segundo
  const fpAdulterado = "0x" + batchFingerprint(adulterado);
  console.log("[ADULTERAÇÃO] alterar 1 check-in é detectado?", fpAdulterado !== data);

  // ---------- ARMAZENAMENTO auditável (modela o BD off-ledger) ----------
  const evidencia = {
    batchId, eventoId: EVENTO_ID, geradoEm: new Date().toISOString(),
    batchSize: registros.length, fingerprint: "0x" + fingerprint,
    ancoragem: { rede: "besu-qbft-local", txHash: tx.hash, blockNumber: receipt.blockNumber },
    registros
  };
  const out = `evidencias/evidencia_${batchId}.json`;
  fs.writeFileSync(out, JSON.stringify(evidencia, null, 2), "utf8");
  console.log("\n[BD] conteúdo canônico do batch salvo em:", out);
}

main().catch(console.error);

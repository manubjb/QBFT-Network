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
const CSV_PATH    = "./dados/jacitec2025_checkins_operador_uuid.csv";
// Ancoragem de referência (B-8eaafaa1, publicada no artigo): só leitura. Este batch tem de repetir a
// mesma sequência de (participante, atividade, ts); só os campos do organizador podem mudar.
const EVIDENCIA_REF = "evidencias/evidencia_B-8eaafaa1.json";
const EVENTO_ID   = "xiv-jornada-academica-ciencia-tecnologia-cultura";
const FP_SEED     = "QRCHECK-BATCH-v1";                       // domínio do fingerprint (evita colisão entre contextos)
// Recorte do batch: só entram os check-ins realizados no período do evento (limites inclusive).
// O relatório exportado também traz lançamentos feitos depois da JACITEC, que ficam fora do batch.
const EVENTO_INICIO = "2025-10-22";                           // 22/10/2025, primeiro dia do evento
const EVENTO_FIM    = "2025-10-24";                           // 24/10/2025, último dia do evento
// =============================================================

const sha256Hex = s => crypto.createHash("sha256").update(s, "utf8").digest("hex");

// A extração (TO_CHAR sem fuso) sai em UTC: "25/10/2025 00:33" (UTC) -> "24/10/2025 21:33" (-03:00).
// America/Sao_Paulo não tem horário de verão desde 2019, então o deslocamento é fixo em 3 h.
const DATA_HORA = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/;
function utcParaBrasilia(br) {
  const m = String(br).trim().match(DATA_HORA);
  if (!m) throw new Error(`"data_hora" fora do formato DD/MM/YYYY HH:MM. Ancoragem abortada.`);
  const [, d, mo, y, hh, mi] = m;
  const t = new Date(Date.UTC(+y, +mo - 1, +d, +hh, +mi) - 3 * 3600 * 1000);
  const z = n => String(n).padStart(2, "0");
  return `${z(t.getUTCDate())}/${z(t.getUTCMonth() + 1)}/${t.getUTCFullYear()} ${z(t.getUTCHours())}:${z(t.getUTCMinutes())}`;
}
const horaLocal = row => utcParaBrasilia(row["data_hora"]);

// "24/10/2025 21:33" -> "2025-10-24": só a data, para comparar com o período do evento.
const dataISO = br => {
  const [date] = String(br).trim().split(/\s+/);
  const [d, m, y] = date.split("/");
  return `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
};
const noPeriodoDoEvento = row => {
  const d = dataISO(horaLocal(row));
  return d >= EVENTO_INICIO && d <= EVENTO_FIM;
};

// Formato esperado dos identificadores públicos (participante e operador): UUID v4 gerado pelo QRCheck.
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
  const opId  = String(row["feito_por_id"] ?? "").trim();
  const papel = String(row["feito_por_role"] ?? "").trim();
  return {
    tipo: "check-in",
    eventoId: EVENTO_ID,
    atividade: String(row["atividade_nome"] || "").trim(),   // título público, não é PII
    participanteId: "P-" + String(row["participante_id_public"]).trim(),   // id público (UUID v4) do QRCheck: já é aleatório, não precisa de hash
    // O organizador recebe o mesmo tratamento do participante: id público (UUID v4), sem hash.
    // O QRCheck não guarda a autoria de check-ins feitos por admin: essas linhas vêm sem operador.
    organizadorId:  opId ? "O-" + opId : "O-desconhecido",
    organizadorPapel: papel || "desconhecido",
    ts: toISO(horaLocal(row))
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
  const ids = linhas.map(r => String(r["participante_id_public"] ?? "").trim());
  const validos = ids.filter(id => UUID_V4.test(id));
  const invalidas = linhas.length - validos.length;
  console.log("Com id público válido  :", validos.length);
  console.log("Participantes distintos:", new Set(validos).size);
  if (invalidas > 0) {
    throw new Error(
      `${invalidas} linha(s) com "participante_id_public" vazio ou fora do formato UUID v4. Ancoragem abortada.`
    );
  }

  // ---------- CHECAGEM DO OPERADOR (aborta antes de ancorar) ----------
  // Operador vazio é aceito (check-in feito por admin, sem autoria no QRCheck) e vira "O-desconhecido".
  // Operador preenchido tem de ser UUID v4 e ter papel.
  const ops = linhas.map(r => ({
    id: String(r["feito_por_id"] ?? "").trim(),
    papel: String(r["feito_por_role"] ?? "").trim()
  }));
  const semOperador = ops.filter(o => !o.id).length;
  const opInvalido  = ops.filter(o => o.id && !UUID_V4.test(o.id)).length;
  const opSemPapel  = ops.filter(o => o.id && !o.papel).length;
  console.log("Operadores distintos   :", new Set(ops.filter(o => o.id).map(o => o.id)).size);
  console.log("Linhas sem operador    :", semOperador);
  if (opInvalido > 0 || opSemPapel > 0) {
    throw new Error(
      `${opInvalido} linha(s) com "feito_por_id" fora do formato UUID v4 e ${opSemPapel} com operador sem "feito_por_role". Ancoragem abortada.`
    );
  }

  const registros = linhas.map(toCanonical);               // batch único = todas as linhas do período (N fixo)

  // ---------- COMPARAÇÃO COM A ANCORAGEM DE REFERÊNCIA (aborta antes de ancorar) ----------
  // Mesma sequência de (participante, atividade, ts), na mesma ordem: só o organizador pode mudar.
  const ref = JSON.parse(fs.readFileSync(EVIDENCIA_REF, "utf8")).registros;
  const chave = r => [r.participanteId, r.atividade, r.ts].join("\u0000");
  const divergentes = registros.filter((r, i) => !ref[i] || chave(r) !== chave(ref[i])).length;
  if (ref.length !== registros.length || divergentes > 0) {
    throw new Error(
      `Batch difere da referência ${EVIDENCIA_REF} fora dos campos do organizador ` +
      `(N ${registros.length} x ${ref.length}, ${divergentes} posição(ões) divergente(s)). Ancoragem abortada.`
    );
  }
  console.log("Igual à referência     :", `${registros.length} de ${ref.length} (participante, atividade, ts)`);

  const fingerprint = batchFingerprint(registros);
  const batchId = "B-" + fingerprint.slice(0, 8);          // id endereçado ao conteúdo
  const data = "0x" + fingerprint;                         // 32 bytes -> só o hash vai on-chain

  console.log("Evento        :", EVENTO_ID);
  console.log("Check-ins (N) :", registros.length);
  console.log("Batch         :", batchId);
  console.log("Fingerprint   :", "0x" + fingerprint);

  // A evidência de um batch já ancorado nunca é sobrescrita: aborta antes de enviar a transação.
  const out = `evidencias/evidencia_${batchId}.json`;
  if (fs.existsSync(out)) {
    throw new Error(`${out} já existe. Ancoragem abortada para não sobrescrever a evidência.`);
  }

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
  fs.writeFileSync(out, JSON.stringify(evidencia, null, 2), { encoding: "utf8", flag: "wx" });
  console.log("\n[BD] conteúdo canônico do batch salvo em:", out);
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;   // abortou: sinaliza falha para quem chamou o script
});

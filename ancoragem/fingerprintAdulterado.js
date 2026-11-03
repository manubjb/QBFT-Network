const fs = require("fs");
const crypto = require("crypto");

const EVIDENCIA = "./evidencias/evidencia_B-8eaafaa1.json";
const FP_SEED   = "QRCHECK-BATCH-v1";

const sha256Hex = s => crypto.createHash("sha256").update(s, "utf8").digest("hex");
const sortKeys = v =>
  Array.isArray(v) ? v.map(sortKeys)
  : (v && typeof v === "object")
    ? Object.keys(v).sort().reduce((o, k) => { o[k] = sortKeys(v[k]); return o; }, {})
    : v;
const canon = o => JSON.stringify(sortKeys(o));
function batchFingerprint(docs, seed = FP_SEED) {
  let acc = sha256Hex(seed);
  for (const d of docs) acc = sha256Hex(acc + canon(d));
  return acc;
}

const ev = JSON.parse(fs.readFileSync(EVIDENCIA, "utf8"));
const registros = ev.registros;

const recalculado = "0x" + batchFingerprint(registros);
console.log("N (registros)            :", registros.length);
console.log("Fingerprint ancorado     :", ev.fingerprint);
console.log("Fingerprint recalculado  :", recalculado);
console.log("Confere?                 :", recalculado === ev.fingerprint);

const adulterado = JSON.parse(JSON.stringify(registros));
const tsOriginal = adulterado[0].ts;
adulterado[0].ts = adulterado[0].ts.replace(/:00-03:00$/, ":01-03:00");
const fpAdulterado = "0x" + batchFingerprint(adulterado);

console.log("\nTimestamp original (1º)  :", tsOriginal);
console.log("Timestamp alterado (1º)  :", adulterado[0].ts);
console.log("Fingerprint adulterado   :", fpAdulterado);
console.log("Adulteração detectada?   :", fpAdulterado !== ev.fingerprint);

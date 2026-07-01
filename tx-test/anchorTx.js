const { JsonRpcProvider, Wallet, Transaction } = require("ethers");
const crypto = require("crypto");

const RPC_URL = "http://127.0.0.1:8545";
const PRIVATE_KEY = "0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3";

async function main() {
  const provider = new JsonRpcProvider(RPC_URL);
  const wallet = new Wallet(PRIVATE_KEY, provider);

  // ===== FASE A — GERAÇÃO DO HASH DO REGISTRO =====
  const registro = {
    eventoId: "EVT-2025-001",
    participanteId: "P-0421",
    tipo: "check-in",
    timestamp: "2025-11-10T14:30:00Z"
  };
  const payload = JSON.stringify(registro);
  const hashHex = crypto.createHash("sha256").update(payload).digest("hex");
  const data = "0x" + hashHex;
  console.log("Registro :", payload);
  console.log("SHA-256  :", hashHex);

  // ===== FASE B — GRAVAÇÃO: hash no campo data de uma transação =====
  const tx = await wallet.sendTransaction({
    to: wallet.address, // envia para si mesmo; só pra ancorar o data
    value: 0,
    data: data
  });
  console.log("\n[GRAVAÇÃO] tx enviada, hash:", tx.hash);
  const receipt = await tx.wait();
  console.log("[GRAVAÇÃO] incluída no bloco:", receipt.blockNumber);

  // ===== FASE C — RECUPERAÇÃO: buscar a tx pelo hash e conferir o data =====
  const onChain = await provider.getTransaction(tx.hash);
  console.log("\n[RECUPERAÇÃO] data on-chain:", onChain.data);
  const igual = onChain.data.toLowerCase() === data.toLowerCase();
  console.log("[RECUPERAÇÃO] data preservado?", igual);

  // prova de integridade: recomputar o hash do registro original e comparar
  const recomputado = "0x" + crypto.createHash("sha256").update(payload).digest("hex");
  console.log("[INTEGRIDADE] hash recomputado bate com o gravado?",
    recomputado.toLowerCase() === onChain.data.toLowerCase());
}

main().catch(console.error);
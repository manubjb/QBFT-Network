const crypto = require("crypto");

const registro = {
  evento: "QRCheck Experience",
  atividade: "Palestra Blockchain",
  participante: "123456789",
  timestamp: "2026-06-10T15:00:00"
};

const data = JSON.stringify(registro);

const hash = crypto
  .createHash("sha256")
  .update(data)
  .digest("hex");

console.log("Registro:");
console.log(registro);

console.log("\nJSON:");
console.log(data);

console.log("\nSHA-256:");
console.log(hash);

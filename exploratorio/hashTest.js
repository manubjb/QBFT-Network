const crypto = require("crypto");

const data =
  "Participante Emanuelly Borges presente na palestra Blockchain 2026";

const hash = crypto
  .createHash("sha256")
  .update(data)
  .digest("hex");

console.log("Texto:");
console.log(data);

console.log("\nSHA-256:");
console.log(hash);

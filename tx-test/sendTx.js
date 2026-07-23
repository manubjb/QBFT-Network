const { ethers } = require("ethers");

const RPC_URL = "http://127.0.0.1:8545";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const TO = "0xf17f52151EbEF6C7334FAD080c5704D77216b732";

async function main() {
  if (!PRIVATE_KEY) {
    throw new Error("Defina PRIVATE_KEY no ambiente antes de rodar este script.");
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log("From:", wallet.address);

  const balanceBefore = await provider.getBalance(wallet.address);
  console.log("Balance before:", ethers.formatEther(balanceBefore));

  const tx = await wallet.sendTransaction({
    to: TO,
    value: ethers.parseEther("1.0"),
  });

  console.log("Transaction hash:", tx.hash);

  const receipt = await tx.wait();
  console.log("Included in block:", receipt.blockNumber);

  const balanceAfter = await provider.getBalance(wallet.address);
  console.log("Balance after:", ethers.formatEther(balanceAfter));
}

main().catch(console.error);

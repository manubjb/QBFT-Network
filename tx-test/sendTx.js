const { ethers } = require("ethers");

const RPC_URL = "http://127.0.0.1:8545";

const PRIVATE_KEY =
  "0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3";

const TO = "0xf17f52151EbEF6C7334FAD080c5704D77216b732";

async function main() {
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

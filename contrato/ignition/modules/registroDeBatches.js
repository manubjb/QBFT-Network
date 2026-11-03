const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("RegistroDeBatchesModule", (m) => {
  const registro = m.contract("RegistroDeBatches");
  return { registro };
});

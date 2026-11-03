const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RegistroDeBatches", function () {
  let registro;      // o contrato implantado para cada teste
  let dono;          // a conta que faz o deploy (vira admin + organizador)
  let organizador;   // uma conta que vamos autorizar como organizadora
  let estranho;      // uma conta SEM permissão nenhuma

  // roda antes de CADA teste: cenário limpo
  beforeEach(async function () {
    [dono, organizador, estranho] = await ethers.getSigners();

    const Fabrica = await ethers.getContractFactory("RegistroDeBatches");
    registro = await Fabrica.deploy();   // contrato novo a cada teste
  });

  it("deve registrar um batch e recuperá-lo por id", async function () {
    const fingerprint = "0x9b27a1b6274aa2fb21d2c4b6371887feec42891524ae7cb4e4736e145f612841";
    const batchId = fingerprint;
    const tamanho = 1864;

    // AÇÃO: o dono (que é organizador) registra o batch
    await registro.registrarBatch(batchId, fingerprint, tamanho);

    // VERIFICAÇÃO: consultar por id deve devolver os dados corretos
    const dados = await registro.consultarPorId(batchId);

    expect(dados.fingerprint).to.equal(fingerprint);
    expect(dados.tamanho).to.equal(1864);
    expect(dados.existe).to.equal(true);
  });
  it("deve encontrar o batch na consulta por intervalo temporal", async function () {
    const fingerprint = "0x9b27a1b6274aa2fb21d2c4b6371887feec42891524ae7cb4e4736e145f612841";
    const tamanho = 1864;

    await registro.registrarBatch(fingerprint, fingerprint, tamanho);

    // janela ampla que certamente inclui o batch recém-registrado
    const lista = await registro.consultarPorIntervalo(0, 9999999999);

    expect(lista.length).to.equal(1);
    expect(lista[0]).to.equal(fingerprint);
  });

  it("deve reverter se uma conta nao autorizada tentar registrar", async function () {
    const fingerprint = "0x9b27a1b6274aa2fb21d2c4b6371887feec42891524ae7cb4e4736e145f612841";
    const tamanho = 1864;

    // 'estranho' nunca recebeu papel de organizador -> deve ser recusado
    await expect(
      registro.connect(estranho).registrarBatch(fingerprint, fingerprint, tamanho)
    ).to.be.revertedWith("apenas organizador autorizado");
  });
  it("nao deve permitir registrar o mesmo batch duas vezes", async function () {
    const fingerprint = "0x9b27a1b6274aa2fb21d2c4b6371887feec42891524ae7cb4e4736e145f612841";
    const tamanho = 1864;

    // primeiro registro: deve funcionar
    await registro.registrarBatch(fingerprint, fingerprint, tamanho);

    // segundo registro do MESMO batch: deve reverter
    await expect(
      registro.registrarBatch(fingerprint, fingerprint, tamanho)
    ).to.be.revertedWith("batch ja registrado");
  });
});

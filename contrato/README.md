# QRCheck Contrato

Subprojeto Hardhat com o contrato `RegistroDeBatches`, usado na Topologia 1 para registrar fingerprints de batches do QRCheck em uma rede Besu/QBFT local.

## Contrato

O contrato guarda apenas metadados mínimos de auditoria:

- `batchId`: identificador do batch;
- `fingerprint`: hash SHA-256 do batch canonicalizado;
- `registradoEm`: timestamp do bloco;
- `tamanho`: quantidade de registros no batch;
- `registradoPor`: conta que executou o registro.

O conteúdo completo dos check-ins permanece off-chain. A verificação acontece recalculando o fingerprint fora da blockchain e comparando com o valor consultado no contrato.

## Interface Principal

```solidity
function registrarBatch(bytes32 batchId, bytes32 fingerprint, uint256 tamanho) external;
function consultarPorId(bytes32 batchId) external view returns (...);
function consultarPorIntervalo(uint256 inicio, uint256 fim) external view returns (bytes32[] memory);
function autorizarOrganizador(address conta) external;
function revogarOrganizador(address conta) external;
```

Somente contas marcadas como `organizador` podem registrar batches. Somente `admin` pode autorizar ou revogar organizadores. A conta que faz o deploy inicia como `owner`, `admin` e `organizador`.

## Comandos

```shell
npm install
npm test
npm run compile
```

Deploy na rede Besu local:

```shell
PRIVATE_KEY=0x... npm run deploy:besu
```

O deploy usa o RPC `http://127.0.0.1:8545`, configurado em `hardhat.config.js`. A rede `besuDocker` usa `chainId` 1337.

## Saída Esperada Para Integração

Após o deploy, o outro repositório precisa apenas do endereço do contrato, do RPC da rede e da ABI do `RegistroDeBatches`. Com isso ele pode:

- enviar `batchId`, `fingerprint` e `tamanho` para `registrarBatch`;
- consultar `consultarPorId(batchId)` para verificar uma evidência;
- consultar `consultarPorIntervalo(inicio, fim)` para recuperar batches registrados em uma janela temporal.

Os arquivos gerados pelo Hardhat/Ignition para deployments locais são estado de execução e não devem ser tratados como fonte principal do projeto.

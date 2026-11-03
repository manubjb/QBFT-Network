// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract RegistroDeBatches {
    struct Batch {
        bytes32 fingerprint;    // o hash SHA-256 do batch
        uint256 registradoEm;   // quando foi gravado (timestamp do bloco)
        uint256 tamanho;        // N de check-ins do batch
        address registradoPor;  // qual conta registrou
        bool existe;            // marca se este batch realmente foi gravado
    }

    mapping(bytes32 => Batch) private batches;   // batchId => registro
    bytes32[] private ids;                        // ordem de registro dos batches
    address public owner;

    mapping(address => bool) public admin;         // gerencia permissões
    mapping(address => bool) public organizador;   // registra batches

    constructor() {
        owner = msg.sender;               // quem faz o deploy vira o dono
        admin[msg.sender] = true;         // dono é admin do sistema
        organizador[msg.sender] = true;   // e também organizador (pra testar com 1 conta)
    }

    modifier apenasAdmin() {
        require(admin[msg.sender], "apenas admin do sistema");
        _;
    }

    modifier apenasOrganizador() {
        require(organizador[msg.sender], "apenas organizador autorizado");
        _;
    }

    // (1) registro de hash de batch — ação de ORGANIZADOR
    function registrarBatch(bytes32 batchId, bytes32 fingerprint, uint256 tamanho)
        external
        apenasOrganizador
    {
        require(!batches[batchId].existe, "batch ja registrado");

        batches[batchId] = Batch(fingerprint, block.timestamp, tamanho, msg.sender, true);
        ids.push(batchId);
    }

    // gestão de organizadores — ação de ADMIN
    function autorizarOrganizador(address conta) external apenasAdmin {
        organizador[conta] = true;
    }

    function revogarOrganizador(address conta) external apenasAdmin {
        organizador[conta] = false;
    }
    // (2) consulta de hash por identificador
    function consultarPorId(bytes32 batchId)
        external
        view
        returns (bytes32 fingerprint, uint256 registradoEm, uint256 tamanho, address registradoPor, bool existe)
    {
        Batch memory b = batches[batchId];
        return (b.fingerprint, b.registradoEm, b.tamanho, b.registradoPor, b.existe);
    }
    // (3) consulta de hashes por intervalo temporal
    function consultarPorIntervalo(uint256 inicio, uint256 fim)
        external
        view
        returns (bytes32[] memory)
    {
        // 1ª passada: contar quantos batches caem na janela [inicio, fim]
        uint256 qtd = 0;
        for (uint256 i = 0; i < ids.length; i++) {
            uint256 t = batches[ids[i]].registradoEm;
            if (t >= inicio && t <= fim) {
                qtd++;
            }
        }

        // aloca o array de resultado no tamanho exato
        bytes32[] memory resultado = new bytes32[](qtd);

        // 2ª passada: preencher com os batchIds que caem na janela
        uint256 j = 0;
        for (uint256 i = 0; i < ids.length; i++) {
            uint256 t = batches[ids[i]].registradoEm;
            if (t >= inicio && t <= fim) {
                resultado[j] = ids[i];
                j++;
            }
        }

        return resultado;
    }
}

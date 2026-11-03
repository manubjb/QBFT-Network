# Exploratório

Testes iniciais da pesquisa, documentados no caderno de laboratório (Parte 1, §7 e §8). Não fazem parte da
ancoragem do lote, que está em [`../ancoragem/`](../ancoragem/).

| Script | O que faz | Dependências |
|---|---|---|
| `hashTest.js` | Calcula o SHA-256 de um texto fixo e imprime o texto e o hash. | só `crypto` do Node |
| `hashRegistro.js` | Serializa um registro de check-in fictício em JSON e calcula o SHA-256 desse JSON. | só `crypto` do Node |
| `sendTx.js` | Conecta ao RPC `http://127.0.0.1:8545` e **envia uma transação**: transfere 1 ETH da conta de `PRIVATE_KEY` para `0xf17f52151EbEF6C7334FAD080c5704D77216b732`, mostrando o saldo antes e depois. | pacote `ethers`, não instalado nesta pasta |

Os dois scripts de hash rodam sem rede:

```shell
node hashTest.js
node hashRegistro.js
```

O `sendTx.js` grava uma transação na cadeia em que estão as ancoragens citadas no artigo. Só deve ser
executado de propósito, com os nós de pé e `PRIVATE_KEY` definida no ambiente.

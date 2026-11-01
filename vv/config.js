/* Configuração comercial do site. Este arquivo é PÚBLICO: nunca coloque token ou segredo aqui.
   A chave do Web3Forms pode ficar aqui porque é pública por natureza (só envia para o e-mail cadastrado nela).
   O Access Token do Mercado Pago fica somente no Worker (ver LEIA-ME.md). */
window.VV_CONFIG = {
  precoUnitario: 99,
  frete: 25, // fixo por pedido
  qtdMaxima: 100,

  // Preço unitário por quantidade. null = condição ainda não cadastrada (o site mostra "sob consulta").
  // Ao preencher, atualize também a mesma tabela em worker-mercadopago/worker.js.
  faixas: [
    { min: 5, precoUnitario: null },
    { min: 10, precoUnitario: null },
  ],

  // Cor de cada modelo conforme as artes existentes.
  modelos: [
    { id: "acrilico-l", label: "Acrílico", cor: "Branca", img: "vv/img/placa-branca.webp" },
    { id: "quadrada", label: "Quadrada", cor: "Branca", img: "vv/img/placa-quadrada.webp" },
    { id: "avalie-l", label: "Avalie-nos", cor: "Preta", img: "vv/img/placa-preta.webp" },
    { id: "preta-cores", label: "Preta Cores", cor: "Preta", img: "vv/img/placa-preta-cores.webp" },
  ],

  whatsapp: "5515936182306",

  // Chave do web3forms.com (e-mail comercial). Vazio = pedido segue pelo WhatsApp.
  web3formsKey: "b0565e5f-a3ce-4c4d-a854-9be19d3e4204",

  // Endereço do Worker publicado. Vazio = sem pagamento on-line; a equipe combina o pagamento.
  pagamentoApi: "https://vitrine-viva-pagamento.worker-mercadopago.workers.dev",
};

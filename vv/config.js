/* Configuração comercial do site. Este arquivo é PÚBLICO: nunca coloque token ou segredo aqui.
   A chave do Web3Forms pode ficar aqui porque é pública por natureza (só envia para o e-mail cadastrado nela).
   O Access Token do Mercado Pago fica somente no Worker (ver LEIA-ME.md). */
window.VV_CONFIG = {
  frete: 25, // fixo por pedido
  qtdMaxima: 100,
  descontoConfigDepois: 20, // % sobre as placas quando o cliente personaliza ao receber. Igual ao Worker.

  // Condições por quantidade ainda não cadastradas: o site mostra "Consultar condições" pelo WhatsApp.
  faixas: [
    { min: 5, precoUnitario: null },
    { min: 10, precoUnitario: null },
  ],

  // Modelos e preços vêm de vv/catalogo.js, gerado por tools/catalogo.py.
  modelos: window.VV_CATALOGO.modelos,
  categorias: window.VV_CATALOGO.categorias,
  promoFim: window.VV_CATALOGO.promoFim, // ao passar desta hora, vale o preço cheio (o Worker faz o mesmo)

  whatsapp: "5515936182306",

  // Chave do web3forms.com (e-mail comercial). Vazio = pedido segue pelo WhatsApp.
  web3formsKey: "b0565e5f-a3ce-4c4d-a854-9be19d3e4204",

  // Endereço do Worker publicado. Vazio = sem pagamento on-line; a equipe combina o pagamento.
  pagamentoApi: "https://vitrine-viva-pagamento.worker-mercadopago.workers.dev",
};

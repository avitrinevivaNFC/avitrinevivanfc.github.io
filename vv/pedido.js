/* Formulário de pedido em etapas. Depende apenas de vv/config.js; funciona mesmo se a cena 3D falhar. */
(function () {
  "use strict";
  const C = window.VV_CONFIG;
  const CHAVE = "vv-pedido";
  const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const ETAPAS = ["Produto", "Personalização", "Entrega", "Revisão", "Pagamento"];
  const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");
  const modelo = (id) => C.modelos.find((m) => m.id === id);

  const TODOS = "todos"; // aba inicial: mostra o catálogo inteiro
  const novoEstado = () => ({
    etapa: 0, cat: TODOS, modelo: C.modelos[0].id, qtd: "1", distintas: false,
    unidades: [novaUnidade(C.modelos[0].id)], comprador: { pais: "Brasil" }, pedidoId: null, emailEnviado: false,
  });
  function novaUnidade(m) { return { modelo: m, estab: "", google: "", nfc: "", qr: "", extra: "", obs: "" }; }

  let E;
  try { E = JSON.parse(sessionStorage.getItem(CHAVE)) || novoEstado(); } catch { E = novoEstado(); }
  if (!modelo(E.modelo) || !E.unidades.every((u) => modelo(u.modelo))) E = novoEstado(); // modelo saiu do catálogo
  if (E.cat !== TODOS) E.cat = modelo(E.modelo).cat; // pedidos em andamento salvos antes das categorias
  const salvar = () => { try { sessionStorage.setItem(CHAVE, JSON.stringify(E)); } catch { /* navegação privada */ } };

  /* Sem WebGL a cena 3D não abre: libera a rolagem e mostra a apresentação estática */
  (function semWebgl() {
    const tela = document.createElement("canvas");
    let ok = false;
    try { ok = !!(tela.getContext("webgl2") || tela.getContext("webgl")); } catch { /* sem suporte */ }
    if (ok) return;
    document.documentElement.classList.add("vv-sem3d");
    document.getElementById("vv-estatico").hidden = false;
  })();

  /* Valores */
  const qtdValida = () => /^\d+$/.test(E.qtd) && +E.qtd >= 1 && +E.qtd <= C.qtdMaxima;
  /* Quantidade por modelo. O Worker recalcula o mesmo total a partir destes itens. */
  function itensDoPedido() {
    if (!E.distintas) return [{ id: E.modelo, qtd: +E.qtd }];
    const n = new Map();
    E.unidades.forEach((u) => n.set(u.modelo, (n.get(u.modelo) || 0) + 1));
    return [...n].map(([id, qtd]) => ({ id, qtd }));
  }
  function valores() {
    if (!qtdValida()) return null;
    const itens = itensDoPedido();
    const subtotal = itens.reduce((t, i) => t + i.qtd * modelo(i.id).preco, 0);
    return { q: +E.qtd, itens, subtotal, frete: C.frete, total: subtotal + C.frete };
  }

  /* DOM */
  function h(tag, props, ...filhos) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (k === "on") for (const [ev, fn] of Object.entries(v)) el.addEventListener(ev, fn);
      else if (k === "class") el.className = v;
      else if (v === true) el.setAttribute(k, "");
      else if (v !== false && v != null) el.setAttribute(k, v);
    }
    for (const f of filhos.flat(Infinity)) if (f != null) el.append(f);
    return el;
  }
  const form = document.getElementById("vv-form");
  const resumo = document.getElementById("vv-resumo");
  const etapas = document.getElementById("vv-etapas");
  const erros = {};

  function campo(rotulo, id, valor, aoMudar, o = {}) {
    const attrs = { id, name: id, "aria-invalid": erros[id] ? "true" : null, "aria-describedby": erros[id] ? id + "-e" : null,
      autocomplete: o.auto, inputmode: o.modo, type: o.tipo || (o.area || o.opcoes ? null : "text"), placeholder: o.ph, maxlength: o.max };
    const on = { input: (e) => { aoMudar(e.target.value); salvar(); }, change: (e) => { aoMudar(e.target.value); salvar(); } };
    let ctl;
    if (o.opcoes) {
      ctl = h("select", { ...attrs, on }, h("option", { value: "" }, "Selecione"), o.opcoes.map((x) => h("option", { value: x.v ?? x, selected: (x.v ?? x) === valor }, x.t ?? x)));
    } else if (o.area) {
      ctl = h("textarea", { ...attrs, rows: 3, "data-lenis-prevent": true, on }, valor || "");
    } else {
      ctl = h("input", { ...attrs, value: valor || "", on });
    }
    return h("label", { class: "vv-campo", for: id },
      h("span", null, rotulo, o.opcional ? h("i", null, " (opcional)") : null), ctl,
      o.ajuda ? h("small", { class: "vv-ajuda" }, o.ajuda) : null,
      erros[id] ? h("small", { class: "vv-erro", id: id + "-e" }, erros[id]) : null);
  }

  /* Validação */
  function urlOk(v) {
    try {
      const u = new URL(/^[a-z]+:/i.test(v) ? v : "https://" + v);
      return /^https?:$/.test(u.protocol) && u.hostname.includes(".");
    } catch { return false; }
  }
  const normalizaUrl = (v) => (/^https?:\/\//i.test(v.trim()) ? v.trim() : "https://" + v.trim());

  function validar(etapa) {
    Object.keys(erros).forEach((k) => delete erros[k]);
    if (etapa === 0 && !qtdValida()) erros.qtd = `Informe um número inteiro de 1 a ${C.qtdMaxima}.`;
    else if (etapa === 0 && !E.distintas && +E.qtd < (modelo(E.modelo).min || 1)) erros.qtd = `Este modelo tem pedido mínimo de ${modelo(E.modelo).min} unidades.`;
    if (etapa === 1) {
      if (E.distintas) itensDoPedido().forEach(({ id, qtd }) => {
        const min = modelo(id).min || 1;
        if (qtd < min) erros[`u${E.unidades.findIndex((u) => u.modelo === id)}-modelo`] = `${modelo(id).label} tem pedido mínimo de ${min} unidades.`;
      });
      E.unidades.forEach((u, i) => {
        if (!u.estab.trim()) erros[`u${i}-estab`] = "Informe o nome do estabelecimento.";
        if (u.google.trim() && !urlOk(u.google)) erros[`u${i}-google`] = "Confira o link. Exemplo: https://g.page/r/...";
        for (const k of ["nfc", "qr"]) {
          if (!u[k].trim()) erros[`u${i}-${k}`] = "Informe o link de destino.";
          else if (!urlOk(u[k])) erros[`u${i}-${k}`] = "Confira o link. Exemplo: https://instagram.com/seunegocio";
        }
      });
    }
    if (etapa === 2) {
      const c = E.comprador, d = (s) => (s || "").replace(/\D/g, "");
      if ((c.nome || "").trim().split(/\s+/).length < 2) erros.nome = "Informe o nome completo.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email || "")) erros.email = "Informe um e-mail válido.";
      if (d(c.fone).length < 10 || d(c.fone).length > 13) erros.fone = "Informe o telefone com DDD.";
      if (d(c.cep).length !== 8) erros.cep = "O CEP tem 8 dígitos.";
      for (const [k, t] of [["rua", "o endereço"], ["numero", "o número"], ["bairro", "o bairro"], ["cidade", "a cidade"], ["uf", "o estado"], ["pais", "o país"]])
        if (!(c[k] || "").trim()) erros[k] = `Informe ${t}.`;
    }
    return Object.keys(erros).length === 0;
  }

  /* Normaliza a lista de placas conforme quantidade e modo */
  function ajustarUnidades() {
    if (!qtdValida()) return; // digitação em andamento: não descarta dados já preenchidos
    if (+E.qtd === 1) E.distintas = false;
    const alvo = E.distintas ? +E.qtd : 1;
    while (E.unidades.length < alvo) E.unidades.push(novaUnidade(E.modelo));
    E.unidades.length = alvo;
    if (!E.distintas) E.unidades[0].modelo = E.modelo;
  }

  /* Etapas */
  function vaiPara(n) {
    E.etapa = n; salvar(); desenhar();
    document.getElementById("comprar").scrollIntoView({ block: "start" });
  }
  function acoes(voltar, avancarTxt) {
    return h("div", { class: "vv-acoes" },
      voltar != null ? h("button", { type: "button", class: "vv-btn sec", on: { click: () => { Object.keys(erros).forEach((k) => delete erros[k]); vaiPara(voltar); } } }, "VOLTAR") : null,
      h("button", { type: "submit", class: "vv-btn" }, avancarTxt));
  }

  function etapaProduto() {
    const lista = E.cat === TODOS ? C.modelos : C.modelos.filter((m) => m.cat === E.cat);
    return [
      h("h3", null, "Escolha sua placa"),
      h("fieldset", { class: "vv-opcoes vv-cats" }, h("legend", null, "Categoria"),
        [{ id: TODOS, label: "Todos os itens" }, ...C.categorias].map((c) => h("label", { class: "vv-op" },
          h("input", { type: "radio", name: "cat", value: c.id, checked: c.id === E.cat, on: { change: () => {
            E.cat = c.id;
            // Filtrar mantém o modelo já escolhido quando ele continua visível.
            if (c.id !== TODOS && modelo(E.modelo).cat !== c.id) escolherModelo(C.modelos.find((m) => m.cat === c.id).id);
            salvar(); desenhar(); } } }), c.label))),
      h("fieldset", { class: "vv-opcoes vv-modelos" }, h("legend", null, "Modelo"),
        lista.map((m) => h("label", { class: "vv-op" },
          h("input", { type: "radio", name: "modelo", value: m.id, checked: m.id === E.modelo, on: { change: () => {
            const antes = E.qtd; escolherModelo(m.id); if (E.qtd !== antes) desenhar(); else desenharResumo(); } } }),
          m.img ? h("img", { src: m.img, alt: "", loading: "lazy" }) : h("span", { class: "vv-sem-foto" }, "Foto em breve"),
          m.label,
          h("b", { class: "vv-op-preco" }, brl(m.preco)),
          [m.tam, m.min > 1 ? `Mínimo de ${m.min} unidades` : null, m.nota].filter(Boolean).map((t) => h("small", { class: "vv-op-info" }, t))))),
      h("div", { class: "vv-campo" },
        h("label", { for: "qtd" }, h("span", { style: "display:block;margin-bottom:.35rem;font-size:.88rem;font-weight:500" }, "Quantidade")),
        h("div", { class: "vv-qtd" },
          h("button", { type: "button", "aria-label": "Diminuir quantidade", on: { click: () => mudaQtd(Math.max(1, (parseInt(E.qtd, 10) || 1) - 1)) } }, "−"),
          h("input", { id: "qtd", name: "qtd", inputmode: "numeric", value: E.qtd, "aria-invalid": erros.qtd ? "true" : null, "aria-describedby": erros.qtd ? "qtd-e" : null,
            on: { input: (e) => { E.qtd = e.target.value.trim(); ajustarUnidades(); salvar(); desenharResumo(); } } }),
          h("button", { type: "button", "aria-label": "Aumentar quantidade", on: { click: () => mudaQtd(Math.min(C.qtdMaxima, (parseInt(E.qtd, 10) || 0) + 1)) } }, "+"),
          h("button", { type: "button", on: { click: () => mudaQtd(5) } }, "5 un."),
          h("button", { type: "button", on: { click: () => mudaQtd(10) } }, "10 un.")),
        erros.qtd ? h("small", { class: "vv-erro", id: "qtd-e" }, erros.qtd) : null),
      acoes(null, "CONTINUAR"),
    ];
  }
  function escolherModelo(id) {
    const minAnterior = modelo(E.modelo).min || 1, min = modelo(id).min || 1, atual = parseInt(E.qtd, 10) || 0;
    E.modelo = id;
    // O mínimo do modelo anterior não pode virar a quantidade do próximo, que pode custar bem mais.
    if (!E.distintas && (atual < min || (minAnterior > 1 && atual === minAnterior))) { E.qtd = String(min); delete erros.qtd; }
    ajustarUnidades(); salvar();
  }
  function mudaQtd(n) { E.qtd = String(n); delete erros.qtd; ajustarUnidades(); salvar(); desenhar(); }

  function blocoUnidade(u, i) {
    const p = `u${i}-`, set = (k) => (v) => { u[k] = v; };
    const usarGoogle = (k) => h("button", { type: "button", class: "vv-link", on: { click: () => {
      const v = document.getElementById(p + "google").value.trim();
      if (v) { u[k] = v; document.getElementById(p + k).value = v; salvar(); } else document.getElementById(p + "google").focus();
    } } }, "Usar o link do Google");
    return h("div", { class: "vv-unidade" },
      E.distintas ? h("h4", null, `Placa ${i + 1} de ${E.qtd}`) : null,
      E.distintas ? campo("Modelo", p + "modelo", u.modelo, (v) => { if (v) u.modelo = v; }, { opcoes: C.modelos.map((m) => ({ v: m.id, t: `${rotuloModelo(m.id)} · ${brl(m.preco)}` })) }) : null,
      campo("Nome do estabelecimento", p + "estab", u.estab, set("estab"), { max: 120 }),
      campo("Link da página de avaliações do Google", p + "google", u.google, set("google"), { opcional: true, tipo: "url", modo: "url", ph: "https://g.page/r/..." }),
      campo("Destino do NFC", p + "nfc", u.nfc, set("nfc"), { tipo: "url", modo: "url", ph: "https://" }), usarGoogle("nfc"),
      h("div", { style: "height:1.1rem" }),
      campo("Destino do QR Code", p + "qr", u.qr, set("qr"), { tipo: "url", modo: "url", ph: "https://" }), usarGoogle("qr"),
      h("div", { style: "height:1.1rem" }),
      campo("Instagram, cardápio, iFood ou outro canal", p + "extra", u.extra, set("extra"), { opcional: true, max: 300 }),
      campo("Observações sobre a configuração", p + "obs", u.obs, set("obs"), { opcional: true, area: true, max: 1000 }));
  }
  function etapaPersonalizacao() {
    return [
      h("h3", null, "Informe seus links"),
      +E.qtd > 1 ? h("label", { class: "vv-check" },
        h("input", { type: "checkbox", checked: E.distintas, on: { change: (e) => { E.distintas = e.target.checked; ajustarUnidades(); salvar(); desenhar(); } } }),
        h("span", null, `Estas ${E.qtd} placas têm estabelecimentos ou links diferentes`)) : null,
      +E.qtd > 1 && !E.distintas ? h("p", { class: "vv-ajuda", style: "margin-bottom:1rem" }, `Os dados abaixo valem para as ${E.qtd} placas.`) : null,
      E.unidades.map(blocoUnidade),
      acoes(0, "CONTINUAR"),
    ];
  }

  async function buscarCep(v) {
    const cep = v.replace(/\D/g, "");
    if (cep.length !== 8) return;
    const msg = document.getElementById("cep-msg");
    msg.textContent = "Buscando endereço...";
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const d = await r.json();
      if (d.erro) throw 0;
      const c = E.comprador;
      c.rua = d.logradouro || c.rua; c.bairro = d.bairro || c.bairro; c.cidade = d.localidade || c.cidade; c.uf = d.uf || c.uf;
      salvar(); desenhar();
      document.getElementById("cep-msg").textContent = "Endereço preenchido. Confira e corrija se preciso.";
      document.getElementById("numero").focus();
    } catch { msg.textContent = "Não encontramos o CEP. Preencha o endereço manualmente."; }
  }
  function etapaEntrega() {
    const c = E.comprador, set = (k) => (v) => { c[k] = v; };
    const cep = campo("CEP", "cep", c.cep, set("cep"), { modo: "numeric", auto: "postal-code", max: 9 });
    cep.querySelector("input").addEventListener("input", (e) => buscarCep(e.target.value));
    cep.append(h("small", { class: "vv-ajuda", id: "cep-msg", "aria-live": "polite" }));
    return [
      h("h3", null, "Seus dados e entrega"),
      campo("Nome completo", "nome", c.nome, set("nome"), { auto: "name", max: 120 }),
      h("div", { class: "vv-linha d2" },
        campo("E-mail", "email", c.email, set("email"), { tipo: "email", modo: "email", auto: "email", max: 120 }),
        campo("Telefone ou WhatsApp", "fone", c.fone, set("fone"), { tipo: "tel", modo: "tel", auto: "tel", ph: "(11) 90000-0000", max: 20 })),
      cep,
      h("div", { class: "vv-linha d3" },
        campo("Endereço", "rua", c.rua, set("rua"), { auto: "address-line1", max: 160 }),
        campo("Número", "numero", c.numero, set("numero"), { max: 12 })),
      h("div", { class: "vv-linha d2" },
        campo("Complemento", "compl", c.compl, set("compl"), { opcional: true, auto: "address-line2", max: 80 }),
        campo("Bairro", "bairro", c.bairro, set("bairro"), { max: 80 })),
      h("div", { class: "vv-linha d2" },
        campo("Cidade", "cidade", c.cidade, set("cidade"), { auto: "address-level2", max: 80 }),
        campo("Estado", "uf", c.uf, set("uf"), { opcoes: UFS, auto: "address-level1" })),
      campo("País", "pais", c.pais, set("pais"), { auto: "country-name", max: 60 }),
      h("p", { class: "vv-aviso" }, `Frete fixo de ${brl(C.frete)} por pedido.`),
      acoes(1, "REVISAR PEDIDO"),
    ];
  }

  const rotuloModelo = (id) => { const m = modelo(id); return m.cor ? `${m.label} (${m.cor.toLowerCase()})` : m.label; };
  const enderecoTexto = () => {
    const c = E.comprador;
    return `${c.rua}, ${c.numero}${c.compl ? " - " + c.compl : ""}, ${c.bairro}, ${c.cidade}/${c.uf}, CEP ${c.cep}, ${c.pais}`;
  };

  function etapaRevisao() {
    const c = E.comprador;
    const par = (t, v) => (v ? [h("dt", null, t), h("dd", null, v)] : []);
    return [
      h("h3", null, "Revise o seu pedido"),
      h("dl", { class: "vv-rev" },
        par("Quantidade", E.qtd),
        E.distintas ? [] : par("Modelo", rotuloModelo(E.modelo)),
        E.unidades.map((u, i) => [
          par(E.distintas ? `Placa ${i + 1}` : "Estabelecimento", E.distintas ? `${u.estab} · ${rotuloModelo(u.modelo)}` : u.estab),
          par("Avaliações do Google", u.google), par("NFC", u.nfc), par("QR Code", u.qr), par("Outros canais", u.extra), par("Observações", u.obs),
        ]).flat(),
        par("Comprador", `${c.nome} · ${c.email} · ${c.fone}`),
        par("Entrega", enderecoTexto())),
      acoes(2, "CONFIRMAR PEDIDO"),
    ];
  }

  /* Texto do pedido: mesmo conteúdo para e-mail e WhatsApp */
  function textoPedido() {
    const v = valores(), c = E.comprador, linhas = [
      `Pedido: ${E.pedidoId}`, `Data: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`, "",
      `COMPRADOR`, `${c.nome}`, `E-mail: ${c.email}`, `Telefone: ${c.fone}`, "",
      `ENTREGA`, enderecoTexto(), "",
      `PRODUTO`, ...v.itens.map((i) => `${i.qtd} × ${rotuloModelo(i.id)}: ${brl(i.qtd * modelo(i.id).preco)}`), E.distintas ? "Placas com configurações diferentes:" : `Modelo: ${rotuloModelo(E.modelo)}. Mesmos dados para todas as unidades.`,
    ];
    E.unidades.forEach((u, i) => {
      linhas.push("", E.distintas ? `PLACA ${i + 1}: ${rotuloModelo(u.modelo)}` : "CONFIGURAÇÃO", `Estabelecimento: ${u.estab}`);
      if (u.google) linhas.push(`Google: ${normalizaUrl(u.google)}`);
      linhas.push(`NFC: ${normalizaUrl(u.nfc)}`, `QR Code: ${normalizaUrl(u.qr)}`);
      if (u.extra) linhas.push(`Outros canais: ${u.extra}`);
      if (u.obs) linhas.push(`Observações: ${u.obs}`);
    });
    linhas.push("", `VALORES`, `Subtotal: ${brl(v.subtotal)}`, `Frete: ${brl(v.frete)}`, `Total: ${brl(v.total)}`, "",
      `Pagamento: NÃO CONFIRMADO. Confira no Mercado Pago pela referência ${E.pedidoId}.`);
    return linhas.join("\n");
  }
  const linkWhats = (t) => `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(t)}`;

  function gerarId() {
    const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const a = crypto.getRandomValues(new Uint8Array(6));
    const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return `VV-${d}-${[...a].map((x) => abc[x % abc.length]).join("")}`;
  }

  async function comTempo(url, op, ms = 20000) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms);
    try { return await fetch(url, { ...op, signal: ctl.signal }); } finally { clearTimeout(t); }
  }

  let enviando = false, painel = null, urlPagamento = null;

  async function enviarEmail() {
    const r = await comTempo("https://api.web3forms.com/submit", {
      method: "POST", headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        access_key: C.web3formsKey, subject: `Novo pedido ${E.pedidoId} - ${E.unidades[0].estab}`, from_name: "Site Vitrine Viva",
        email: E.comprador.email, name: E.comprador.nome, botcheck: form.querySelector("[name=botcheck]")?.value || "", message: textoPedido(),
      }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.success) throw new Error("email");
  }
  async function criarPagamento() {
    const v = valores();
    const r = await comTempo(`${C.pagamentoApi}/pagamento`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ pedido: E.pedidoId, itens: v.itens, totalExibido: v.total }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.checkout_url) throw new Error(d.erro || "pagamento");
    return d.checkout_url;
  }

  async function confirmar() {
    if (enviando) return;
    enviando = true;
    E.pedidoId = E.pedidoId || gerarId();
    salvar();
    painel = { tipo: "enviando" };
    E.etapa = 4; desenhar();
    try {
      if (!C.web3formsKey) { painel = { tipo: "whatsapp" }; return; }
      if (!E.emailEnviado) {
        try { await enviarEmail(); } catch { painel = { tipo: "erroEmail" }; return; }
        E.emailEnviado = true; salvar();
        if (window.fbq) window.fbq("track", "Lead");
      }
      if (!C.pagamentoApi) { painel = { tipo: "semPagamento" }; return; }
      try { urlPagamento = await criarPagamento(); painel = { tipo: "pagar" }; }
      catch { painel = { tipo: "erroPagamento" }; }
    } finally { enviando = false; desenhar(); }
  }

  function etapaPagamento() {
    if (!painel) painel = { tipo: E.emailEnviado ? "erroPagamento" : "erroEmail" };
    const id = h("p", { class: "vv-ajuda", style: "margin-top:1rem" }, `Pedido ${E.pedidoId}`);
    const novo = h("button", { type: "button", class: "vv-btn sec", on: { click: novoPedido } }, "FAZER OUTRO PEDIDO");
    const whats = (txt) => h("a", { class: "vv-btn", target: "_blank", rel: "noopener noreferrer", href: linkWhats(textoPedido()) }, txt);
    const retry = (txt) => h("button", { type: "button", class: "vv-btn", on: { click: confirmar } }, txt);
    const voltar = h("button", { type: "button", class: "vv-btn sec", on: { click: () => { painel = null; vaiPara(3); } } }, "CORRIGIR DADOS");
    switch (painel.tipo) {
      case "enviando": return [h("h3", null, "Enviando seu pedido..."), h("p", { class: "vv-aviso", role: "status" }, "Aguarde um instante e não feche esta página.")];
      case "pagar": return [h("h3", null, "Seu pedido está quase pronto!"),
        h("p", { class: "vv-aviso", role: "status" }, "Recebemos os dados. O pagamento está pendente: conclua pelo Mercado Pago. Após a confirmação, nossa equipe dará andamento à preparação da sua placa."),
        h("div", { class: "vv-acoes" }, h("a", { class: "vv-btn", id: "vv-pagar", href: urlPagamento }, `PAGAR ${brl(valores().total)} NO MERCADO PAGO`)), id];
      case "whatsapp": return [h("h3", null, "Envie o pedido pelo WhatsApp"),
        h("p", { class: "vv-aviso" }, "Falta um passo: seu pedido só chega à nossa equipe depois que você enviar a mensagem. O pagamento é combinado no atendimento."),
        h("div", { class: "vv-acoes" }, whats("ENVIAR PELO WHATSAPP"), voltar), id];
      case "semPagamento": return [h("h3", null, "Recebemos os dados do seu pedido"),
        h("p", { class: "vv-aviso", role: "status" }, "O pagamento ainda está pendente. Nossa equipe entrará em contato para concluir a compra."),
        h("div", { class: "vv-acoes" }, novo), id];
      case "erroEmail": return [h("h3", null, "Não conseguimos enviar seu pedido"),
        h("p", { class: "vv-aviso erro", role: "alert" }, "Seus dados continuam aqui e nada foi cobrado. Tente de novo ou envie pelo WhatsApp."),
        h("div", { class: "vv-acoes" }, retry("TENTAR NOVAMENTE"), whats("ENVIAR PELO WHATSAPP"), voltar), id];
      default: return [h("h3", null, "O pagamento não abriu"),
        h("p", { class: "vv-aviso erro", role: "alert" }, "Seu pedido foi recebido, mas não conseguimos abrir o Mercado Pago. Nada foi cobrado. Tente de novo ou fale conosco."),
        h("div", { class: "vv-acoes" }, retry("TENTAR NOVAMENTE"), whats("FALAR PELO WHATSAPP")), id];
    }
  }

  function novoPedido() {
    E = novoEstado(); painel = null; urlPagamento = null;
    try { sessionStorage.removeItem(CHAVE); } catch { /* */ }
    desenhar();
  }

  /* Desenho */
  function desenharResumo() {
    const v = valores();
    const lin = (a, b, cl) => h("div", { class: cl }, h("span", null, a), h("span", null, b));
    if (!v) { resumo.replaceChildren(h("h3", null, "Resumo"), h("small", null, "Informe uma quantidade válida para ver os valores.")); return; }
    resumo.replaceChildren(...[h("h3", null, "Resumo"),
      ...v.itens.map((i) => lin(`${i.qtd} × ${rotuloModelo(i.id)}`, brl(i.qtd * modelo(i.id).preco))),
      lin("Frete fixo", brl(v.frete)),
      lin("Total", brl(v.total), "tot"),
      h("small", null, C.pagamentoApi ? "Pagamento processado pelo Mercado Pago, em ambiente próprio." : "O pagamento é combinado depois do envio do pedido."),
    ].filter(Boolean));
  }
  function desenhar() {
    etapas.replaceChildren(...ETAPAS.map((t, i) => h("li", { class: i < E.etapa ? "feita" : i === E.etapa ? "atual" : "", "aria-current": i === E.etapa ? "step" : null }, t)));
    const fn = [etapaProduto, etapaPersonalizacao, etapaEntrega, etapaRevisao, etapaPagamento][E.etapa];
    const isca = h("input", { type: "text", name: "botcheck", tabindex: "-1", autocomplete: "off", "aria-hidden": "true", style: "position:absolute;left:-9999px" });
    form.replaceChildren(isca, ...fn().flat(Infinity).filter((x) => x != null));
    desenharResumo();
  }

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    if (E.etapa === 3) return void confirmar();
    if (E.etapa > 3) return;
    if (validar(E.etapa)) { ajustarUnidades(); vaiPara(E.etapa + 1); return; }
    desenhar();
    const prim = form.querySelector('[aria-invalid="true"]');
    if (prim) prim.focus();
  });

  window.vvSelecionarModelo = (id) => {
    const m = modelo(id);
    if (!m || E.etapa !== 0) return;
    if (E.cat !== TODOS) E.cat = m.cat;
    escolherModelo(id); desenhar();
  };

  /* Revenda */
  (function faixas() {
    const alvo = document.getElementById("vv-faixas");
    const bloco = (q, preco) => {
      const v = preco == null
        ? h("small", null, h("a", { target: "_blank", rel: "noopener noreferrer", href: linkWhats(`Olá! Quero saber as condições para ${q} placas NFC + QR Code.`) }, "Consultar condições"))
        : h("small", null, `${brl(preco)} por unidade · ${brl(q * preco)} + frete fixo de ${brl(C.frete)}`);
      return h("div", null, h("b", null, `${q} ${q > 1 ? "unidades" : "unidade"}`), v);
    };
    const menor = Math.min(...C.modelos.map((m) => m.preco));
    alvo.replaceChildren(h("div", null, h("b", null, "Por unidade"), h("small", null, `A partir de ${brl(menor)}, conforme o modelo, + frete fixo de ${brl(C.frete)} por pedido`)),
      ...C.faixas.map((f) => bloco(f.min, f.precoUnitario)));
  })();

  /* Retorno do Mercado Pago: o status exibido vem sempre da consulta ao Worker, nunca da URL */
  (async function retorno() {
    const p = new URLSearchParams(location.search), pedido = p.get("pedido");
    if (!pedido) return;
    const ordem = p.get("order_id");
    history.replaceState(null, "", location.pathname);
    const caixa = document.getElementById("vv-retorno"), t = document.getElementById("vv-retorno-t"), m = document.getElementById("vv-retorno-p");
    document.getElementById("vv-retorno-x").onclick = () => { caixa.hidden = true; };
    t.textContent = "Consultando o pagamento..."; m.textContent = `Pedido ${pedido}`; caixa.hidden = false;
    const MSG = {
      approved: ["Pagamento aprovado", "Obrigado! Nossa equipe vai iniciar a preparação da sua placa."],
      pending: ["Pagamento pendente", "O Mercado Pago ainda não confirmou. Se pagou com Pix ou boleto, a confirmação pode levar algum tempo."],
      in_process: ["Pagamento em análise", "O Mercado Pago está analisando o pagamento e informará o resultado."],
      rejected: ["Pagamento recusado", "Nada foi cobrado. Tente novamente com outra forma de pagamento."],
      cancelled: ["Pagamento cancelado", "Este pagamento foi cancelado. Fale conosco para retomar o pedido."],
    };
    let status = null;
    try {
      if (C.pagamentoApi && ordem) {
        const r = await comTempo(`${C.pagamentoApi}/status?order_id=${encodeURIComponent(ordem)}&pedido=${encodeURIComponent(pedido)}`, {});
        if (r.ok) status = (await r.json()).status;
      }
    } catch { /* tratado abaixo */ }
    const [a, b] = MSG[status] || ["Não confirmamos o pagamento", "Não conseguimos consultar o status agora. Se você pagou, o comprovante do Mercado Pago vale até a confirmação; fale conosco se precisar."];
    t.textContent = a; m.textContent = `${b} Pedido ${pedido}.`;
    if (status === "approved") {
      if (window.fbq && !sessionStorage.getItem("vv-comprou-" + pedido)) {
        window.fbq("track", "Purchase", { value: E.pedidoId === pedido && valores() ? valores().total : undefined, currency: "BRL", content_ids: [pedido] });
        try { sessionStorage.setItem("vv-comprou-" + pedido, "1"); } catch { /* */ }
      }
      novoPedido();
    }
  })();

  const wa = document.getElementById("vv-wa-rodape");
  wa.href = linkWhats("Olá! Vim pelo site da Vitrine Viva e tenho uma dúvida sobre a Placa de Avaliação Google com NFC + QR Code.");

  // Pedido já enviado ou com painel perdido no recarregamento volta à revisão, sem reenviar e-mail.
  if (E.etapa === 4 && !E.emailEnviado) E.etapa = 3;
  ajustarUnidades();
  desenhar();
  if (E.etapa === 4) confirmar();
})();

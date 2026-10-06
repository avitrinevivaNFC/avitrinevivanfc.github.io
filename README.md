# AURA — Landing Page

Landing page editorial com um objeto 3D que percorre a página conforme o scroll (inspirada na Stereoscope Coffee).

**Stack:** React 19 · Vite · Three.js + React Three Fiber/Drei · GSAP ScrollTrigger · Lenis · Tailwind CSS v4

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera /dist
```

## Trocar o produto e os mockups

Todo o conteúdo vem de `src/data/product.json`:

| Campo | Efeito |
| --- | --- |
| `title`, `brand`, `name`, `price`, `collection` | Título do site, nav, rodapé fixo e seção final |
| `colors` | `[papel, tinta]` — fundo/texto da página |
| `models[]` | Mockups 3D que aparecem nos círculos do cabeçalho (o primeiro é o padrão) |
| `hero.headline` | Uma linha por item |
| `sections[]` | Uma tela por item. `align: "left" \| "right"` posiciona o texto; o objeto 3D vai para o lado oposto |
| `cta` | Botão e nota da seção final |

Tipos de mockup (`models[].type`):

| type | Modelo | Campos |
| --- | --- | --- |
| `stand` | Display em L com a arte impressa | `texture`, `finish: "clear" \| "black"` |
| `plaque` (ou `square`) | Placa de acrílico grosso; proporção segue a arte (quadrada, retrato…) | `texture`, `backing: "black"` opcional |
| `embossed` | Display em L com "G" e ícone de aproximação em relevo | `finish: "gold" \| "black"` |
| `card` | Cartão de visita em papel | `texture` |
| `glb` | Qualquer modelo `.glb` (centralizado e normalizado) | `path` |

`texture` é a arte da frente, já plana (sem perspectiva), em `public/textures/` (cantos transparentes são respeitados). `scale` opcional ajusta o tamanho de peças mais largas. Cada modelo tem um `thumb` (imagem do círculo). Para regenerar as miniaturas depois de mudar um modelo:

```bash
npm run build && npx vite preview --port 4173 &
npm run thumbs        # grava public/thumbs/<id>.webp
```

No cabeçalho, mover o mouse gira o mockup em 360° nos dois eixos (de lado a lado da tela = uma volta; de cima a baixo = uma volta). No celular, arrastar sobre a placa faz o mesmo.

Modelos `.glb` devem ser comprimidos com Draco antes de publicar:

```bash
npx gltf-pipeline -i modelo.glb -o public/models/modelo.glb -d
```

## Música de fundo

Coloque o arquivo em `public/audio/musica-de-fundo.mp3` (ou ajuste `music.src` no `product.json`). Volume em `music.volume` (0.4 = 40%).
A música começa no primeiro toque/clique do visitante (os navegadores bloqueiam som automático), fica em loop, pausa quando a aba sai de foco e pode ser ligada/desligada pelo botão "Som" no rodapé. Sem o arquivo, o botão não aparece.
Use apenas uma faixa que você tenha licença para usar em site comercial.

## Como a coreografia funciona

- `src/lib/choreography.js` gera uma pose (posição, rotação, escala) por seção a partir de `sections[].align`.
- Uma única timeline GSAP com `scrub` percorre essas poses; como cada seção tem exatamente 100svh, o segmento *i* da timeline corresponde ao scroll entre a seção *i* e *i+1*.
- A timeline escreve num objeto mutável (`pose`) que o loop do R3F lê a cada frame — sem re-render do React.
- Por cima disso: flutuação constante (`Float`) e inclinação suave seguindo o mouse (lerp).
- Lenis é dirigido pelo ticker do GSAP, mantendo ScrollTrigger sincronizado. Com `prefers-reduced-motion`, Lenis e a flutuação são desativados.
- Em telas retrato o objeto ocupa a metade de cima e o texto vai para baixo, preservando a legibilidade.
- A iluminação de estúdio usa `Lightformer`s (sem download de HDR).

## Publicar no GitHub Pages

Site principal: **https://avitrinevivanfc.github.io/** (repositório `avitrinevivaNFC/avitrinevivanfc.github.io`, branch `main`):

```bash
npm run deploy:vitrine
```

Cópia antiga em thiagodobronx.github.io:

```bash
npm run deploy   # build + push de dist/ para o branch gh-pages
```

Página: https://thiagodobronx.github.io/ — em *Settings → Pages*, a fonte deve ser o branch `gh-pages`, pasta `/ (root)`.

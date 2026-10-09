import ModelPicker from './ModelPicker';
import { whatsappUrl } from '../lib/whatsapp';
import { productParams, track } from '../lib/pixel';

const pad = (n) => String(n).padStart(2, '0');

/** Opening screen: only the 3D plaque (rendered by the fixed canvas), the model picker and a hint. */
export function Showcase({ title, models, flyingSlot, onSelect }) {
  return (
    <section id="top" data-section className="relative flex h-svh items-end justify-center pb-[10vh]">
      <h1 className="sr-only">{title}</h1>
      {/* Touch area for spinning; outside it the page scrolls normally. */}
      <div data-spin-stage className="absolute top-[12vh] right-[24vw] bottom-[24vh] left-[6vw] md:top-[10vh] md:right-[30vw] md:bottom-[18vh] md:left-[30vw] md:cursor-grab" />

      <div className="absolute top-1/2 right-4 z-30 -translate-y-1/2 md:right-[5vw]">
        <ModelPicker models={models} flyingSlot={flyingSlot} onSelect={onSelect} />
      </div>

      <p data-hero-fade className="label relative z-20 text-center opacity-50">
        <span className="hidden md:inline">Clique e arraste a placa para girar 360°</span>
        <span className="md:hidden">Arraste a placa para girar 360°</span>
      </p>
    </section>
  );
}

export function Hero({ hero }) {
  const [first, ...rest] = hero.headline;
  return (
    <section data-section className="relative flex h-svh items-end px-[8vw] pb-[17vh] md:items-center md:pb-0">
      <div className="relative z-20">
        <h2 className="font-serif text-[10.5vw] leading-[0.9] font-normal whitespace-nowrap italic md:text-[8vw]">
          <span className="line">
            <span data-reveal-line>{first}</span>
          </span>
          {rest.map((word) => (
            <span key={word} className="line pl-[4vw] md:pl-[8vw]">
              <span data-reveal-line>
                {word}
              </span>
            </span>
          ))}
        </h2>
        <p data-reveal className="label mt-6 max-w-xs leading-loose text-ink/50 md:mt-10">
          {hero.tagline}
        </p>
      </div>
    </section>
  );
}

export function StorySection({ section, index }) {
  const right = section.align === 'right';
  return (
    <section
      data-section
      className={`relative flex h-svh items-end px-[8vw] pb-[14vh] md:items-center md:pb-0 ${right ? 'justify-end' : 'justify-start'}`}
    >
      {/* Depth layer: oversized numeral behind the copy, on the text side, so
          the 3D object (always on the opposite side) never covers it. */}
      <span
        data-parallax
        aria-hidden="true"
        className={`pointer-events-none absolute bottom-[6vh] z-0 font-serif text-[38vw] leading-none italic opacity-[0.06] select-none md:top-[4%] md:bottom-auto md:text-[24vw] ${
          right ? 'right-[4vw]' : 'left-[4vw]'
        }`}
      >
        {pad(index + 1)}
      </span>

      <div className={`relative z-20 max-w-md ${right ? 'text-right' : 'text-left'}`}>
        <span data-reveal className="label block opacity-40">
          {section.label}
        </span>
        <h2 className="my-4 font-serif text-4xl md:my-6 md:text-7xl leading-[0.95] italic">
          <span className="line">
            <span data-reveal-line>{section.title}</span>
          </span>
        </h2>
        <p data-reveal className="text-sm leading-relaxed opacity-70">
          {section.body}
        </p>
      </div>
    </section>
  );
}

export function Finale({ product, index, model }) {
  const { number, purchase } = product.whatsapp;
  const message = purchase.replace('{model}', model.label).replace('{price}', product.price);
  return (
    <section data-section className="relative flex h-svh items-end px-[8vw] pt-[8vw] pb-[14vh] md:pb-[calc(8vw+3.5rem)]">
      {/* Touch area to spin the mockup at 100% scroll (invisible). */}
      <div data-spin-stage className="absolute top-[10vh] right-[6vw] bottom-[55vh] left-[6vw] md:top-[8vh] md:right-[36vw] md:bottom-[42vh] md:left-[36vw] md:cursor-grab" />
      <div className="relative z-20 flex w-full flex-col gap-10 pt-10 md:flex-row md:items-end md:justify-between">
        <div>
          <div data-reveal className="text-7xl font-thin opacity-10 md:text-8xl">
            {pad(index)}
          </div>
          <p data-reveal className="label mt-6 flex items-center gap-3">
            <span className="whitespace-nowrap opacity-50">
              {product.brand} — {product.name}
            </span>
            {product.promo && (
              <span className="rounded-full bg-ink px-2.5 py-1 text-[9px] leading-none tracking-[0.2em] whitespace-nowrap text-paper">
                {product.promo.short}
                <span className="hidden md:inline"> {product.promo.long}</span>
              </span>
            )}
          </p>
          <p data-reveal className="mt-2 flex items-baseline gap-4 font-serif italic">
            {product.oldPrice && (
              <s className="text-xl opacity-40 decoration-1" aria-label={`De ${product.oldPrice}`}>
                {product.oldPrice}
              </s>
            )}
            <span className="text-4xl" aria-label={`Por ${product.price}`}>
              {product.price}
            </span>
          </p>
        </div>
        <div data-reveal className="flex flex-col items-start gap-4 md:items-end">
          <a
            href={whatsappUrl(number, message)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('InitiateCheckout', { ...productParams(model), num_items: 1 })}
            className="group relative inline-block cursor-pointer overflow-hidden rounded-full border border-ink px-12 py-5 transition-colors duration-500 hover:text-paper"
          >
            <span className="label relative z-10 font-semibold">{product.cta.label}</span>
            <span className="absolute inset-0 translate-y-full bg-ink transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0" />
          </a>
          <span className="label opacity-40">{product.cta.note}</span>
          <span className="label text-[9px] opacity-30">{product.copyright}</span>
        </div>
      </div>
    </section>
  );
}

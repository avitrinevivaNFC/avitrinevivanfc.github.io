import { forwardRef } from 'react';
import { whatsappUrl } from '../lib/whatsapp';
import { track } from '../lib/pixel';

const Nav = forwardRef(function Nav({ product, music }, progressRef) {
  const contact = whatsappUrl(product.whatsapp.number, product.whatsapp.contact);
  return (
    <>
      <nav className="label fixed top-0 z-50 flex w-full items-start justify-between p-6 text-ink md:p-10">
        <a href={contact} target="_blank" rel="noopener noreferrer" onClick={() => track('Contact')} className="font-serif text-xl tracking-tight normal-case italic">
          {product.title}
        </a>
        <a href={contact} target="_blank" rel="noopener noreferrer" onClick={() => track('Contact')} className="text-right leading-relaxed">
          {product.collection.split(' / ').map((part, i) => (
            <span key={i} className="block">
              {part}
            </span>
          ))}
        </a>
      </nav>
      <div className="label pointer-events-none fixed bottom-0 z-50 flex w-full items-end justify-between p-6 text-ink md:p-10">
        <span>
          {product.name} —{' '}
          {product.oldPrice && <s className="mr-2 hidden opacity-50 md:inline">{product.oldPrice}</s>}
          {product.price}
        </span>
        <span className="flex items-end gap-5 md:gap-8">
          {music?.available && (
            <button
              type="button"
              data-sound-toggle
              onClick={music.toggle}
              aria-pressed={music.playing}
              aria-label={music.playing ? 'Desligar música' : 'Ligar música'}
              title={product.music?.title}
              className="pointer-events-auto flex cursor-pointer items-end gap-2 uppercase"
            >
              <span aria-hidden="true" className={`sound-bars ${music.playing ? 'is-playing' : ''}`}>
                <i />
                <i />
                <i />
                <i />
              </span>
              <span className="hidden md:inline">Som</span>
            </button>
          )}
          <span>
            Scroll <span ref={progressRef}>000</span>
          </span>
        </span>
      </div>
    </>
  );
});

export default Nav;

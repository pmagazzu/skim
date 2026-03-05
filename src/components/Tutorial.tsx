import { useState } from 'react';

interface TutorialProps {
  onClose: () => void;
}

const SLIDES = [
  {
    title: 'THE OBJECTIVE',
    icon: '🏦',
    content: [
      'You work at a casino. Every night, you play poker hands to fill the vault.',
      'Fill the vault before you run out of hands — then take your cut and move on.',
      'Three levels per round. Three rounds total. Don\'t get caught.',
    ],
  },
  {
    title: 'YOUR CARDS',
    icon: '🃏',
    content: [
      'You\'re dealt 8 cards from your deck. 3 community cards sit in the middle — available to everyone.',
      'Select 1 to 5 cards to form a poker hand. The better the hand, the more chips it scores.',
      'Unused community cards stay put. Used ones get replaced from the deck automatically.',
    ],
  },
  {
    title: 'POKER HANDS',
    icon: '♠',
    content: [
      'Hands rank lowest to highest:',
      'High Card → Pair → Two Pair → Three of a Kind → Straight → Flush → Full House → Four of a Kind → Straight Flush → Royal Flush',
      'Each hand has a base chip value that grows when you level it up in the shop.',
    ],
  },
  {
    title: 'THE CHIP STACK',
    icon: '🔴',
    content: [
      'Your chip stack fires after every hand. Each chip adds a bonus on top of your score.',
      'Chips fire left to right — order matters. Some chips multiply what came before.',
      'Buy new chips in the shop. Sell old ones. Reorder them to maximize combos.',
    ],
  },
  {
    title: 'THE SKIM',
    icon: '💰',
    content: [
      'Not all chips go to the vault. You skim a percentage off the top into your personal wallet.',
      'Your wallet pays for shop items. The rest fills the vault.',
      'Upgrade your skim rate in the shop to take a bigger cut — but the vault still needs filling.',
    ],
  },
  {
    title: 'THE SHOP',
    icon: '🛒',
    content: [
      'Between rounds, spend your personal chips in the shop.',
      'Buy chips, booster packs, consumables, hand level upgrades, and table upgrades.',
      'Use the FORGE to apply modifiers to cards in your deck — enhancing them permanently.',
    ],
  },
  {
    title: 'CONSUMABLES',
    icon: '🎫',
    content: [
      'Consumables are one-time-use power-ups you carry into rounds.',
      'Scratch Ticket: next hand scores ×1–5 chips.',
      'Roulette: bet chips — double or nothing.',
      'Burned Hand: sacrifice a hand for ×3 on the next one.',
      'High Card Draw: draw 2 extra cards this hand.',
    ],
  },
  {
    title: 'TIPS',
    icon: '💡',
    content: [
      'You get 2 free discards per round — use them to fish for better hands.',
      'Extra discards cost chips and get pricier each time.',
      'Timer ticking down? It auto-discards when it hits zero — watch the bar.',
      'Tap a chip during a round to pick it up and reorder. Double-tap for details.',
      'Good luck. Don\'t get greedy.',
    ],
  },
];

export function Tutorial({ onClose }: TutorialProps) {
  const [page, setPage] = useState(0);
  const slide = SLIDES[page];
  const isLast = page === SLIDES.length - 1;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.95)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        display: 'flex', flexDirection: 'column',
        gap: 20, height: '100%', maxHeight: 700,
        justifyContent: 'space-between',
      }}>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {SLIDES.map((_, i) => (
            <div key={i} onClick={() => setPage(i)} style={{
              width: i === page ? 24 : 8, height: 8, borderRadius: 4,
              background: i === page ? 'var(--accent-bright, #f0c040)' : i < page ? '#4b5563' : '#1f2937',
              cursor: 'pointer', transition: 'all 0.2s',
            }} />
          ))}
        </div>

        {/* Slide content */}
        <div style={{
          flex: 1,
          background: '#0d0a07',
          border: '1px solid #3a2e1e',
          borderRadius: 16, padding: '24px 20px',
          display: 'flex', flexDirection: 'column', gap: 16,
          overflow: 'hidden',
        }}>
          {/* Icon + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 36 }}>{slide.icon}</span>
            <div style={{
              fontFamily: "'VT323',monospace", fontSize: 28,
              color: 'var(--accent-bright, #f0c040)', letterSpacing: '0.1em',
              lineHeight: 1.1,
            }}>
              {slide.title}
            </div>
          </div>

          <div style={{ width: '100%', height: 1, background: '#2a2520' }} />

          {/* Content lines */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
            {slide.content.map((line, i) => (
              <div key={i} style={{
                fontFamily: "'VT323',monospace", fontSize: 20,
                color: line.startsWith('High Card') || line.startsWith('Scratch') || line.startsWith('Roulette') || line.startsWith('Burned') || line.startsWith('High Card D') ? '#9ca3af' : '#d1d5db',
                lineHeight: 1.45,
                paddingLeft: line.startsWith('High Card') || line.startsWith('Scratch') || line.startsWith('Roulette') || line.startsWith('Burned') || line.startsWith('High Card D') ? 12 : 0,
                borderLeft: line.startsWith('High Card') || line.startsWith('Scratch') || line.startsWith('Roulette') || line.startsWith('Burned') || line.startsWith('High Card D') ? '2px solid #3a2e1e' : 'none',
              }}>
                {line}
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 10 }}>
          {page > 0 && (
            <button
              onClick={() => setPage(p => p - 1)}
              style={{
                flex: 1, padding: '14px 0', borderRadius: 10, cursor: 'pointer',
                background: 'transparent', border: '1px solid #3a2e1e',
                color: '#6b5a3e', fontFamily: "'VT323',monospace", fontSize: 20,
              }}
            >
              ← BACK
            </button>
          )}
          {!isLast ? (
            <button
              onClick={() => setPage(p => p + 1)}
              style={{
                flex: 2, padding: '14px 0', borderRadius: 10, cursor: 'pointer',
                background: '#92400e', border: '1px solid #ca8a04',
                color: '#fde68a', fontFamily: "'VT323',monospace", fontSize: 22,
              }}
            >
              NEXT →
            </button>
          ) : (
            <button
              onClick={onClose}
              style={{
                flex: 2, padding: '14px 0', borderRadius: 10, cursor: 'pointer',
                background: 'linear-gradient(135deg, #92400e, #ca8a04)',
                border: '1px solid #fde68a',
                color: '#fde68a', fontFamily: "'VT323',monospace", fontSize: 22,
                boxShadow: '0 0 20px rgba(202,138,4,0.3)',
              }}
            >
              LET'S PLAY ▶
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'VT323',monospace", fontSize: 17, color: '#374151',
            textAlign: 'center',
          }}
        >
          skip tutorial
        </button>
      </div>
    </div>
  );
}

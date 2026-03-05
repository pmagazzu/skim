import { useState, useEffect, useRef } from 'react';
import { ChipArt } from './ChipArt';
import { rankName, suitSymbol } from '../game/deck';

// ── Mini card for tutorial use ──
function TCard({ rank, suit, selected, small }: { rank: number; suit: string; selected?: boolean; small?: boolean }) {
  const red = suit === 'hearts' || suit === 'diamonds';
  const w = small ? 42 : 56;
  const h = small ? 60 : 80;
  return (
    <div style={{
      width: w, height: h, borderRadius: 7,
      background: 'linear-gradient(145deg,#fdfaf3,#f0ead8)',
      border: selected ? '2px solid #fbbf24' : '1.5px solid #d4c9a8',
      boxShadow: selected
        ? '0 0 0 2px #fff, 0 0 0 4px #fbbf24, 0 -8px 12px rgba(201,168,76,0.4)'
        : '0 2px 6px rgba(0,0,0,0.4)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', position: 'relative', flexShrink: 0,
      transform: selected ? 'translateY(-8px) scale(1.05)' : 'none',
      transition: 'all 0.2s',
    }}>
      <div style={{ position: 'absolute', top: 4, left: 5, fontFamily: "'Orbitron',monospace", fontWeight: 900, fontSize: small ? 9 : 11, color: red ? '#b91c1c' : '#111', lineHeight: 1.1 }}>
        <div>{rankName(rank)}</div>
        <div style={{ fontSize: small ? 8 : 9 }}>{suitSymbol(suit as any)}</div>
      </div>
      <div style={{ fontSize: small ? 22 : 30, color: red ? '#b91c1c' : '#111', lineHeight: 1 }}>{suitSymbol(suit as any)}</div>
      <div style={{ position: 'absolute', bottom: 4, right: 5, fontFamily: "'Orbitron',monospace", fontWeight: 900, fontSize: small ? 9 : 11, color: red ? '#b91c1c' : '#111', lineHeight: 1.1, transform: 'rotate(180deg)' }}>
        <div>{rankName(rank)}</div>
        <div style={{ fontSize: small ? 8 : 9 }}>{suitSymbol(suit as any)}</div>
      </div>
    </div>
  );
}

// ── Animated vault bar ──
function AnimVault({ pct, target = 560 }: { pct: number; target?: number }) {
  const filled = Math.round(pct * target);
  const color = pct >= 1 ? '#22c55e' : pct >= 0.7 ? '#fbbf24' : '#ca8a04';
  return (
    <div style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid #3a2e1e', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'VT323',monospace", fontSize: 18, color: '#ca8a04', marginBottom: 6 }}>
        <span>🏦 VAULT</span>
        <span style={{ color }}>{filled.toLocaleString()} / {target.toLocaleString()}</span>
      </div>
      <div style={{ height: 14, background: '#111', borderRadius: 7, overflow: 'hidden', border: '1px solid #2a2520' }}>
        <div style={{ height: '100%', width: `${Math.min(100, pct * 100)}%`, background: `linear-gradient(90deg, #92400e, ${color})`, borderRadius: 7, transition: 'width 1s ease', boxShadow: `0 0 8px ${color}66` }} />
      </div>
      <div style={{ textAlign: 'right', fontFamily: "'VT323',monospace", fontSize: 15, color: '#4b5563', marginTop: 4 }}>{Math.round(pct * 100)}% filled</div>
    </div>
  );
}

// ── Score chain mockup ──
function ScoreMock({ base, chips, final, hand }: { base: number; chips: { label: string; color: string; after: number }[]; final: number; hand: string }) {
  return (
    <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 12px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 8px', fontFamily: "'VT323',monospace", fontSize: 18 }}>
      <span style={{ color: '#9ca3af' }}>{hand}</span>
      <span style={{ color: '#fbbf24', fontWeight: 700 }}>{base}</span>
      {chips.map((c, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#4b5563' }}>›</span>
          <span style={{ color: c.color }}>{c.label}</span>
          <span style={{ color: '#fbbf24', fontWeight: 700 }}>{c.after}</span>
        </span>
      ))}
      <span style={{ color: '#4b5563' }}>›</span>
      <span style={{ color: '#fde68a', fontWeight: 700, fontSize: 22 }}>{final}</span>
    </div>
  );
}

const HAND_RANKS = [
  { name: 'High Card',       cards: [{ r: 14, s: 'spades' }, { r: 9, s: 'hearts' }, { r: 5, s: 'clubs' }, { r: 3, s: 'diamonds' }, { r: 2, s: 'spades' }], chips: 10, mult: 1 },
  { name: 'Pair',            cards: [{ r: 8, s: 'hearts' }, { r: 8, s: 'diamonds' }, { r: 5, s: 'clubs' }, { r: 3, s: 'spades' }, { r: 2, s: 'hearts' }], chips: 20, mult: 2 },
  { name: 'Two Pair',        cards: [{ r: 10, s: 'spades' }, { r: 10, s: 'hearts' }, { r: 7, s: 'clubs' }, { r: 7, s: 'diamonds' }, { r: 3, s: 'spades' }], chips: 30, mult: 2 },
  { name: 'Three of a Kind', cards: [{ r: 6, s: 'hearts' }, { r: 6, s: 'diamonds' }, { r: 6, s: 'clubs' }, { r: 9, s: 'spades' }, { r: 2, s: 'hearts' }], chips: 35, mult: 3 },
  { name: 'Straight',        cards: [{ r: 9, s: 'spades' }, { r: 8, s: 'hearts' }, { r: 7, s: 'diamonds' }, { r: 6, s: 'clubs' }, { r: 5, s: 'spades' }], chips: 40, mult: 4 },
  { name: 'Flush',           cards: [{ r: 13, s: 'hearts' }, { r: 10, s: 'hearts' }, { r: 8, s: 'hearts' }, { r: 5, s: 'hearts' }, { r: 2, s: 'hearts' }], chips: 45, mult: 4 },
  { name: 'Full House',      cards: [{ r: 11, s: 'spades' }, { r: 11, s: 'hearts' }, { r: 11, s: 'clubs' }, { r: 4, s: 'diamonds' }, { r: 4, s: 'spades' }], chips: 50, mult: 4 },
  { name: 'Four of a Kind',  cards: [{ r: 7, s: 'spades' }, { r: 7, s: 'hearts' }, { r: 7, s: 'diamonds' }, { r: 7, s: 'clubs' }, { r: 2, s: 'hearts' }], chips: 70, mult: 5 },
  { name: 'Straight Flush',  cards: [{ r: 9, s: 'spades' }, { r: 8, s: 'spades' }, { r: 7, s: 'spades' }, { r: 6, s: 'spades' }, { r: 5, s: 'spades' }], chips: 100, mult: 7 },
  { name: 'Royal Flush',     cards: [{ r: 14, s: 'hearts' }, { r: 13, s: 'hearts' }, { r: 12, s: 'hearts' }, { r: 11, s: 'hearts' }, { r: 10, s: 'hearts' }], chips: 150, mult: 8 },
];

interface TutorialProps { onClose: () => void; }

export function Tutorial({ onClose }: TutorialProps) {
  const [page, setPage] = useState(0);
  const [vaultPct, setVaultPct] = useState(0.1);
  const [handIdx, setHandIdx] = useState(0);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const vaultTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const handTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Vault animation on page 0
  useEffect(() => {
    if (page === 0) {
      setVaultPct(0.1);
      vaultTimer.current = setInterval(() => setVaultPct(p => p >= 1 ? 0.1 : p + 0.08), 600);
    }
    return () => { if (vaultTimer.current) clearInterval(vaultTimer.current); };
  }, [page]);

  // Hand cycle animation on page 2
  useEffect(() => {
    if (page === 2) {
      setHandIdx(0);
      handTimer.current = setInterval(() => setHandIdx(i => (i + 1) % HAND_RANKS.length), 1800);
    }
    return () => { if (handTimer.current) clearInterval(handTimer.current); };
  }, [page]);

  // Card selection demo on page 1
  useEffect(() => {
    if (page === 1) {
      setSelectedCards([]);
      let step = 0;
      const cards = [0, 2, 4];
      const t = setInterval(() => {
        if (step < cards.length) setSelectedCards(prev => [...prev, cards[step++]]);
        else { setSelectedCards([]); step = 0; }
      }, 700);
      return () => clearInterval(t);
    }
  }, [page]);

  const TOTAL = 8;

  const slides = [
    // 0 — OBJECTIVE
    {
      title: 'THE OBJECTIVE',
      icon: '🏦',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 20, color: '#d1d5db', lineHeight: 1.45 }}>
            You work at a casino. Play poker hands to fill the vault before you run out of hands.
          </p>
          <AnimVault pct={vaultPct} target={560} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 22 }}>✅</span>
              <span style={{ fontSize: 19, color: '#86efac' }}>Fill the vault → win the round</span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 22 }}>❌</span>
              <span style={{ fontSize: 19, color: '#fca5a5' }}>Run out of hands with vault short → bust</span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 22 }}>💰</span>
              <span style={{ fontSize: 19, color: '#fde68a' }}>You skim a cut of every hand for yourself</span>
            </div>
          </div>
          <p style={{ fontSize: 18, color: '#6b5a3e' }}>3 levels per round · unlimited rounds · see how far you can get</p>
        </div>
      ),
    },

    // 1 — CARDS
    {
      title: 'YOUR CARDS',
      icon: '🃏',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 20, color: '#d1d5db', lineHeight: 1.45 }}>
            You're dealt <strong style={{ color: '#fbbf24' }}>8 cards</strong> from your deck. Tap 1–5 to select a hand, then hit PLAY HAND.
          </p>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', padding: '8px 0' }}>
            {[
              { r: 10, s: 'hearts' }, { r: 7, s: 'spades' }, { r: 14, s: 'diamonds' },
              { r: 3, s: 'clubs' }, { r: 7, s: 'hearts' },
            ].map((c, i) => (
              <TCard key={i} rank={c.r} suit={c.s} selected={selectedCards.includes(i)} />
            ))}
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #3a2e1e', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 18, color: '#4ade80', marginBottom: 6, fontWeight: 700 }}>🟢 COMMUNITY CARDS</div>
            <p style={{ fontSize: 18, color: '#9ca3af', lineHeight: 1.4 }}>
              3 cards in the center are <strong style={{ color: '#4ade80' }}>shared with all players</strong>. Use them in your hand. When used, they auto-replace from the deck.
            </p>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #3a2e1e', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 18, color: '#f59e0b', marginBottom: 4 }}>♻️ DISCARD</div>
            <p style={{ fontSize: 18, color: '#9ca3af', lineHeight: 1.4 }}>
              Discards <strong style={{ color: '#fbbf24' }}>your 5 cards AND all 3 community cards</strong>. 2 free per round — extra discards cost chips and get pricier each use.
            </p>
          </div>
        </div>
      ),
    },

    // 2 — HANDS
    {
      title: 'POKER HANDS',
      icon: '♠️',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 19, color: '#d1d5db', lineHeight: 1.4 }}>
            Your selected cards are scored as a poker hand. Higher = more chips.
          </p>
          {/* Animated hand display */}
          <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #3a2e1e', borderRadius: 10, padding: '12px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ fontFamily: "'VT323',monospace", fontSize: 22, color: '#fbbf24', letterSpacing: '0.1em' }}>
              {HAND_RANKS[handIdx].name}
            </div>
            <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
              {HAND_RANKS[handIdx].cards.map((c, i) => (
                <TCard key={i} rank={c.r} suit={c.s} small />
              ))}
            </div>
            <div style={{ fontFamily: "'VT323',monospace", fontSize: 17, color: '#9ca3af' }}>
              Base: <span style={{ color: '#fbbf24' }}>{HAND_RANKS[handIdx].chips} chips</span>
              {' '}× <span style={{ color: '#60a5fa' }}>{HAND_RANKS[handIdx].mult} mult</span>
            </div>
          </div>
          <p style={{ fontSize: 16, color: '#4b5563', textAlign: 'center' }}>← cycling through all hands →</p>
          <p style={{ fontSize: 18, color: '#a78bfa' }}>
            💡 Level up hands in the shop HANDS tab to boost their base chip value permanently.
          </p>
        </div>
      ),
    },

    // 3 — SCORING
    {
      title: 'HOW SCORING WORKS',
      icon: '🧮',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 20, color: '#d1d5db', lineHeight: 1.4 }}>
            Every card in your hand adds its rank value to your chip total. Then your chip stack fires.
          </p>
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #3a2e1e', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontFamily: "'VT323',monospace", fontSize: 17, color: '#4b5563', marginBottom: 6 }}>Example: Pair of 8s</div>
            <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
              {[{r:8,s:'hearts'},{r:8,s:'diamonds'},{r:5,s:'clubs'}].map((c,i) => <TCard key={i} rank={c.r} suit={c.s} small selected={i < 2} />)}
            </div>
            <div style={{ fontFamily: "'VT323',monospace", fontSize: 17, color: '#9ca3af', marginBottom: 8 }}>
              Pair base: <span style={{ color: '#fbbf24' }}>20 chips</span><br/>
              Card pips: 8 + 8 = <span style={{ color: '#fbbf24' }}>+16 chips</span><br/>
              Total before chips: <span style={{ color: '#fbbf24' }}>36</span> × <span style={{ color: '#60a5fa' }}>2 mult</span> = <span style={{ color: '#fde68a', fontSize: 20 }}>72</span>
            </div>
          </div>
          <ScoreMock
            hand="Pair"
            base={72}
            chips={[
              { label: '+RED', color: '#f87171', after: 82 },
              { label: '+GOLD ×1.5', color: '#fbbf24', after: 123 },
            ]}
            final={123}
          />
          <p style={{ fontSize: 18, color: '#4b5563' }}>Chips fire left to right — order matters!</p>
        </div>
      ),
    },

    // 4 — CHIP STACK
    {
      title: 'CHIP STACK',
      icon: '🔴',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 20, color: '#d1d5db', lineHeight: 1.4 }}>
            Your chip stack fires after every hand, adding bonuses to your score.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', padding: '6px 0' }}>
            {(['RED', 'BLUE', 'GOLD', 'LUCKY', 'SILVER'] as const).map((type, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <ChipArt type={type} size={48} />
                <div style={{ fontFamily: "'VT323',monospace", fontSize: 14, color: '#6b7280', textAlign: 'center' }}>
                  {type === 'RED' ? '+10' : type === 'BLUE' ? '+20' : type === 'GOLD' ? '+30' : type === 'LUCKY' ? 'rand' : '+15'}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>↔️</span>
              <span style={{ fontSize: 18, color: '#9ca3af' }}>Tap a chip to pick it up, tap another to swap positions. Order matters — some chips multiply what came before.</span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>🛒</span>
              <span style={{ fontSize: 18, color: '#9ca3af' }}>Buy new chips in the shop. Sell old ones for chips back. Rare chips have powerful effects.</span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>👆</span>
              <span style={{ fontSize: 18, color: '#9ca3af' }}>Double-tap a chip to see what it does.</span>
            </div>
          </div>
        </div>
      ),
    },

    // 5 — THE SKIM
    {
      title: 'THE SKIM',
      icon: '💰',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 20, color: '#d1d5db', lineHeight: 1.4 }}>
            You don't keep everything. A percentage goes to the vault — the rest is yours to keep.
          </p>
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #3a2e1e', borderRadius: 10, padding: '14px' }}>
            <div style={{ fontFamily: "'VT323',monospace", fontSize: 20, color: '#fbbf24', marginBottom: 10 }}>Hand scores: 200 chips</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'VT323',monospace", fontSize: 19 }}>
                <span style={{ color: '#9ca3af' }}>Skim rate (your cut)</span>
                <span style={{ color: '#fbbf24' }}>25%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'VT323',monospace", fontSize: 19 }}>
                <span style={{ color: '#9ca3af' }}>→ Your wallet</span>
                <span style={{ color: '#fbbf24' }}>+50c</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'VT323',monospace", fontSize: 19 }}>
                <span style={{ color: '#9ca3af' }}>→ Vault</span>
                <span style={{ color: '#4ade80' }}>+150c</span>
              </div>
            </div>
          </div>
          <p style={{ fontSize: 18, color: '#a78bfa', lineHeight: 1.4 }}>
            💡 Upgrade your skim rate in the shop Upgrades tab. Start at 20% — max out at 60%.
          </p>
          <p style={{ fontSize: 18, color: '#f59e0b', lineHeight: 1.4 }}>
            ⚠️ Higher skim = more wallet chips, but vault fills slower. Balance it.
          </p>
        </div>
      ),
    },

    // 6 — THE SHOP
    {
      title: 'THE SHOP',
      icon: '🛒',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 19, color: '#d1d5db', lineHeight: 1.4 }}>
            Between rounds, spend your wallet chips in the shop. Stock refreshes every round.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { tab: 'CHIPS', color: '#fbbf24', desc: 'Buy chips to add to your stack. Higher rarity = stronger effects.' },
              { tab: 'HANDS', color: '#a78bfa', desc: 'Level up poker hand base values. Cap at level 10.' },
              { tab: 'DECK',  color: '#4ade80', desc: 'Buy booster packs to add cards to your permanent deck.' },
              { tab: 'FORGE', color: '#fb923c', desc: 'Apply modifiers to random cards. Polished, Wild, Cursed, Mimic and more.' },
              { tab: 'CASINO', color: '#60a5fa', desc: 'Buy consumables for single-use in-round power-ups.' },
              { tab: 'UPGRADES', color: '#f87171', desc: 'Permanent bonuses: extra chip slots, bigger skim rate, lucky shop.' },
            ].map(({ tab, color, desc }) => (
              <div key={tab} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid #2a2520' }}>
                <div style={{ fontFamily: "'VT323',monospace", fontSize: 17, color, minWidth: 70, flexShrink: 0, paddingTop: 2 }}>{tab}</div>
                <div style={{ fontFamily: "'VT323',monospace", fontSize: 17, color: '#9ca3af', lineHeight: 1.35 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },

    // 7 — CONSUMABLES
    {
      title: 'CONSUMABLES',
      icon: '🎫',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 19, color: '#d1d5db', lineHeight: 1.4 }}>
            Carry up to 4 consumables into rounds. Use them for big advantages — but they're one-time only.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { icon: '🎫', name: 'Scratch Ticket', desc: 'Next hand scores ×1 to ×5 chips. Pure luck.' },
              { icon: '🎰', name: 'Roulette',       desc: 'Bet up to 50 chips. Win = doubled. Lose = gone.' },
              { icon: '🔥', name: 'Burned Hand',    desc: 'Burn a hand (−1 play) → next hand scores ×3.' },
              { icon: '🃏', name: 'High Card Draw', desc: 'Draw 2 extra cards this hand for better picks.' },
            ].map(({ icon, name, desc }) => (
              <div key={name} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 12px', background: 'rgba(0,0,0,0.25)', borderRadius: 8, border: '1px solid #3a2e1e' }}>
                <span style={{ fontSize: 26, flexShrink: 0 }}>{icon}</span>
                <div>
                  <div style={{ fontFamily: "'VT323',monospace", fontSize: 20, color: '#fbbf24', marginBottom: 2 }}>{name}</div>
                  <div style={{ fontFamily: "'VT323',monospace", fontSize: 17, color: '#9ca3af', lineHeight: 1.35 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 17, color: '#6b5a3e' }}>Start with 2 consumable slots. Buy upgrades to unlock up to 4.</p>
        </div>
      ),
    },

    // 8 — HOW TO LOSE
    {
      title: 'HOW TO LOSE',
      icon: '💀',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 20, color: '#d1d5db', lineHeight: 1.45 }}>
            The run ends when either of these happens:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 20, color: '#f87171', marginBottom: 6 }}>❌ Vault not filled</div>
              <p style={{ fontSize: 18, color: '#9ca3af', lineHeight: 1.4 }}>
                You run out of hands for the level without filling the vault target. Game over.
              </p>
            </div>
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 20, color: '#f87171', marginBottom: 6 }}>🃏 Deck runs out</div>
              <p style={{ fontSize: 18, color: '#9ca3af', lineHeight: 1.4 }}>
                If your deck runs dry, you can't draw cards to play hands. This is why buying booster packs from the shop is critical — a bigger deck means more plays.
              </p>
            </div>
          </div>
          <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 20, color: '#fbbf24', marginBottom: 6 }}>💡 Stay alive longer</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ fontSize: 17, color: '#9ca3af', lineHeight: 1.4 }}>• Buy deck packs in the shop — more cards = more hands available</p>
              <p style={{ fontSize: 17, color: '#9ca3af', lineHeight: 1.4 }}>• Level up your best hands to score bigger with fewer plays</p>
              <p style={{ fontSize: 17, color: '#9ca3af', lineHeight: 1.4 }}>• Build a strong chip stack to multiply your score</p>
            </div>
          </div>
          <p style={{ fontSize: 18, color: '#6b5a3e' }}>
            Rounds get harder as you progress — vault targets scale up. How far can you go?
          </p>
        </div>
      ),
    },

    // 9 — TIPS
    {
      title: 'TIPS & TRICKS',
      icon: '💡',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { icon: '⏱️', text: 'Watch the timer bar. When it hits zero, your hand auto-discards.' },
            { icon: '♻️', text: '2 free discards per round. Extra discards cost chips and get pricier.' },
            { icon: '↔️', text: 'Chip order matters — put multipliers AFTER flat bonus chips.' },
            { icon: '✨', text: 'Modified cards glow with a ✦ badge. Tap it to see what the modifier does.' },
            { icon: '🃏', text: 'Community cards auto-replace when used. Your deck shrinks — plan ahead.' },
            { icon: '🎯', text: 'Complete bounties for bonus chips. Check the active bounties strip at the top.' },
            { icon: '🏦', text: 'Balance skim rate — more wallet chips helps, but the vault still needs filling.' },
            { icon: '💸', text: "Don't blow your whole wallet in round 1 shop. Later rounds get harder." },
          ].map(({ icon, text }, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: i < 7 ? '1px solid #1f1a14' : 'none' }}>
              <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{icon}</span>
              <span style={{ fontFamily: "'VT323',monospace", fontSize: 19, color: '#d1d5db', lineHeight: 1.4 }}>{text}</span>
            </div>
          ))}
        </div>
      ),
    },
  ];

  const slide = slides[page];
  const isLast = page === slides.length - 1;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0806', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 24 }}>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', paddingTop: 4 }}>
          {slides.map((_, i) => (
            <div key={i} onClick={() => setPage(i)} style={{ width: i === page ? 22 : 7, height: 7, borderRadius: 4, background: i === page ? 'var(--accent-bright,#f0c040)' : i < page ? '#4b5563' : '#1f2937', cursor: 'pointer', transition: 'all 0.2s' }} />
          ))}
        </div>

        {/* Slide */}
        <div style={{ background: '#0d0a07', border: '1px solid #3a2e1e', borderRadius: 16, padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 32 }}>{slide.icon}</span>
            <div style={{ fontFamily: "'VT323',monospace", fontSize: 26, color: 'var(--accent-bright,#f0c040)', letterSpacing: '0.1em', lineHeight: 1.1 }}>{slide.title}</div>
          </div>
          <div style={{ width: '100%', height: 1, background: '#2a2520' }} />
          <div style={{ fontFamily: "'VT323',monospace" }}>{slide.body}</div>
        </div>

        {/* Nav */}
        <div style={{ display: 'flex', gap: 10 }}>
          {page > 0 && (
            <button onClick={() => setPage(p => p - 1)} style={{ flex: 1, padding: '14px 0', borderRadius: 10, cursor: 'pointer', background: 'transparent', border: '1px solid #3a2e1e', color: '#6b5a3e', fontFamily: "'VT323',monospace", fontSize: 20 }}>
              ← BACK
            </button>
          )}
          {!isLast ? (
            <button onClick={() => setPage(p => p + 1)} style={{ flex: 2, padding: '14px 0', borderRadius: 10, cursor: 'pointer', background: '#92400e', border: '1px solid #ca8a04', color: '#fde68a', fontFamily: "'VT323',monospace", fontSize: 22 }}>
              NEXT →
            </button>
          ) : (
            <button onClick={onClose} style={{ flex: 2, padding: '14px 0', borderRadius: 10, cursor: 'pointer', background: 'linear-gradient(135deg,#92400e,#ca8a04)', border: '1px solid #fde68a', color: '#fde68a', fontFamily: "'VT323',monospace", fontSize: 22, boxShadow: '0 0 20px rgba(202,138,4,0.3)' }}>
              LET'S PLAY ▶
            </button>
          )}
        </div>

        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'VT323',monospace", fontSize: 17, color: '#374151', textAlign: 'center' }}>
          skip tutorial
        </button>
      </div>
    </div>
  );
}

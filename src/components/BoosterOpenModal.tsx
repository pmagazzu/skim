import { useEffect, useState } from 'react';
import type { BoosterOption, BoosterTypeValue, ShopItem } from '../game/gameState';
import { playBoosterOpen, playBoosterPick } from '../audio/sounds';
import { ChipArt } from './ChipArt';
import { HAND_NAMES } from '../game/hands';

interface BoosterOpenModalProps {
  booster: ShopItem;
  options: BoosterOption[];
  onPick: (optionId: string) => void;
  onDismiss: () => void;
}

const BOOSTER_ICON: Record<BoosterTypeValue, string> = {
  CHIP: '🪙',
  HAND: '🖐️',
  UTILITY: '🎲',
  FORGE: '⚒️',
  WILDCARD: '✨',
  BOUNTY: '🎯',
};

function OptionVisual({ opt }: { opt: BoosterOption }) {
  if (opt.kind === 'chip' && opt.chipType) {
    return <ChipArt type={opt.chipType} size={34} />;
  }
  if (opt.kind === 'hand-upgrade' && opt.handRank) {
    return (
      <div style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'VT323',monospace", fontSize: 18, color: '#93c5fd' }}>
        {HAND_NAMES[opt.handRank].slice(0, 2).toUpperCase()}
      </div>
    );
  }
  if (opt.kind === 'forge') {
    return <div style={{ fontSize: 28 }}>⚒️</div>;
  }
  if (opt.kind === 'bounty') {
    return <div style={{ fontSize: 28 }}>🎯</div>;
  }
  if (opt.kind === 'consumable') {
    return <div style={{ fontSize: 28 }}>🎲</div>;
  }
  if (opt.kind === 'skim-upgrade') {
    return <div style={{ fontSize: 28 }}>📈</div>;
  }
  if (opt.kind === 'chips') {
    return <div style={{ fontSize: 28 }}>💰</div>;
  }
  return <div style={{ fontSize: 24 }}>✨</div>;
}

export function BoosterOpenModal({ booster, options, onPick, onDismiss }: BoosterOpenModalProps) {
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    playBoosterOpen();
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setRevealed(i);
      if (i >= options.length) clearInterval(t);
    }, 150);
    return () => clearInterval(t);
  }, [options.length]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 'min(430px,92vw)', background: '#0d0a07', border: '1px solid #3a2e1e', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <span style={{ fontSize: 26 }}>{BOOSTER_ICON[booster.boosterType]}</span>
          <div style={{ fontFamily: "'VT323',monospace", fontSize: 28, color: '#f8d082', textAlign: 'center' }}>{booster.label}</div>
        </div>
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 16, color: '#9ca3af', textAlign: 'center' }}>Pick 1</div>

        <div className="grid grid-cols-1 gap-2">
          {options.map((opt, i) => {
            const show = i < revealed;
            return (
              <button
                key={opt.id}
                onClick={show ? () => { playBoosterPick(); onPick(opt.id); } : undefined}
                disabled={!show}
                className={show ? 'shop-card text-left' : 'shop-card opacity-30 text-left'}
                style={{ transition: 'all 0.2s ease', minHeight: 72 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {show ? <OptionVisual opt={opt} /> : <div style={{ fontSize: 18 }}>?</div>}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "'VT323',monospace", fontSize: 22, color: '#f8d082', lineHeight: 1 }}>
                      {show ? opt.label : '???'}
                    </div>
                    <div style={{ fontFamily: "'VT323',monospace", fontSize: 13, color: '#9ca3af' }}>
                      {show ? opt.detail : 'Revealing...'}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <button onClick={onDismiss} className="btn-secondary" style={{ fontSize: 13, padding: '8px 0' }}>CLOSE</button>
      </div>
    </div>
  );
}

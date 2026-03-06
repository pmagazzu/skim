import { useEffect, useState } from 'react';
import type { BoosterOption, ShopItem } from '../game/gameState';
import { playBoosterOpen, playBoosterPick } from '../audio/sounds';

interface BoosterOpenModalProps {
  booster: ShopItem;
  options: BoosterOption[];
  onPick: (optionId: string) => void;
  onDismiss: () => void;
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
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 28, color: '#f8d082', textAlign: 'center' }}>{booster.label}</div>
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 16, color: '#9ca3af', textAlign: 'center' }}>Pick 1 reward</div>

        {options.map((opt, i) => {
          const show = i < revealed;
          return (
            <button
              key={opt.id}
              onClick={show ? () => { playBoosterPick(); onPick(opt.id); } : undefined}
              disabled={!show}
              className={show ? 'shop-card text-left' : 'shop-card opacity-30 text-left'}
              style={{ transition: 'all 0.2s ease' }}
            >
              <div style={{ fontFamily: "'VT323',monospace", fontSize: 22, color: '#f8d082' }}>{show ? opt.label : '???'}</div>
              <div style={{ fontFamily: "'VT323',monospace", fontSize: 15, color: '#9ca3af' }}>{show ? opt.detail : 'Revealing...'}</div>
            </button>
          );
        })}

        <button onClick={onDismiss} className="btn-secondary" style={{ fontSize: 13, padding: '8px 0' }}>CLOSE</button>
      </div>
    </div>
  );
}

export const ChipRarity = {
  COMMON:    'common',
  UNCOMMON:  'uncommon',
  RARE:      'rare',
  LEGENDARY: 'legendary',
} as const;

export type ChipRarityValue = typeof ChipRarity[keyof typeof ChipRarity];

export const RARITY_LABELS: Record<ChipRarityValue, string> = {
  common:    '○ Common',
  uncommon:  '◑ Uncommon',
  rare:      '● Rare',
  legendary: '★ Legendary',
};

export const RARITY_COLORS: Record<ChipRarityValue, string> = {
  common:    'text-gray-400',
  uncommon:  'text-blue-400',
  rare:      'text-purple-400',
  legendary: 'text-yellow-300',
};

export function rollRarity(ante: number): ChipRarityValue {
  const r = Math.random() * 100;
  if (ante === 1) {
    // Ante 1: no legendaries, mostly common
    if (r < 60) return 'common';
    if (r < 88) return 'uncommon';
    return 'rare';
  }
  if (ante === 2) {
    // Ante 2: rare legendaries appear
    if (r < 45) return 'common';
    if (r < 72) return 'uncommon';
    if (r < 93) return 'rare';
    return 'legendary';
  }
  // Ante 3+: legendaries more accessible
  if (r < 30) return 'common';
  if (r < 60) return 'uncommon';
  if (r < 85) return 'rare';
  return 'legendary';
}

export const ChipType = {
  // Common
  RED:       'RED',
  LUCKY:     'LUCKY',
  COPPER:    'COPPER',
  PENNY:     'PENNY',
  CHALK:     'CHALK',
  TIN:       'TIN',
  NICKEL:    'NICKEL',
  ROSE:      'ROSE',
  RIVER:     'RIVER',
  EMBER:     'EMBER',
  // Uncommon
  BLUE:      'BLUE',
  SILVER:    'SILVER',
  JADE:      'JADE',
  IRON:      'IRON',
  BRONZE:    'BRONZE',
  OBSIDIAN:  'OBSIDIAN',
  SAPPHIRE:  'SAPPHIRE',
  CORAL:     'CORAL',
  AMBER:     'AMBER',
  STEEL:     'STEEL',
  // Rare
  BLACK:     'BLACK',
  GOLD:      'GOLD',
  ONYX:      'ONYX',
  RUBY:      'RUBY',
  QUARTZ:    'QUARTZ',
  CRYSTAL:   'CRYSTAL',
  HAZE:      'HAZE',
  FORGE:     'FORGE',
  // Legendary
  DIAMOND:   'DIAMOND',
  PLATINUM:  'PLATINUM',
  JOKER:     'JOKER',
  MOONSTONE: 'MOONSTONE',
  PRISM:     'PRISM',
  VOID:      'VOID',
  // Uncommon (new)
  BONE:      'BONE',
  CEDAR:     'CEDAR',
  TOPAZ:     'TOPAZ',
  // Common (new)
  MARBLE:    'MARBLE',
  RUST:      'RUST',
  GRAVEL:    'GRAVEL',
  // Batch 2 — Common
  FLINT:     'FLINT',
  COAL:      'COAL',
  // Batch 2 — Uncommon
  IVORY:     'IVORY',
  GRANITE:   'GRANITE',
  PYRITE:    'PYRITE',
  TIDE:      'TIDE',
  // Batch 2 — Rare
  SHARD:     'SHARD',
  LICHEN:    'LICHEN',
  // Batch 2 — Legendary
  AURORA:    'AURORA',
  ECHO:      'ECHO',
} as const;

export type ChipTypeValue = typeof ChipType[keyof typeof ChipType];

export interface Chip {
  type: ChipTypeValue;
  name: string;
  description: string;
  color: string;
  textColor: string;
  cost: number;
  rarity: ChipRarityValue;
}

export const CHIPS: Record<ChipTypeValue, Chip> = {
  RED: {
    type: ChipType.RED,
    name: 'Red Chip',
    description: '+15 chips per hand.',
    color: 'bg-red-600',
    textColor: 'text-red-400',
    cost: 40,
    rarity: 'common',
  },
  BLUE: {
    type: ChipType.BLUE,
    name: 'Blue Chip',
    description: 'Pair or better: ×1.2.',
    color: 'bg-blue-600',
    textColor: 'text-blue-400',
    cost: 60,
    rarity: 'uncommon',
  },
  BLACK: {
    type: ChipType.BLACK,
    name: 'Black Chip',
    description: 'Once per round: double your skim on this hand.',
    color: 'bg-gray-800',
    textColor: 'text-gray-300',
    cost: 80,
    rarity: 'rare',
  },
  GOLD: {
    type: ChipType.GOLD,
    name: 'Gold Chip',
    description: 'Every 5th hand: +80 vault bonus (not in chain).',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-400',
    cost: 100,
    rarity: 'rare',
  },
  ONYX: {
    type: ChipType.ONYX,
    name: 'Onyx Chip',
    description: 'All-black hand: ×1.5.',
    color: 'bg-black',
    textColor: 'text-gray-300',
    cost: 120,
    rarity: 'rare',
  },
  RUBY: {
    type: ChipType.RUBY,
    name: 'Ruby Chip',
    description: 'All-red hand: ×1.5.',
    color: 'bg-red-900',
    textColor: 'text-red-300',
    cost: 120,
    rarity: 'rare',
  },
  QUARTZ: {
    type: ChipType.QUARTZ,
    name: 'Quartz Chip',
    description: 'Score ×1.3, but your skim rate is permanently +5%.',
    color: 'bg-violet-400',
    textColor: 'text-violet-200',
    cost: 110,
    rarity: 'rare',
  },
  CRYSTAL: {
    type: ChipType.CRYSTAL,
    name: 'Crystal Chip',
    description: 'Royal Flush only: +500 chips.',
    color: 'bg-cyan-500',
    textColor: 'text-cyan-100',
    cost: 150,
    rarity: 'rare',
  },
  MOONSTONE: {
    type: ChipType.MOONSTONE,
    name: 'Moonstone Chip',
    description: 'Each round, one random chip in your stack fires twice.',
    color: 'bg-indigo-400',
    textColor: 'text-indigo-100',
    cost: 220,
    rarity: 'legendary',
  },
  LUCKY: {
    type: ChipType.LUCKY,
    name: 'Lucky Chip',
    description: 'Random +10–50 chips per hand.',
    color: 'bg-purple-600',
    textColor: 'text-purple-400',
    cost: 50,
    rarity: 'common',
  },
  COPPER: {
    type: ChipType.COPPER,
    name: 'Copper Chip',
    description: '+10 chips every hand.',
    color: 'bg-orange-700',
    textColor: 'text-orange-400',
    cost: 30,
    rarity: 'common',
  },
  PENNY: {
    type: ChipType.PENNY,
    name: 'Penny Chip',
    description: 'Pair or better: +2 chips per card selected (max +10 for 5 cards).',
    color: 'bg-amber-800',
    textColor: 'text-amber-500',
    cost: 25,
    rarity: 'common',
  },
  CHALK: {
    type: ChipType.CHALK,
    name: 'Chalk Chip',
    description: 'High Card: +20 chips.',
    color: 'bg-stone-400',
    textColor: 'text-stone-300',
    cost: 20,
    rarity: 'common',
  },
  TIN: {
    type: ChipType.TIN,
    name: 'Tin Chip',
    description: '+8 chips. Doubles to +16 on your last hand of the round.',
    color: 'bg-slate-500',
    textColor: 'text-slate-300',
    cost: 25,
    rarity: 'common',
  },
  NICKEL: {
    type: ChipType.NICKEL,
    name: 'Nickel Chip',
    description: '+2 chips per chip in your stack (including this one).',
    color: 'bg-neutral-500',
    textColor: 'text-neutral-300',
    cost: 30,
    rarity: 'common',
  },
  ROSE: {
    type: ChipType.ROSE,
    name: 'Rose Chip',
    description: '+15 chips when your hand contains a Heart.',
    color: 'bg-rose-600',
    textColor: 'text-rose-300',
    cost: 25,
    rarity: 'common',
  },
  RIVER: {
    type: ChipType.RIVER,
    name: 'River Chip',
    description: '+18 chips when you use one or more community cards.',
    color: 'bg-sky-700',
    textColor: 'text-sky-400',
    cost: 30,
    rarity: 'common',
  },
  EMBER: {
    type: ChipType.EMBER,
    name: 'Ember Chip',
    description: '+5 chips on hand 1, +10 on hand 2, +15 on hand 3… (+5 per hand played).',
    color: 'bg-orange-600',
    textColor: 'text-orange-300',
    cost: 35,
    rarity: 'common',
  },
  SILVER: {
    type: ChipType.SILVER,
    name: 'Silver Chip',
    description: '+1 hand per round. More time at the table.',
    color: 'bg-gray-400',
    textColor: 'text-gray-300',
    cost: 70,
    rarity: 'uncommon',
  },
  JADE: {
    type: ChipType.JADE,
    name: 'Jade Chip',
    description: '3+ cards of same suit: score ×1.15.',
    color: 'bg-emerald-600',
    textColor: 'text-emerald-400',
    cost: 60,
    rarity: 'uncommon',
  },
  IRON: {
    type: ChipType.IRON,
    name: 'Iron Chip',
    description: 'Play exactly 5 cards: +35 chips.',
    color: 'bg-zinc-600',
    textColor: 'text-zinc-300',
    cost: 55,
    rarity: 'uncommon',
  },
  BRONZE: {
    type: ChipType.BRONZE,
    name: 'Bronze Chip',
    description: 'Every 3rd hand this round: +25 chips.',
    color: 'bg-amber-700',
    textColor: 'text-amber-400',
    cost: 50,
    rarity: 'uncommon',
  },
  OBSIDIAN: {
    type: ChipType.OBSIDIAN,
    name: 'Obsidian Chip',
    description: 'Straight or better: +40 chips.',
    color: 'bg-gray-950',
    textColor: 'text-gray-300',
    cost: 65,
    rarity: 'uncommon',
  },
  SAPPHIRE: {
    type: ChipType.SAPPHIRE,
    name: 'Sapphire Chip',
    description: 'Pair: ×1.1 · Two Pair: ×1.15 · Three of a Kind: ×1.2.',
    color: 'bg-blue-800',
    textColor: 'text-blue-300',
    cost: 70,
    rarity: 'uncommon',
  },
  CORAL: {
    type: ChipType.CORAL,
    name: 'Coral Chip',
    description: 'First hand each round: +50 chips.',
    color: 'bg-pink-600',
    textColor: 'text-pink-300',
    cost: 60,
    rarity: 'uncommon',
  },
  AMBER: {
    type: ChipType.AMBER,
    name: 'Amber Chip',
    description: 'Last hand each round: +60 chips.',
    color: 'bg-yellow-700',
    textColor: 'text-yellow-300',
    cost: 65,
    rarity: 'uncommon',
  },
  STEEL: {
    type: ChipType.STEEL,
    name: 'Steel Chip',
    description: '+20 chips for each time you discarded this round.',
    color: 'bg-slate-700',
    textColor: 'text-slate-300',
    cost: 60,
    rarity: 'uncommon',
  },
  DIAMOND: {
    type: ChipType.DIAMOND,
    name: 'Diamond Chip',
    description: 'Your skim also contributes 50% to the vault.',
    color: 'bg-cyan-300',
    textColor: 'text-cyan-300',
    cost: 200,
    rarity: 'legendary',
  },
  PLATINUM: {
    type: ChipType.PLATINUM,
    name: 'Platinum Chip',
    description: 'Flush or better: +200 chips.',
    color: 'bg-slate-300',
    textColor: 'text-slate-200',
    cost: 200,
    rarity: 'legendary',
  },
  JOKER: {
    type: ChipType.JOKER,
    name: 'Joker Chip',
    description: 'First hand each round: +150 chips.',
    color: 'bg-fuchsia-600',
    textColor: 'text-fuchsia-200',
    cost: 180,
    rarity: 'legendary',
  },
  // ── New chips ───────────────────────────────────────────────────────────────
  // Common
  MARBLE: {
    type: ChipType.MARBLE,
    name: 'Marble Chip',
    description: '+8 chips per community card used (up to +24 for 3).',
    color: 'bg-slate-400',
    textColor: 'text-slate-200',
    cost: 35,
    rarity: 'common',
  },
  RUST: {
    type: ChipType.RUST,
    name: 'Rust Chip',
    description: 'First hand of the round only: +40 chips. Useless after.',
    color: 'bg-orange-800',
    textColor: 'text-orange-300',
    cost: 25,
    rarity: 'common',
  },
  GRAVEL: {
    type: ChipType.GRAVEL,
    name: 'Gravel Chip',
    description: 'Play exactly 3 cards: +20 chips.',
    color: 'bg-stone-600',
    textColor: 'text-stone-300',
    cost: 20,
    rarity: 'common',
  },
  // Uncommon
  BONE: {
    type: ChipType.BONE,
    name: 'Bone Chip',
    description: 'All cards same color (all red or all black): ×1.25.',
    color: 'bg-stone-200',
    textColor: 'text-stone-700',
    cost: 55,
    rarity: 'uncommon',
  },
  CEDAR: {
    type: ChipType.CEDAR,
    name: 'Cedar Chip',
    description: '+25 chips on even-numbered hands this round (2nd, 4th, 6th...).',
    color: 'bg-amber-700',
    textColor: 'text-amber-200',
    cost: 50,
    rarity: 'uncommon',
  },
  TOPAZ: {
    type: ChipType.TOPAZ,
    name: 'Topaz Chip',
    description: 'Always: ×1.1.',
    color: 'bg-yellow-400',
    textColor: 'text-yellow-900',
    cost: 65,
    rarity: 'uncommon',
  },
  // Rare
  HAZE: {
    type: ChipType.HAZE,
    name: 'Haze Chip',
    description: 'If you discarded this round: ×1.4 to score.',
    color: 'bg-purple-900',
    textColor: 'text-purple-300',
    cost: 80,
    rarity: 'rare',
  },
  FORGE: {
    type: ChipType.FORGE,
    name: 'Forge Chip',
    description: '+8 chips per card played. 5 cards = +40.',
    color: 'bg-orange-600',
    textColor: 'text-orange-100',
    cost: 85,
    rarity: 'rare',
  },
  // Legendary
  PRISM: {
    type: ChipType.PRISM,
    name: 'Prism Chip',
    description: '×1.1 per unique suit in your hand (up to ×1.4 for 4 suits).',
    color: 'bg-cyan-400',
    textColor: 'text-cyan-900',
    cost: 140,
    rarity: 'legendary',
  },
  VOID: {
    type: ChipType.VOID,
    name: 'Void Chip',
    description: 'Last hand of the round: ×2.5. Any other hand: ×0.8. Risk it.',
    color: 'bg-gray-950',
    textColor: 'text-gray-400',
    cost: 160,
    rarity: 'legendary',
  },
  // ── Batch 2 — Common ─────────────────────────────────────────────────────
  FLINT: {
    type: ChipType.FLINT,
    name: 'Flint Chip',
    description: '+10 chips per face card (J, Q, K) in your played hand.',
    color: 'bg-stone-700',
    textColor: 'text-stone-300',
    cost: 30,
    rarity: 'common',
  },
  COAL: {
    type: ChipType.COAL,
    name: 'Coal Chip',
    description: 'Play exactly 1 card: +35 chips.',
    color: 'bg-gray-900',
    textColor: 'text-gray-400',
    cost: 25,
    rarity: 'common',
  },
  // ── Batch 2 — Uncommon ───────────────────────────────────────────────────
  IVORY: {
    type: ChipType.IVORY,
    name: 'Ivory Chip',
    description: 'Each Ace in your played hand: +25 chips (up to +100 for 4 Aces).',
    color: 'bg-amber-50',
    textColor: 'text-amber-900',
    cost: 55,
    rarity: 'uncommon',
  },
  GRANITE: {
    type: ChipType.GRANITE,
    name: 'Granite Chip',
    description: '+40 chips if you use zero community cards.',
    color: 'bg-stone-500',
    textColor: 'text-stone-200',
    cost: 50,
    rarity: 'uncommon',
  },
  PYRITE: {
    type: ChipType.PYRITE,
    name: 'Pyrite Chip',
    description: "×1.2 if your wallet has 50c or more. Fool's gold.",
    color: 'bg-yellow-600',
    textColor: 'text-yellow-200',
    cost: 55,
    rarity: 'uncommon',
  },
  TIDE: {
    type: ChipType.TIDE,
    name: 'Tide Chip',
    description: 'Odd hands this round: +45 chips. Even hands: nothing.',
    color: 'bg-teal-600',
    textColor: 'text-teal-200',
    cost: 50,
    rarity: 'uncommon',
  },
  // ── Batch 2 — Rare ───────────────────────────────────────────────────────
  SHARD: {
    type: ChipType.SHARD,
    name: 'Shard Chip',
    description: 'Two Pair: ×1.3 · Full House: ×1.6 · Four of a Kind: ×2.0.',
    color: 'bg-violet-600',
    textColor: 'text-violet-200',
    cost: 90,
    rarity: 'rare',
  },
  LICHEN: {
    type: ChipType.LICHEN,
    name: 'Lichen Chip',
    description: '×1.1 per completed Round. Starts weak, compounds over time.',
    color: 'bg-lime-700',
    textColor: 'text-lime-300',
    cost: 80,
    rarity: 'rare',
  },
  // ── Batch 2 — Legendary ──────────────────────────────────────────────────
  AURORA: {
    type: ChipType.AURORA,
    name: 'Aurora Chip',
    description: '×1.05 for each chip in your stack. Scales with your collection.',
    color: 'bg-purple-700',
    textColor: 'text-cyan-200',
    cost: 220,
    rarity: 'legendary',
  },
  ECHO: {
    type: ChipType.ECHO,
    name: 'Echo Chip',
    description: 'Fires the chip directly before it in your stack a second time.',
    color: 'bg-indigo-800',
    textColor: 'text-indigo-200',
    cost: 200,
    rarity: 'legendary',
  },
};

export function getChip(type: ChipTypeValue): Chip {
  return CHIPS[type];
}

export function bonusHandsFromChips(chips: ChipTypeValue[]): number {
  return chips.filter(c => c === ChipType.SILVER).length;
}

// A single step in the scoring chain
export interface ScoreStep {
  chipType: ChipTypeValue;
  label: string;       // e.g. "Red Chip"
  delta: string;       // e.g. "+15" or "×1.2"
  before: number;
  after: number;
  skimDoubled?: boolean;
  vaultBonus?: number;
  diamondActive?: boolean;
}

export interface ChainResult {
  finalScore: number;
  steps: ScoreStep[];
  skimDoubled: boolean;
  vaultBonus: number;
  diamondActive: boolean;
  skimPenalty: number;  // added by QUARTZ — permanent skim rate increase
}

// Apply chips sequentially — order matters!
// Flat bonuses add to running total, multipliers multiply running total
export function applyChipsSequential(
  chips: ChipTypeValue[],
  baseScore: number,
  handRankValue: number,
  handsPlayedThisRound: number,
  blackChipUsed: boolean,
  selectedCount = 0,
  maxSuitCount = 0,
  hasHeart = false,
  communityUsed = 0,
  discardCount = 0,
  isLastHand = false,
  allBlack = false,
  allRed = false,
  _maxHandsThisRound = 8,
  scratchMultiplier = 1,
  uniqueSuitCount = 1,     // number of unique suits in selected hand (for PRISM)
  faceCardCount = 0,       // J/Q/K count in played hand (for FLINT)
  aceCount = 0,            // Aces in played hand (for IVORY)
  wallet = 0,              // current coins (for PYRITE)
  chipStackSize = 1,       // total chips in stack (for AURORA)
  ante = 1,                // current ante / completed rounds (for LICHEN)
): ChainResult {
  // MOONSTONE: pick one random chip (other than MOONSTONE) to fire twice
  const moonstoneActive = chips.includes(ChipType.MOONSTONE);
  const nonMoonstoneChips = chips.filter(c => c !== ChipType.MOONSTONE);
  const moonstoneDouble = moonstoneActive && nonMoonstoneChips.length > 0
    ? nonMoonstoneChips[Math.floor(Math.random() * nonMoonstoneChips.length)]
    : null;

  // Build execution list — double the moonstone target
  const execList: ChipTypeValue[] = [];
  let moonstoneInserted = false;
  for (const c of chips) {
    execList.push(c);
    if (c === moonstoneDouble && !moonstoneInserted) {
      execList.push(c); // fires twice
      moonstoneInserted = true;
    }
  }

  let running = baseScore;
  const steps: ScoreStep[] = [];
  let skimDoubled = false;
  let vaultBonus = 0;
  let diamondActive = false;
  let skimPenalty = 0;
  let quartzApplied = false;

  // Scratch ticket — applied first as a multiplier on base score
  if (scratchMultiplier > 1) {
    const before = running;
    running = Math.floor(running * scratchMultiplier);
    steps.push({
      chipType: 'SCRATCH' as ChipTypeValue,
      label: `🎫 Scratch ×${scratchMultiplier}`,
      delta: `×${scratchMultiplier}`,
      before,
      after: running,
    });
  }

  for (const chip of execList) {
    const before = running;

    switch (chip) {
      case ChipType.RED: {
        running += 15;
        steps.push({ chipType: chip, label: 'Red Chip', delta: '+15', before, after: running });
        break;
      }
      case ChipType.BLUE: {
        if (handRankValue >= 2) {
          running = Math.floor(running * 1.2);
          steps.push({ chipType: chip, label: 'Blue Chip', delta: '×1.2', before, after: running });
        }
        break;
      }
      case ChipType.BLACK: {
        if (!blackChipUsed) {
          skimDoubled = true;
          steps.push({ chipType: chip, label: 'Black Chip', delta: 'Skim ×2', before, after: running, skimDoubled: true });
        }
        break;
      }
      case ChipType.GOLD: {
        if ((handsPlayedThisRound + 1) % 5 === 0) {
          vaultBonus += 80;
          steps.push({ chipType: chip, label: 'Gold Chip', delta: '+80 vault', before, after: running, vaultBonus: 80 });
        }
        break;
      }
      case ChipType.LUCKY: {
        const roll = 10 + Math.floor(Math.random() * 41);
        running += roll;
        steps.push({ chipType: chip, label: 'Lucky Chip', delta: `+${roll}`, before, after: running });
        break;
      }
      case ChipType.SILVER: {
        // No in-hand effect — handled at deal time
        break;
      }
      case ChipType.DIAMOND: {
        diamondActive = true;
        steps.push({ chipType: chip, label: 'Diamond Chip', delta: 'Skim→Vault 50%', before, after: running, diamondActive: true });
        break;
      }
      case ChipType.PLATINUM: {
        if (handRankValue >= 6) { // FLUSH or better
          running += 200;
          steps.push({ chipType: chip, label: 'Platinum Chip', delta: '+200', before, after: running });
        }
        break;
      }
      case ChipType.JOKER: {
        if (handsPlayedThisRound === 0) {
          running += 150;
          steps.push({ chipType: chip, label: 'Joker Chip', delta: '+150', before, after: running });
        }
        break;
      }
      // New commons
      case ChipType.COPPER: {
        running += 10;
        steps.push({ chipType: chip, label: 'Copper Chip', delta: '+10', before, after: running });
        break;
      }
      case ChipType.PENNY: {
        // Only fires on Pair or better (handRankValue >= 2)
        if (handRankValue >= 2) {
          const bonus = selectedCount * 2;
          running += bonus;
          steps.push({ chipType: chip, label: 'Penny Chip', delta: `+${bonus}`, before, after: running });
        }
        break;
      }
      case ChipType.CHALK: {
        if (handRankValue === 1) { // HIGH_CARD
          running += 20;
          steps.push({ chipType: chip, label: 'Chalk Chip', delta: '+20', before, after: running });
        }
        break;
      }
      // New uncommons
      case ChipType.JADE: {
        if (maxSuitCount >= 3) {
          running = Math.floor(running * 1.15);
          steps.push({ chipType: chip, label: 'Jade Chip', delta: '×1.15', before, after: running });
        }
        break;
      }
      case ChipType.IRON: {
        if (selectedCount === 5) {
          running += 35;
          steps.push({ chipType: chip, label: 'Iron Chip', delta: '+35', before, after: running });
        }
        break;
      }
      case ChipType.BRONZE: {
        if ((handsPlayedThisRound + 1) % 3 === 0) {
          running += 25;
          steps.push({ chipType: chip, label: 'Bronze Chip', delta: '+25', before, after: running });
        }
        break;
      }
      // New commons
      case ChipType.TIN: {
        const bonus = isLastHand ? 16 : 8;
        running += bonus;
        steps.push({ chipType: chip, label: 'Tin Chip', delta: `+${bonus}`, before, after: running });
        break;
      }
      case ChipType.NICKEL: {
        const bonus = execList.filter((v, i, a) => a.indexOf(v) === i).length * 2; // unique chips × 2
        running += bonus;
        steps.push({ chipType: chip, label: 'Nickel Chip', delta: `+${bonus}`, before, after: running });
        break;
      }
      case ChipType.ROSE: {
        if (hasHeart) {
          running += 15;
          steps.push({ chipType: chip, label: 'Rose Chip', delta: '+15', before, after: running });
        }
        break;
      }
      case ChipType.RIVER: {
        if (communityUsed > 0) {
          running += 18;
          steps.push({ chipType: chip, label: 'River Chip', delta: '+18', before, after: running });
        }
        break;
      }
      case ChipType.EMBER: {
        const bonus = (handsPlayedThisRound + 1) * 5;
        running += bonus;
        steps.push({ chipType: chip, label: 'Ember Chip', delta: `+${bonus}`, before, after: running });
        break;
      }
      // New uncommons
      case ChipType.OBSIDIAN: {
        if (handRankValue >= 5) { // STRAIGHT or better
          running += 40;
          steps.push({ chipType: chip, label: 'Obsidian Chip', delta: '+40', before, after: running });
        }
        break;
      }
      case ChipType.SAPPHIRE: {
        if (handRankValue === 2) { running = Math.floor(running * 1.1); steps.push({ chipType: chip, label: 'Sapphire Chip', delta: '×1.1', before, after: running }); }
        else if (handRankValue === 3) { running = Math.floor(running * 1.15); steps.push({ chipType: chip, label: 'Sapphire Chip', delta: '×1.15', before, after: running }); }
        else if (handRankValue === 4) { running = Math.floor(running * 1.2); steps.push({ chipType: chip, label: 'Sapphire Chip', delta: '×1.2', before, after: running }); }
        break;
      }
      case ChipType.CORAL: {
        if (handsPlayedThisRound === 0) {
          running += 50;
          steps.push({ chipType: chip, label: 'Coral Chip', delta: '+50', before, after: running });
        }
        break;
      }
      case ChipType.AMBER: {
        if (isLastHand) {
          running += 60;
          steps.push({ chipType: chip, label: 'Amber Chip', delta: '+60', before, after: running });
        }
        break;
      }
      case ChipType.STEEL: {
        if (discardCount > 0) {
          const bonus = discardCount * 20;
          running += bonus;
          steps.push({ chipType: chip, label: 'Steel Chip', delta: `+${bonus}`, before, after: running });
        }
        break;
      }
      // New rares
      case ChipType.ONYX: {
        if (allBlack) {
          running = Math.floor(running * 1.5);
          steps.push({ chipType: chip, label: 'Onyx Chip', delta: '×1.5', before, after: running });
        }
        break;
      }
      case ChipType.RUBY: {
        if (allRed) {
          running = Math.floor(running * 1.5);
          steps.push({ chipType: chip, label: 'Ruby Chip', delta: '×1.5', before, after: running });
        }
        break;
      }
      case ChipType.QUARTZ: {
        if (!quartzApplied) {
          running = Math.floor(running * 1.3);
          skimPenalty += 0.05;
          quartzApplied = true;
          steps.push({ chipType: chip, label: 'Quartz Chip', delta: '×1.3 / skim+5%', before, after: running });
        }
        break;
      }
      case ChipType.CRYSTAL: {
        if (handRankValue === 10) { // ROYAL_FLUSH
          running += 500;
          steps.push({ chipType: chip, label: 'Crystal Chip', delta: '+500', before, after: running });
        }
        break;
      }
      case ChipType.MOONSTONE: {
        steps.push({ chipType: chip, label: `Moonstone: doubles ${moonstoneDouble ?? 'none'}`, delta: '×2', before, after: running });
        break;
      }
      // ── New common chips ─────────────────────────────────────────────────
      case ChipType.MARBLE: {
        const bonus = Math.min(3, communityUsed) * 8;
        if (bonus > 0) {
          running += bonus;
          steps.push({ chipType: chip, label: 'Marble Chip', delta: `+${bonus}`, before, after: running });
        }
        break;
      }
      case ChipType.RUST: {
        if (handsPlayedThisRound === 0) {
          running += 40;
          steps.push({ chipType: chip, label: 'Rust Chip', delta: '+40', before, after: running });
        }
        break;
      }
      case ChipType.GRAVEL: {
        if (selectedCount === 3) {
          running += 20;
          steps.push({ chipType: chip, label: 'Gravel Chip', delta: '+20', before, after: running });
        }
        break;
      }
      // ── New uncommon chips ───────────────────────────────────────────────
      case ChipType.BONE: {
        if (allBlack || allRed) {
          running = Math.floor(running * 1.25);
          steps.push({ chipType: chip, label: 'Bone Chip', delta: '×1.25', before, after: running });
        }
        break;
      }
      case ChipType.CEDAR: {
        if (handsPlayedThisRound % 2 === 1) {
          running += 25;
          steps.push({ chipType: chip, label: 'Cedar Chip', delta: '+25', before, after: running });
        }
        break;
      }
      case ChipType.TOPAZ: {
        running = Math.floor(running * 1.1);
        steps.push({ chipType: chip, label: 'Topaz Chip', delta: '×1.1', before, after: running });
        break;
      }
      // ── New rare chips ───────────────────────────────────────────────────
      case ChipType.HAZE: {
        if (discardCount > 0) {
          running = Math.floor(running * 1.4);
          steps.push({ chipType: chip, label: 'Haze Chip', delta: '×1.4', before, after: running });
        }
        break;
      }
      case ChipType.FORGE: {
        const forgeBonus = selectedCount * 8;
        if (forgeBonus > 0) {
          running += forgeBonus;
          steps.push({ chipType: chip, label: 'Forge Chip', delta: `+${forgeBonus}`, before, after: running });
        }
        break;
      }
      // ── New legendary chips ──────────────────────────────────────────────
      case ChipType.PRISM: {
        const prismMult = Math.pow(1.1, Math.min(4, uniqueSuitCount));
        running = Math.floor(running * prismMult);
        steps.push({ chipType: chip, label: 'Prism Chip', delta: `×${prismMult.toFixed(2)}`, before, after: running });
        break;
      }
      case ChipType.VOID: {
        const voidMult = isLastHand ? 2.5 : 0.8;
        running = Math.floor(running * voidMult);
        steps.push({ chipType: chip, label: 'Void Chip', delta: isLastHand ? '×2.5' : '×0.8', before, after: running });
        break;
      }
      // ── Batch 2 — Common ───────────────────────────────────────────────
      case ChipType.FLINT: {
        if (faceCardCount > 0) {
          const bonus = faceCardCount * 10;
          running += bonus;
          steps.push({ chipType: chip, label: 'Flint Chip', delta: `+${bonus}`, before, after: running });
        }
        break;
      }
      case ChipType.COAL: {
        if (selectedCount === 1) {
          running += 35;
          steps.push({ chipType: chip, label: 'Coal Chip', delta: '+35', before, after: running });
        }
        break;
      }
      // ── Batch 2 — Uncommon ─────────────────────────────────────────────
      case ChipType.IVORY: {
        if (aceCount > 0) {
          const bonus = aceCount * 25;
          running += bonus;
          steps.push({ chipType: chip, label: 'Ivory Chip', delta: `+${bonus}`, before, after: running });
        }
        break;
      }
      case ChipType.GRANITE: {
        if (communityUsed === 0) {
          running += 40;
          steps.push({ chipType: chip, label: 'Granite Chip', delta: '+40', before, after: running });
        }
        break;
      }
      case ChipType.PYRITE: {
        if (wallet >= 50) {
          running = Math.floor(running * 1.2);
          steps.push({ chipType: chip, label: 'Pyrite Chip', delta: '×1.2', before, after: running });
        }
        break;
      }
      case ChipType.TIDE: {
        // Odd hands = 1st, 3rd, 5th... (handsPlayedThisRound is 0-indexed, so 0=1st hand)
        if (handsPlayedThisRound % 2 === 0) {
          running += 45;
          steps.push({ chipType: chip, label: 'Tide Chip', delta: '+45', before, after: running });
        }
        break;
      }
      // ── Batch 2 — Rare ─────────────────────────────────────────────────
      case ChipType.SHARD: {
        if (handRankValue === 3) { // TWO_PAIR
          running = Math.floor(running * 1.3);
          steps.push({ chipType: chip, label: 'Shard Chip', delta: '×1.3', before, after: running });
        } else if (handRankValue === 7) { // FULL_HOUSE
          running = Math.floor(running * 1.6);
          steps.push({ chipType: chip, label: 'Shard Chip', delta: '×1.6', before, after: running });
        } else if (handRankValue === 8) { // FOUR_OF_A_KIND
          running = Math.floor(running * 2.0);
          steps.push({ chipType: chip, label: 'Shard Chip', delta: '×2.0', before, after: running });
        }
        break;
      }
      case ChipType.LICHEN: {
        // ante - 1 = completed rounds (ante 1 = 0 completed, ante 2 = 1 completed, etc.)
        const completedAntes = Math.max(0, ante - 1);
        if (completedAntes > 0) {
          const lichenMult = Math.pow(1.1, completedAntes);
          running = Math.floor(running * lichenMult);
          steps.push({ chipType: chip, label: 'Lichen Chip', delta: `×${lichenMult.toFixed(2)}`, before, after: running });
        }
        break;
      }
      // ── Batch 2 — Legendary ────────────────────────────────────────────
      case ChipType.AURORA: {
        const auroraMult = Math.pow(1.05, chipStackSize);
        running = Math.floor(running * auroraMult);
        steps.push({ chipType: chip, label: 'Aurora Chip', delta: `×${auroraMult.toFixed(2)}`, before, after: running });
        break;
      }
      case ChipType.ECHO: {
        // Find the chip directly before ECHO in the original chips array and re-apply it.
        // We track this via the execList index.
        const echoIdx = execList.indexOf(chip);
        const prevChip = echoIdx > 0 ? execList[echoIdx - 1] : null;
        if (prevChip && prevChip !== ChipType.ECHO && prevChip !== ChipType.MOONSTONE) {
          // Re-push prevChip into execList for processing — handled by re-running the switch
          // Simplest approach: push a second copy right after current position
          // Since we can't modify execList mid-loop, we store it and process after
          // Instead, duplicate the step value from the last step
          const lastStep = steps.length > 0 ? steps[steps.length - 1] : null;
          if (lastStep) {
            const echoBefore = running;
            const delta = lastStep.after - lastStep.before;
            if (delta > 0) {
              // Flat bonus echo
              running += delta;
              steps.push({ chipType: chip, label: `Echo (${lastStep.label})`, delta: `+${delta}`, before: echoBefore, after: running });
            } else if (lastStep.after !== lastStep.before) {
              // Multiplier echo — apply same ratio
              const ratio = lastStep.after / (lastStep.before || 1);
              running = Math.floor(running * ratio);
              steps.push({ chipType: chip, label: `Echo (${lastStep.label})`, delta: `×${ratio.toFixed(2)}`, before: echoBefore, after: running });
            }
          }
        }
        break;
      }
    }
  }

  return { finalScore: running, steps, skimDoubled, vaultBonus, diamondActive, skimPenalty };
}

// Keep old applyChips for compatibility — delegates to sequential
export interface ChipBonusResult {
  flatBonus: number;
  multiplier: number;
  skimDoubled: boolean;
  vaultBonus: number;
  diamondActive: boolean;
}

export function applyChips(
  chips: ChipTypeValue[],
  handRankValue: number,
  handsPlayedThisRound: number,
  blackChipUsed: boolean,
): ChipBonusResult {
  // Legacy shim — not used for scoring anymore, kept for type safety
  const result = applyChipsSequential(chips, 0, handRankValue, handsPlayedThisRound, blackChipUsed);
  return {
    flatBonus: 0,
    multiplier: 1,
    skimDoubled: result.skimDoubled,
    vaultBonus: result.vaultBonus,
    diamondActive: result.diamondActive,
  };
}

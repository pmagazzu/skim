import { createDeck, shuffleSeeded, rankName, suitSymbol, CardModifier } from './deck';
import type { Card, CardModifierValue } from './deck';
import { evaluateHand, HAND_NAMES } from './hands';
import { chipValue, handUpgradeCost, SCORE_TABLE, handBaseAtLevel, resolveModifiers } from './scoring';
import type { HandRankValue } from './hands';
import { ConsumableType, rollScratchMultiplier } from './consumables';
import type { ConsumableTypeValue } from './consumables';
import { ChipType, applyChipsSequential, bonusHandsFromChips, CHIPS } from './chips';
import type { ChipTypeValue, ScoreStep } from './chips';
import { generateBounties, checkBountyCondition, BountyReward } from './bounties';
import type { Bounty } from './bounties';
import { dailySeed, makeRandomSeed, nextBool, nextInt, seedFromString, shuffleWithRng, weightedPick as weightedPickSeeded } from './rng';

export type Difficulty = 'easy' | 'normal' | 'hard';

const HANDS_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy:   10,
  normal:  8,
  hard:    6,
};

export type GamePhase =
  | 'difficulty'
  | 'dealing'
  | 'selecting'
  | 'score-review'   // pause after last hand to view final score before round-end
  | 'shop'
  | 'round-end'
  | 'ante-complete'  // brief screen between antes
  | 'game-over'
  | 'victory';

export const PackType = {
  // ── Common ─────────────────────────────────────────────────────────────────
  JUNK_PACK:     'JUNK_PACK',     // 2 crappy low cards (2-6)
  BULK_PACK:     'BULK_PACK',     // 3 mid-range cards (5-9)
  // ── Uncommon ──────────────────────────────────────────────────────────────
  STANDARD_PACK: 'STANDARD_PACK', // 3 cards, mostly mid-rank (7-K)
  SUITED_PACK:   'SUITED_PACK',   // 3 cards same random suit
  FACE_UPGRADE:  'FACE_UPGRADE',  // upgrades 3 low cards (2-6) → J/Q/K
  // ── Rare ──────────────────────────────────────────────────────────────────
  PREMIUM_PACK:  'PREMIUM_PACK',  // 4 cards, face cards & Aces weighted
  FLUSH_PACK:    'FLUSH_PACK',    // 5 cards same suit (5 through A)
  PAIR_UPGRADE:  'PAIR_UPGRADE',  // upgrades low cards to create 2 matching pairs
  // ── Legendary ─────────────────────────────────────────────────────────────
  ROYAL_UPGRADE: 'ROYAL_UPGRADE', // upgrades 5 low cards → face cards + Aces
  ACE_PACK:      'ACE_PACK',      // adds 3 Aces to your deck
  GODHAND_PACK:  'GODHAND_PACK',  // adds A K Q J 10 same suit — the royal flush set
} as const;
export type PackTypeValue = typeof PackType[keyof typeof PackType];
export type PackKind = 'add' | 'upgrade';
export type PackRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export const PACK_KIND: Record<PackTypeValue, PackKind> = {
  JUNK_PACK:     'add',
  BULK_PACK:     'add',
  STANDARD_PACK: 'add',
  SUITED_PACK:   'add',
  FACE_UPGRADE:  'upgrade',
  PREMIUM_PACK:  'add',
  FLUSH_PACK:    'add',
  PAIR_UPGRADE:  'upgrade',
  ROYAL_UPGRADE: 'upgrade',
  ACE_PACK:      'add',
  GODHAND_PACK:  'add',
};

export const PACK_RARITY: Record<PackTypeValue, PackRarity> = {
  JUNK_PACK:     'common',
  BULK_PACK:     'common',
  STANDARD_PACK: 'uncommon',
  SUITED_PACK:   'uncommon',
  FACE_UPGRADE:  'uncommon',
  PREMIUM_PACK:  'rare',
  FLUSH_PACK:    'rare',
  PAIR_UPGRADE:  'rare',
  ROYAL_UPGRADE: 'legendary',
  ACE_PACK:      'legendary',
  GODHAND_PACK:  'legendary',
};

export interface PackUpgradeEntry { from: Card; to: Card; deckIndex: number; }
export interface PendingPackResult {
  packType: PackTypeValue;
  kind: PackKind;
  addedCards?: Card[];                // for ADD packs
  upgrades?: PackUpgradeEntry[];      // for UPGRADE packs
}

export const BoosterType = {
  CHIP: 'CHIP',
  HAND: 'HAND',
  UTILITY: 'UTILITY',
  FORGE: 'FORGE',
  WILDCARD: 'WILDCARD',
  BOUNTY: 'BOUNTY',
} as const;
export type BoosterTypeValue = typeof BoosterType[keyof typeof BoosterType];

export type BoosterRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface BoosterOption {
  id: string;
  label: string;
  detail: string;
  kind: 'chip' | 'hand-upgrade' | 'consumable' | 'skim-upgrade' | 'forge' | 'bounty' | 'chips';
  chipType?: ChipTypeValue;
  handRank?: HandRankValue;
  consumableType?: ConsumableTypeValue;
  forgeRarity?: BoosterRarity;
  bountyId?: string;
  chipsAmount?: number;
}

export interface ShopItem {
  id: string;
  label: string;
  subtitle: string;
  cost: number;
  type: 'booster';
  boosterType: BoosterTypeValue;
  rarity: BoosterRarity;
  optionCount: number;
  premium?: boolean;
}

export const UpgradeType = {
  DISCOUNT_5:             'DISCOUNT_5',
  DISCOUNT_10:            'DISCOUNT_10',
  EXTRA_CHIP_SLOT:        'EXTRA_CHIP_SLOT',
  LUCKY_SHOP:             'LUCKY_SHOP',
  PACK_PLUS:              'PACK_PLUS',
  FELT_NEON:              'FELT_NEON',
  FELT_MARBLE:            'FELT_MARBLE',
  EXTRA_CONSUMABLE_SLOT:  'EXTRA_CONSUMABLE_SLOT', // +1 consumable slot (3 max)
  EXTRA_CONSUMABLE_SLOT2: 'EXTRA_CONSUMABLE_SLOT2', // +1 more consumable slot (4 max)
} as const;
export type UpgradeTypeValue = typeof UpgradeType[keyof typeof UpgradeType];

export const UPGRADE_DEFS: Record<UpgradeTypeValue, { label: string; description: string; cost: number; icon: string }> = {
  DISCOUNT_5:      { label: 'Discount Card I',    icon: '🏷️',  description: 'All shop prices permanently 5% cheaper.',             cost: 90  },
  DISCOUNT_10:     { label: 'Discount Card II',   icon: '🏷️',  description: 'Another 5% off everything. Stacks with Card I.',     cost: 180 },
  EXTRA_CHIP_SLOT: { label: 'Extra Chip Slot',    icon: '🎰',  description: 'Carry one more chip. Stack grows from 5 to 6.',       cost: 120 },
  LUCKY_SHOP:      { label: 'Lucky Roster',       icon: '🍀',  description: '+1 extra chip offered each shop visit.',              cost: 100 },
  PACK_PLUS:       { label: 'Fat Pack',           icon: '📦',  description: 'Every booster pack gives you one bonus card.',        cost: 110 },
  FELT_NEON:              { label: 'Neon Felt',             icon: '💡',  description: 'Unlocks the neon table skin. Purely cosmetic.',            cost: 60  },
  FELT_MARBLE:            { label: 'Marble Felt',           icon: '🪨',  description: 'Unlocks the marble table skin. Purely cosmetic.',          cost: 60  },
  EXTRA_CONSUMABLE_SLOT:  { label: 'Bigger Pockets I',      icon: '🎒',  description: 'Unlock a 3rd consumable slot. Carry more tools.',          cost: 200 },
  EXTRA_CONSUMABLE_SLOT2: { label: 'Bigger Pockets II',     icon: '🎒',  description: 'Unlock a 4th consumable slot. The full kit.',             cost: 300 },
};

export interface TipBonus {
  chipType: ChipTypeValue;
  label: string;
  multiplier?: number;   // if defined, multiply score by this
  flat?: number;         // if defined, add this flat bonus
  skimMult?: number;     // if defined, override skim multiplier
  vaultFlat?: number;    // if defined, add this to vault directly
}

// Map chip type → tip bonus definition
export const TIP_BONUS_MAP: Record<string, TipBonus> = {
  RED:      { chipType: 'RED',      label: '+60 chips next hand',         flat: 60 },
  BLUE:     { chipType: 'BLUE',     label: '×1.5 next hand',              multiplier: 1.5 },
  BLACK:    { chipType: 'BLACK',    label: 'Skim ×3 next hand',           skimMult: 3 },
  GOLD:     { chipType: 'GOLD',     label: '+200 vault next hand',        vaultFlat: 200 },
  LUCKY:    { chipType: 'LUCKY',    label: '+80 chips next hand',         flat: 80 },
  SILVER:   { chipType: 'SILVER',   label: '+60 chips next hand',         flat: 60 },
  DIAMOND:  { chipType: 'DIAMOND',  label: '×2.0 next hand',              multiplier: 2.0 },
  PLATINUM: { chipType: 'PLATINUM', label: '×1.8 next hand',              multiplier: 1.8 },
  JOKER:    { chipType: 'JOKER',    label: '+150 chips next hand',        flat: 150 },
  MOONSTONE:{ chipType: 'MOONSTONE',label: '×2.0 next hand',              multiplier: 2.0 },
  TOPAZ:    { chipType: 'TOPAZ',    label: '×1.5 next hand',              multiplier: 1.5 },
  PRISM:    { chipType: 'PRISM',    label: '×1.8 next hand',              multiplier: 1.8 },
  VOID:     { chipType: 'VOID',     label: '×2.5 next hand (no penalty)', multiplier: 2.5 },
  QUARTZ:   { chipType: 'QUARTZ',   label: '×1.5 + no skim penalty',      multiplier: 1.5 },
  FORGE:    { chipType: 'FORGE',    label: '+60 chips next hand',         flat: 60 },
  HAZE:     { chipType: 'HAZE',     label: '×1.6 next hand',              multiplier: 1.6 },
};

export interface RoundResult {
  round: number;
  vaultFilled: boolean;
  vaultPct: number;
  personalChips: number;
  skimRate: number;
}

export interface GameState {
  phase: GamePhase;
  deck: Card[];
  hand: Card[];
  communityCards: Card[];
  selectedIds: string[];
  maxHandsPerRound: number;
  vault: number;
  vaultTarget: number;
  skimRate: number;
  personalChips: number;
  roundChips: number;
  consumables: ConsumableTypeValue[];
  chipStack: ChipTypeValue[];
  scratchMultiplier: number;
  blackChipUsedThisRound: boolean;
  handsPlayedThisRound: number;
  shopItems: ShopItem[];
  round: number;        // global round counter (1, 2, 3, 4, ...)
  ante: number;         // current ante (1, 2, 3, ...)
  roundInAnte: number;  // 1, 2, or 3 within the current ante
  lastScore: number | null;
  lastBaseScore: number | null;
  lastHandName: string | null;
  lastBonusDetail: string | null;
  consumableResult: { title: string; message: string } | null;
  forgeResult: { card: Card; modifier: CardModifierValue } | null;
  roundHistory: RoundResult[];
  rouletteWins: number;
  handSize: number;
  difficulty: Difficulty;
  availableBounties: Bounty[];
  activeBounties: Bounty[];
  usedConsumableThisRound: boolean;
  ownedDeck: Card[];          // persistent deck across rounds (packs add here)
  discardedThisRound: number; // count of discards this round
  maxFreeDiscards: number;   // free discards per round (default 2)
  extraDiscardCost: number;  // cost per extra discard beyond free limit
  playedCardIds: string[]; // cards consumed this round (played from hand/community)
  bestHandScoreThisRound: number;
  bestHandRankThisRound: number;
  newCommunityIds: string[];
  lastScoreChain: ScoreStep[];  // sequential chip scoring steps for display
  lastFiredChips: string[];     // chip types that contributed to last hand score
  pendingPackResult: PendingPackResult | null;
  tipBonus: TipBonus | null;               // active chip tip bonus (fires next hand)
  purchasedUpgrades: UpgradeTypeValue[];   // permanent shop upgrades bought
  consumableSlots: number;               // 2 default, up to 4 via upgrades
  shopDiscount: number;                    // 0.0–0.5, applied to all shop costs
  feltSkin: 'default' | 'neon' | 'marble';
  theme: 'gold' | 'neon' | 'blood' | 'ice' | 'smoke';
  handLevels: Record<HandRankValue, number>;   // upgrade level per hand rank (1 = base)
  shopHandUpgrades: HandRankValue[];           // 2 random hands offered for upgrade this shop visit
  handRerollCost: number;                      // current reroll cost (escalates per reroll)
  openedBooster: { boosterId: string; options: BoosterOption[] } | null;
  boosterRerollCost: number;
  boosterOptionsCache: Record<string, BoosterOption[]>;
  armedBoosters: string[];
  runSeed: string;
  rngState: number;
  initialSeedState: number;
}

export type GameAction =
  | { type: 'SET_DIFFICULTY'; difficulty: Difficulty }
  | { type: 'SET_RUN_SEED'; seed: string }
  | { type: 'NEW_RANDOM_SEED' }
  | { type: 'SET_DAILY_SEED' }
  | { type: 'ACCEPT_BOUNTY'; bountyId: string }
  | { type: 'REORDER_CHIPS'; fromIndex: number; toIndex: number }
  | { type: 'CLEAR_NEW_COMMUNITY' }
  | { type: 'DEBUG_WIN' }
  | { type: 'DEAL' }
  | { type: 'SELECT_CARD'; id: string }
  | { type: 'PLAY_HAND' }
  | { type: 'DISCARD_HAND' }
  | { type: 'USE_CONSUMABLE'; consumable: ConsumableTypeValue }
  | { type: 'ROULETTE_SPIN'; betAmount: number; betType: 'red' | 'black' | 'number'; pickedNumbers: number[] }
  | { type: 'DISMISS_RESULT' }
  | { type: 'BUY_ITEM'; itemId: string }
  | { type: 'BUY_BOOSTER'; itemId: string }
  | { type: 'SELECT_BOOSTER_OPTION'; boosterId: string; optionId: string }
  | { type: 'DISMISS_BOOSTER' }
  | { type: 'REROLL_BOOSTERS' }
  | { type: 'BUY_PACK'; packType: PackTypeValue }
  | { type: 'CONFIRM_PACK' }
  | { type: 'SELL_CHIP'; index: number }
  | { type: 'TIP_CHIP'; index: number }
  | { type: 'BUY_UPGRADE'; upgradeType: UpgradeTypeValue }
  | { type: 'SET_THEME'; theme: 'gold' | 'neon' | 'blood' | 'ice' | 'smoke' }
  | { type: 'BUY_HAND_UPGRADE'; handRank: HandRankValue }
  | { type: 'REROLL_HAND_UPGRADES' }
  | { type: 'BUY_FORGE'; rarity: 'common' | 'uncommon' | 'rare' | 'legendary' }
  | { type: 'END_SHOP' }
  | { type: 'NEXT_ROUND' }
  | { type: 'CONTINUE_SCORE_REVIEW' }
  | { type: 'START_ANTE' }
  | { type: 'RESET' };

const HAND_SIZE = 5;

// Generate pack contents without mutating deck — returns a PendingPackResult
// Deterministic: every draw consumes and returns rng state.
function maybeModifier(packRarity: PackRarity, rngState: number): { modifier?: CardModifierValue; rngState: number } {
  const chance = nextBool(rngState, 0.2);
  let s = chance.state;
  if (!chance.value) return { rngState: s };
  const pools: Record<PackRarity, CardModifierValue[]> = {
    common: ['POLISHED', 'SCARRED'],
    uncommon: ['POLISHED', 'SCARRED', 'CHARGED', 'HOT', 'WILD'],
    rare: ['CHARGED', 'HOT', 'WILD', 'VOLATILE', 'GHOST'],
    legendary: ['VOLATILE', 'GHOST', 'CURSED', 'MIMIC'],
  };
  const pick = nextInt(s, pools[packRarity].length);
  s = pick.state;
  return { modifier: pools[packRarity][pick.value], rngState: s };
}

function computePackResult(deck: Card[], packType: PackTypeValue, rngState: number): { result: PendingPackResult; rngState: number } {
  const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const kind = PACK_KIND[packType];
  let s = rngState;
  const token = nextInt(s, 0x7fffffff); s = token.state;
  const ts = token.value;
  const rSuit = (): Card['suit'] => { const r = nextInt(s, 4); s = r.state; return suits[r.value]; };
  const rRange = (min:number, span:number) => { const r = nextInt(s, span); s = r.state; return min + r.value; };
  const packRarity = PACK_RARITY[packType] as PackRarity;
  const withModifier = (base: Omit<Card,'id'>, id: string): Card => {
    const m = maybeModifier(packRarity, s); s = m.rngState; return { ...base, id, modifier: m.modifier };
  };

  if (packType === PackType.JUNK_PACK) {
    const addedCards = Array.from({ length: 2 }, (_, i) => withModifier({ suit: rSuit(), rank: rRange(2,5) }, `pack-junk-${ts}-${i}`));
    return { result: { packType, kind, addedCards }, rngState: s };
  }
  if (packType === PackType.BULK_PACK) {
    const addedCards = Array.from({ length: 3 }, (_, i) => withModifier({ suit: rSuit(), rank: rRange(5,5) }, `pack-bulk-${ts}-${i}`));
    return { result: { packType, kind, addedCards }, rngState: s };
  }
  if (packType === PackType.STANDARD_PACK) {
    const pool = [
      ...Array(5).fill(null).map((_, i) => ({ rank: 7 + i % 4, suit: suits[i % 4] })),
      ...Array(3).fill(null).map((_, i) => ({ rank: 11 + i % 3, suit: suits[(i + 1) % 4] })),
      { rank: 14, suit: rSuit() },
    ];
    const shuffled = shuffleWithRng(s, pool); s = shuffled.state;
    const addedCards = shuffled.value.slice(0,3).map((c,i)=>withModifier({ suit:c.suit as Card['suit'], rank:c.rank }, `pack-std-${ts}-${i}`));
    return { result: { packType, kind, addedCards }, rngState: s };
  }
  if (packType === PackType.SUITED_PACK) {
    const suit = rSuit();
    const shuffled = shuffleWithRng(s, [6,7,8,9,10,11,12,13]); s = shuffled.state;
    const addedCards = shuffled.value.slice(0,3).map((rank,i)=>withModifier({ suit, rank }, `pack-suit-${ts}-${i}`));
    return { result: { packType, kind, addedCards }, rngState: s };
  }
  if (packType === PackType.FACE_UPGRADE) {
    const sorted = deck.map((c,i)=>({c,i})).filter(x=>x.c.rank<=8).sort((a,b)=>a.c.rank-b.c.rank).slice(0,3);
    const faceRanks = [11,12,13];
    const upgrades = sorted.map(({c,i},idx)=>({ from:c, to:{ ...c, rank: faceRanks[idx], id:`${c.suit}-${faceRanks[idx]}-upg-${ts}`}, deckIndex:i }));
    return { result: { packType, kind, upgrades }, rngState: s };
  }
  if (packType === PackType.PREMIUM_PACK) {
    const pool = [
      { rank: 11, suit: suits[0] }, { rank: 12, suit: suits[1] }, { rank: 13, suit: suits[2] }, { rank: 13, suit: suits[3] },
      { rank: 14, suit: suits[0] }, { rank: 14, suit: suits[1] }, { rank: 14, suit: suits[2] }, { rank: 14, suit: suits[3] },
      { rank: 10, suit: rSuit() },
    ];
    const shuffled = shuffleWithRng(s, pool); s = shuffled.state;
    const addedCards = shuffled.value.slice(0,4).map((c,i)=>withModifier({ suit:c.suit as Card['suit'], rank:c.rank }, `pack-prem-${ts}-${i}`));
    return { result: { packType, kind, addedCards }, rngState: s };
  }
  if (packType === PackType.FLUSH_PACK) {
    const suit = rSuit();
    const shuffled = shuffleWithRng(s, [5,6,7,8,9,10,11,12,13,14]); s = shuffled.state;
    const addedCards = shuffled.value.slice(0,5).map((rank,i)=>withModifier({ suit, rank }, `pack-flush-${ts}-${i}`));
    return { result: { packType, kind, addedCards }, rngState: s };
  }
  if (packType === PackType.PAIR_UPGRADE) {
    const sorted = deck.map((c,i)=>({c,i})).filter(x=>x.c.rank<=9).sort((a,b)=>a.c.rank-b.c.rank).slice(0,4);
    const pair = nextInt(s,5); s = pair.state;
    const pairRankA = 9 + pair.value;
    const pairRankB = pairRankA === 9 ? 10 : 9;
    const targetRanks = [pairRankA,pairRankA,pairRankB,pairRankB];
    const upgrades = sorted.map(({c,i},idx)=>({ from:c, to:{ ...c, rank:targetRanks[idx], id:`${c.suit}-${targetRanks[idx]}-pair-${ts}-${idx}`}, deckIndex:i }));
    return { result: { packType, kind, upgrades }, rngState: s };
  }
  if (packType === PackType.ROYAL_UPGRADE) {
    const sorted = deck.map((c,i)=>({c,i})).filter(x=>x.c.rank<=10).sort((a,b)=>a.c.rank-b.c.rank).slice(0,5);
    const royalRanks = [14,14,13,12,11];
    const upgrades = sorted.map(({c,i},idx)=>({ from:c, to:{ ...c, rank:royalRanks[idx], id:`${c.suit}-${royalRanks[idx]}-royal-${ts}` }, deckIndex:i }));
    return { result: { packType, kind, upgrades }, rngState: s };
  }
  if (packType === PackType.ACE_PACK) {
    const shuffled = shuffleWithRng(s, suits); s = shuffled.state;
    const addedCards = shuffled.value.slice(0,3).map((suit,i)=>({ suit, rank:14, id:`pack-ace-${ts}-${i}` }));
    return { result: { packType, kind, addedCards }, rngState: s };
  }
  if (packType === PackType.GODHAND_PACK) {
    const suit = rSuit();
    const addedCards = [14,13,12,11,10].map((rank,i)=>({ suit, rank, id:`pack-god-${ts}-${i}` }));
    return { result: { packType, kind, addedCards }, rngState: s };
  }
  return { result: { packType, kind }, rngState: s };
}

function applyPackResult(deck: Card[], result: PendingPackResult): Card[] {
  const d = [...deck];
  if (result.kind === 'add' && result.addedCards) return [...d, ...result.addedCards];
  if (result.kind === 'upgrade' && result.upgrades) for (const upg of result.upgrades) d[upg.deckIndex] = upg.to;
  return d;
}

export function calcVaultTarget(ante: number, roundInAnte: number): number {
  if (ante === 1) return [300, 420, 560][roundInAnte - 1] ?? 560;
  return Math.floor(600 * Math.pow(1.5, ante - 1) * (0.7 + roundInAnte * 0.3));
}
const MAX_HANDS_PER_ROUND = 8;
const MAX_CONSUMABLES = 4;
const MAX_CHIPS = 5;
const COMMUNITY_COUNT = 3;

function seededId(prefix: string, state: number): { id: string; rngState: number } {
  const n = nextInt(state, 0x7fffffff);
  return { id: `${prefix}-${n.value.toString(36)}`, rngState: n.state };
}

function pickHandUpgrades(rngState: number): { handUpgrades: HandRankValue[]; rngState: number } {
  const weights: Record<HandRankValue, number> = { 1:20,2:18,3:15,4:13,5:10,6:8,7:6,8:4,9:2,10:1 };
  const remaining: HandRankValue[] = [1,2,3,4,5,6,7,8,9,10];
  const picked: HandRankValue[] = [];
  let s = rngState;
  while (picked.length < 2 && remaining.length > 0) {
    const w = weightedPickSeeded(s, remaining.map(r => ({ key: r, weight: weights[r] })));
    s = w.state;
    picked.push(w.value);
    remaining.splice(remaining.indexOf(w.value), 1);
  }
  return { handUpgrades: picked, rngState: s };
}

function boosterRarityFor(ante: number, rngState: number, isPremiumBias = false): { rarity: BoosterRarity; rngState: number } {
  const p = weightedPickSeeded(rngState, [
    { key: 'common' as BoosterRarity, weight: ante <= 1 ? 64 : ante === 2 ? 40 : 24 },
    { key: 'uncommon' as BoosterRarity, weight: ante <= 1 ? 30 : ante === 2 ? 36 : 34 },
    { key: 'rare' as BoosterRarity, weight: ante <= 1 ? 6 : ante === 2 ? 20 : 30 },
    { key: 'legendary' as BoosterRarity, weight: isPremiumBias ? (ante <= 2 ? 6 : 14) : (ante <= 1 ? 0 : ante === 2 ? 4 : 12) },
  ]);
  return { rarity: p.value, rngState: p.state };
}

function countLowCards(deck: Card[]): number { return deck.filter(c => c.rank <= 8).length; }

function generateBoosterOptions(state: GameState, item: ShopItem): { options: BoosterOption[]; rngState: number } {
  let s = state.rngState;
  const maxChips = state.purchasedUpgrades.includes(UpgradeType.EXTRA_CHIP_SLOT) ? 6 : MAX_CHIPS;
  const rarityOrder: BoosterRarity[] = ['common', 'uncommon', 'rare', 'legendary'];
  const forgeFallback = rarityOrder[Math.max(0, rarityOrder.indexOf(item.rarity))];
  const cVals = Object.values(ConsumableType) as ConsumableTypeValue[];
  const options: BoosterOption[] = [];
  const seen = new Set<string>();
  const makeId = (prefix: string) => { const out = seededId(prefix, s); s = out.rngState; return out.id; };
  const randIndex = (len:number) => { const r=nextInt(s,len); s=r.state; return r.value; };
  const optionKey = (o: BoosterOption): string => {
    if (o.kind === 'chip') return `chip:${o.chipType}`;
    if (o.kind === 'hand-upgrade') return `hand:${o.handRank}`;
    if (o.kind === 'consumable') return `cons:${o.consumableType}`;
    if (o.kind === 'skim-upgrade') return 'skim-upgrade';
    if (o.kind === 'forge') return `forge:${o.forgeRarity}`;
    if (o.kind === 'bounty') return `bounty:${o.bountyId}`;
    if (o.kind === 'chips') return `chips:${o.chipsAmount}`;
    return `${o.kind}:${o.label}`;
  };
  const addUnique = (o: BoosterOption) => {
    const k = optionKey(o);
    if (seen.has(k)) return false;
    seen.add(k);
    options.push(o);
    return true;
  };
  const randomHand = (): HandRankValue => { const p = weightedPickSeeded(s, [
    { key: 1 as HandRankValue, weight: 20 }, { key: 2 as HandRankValue, weight: 17 }, { key: 3 as HandRankValue, weight: 15 },
    { key: 4 as HandRankValue, weight: 12 }, { key: 5 as HandRankValue, weight: 10 }, { key: 6 as HandRankValue, weight: 8 },
    { key: 7 as HandRankValue, weight: 6 }, { key: 8 as HandRankValue, weight: 4 }, { key: 9 as HandRankValue, weight: 2 }, { key: 10 as HandRankValue, weight: 1 },
  ]); s = p.state; return p.value; };

  const pushChip = () => {
    if (state.chipStack.length >= maxChips) {
      addUnique({ id: makeId('opt-cash'), kind: 'chips', chipsAmount: 45, label: '+45 chips', detail: 'Stack full fallback' });
    } else {
      const all = Object.values(ChipType) as ChipTypeValue[];
      const pool = all.filter(ch => CHIPS[ch].rarity === item.rarity);
      const source = pool.length > 0 ? pool : all;
      const chip = source[randIndex(source.length)];
      addUnique({ id: makeId(`opt-chip-${chip}`), kind: 'chip', chipType: chip, label: CHIPS[chip].name, detail: CHIPS[chip].description });
    }
  };
  const pushHand = () => { const hr = randomHand(); addUnique({ id: makeId(`opt-hand-${hr}`), kind: 'hand-upgrade', handRank: hr, label: `${HAND_NAMES[hr]} +1`, detail: 'Upgrade hand rank' }); };
  const pushUtility = () => {
    const b = nextBool(s, 0.55); s = b.state;
    if (b.value) { const c = cVals[randIndex(cVals.length)]; addUnique({ id: makeId(`opt-c-${c}`), kind: 'consumable', consumableType: c, label: `+ ${c.split('_').join(' ')}`, detail: 'Consumable' }); }
    else addUnique({ id: makeId('opt-skim'), kind: 'skim-upgrade', label: 'Skim Rate +5%', detail: 'Permanent' });
  };
  const pushForge = () => addUnique({ id: makeId('opt-forge'), kind: 'forge', forgeRarity: forgeFallback, label: `${forgeFallback.toUpperCase()} Forge`, detail: 'Random card modifier' });
  const pushBounty = () => {
    const open = state.availableBounties.filter(b => !b.accepted);
    if (open.length === 0) addUnique({ id: makeId('opt-cash'), kind: 'chips', chipsAmount: 65, label: '+65 chips', detail: 'No bounties available' });
    else { const b = open[randIndex(open.length)]; addUnique({ id: `opt-bounty-${b.id}`, kind: 'bounty', bountyId: b.id, label: b.title, detail: b.rewardLabel }); }
  };

  let guard = 0;
  while (options.length < item.optionCount && guard < 80) {
    guard++;
    if (item.boosterType === BoosterType.CHIP) {
      pushChip();
    } else if (item.boosterType === BoosterType.HAND) {
      pushHand();
    } else if (item.boosterType === BoosterType.UTILITY) {
      pushUtility();
    } else if (item.boosterType === BoosterType.FORGE) {
      pushForge();
    } else if (item.boosterType === BoosterType.BOUNTY) {
      pushBounty();
    } else {
      // TRUE wildcard: any reward path, including direct chip payout and cross-tier forge.
      const branch = randIndex(7);
      if (branch === 0) pushChip();
      else if (branch === 1) pushHand();
      else if (branch === 2) pushUtility();
      else if (branch === 3) pushBounty();
      else if (branch === 4) {
        // Wild forge can roll any rarity, not booster-locked
        const fr: BoosterRarity[] = ['common', 'uncommon', 'rare', 'legendary'];
        const rf = fr[randIndex(fr.length)];
        addUnique({ id: makeId(`opt-forge-${rf}`), kind: 'forge', forgeRarity: rf, label: `${rf.toUpperCase()} Forge`, detail: 'Random card modifier' });
      } else {
        // Cash jackpot lane
        const jackpots = [40, 65, 90, 130];
        const amt = jackpots[randIndex(jackpots.length)];
        addUnique({ id: makeId(`opt-cash-${amt}`), kind: 'chips', chipsAmount: amt, label: `+${amt} chips`, detail: 'Direct payout' });
      }
    }
  }
  if (options.every(o => o.kind === 'chips')) options[0] = { id: makeId('opt-skim-safe'), kind: 'skim-upgrade', label: 'Skim Rate +5%', detail: 'Safety offer' };

  // Hard fallback to ensure pack has full unique count.
  if (options.length < item.optionCount) {
    const fallbackCash = [31, 47, 63, 79, 95, 111];
    for (const amt of fallbackCash) {
      if (options.length >= item.optionCount) break;
      addUnique({ id: makeId(`opt-fallback-cash-${amt}`), kind: 'chips', chipsAmount: amt, label: `+${amt} chips`, detail: 'Fallback payout' });
    }
  }

  return { options: options.slice(0, item.optionCount), rngState: s };
}

function generateShop(_held: ConsumableTypeValue[], chipStack: ChipTypeValue[], _round = 1, ante = 1, shopDiscount = 0, _upgrades: UpgradeTypeValue[] = [], state?: GameState): { items: ShopItem[]; rngState: number } {
  let s = state?.rngState ?? seedFromString(String(Date.now()));
  const lowCards = state ? countLowCards(state.ownedDeck) : 18;
  const emptyConsumableSlots = state ? Math.max(0, state.consumableSlots - state.consumables.length) : 1;
  const synergy: Record<BoosterTypeValue, number> = {
    CHIP: chipStack.length <= 1 ? 1.25 : chipStack.length <= 3 ? 1.1 : 0.8,
    HAND: lowCards > 18 ? 1.2 : 1,
    UTILITY: emptyConsumableSlots >= 1 ? 1.3 : 0.8,
    FORGE: ante >= 2 ? 1.1 : 0.75,
    WILDCARD: 1,
    BOUNTY: ante >= 2 ? 0.7 : 0.3,
  };
  const def = [
    { boosterType: BoosterType.CHIP, label: 'Chip Booster', subtitle: 'Pick 1 of 3 chips', baseCost: 34 },
    { boosterType: BoosterType.HAND, label: 'Hand Booster', subtitle: 'Pick 1 of 2 upgrades', baseCost: 42 },
    { boosterType: BoosterType.UTILITY, label: 'Utility Booster', subtitle: 'Pick 1 of 2 utility', baseCost: 38 },
    { boosterType: BoosterType.FORGE, label: 'Forge Booster', subtitle: 'Pick 1 forge path', baseCost: 56 },
    { boosterType: BoosterType.WILDCARD, label: 'Wildcard Booster', subtitle: 'Pick 1 of absolutely anything', baseCost: 52 },
    { boosterType: BoosterType.BOUNTY, label: 'Bounty Booster', subtitle: 'Pick 1 contract', baseCost: 35 },
  ] as const;

  const chosen: ShopItem[] = [];
  const types = new Set<BoosterTypeValue>();
  while (chosen.length < 5) {
    const pickRoll = weightedPickSeeded(
      s,
      def.map(d => {
        const already = types.has(d.boosterType);
        // Hard cap: at most one Wildcard booster per shop.
        const duplicateFactor = d.boosterType === BoosterType.WILDCARD && already ? 0 : (already ? 0.35 : 1);
        return { key: d.boosterType, weight: (synergy[d.boosterType] ?? 1) * duplicateFactor };
      }),
    );
    s = pickRoll.state;
    const d = def.find(x => x.boosterType === pickRoll.value)!;
    const rarityRoll = boosterRarityFor(ante, s, pickRoll.value === BoosterType.WILDCARD || pickRoll.value === BoosterType.FORGE);
    s = rarityRoll.rngState;
    const premium = rarityRoll.rarity === 'legendary';
    const cost = Math.max(8, Math.floor(d.baseCost * ({ common:1, uncommon:1.22, rare:1.58, legendary:2.05 }[rarityRoll.rarity]) * (1 - shopDiscount)));
    const optionCount = pickRoll.value === BoosterType.CHIP
      ? (premium ? 4 : 3)
      : pickRoll.value === BoosterType.WILDCARD
        ? (premium ? 4 : 3)
        : 2;
    const idTok = nextInt(s, 0x7fffffff); s = idTok.state;
    chosen.push({ id: `shop-booster-${pickRoll.value}-${idTok.value.toString(36)}`, label: premium ? `Premium ${d.label}` : d.label, subtitle: d.subtitle, cost, type: 'booster', boosterType: pickRoll.value, rarity: rarityRoll.rarity, optionCount, premium });
    types.add(pickRoll.value);
  }
  return { items: chosen, rngState: s };
}

const DEFAULT_RUN_SEED = makeRandomSeed();
const DEFAULT_INITIAL_SEED_STATE = seedFromString(DEFAULT_RUN_SEED);

export const initialState: GameState = {
  phase: 'difficulty',
  deck: [],
  hand: [],
  communityCards: [],
  selectedIds: [],
  vault: 0,
  vaultTarget: calcVaultTarget(1, 1), // 550
  skimRate: 0.10,
  personalChips: 100,
  roundChips: 0,
  consumables: [ConsumableType.SCRATCH_TICKET],
  chipStack: [],
  scratchMultiplier: 1,
  blackChipUsedThisRound: false,
  handsPlayedThisRound: 0,
  shopItems: [],
  round: 1,
  ante: 1,
  roundInAnte: 1,
  maxHandsPerRound: MAX_HANDS_PER_ROUND,
  lastScore: null,
  lastBaseScore: null,
  lastHandName: null,
  lastBonusDetail: null,
  roundHistory: [],
  rouletteWins: 0,
  handSize: HAND_SIZE,
  consumableResult: null,
  forgeResult: null,
  difficulty: 'normal',
  availableBounties: [],
  activeBounties: [],
  usedConsumableThisRound: false,
  ownedDeck: createDeck(),
  discardedThisRound: 0,
  maxFreeDiscards: 2,
  extraDiscardCost: 15,
  playedCardIds: [],
  bestHandScoreThisRound: 0,
  bestHandRankThisRound: 0,
  newCommunityIds: [],
  lastScoreChain: [], lastFiredChips: [],
  pendingPackResult: null,
  tipBonus: null,
  purchasedUpgrades: [],
  consumableSlots: 2,
  shopDiscount: 0,
  feltSkin: 'default',
  theme: 'gold',
  handLevels: { 1:1, 2:1, 3:1, 4:1, 5:1, 6:1, 7:1, 8:1, 9:1, 10:1 },
  shopHandUpgrades: [],
  handRerollCost: 10,
  openedBooster: null,
  boosterRerollCost: 20,
  boosterOptionsCache: {},
  armedBoosters: [],
  runSeed: DEFAULT_RUN_SEED,
  rngState: DEFAULT_INITIAL_SEED_STATE,
  initialSeedState: DEFAULT_INITIAL_SEED_STATE,
};

// Determinism note: gameplay-critical randomness must only happen in reducer paths
// and must write back `rngState` so identical seed + inputs reproduces the run.
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_RUN_SEED': {
      const runSeed = action.seed.trim() || dailySeed();
      const initialSeedState = seedFromString(runSeed);
      return { ...state, runSeed, initialSeedState, rngState: initialSeedState };
    }

    case 'NEW_RANDOM_SEED': {
      const runSeed = makeRandomSeed();
      const initialSeedState = seedFromString(runSeed);
      return { ...state, runSeed, initialSeedState, rngState: initialSeedState };
    }

    case 'SET_DAILY_SEED': {
      const runSeed = dailySeed();
      const initialSeedState = seedFromString(runSeed);
      return { ...state, runSeed, initialSeedState, rngState: initialSeedState };
    }

    case 'SET_DIFFICULTY': {
      const base = HANDS_BY_DIFFICULTY[action.difficulty];
      const seeded = generateBounties(1, state.rngState) as { bounties: Bounty[]; rngState: number };
      return {
        ...state,
        difficulty: action.difficulty,
        maxHandsPerRound: base,
        availableBounties: seeded.bounties,
        rngState: seeded.rngState,
        phase: 'dealing',
      };
    }

    case 'DEAL': {
      const shuffled = shuffleSeeded([...state.ownedDeck], state.rngState);
      const deck = shuffled.deck;
      const community = deck.slice(0, COMMUNITY_COUNT);
      const hand = deck.slice(COMMUNITY_COUNT, COMMUNITY_COUNT + state.handSize);
      const remaining = deck.slice(COMMUNITY_COUNT + state.handSize);
      const base = HANDS_BY_DIFFICULTY[state.difficulty];
      const bonus = bonusHandsFromChips(state.chipStack);
      return {
        ...state,
        phase: 'selecting',
        deck: remaining,
        hand,
        communityCards: community,
        selectedIds: [],
        vault: 0,
        roundChips: 0,
        handsPlayedThisRound: 0,
        blackChipUsedThisRound: false,
        usedConsumableThisRound: false,
        discardedThisRound: 0,
        extraDiscardCost: 15,
        playedCardIds: [],
        bestHandScoreThisRound: 0,
        bestHandRankThisRound: 0,
        lastScore: null,
        lastBaseScore: null,
        lastHandName: null,
        lastBonusDetail: null,
        scratchMultiplier: 1,
        maxHandsPerRound: base + bonus,
        newCommunityIds: [],
        lastScoreChain: [], lastFiredChips: [],
        activeBounties: state.availableBounties.filter(b => b.accepted),
        rngState: shuffled.rngState,
      };
    }

    case 'SELECT_CARD': {
      const { id } = action;
      const already = state.selectedIds.includes(id);
      if (already) {
        return { ...state, selectedIds: state.selectedIds.filter(x => x !== id) };
      }
      if (state.selectedIds.length >= 5) return state;
      return { ...state, selectedIds: [...state.selectedIds, id] };
    }

    case 'DISCARD_HAND': {
      if (state.handsPlayedThisRound >= state.maxHandsPerRound) return state;

      // Check if this discard is free or costs chips
      const isFreeDiscard = state.discardedThisRound < state.maxFreeDiscards;
      const cost = isFreeDiscard ? 0 : state.extraDiscardCost;
      if (!isFreeDiscard && state.personalChips < cost) return state; // can't afford

      // Discard entire private hand + leftmost community card, redraw both
      const newHand = state.deck.slice(0, state.handSize);
      let deckAfterDiscard = state.deck.slice(state.handSize);
      const newCommunityCard = deckAfterDiscard[0] ? [deckAfterDiscard[0]] : [];
      deckAfterDiscard = deckAfterDiscard.slice(1);
      const newCommunity = [...state.communityCards.slice(1), ...newCommunityCard];
      const newHandsPlayed = state.handsPlayedThisRound + 1;
      const outOfHands = newHandsPlayed >= state.maxHandsPerRound;
      // Extra discard cost escalates each use: +5c per extra discard taken
      const newExtraCost = isFreeDiscard ? state.extraDiscardCost : state.extraDiscardCost + 5;
      return {
        ...state,
        hand: newHand,
        communityCards: newCommunity,
        deck: deckAfterDiscard,
        selectedIds: [],
        handsPlayedThisRound: newHandsPlayed,
        discardedThisRound: state.discardedThisRound + 1,
        personalChips: state.personalChips - cost,
        extraDiscardCost: newExtraCost,
        newCommunityIds: newCommunityCard.map(c => c.id),
        phase: outOfHands ? 'score-review' : 'selecting',
      };
    }

    case 'PLAY_HAND': {
      if (state.selectedIds.length === 0) return state;

      // Selected cards can come from hand OR community
      const allAvailable = [...state.hand, ...state.communityCards];
      const selectedCards = allAvailable.filter(c => state.selectedIds.includes(c.id));

      // Ghost cards are invisible to hand rank evaluation
      const nonGhostSelected = selectedCards.filter(c => c.modifier !== CardModifier.GHOST);
      // Wild cards count as any suit — temporarily mark as the most common suit in the hand for flush eval
      const evalCards = nonGhostSelected.map(c => {
        if (c.modifier !== CardModifier.WILD) return c;
        const suitCounts: Record<string, number> = {};
        for (const sc of nonGhostSelected) if (sc.modifier !== CardModifier.WILD) suitCounts[sc.suit] = (suitCounts[sc.suit] ?? 0) + 1;
        const dominantSuit = (Object.entries(suitCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? c.suit) as Card['suit'];
        return { ...c, suit: dominantSuit };
      });

      const handResult = evaluateHand(evalCards.length > 0 ? evalCards : selectedCards);
      // For chipValue, use the original cards (Ghost cards still add chips via their rank)
      const handResultWithGhosts = { ...handResult, cards: [...handResult.cards, ...selectedCards.filter(c => c.modifier === CardModifier.GHOST)] };
      const baseChips = chipValue(handResultWithGhosts, selectedCards, state.handLevels);

      // Compute suit counts for JADE chip
      // Extra context for chips
      const suitBuckets: Record<string, number> = {};
      for (const c of selectedCards) suitBuckets[c.suit] = (suitBuckets[c.suit] ?? 0) + 1;
      const maxSuitCount = Math.max(0, ...Object.values(suitBuckets));
      const hasHeart = selectedCards.some(c => c.suit === 'hearts');
      const communityUsed = selectedCards.filter(c => state.communityCards.some(cc => cc.id === c.id)).length;
      const isLastHand = state.handsPlayedThisRound + 1 >= state.maxHandsPerRound;
      const allBlack = selectedCards.every(c => c.suit === 'spades' || c.suit === 'clubs');
      const allRed = selectedCards.every(c => c.suit === 'hearts' || c.suit === 'diamonds');
      const uniqueSuitCount = new Set(selectedCards.map(c => c.suit)).size;
      const faceCardCount = selectedCards.filter(c => c.rank === 11 || c.rank === 12 || c.rank === 13).length;
      const aceCount = selectedCards.filter(c => c.rank === 1 || c.rank === 14).length;

      // Apply chips SEQUENTIALLY — order matters!
      const chain = applyChipsSequential(
        state.chipStack,
        baseChips,
        handResult.rank,
        state.handsPlayedThisRound,
        state.blackChipUsedThisRound,
        selectedCards.length,
        maxSuitCount,
        hasHeart,
        communityUsed,
        state.discardedThisRound,
        isLastHand,
        allBlack,
        allRed,
        state.maxHandsPerRound,
        state.scratchMultiplier,
        uniqueSuitCount,
        faceCardCount,
        aceCount,
        state.personalChips,
        state.chipStack.length,
        state.ante,
        state.rngState,
      );

      // Resolve card modifiers — flat bonus + mult bonus + cursed removals
      const modResult = resolveModifiers(handResult.cards, selectedCards);
      const modSteps: import('./chips').ScoreStep[] = [];
      if (modResult.flatBonus !== 0) {
        const before = chain.finalScore;
        const after = before + modResult.flatBonus;
        modSteps.push({ chipType: null as unknown as ChipTypeValue, label: '✨ Card Modifiers', delta: modResult.flatBonus > 0 ? `+${modResult.flatBonus}` : `${modResult.flatBonus}`, before, after });
        chain.finalScore = after;
      }
      if (modResult.multBonus > 1) {
        const before = chain.finalScore;
        const after = Math.floor(before * modResult.multBonus);
        modSteps.push({ chipType: null as unknown as ChipTypeValue, label: '🔥 Card Mult', delta: `×${modResult.multBonus.toFixed(1)}`, before, after });
        chain.finalScore = after;
      }
      // Remove Cursed cards from ownedDeck
      const ownedAfterCurse = modResult.cursedCardIds.length > 0
        ? state.ownedDeck.filter(c => !modResult.cursedCardIds.includes(c.id))
        : state.ownedDeck;

      // Apply tip bonus (one-time, fires after chip chain)
      let tipAdjustedScore = chain.finalScore;
      const tipSteps = [...chain.steps, ...modSteps];
      let tipSkimMult = 1;
      let tipVaultExtra = 0;
      if (state.tipBonus) {
        const tb = state.tipBonus;
        if (tb.multiplier) {
          const before = tipAdjustedScore;
          tipAdjustedScore = Math.floor(tipAdjustedScore * tb.multiplier);
          tipSteps.push({ chipType: tb.chipType, label: `🎯 Tip: ${tb.label}`, delta: `×${tb.multiplier}`, before, after: tipAdjustedScore });
        }
        if (tb.flat) {
          const before = tipAdjustedScore;
          tipAdjustedScore += tb.flat;
          tipSteps.push({ chipType: tb.chipType, label: `🎯 Tip: ${tb.label}`, delta: `+${tb.flat}`, before, after: tipAdjustedScore });
        }
        if (tb.skimMult) tipSkimMult = tb.skimMult;
        if (tb.vaultFlat) tipVaultExtra = tb.vaultFlat;
      }

      const total = tipAdjustedScore;

      // Skim split
      const baseSkimRate = chain.skimDoubled ? Math.min(0.9, state.skimRate * 2) : state.skimRate;
      const effectiveSkimRate = tipSkimMult > 1 ? Math.min(0.95, baseSkimRate * tipSkimMult) : baseSkimRate;
      const skimmed = Math.floor(total * effectiveSkimRate);
      const diamondBonus = chain.diamondActive ? Math.floor(skimmed * 0.5) : 0;
      const vaultChips = total - skimmed + chain.vaultBonus + diamondBonus + tipVaultExtra;

      const newVault = state.vault + vaultChips;
      const newPersonal = state.personalChips + skimmed;
      const newRoundChips = state.roundChips + skimmed;

      const bonusParts: string[] = [];
      if (chain.skimDoubled) bonusParts.push('skim ×2!');
      if (chain.vaultBonus > 0) bonusParts.push(`+${chain.vaultBonus} vault!`);
      if (chain.diamondActive && diamondBonus > 0) bonusParts.push(`💎 +${diamondBonus} vault`);
      if (state.tipBonus) bonusParts.push(`🎯 tip fired!`);

      // Check per-hand bounties
      const updatedBounties = state.activeBounties.map(b => {
        if (b.completed) return b;
        const done = checkBountyCondition(b, { handRank: handResult.rank, handScore: total });
        return done ? { ...b, completed: true } : b;
      });

      // Refill hand (only private hand cards get replaced, not community)
      const playedFromHand = state.hand.filter(c => state.selectedIds.includes(c.id));
      const remainingHand = state.hand.filter(c => !state.selectedIds.includes(c.id));
      const handNeeded = playedFromHand.length;
      const drawnForHand = state.deck.slice(0, handNeeded);
      let deckAfterHand = state.deck.slice(handNeeded);
      let newHand = [...remainingHand, ...drawnForHand];
      // Cap hand size at HAND_SIZE — bonus cards (e.g. HIGH_CARD_DRAW) are one-hand only
      if (newHand.length > HAND_SIZE) {
        const excess = newHand.slice(HAND_SIZE);
        deckAfterHand = [...excess, ...deckAfterHand];
        newHand = newHand.slice(0, HAND_SIZE);
      }

      // Replace used community cards
      const usedCommunityCards = state.communityCards.filter(c => state.selectedIds.includes(c.id));
      const remainingCommunity = state.communityCards.filter(c => !state.selectedIds.includes(c.id));
      const communityReplacements = deckAfterHand.slice(0, usedCommunityCards.length);
      deckAfterHand = deckAfterHand.slice(usedCommunityCards.length);
      const newCommunity = [...remainingCommunity, ...communityReplacements];
      const newCommunityIds = communityReplacements.map(c => c.id);

      const newDeck = deckAfterHand;

      const newHandsPlayed = state.handsPlayedThisRound + 1;
      const vaultFilled = newVault >= state.vaultTarget;
      const outOfHands = newHandsPlayed >= state.maxHandsPerRound;
      const deckEmpty = newDeck.length === 0 && newHand.length === 0;
      let phase: GamePhase = 'selecting';
      if (vaultFilled || deckEmpty || outOfHands) phase = 'score-review';

      return {
        ...state,
        phase,
        vault: Math.min(newVault, state.vaultTarget + 9999),
        personalChips: newPersonal,
        roundChips: newRoundChips,
        hand: newHand,
        communityCards: newCommunity,
        deck: newDeck,
        selectedIds: [],
        scratchMultiplier: 1,
        newCommunityIds,
        blackChipUsedThisRound: chain.skimDoubled ? true : state.blackChipUsedThisRound,
        skimRate: chain.skimPenalty > 0 ? Math.min(0.5, state.skimRate + chain.skimPenalty) : state.skimRate,
        handsPlayedThisRound: newHandsPlayed,
        bestHandScoreThisRound: Math.max(state.bestHandScoreThisRound, total),
        bestHandRankThisRound: Math.max(state.bestHandRankThisRound, handResult.rank),
        activeBounties: updatedBounties,
        lastScore: total,
        lastBaseScore: baseChips,
        lastHandName: handResult.name,
        lastBonusDetail: bonusParts.length > 0 ? bonusParts.join(' · ') : null,
        tipBonus: null,
        lastScoreChain: tipSteps,
        lastFiredChips: tipSteps.map(s => s.chipType),
        ownedDeck: ownedAfterCurse,
        playedCardIds: [
          ...state.playedCardIds,
          ...playedFromHand.map(c => c.id),
          ...usedCommunityCards.map(c => c.id),
          ...modResult.cursedCardIds,
        ],
        rngState: chain.rngState ?? state.rngState,
      };
    }

    case 'SELL_CHIP': {
      const { index } = action;
      if (index < 0 || index >= state.chipStack.length) return state;
      const chipType = state.chipStack[index];
      const refund = Math.floor(CHIPS[chipType].cost * 0.45);
      const newStack = state.chipStack.filter((_, i) => i !== index);
      const shop = generateShop(state.consumables, newStack, state.round, state.ante, state.shopDiscount, state.purchasedUpgrades, state);
      return {
        ...state,
        chipStack: newStack,
        personalChips: state.personalChips + refund,
        shopItems: shop.items,
        rngState: shop.rngState,
        openedBooster: null,
        boosterOptionsCache: {},
        armedBoosters: [],
      };
    }

    case 'TIP_CHIP': {
      const { index } = action;
      if (index < 0 || index >= state.chipStack.length) return state;
      if (state.phase !== 'selecting') return state;
      const chipType = state.chipStack[index];
      const bonus: TipBonus = TIP_BONUS_MAP[chipType] ?? { chipType, label: '+30 chips next hand', flat: 30 };
      const newStack = state.chipStack.filter((_, i) => i !== index);
      return { ...state, chipStack: newStack, tipBonus: bonus };
    }

    case 'SET_THEME':
      return { ...state, theme: action.theme };

    case 'BUY_UPGRADE': {
      const { upgradeType } = action;
      if (state.purchasedUpgrades.includes(upgradeType)) return state;
      const def = UPGRADE_DEFS[upgradeType];
      const discountedCost = Math.floor(def.cost * (1 - state.shopDiscount));
      if (state.personalChips < discountedCost) return state;
      const newUpgrades = [...state.purchasedUpgrades, upgradeType];
      let newDiscount = state.shopDiscount;
      if (upgradeType === UpgradeType.DISCOUNT_5)  newDiscount = Math.min(0.5, newDiscount + 0.05);
      if (upgradeType === UpgradeType.DISCOUNT_10) newDiscount = Math.min(0.5, newDiscount + 0.05);
      let newFelt = state.feltSkin;
      if (upgradeType === UpgradeType.FELT_NEON)   newFelt = 'neon';
      if (upgradeType === UpgradeType.FELT_MARBLE)  newFelt = 'marble';
      let newConsumableSlots = state.consumableSlots;
      if (upgradeType === UpgradeType.EXTRA_CONSUMABLE_SLOT)  newConsumableSlots = Math.min(4, newConsumableSlots + 1);
      if (upgradeType === UpgradeType.EXTRA_CONSUMABLE_SLOT2) newConsumableSlots = Math.min(4, newConsumableSlots + 1);
      const shop = generateShop(state.consumables, state.chipStack, state.round, state.ante, newDiscount, newUpgrades, state);
      return {
        ...state,
        personalChips: state.personalChips - discountedCost,
        purchasedUpgrades: newUpgrades,
        consumableSlots: newConsumableSlots,
        shopDiscount: newDiscount,
        feltSkin: newFelt,
        shopItems: shop.items,
        rngState: shop.rngState,
        openedBooster: null,
        boosterOptionsCache: {},
        armedBoosters: [],
      };
    }

    case 'BUY_HAND_UPGRADE': {
      const { handRank } = action;
      const currentLevel = state.handLevels[handRank] ?? 1;
      const cost = Math.ceil(handUpgradeCost(handRank, currentLevel) * (1 - state.shopDiscount));
      if (state.personalChips < cost) return state;
      const newLevels = { ...state.handLevels, [handRank]: currentLevel + 1 };
      // Remove this hand from the current shop offer — can't buy again until reroll
      const remainingOffers = state.shopHandUpgrades.filter(r => r !== handRank);
      return {
        ...state,
        personalChips: state.personalChips - cost,
        handLevels: newLevels,
        shopHandUpgrades: remainingOffers,
      };
    }

    case 'REROLL_HAND_UPGRADES': {
      if (state.personalChips < state.handRerollCost) return state;
      const picks = pickHandUpgrades(state.rngState);
      return {
        ...state,
        personalChips: state.personalChips - state.handRerollCost,
        shopHandUpgrades: picks.handUpgrades,
        rngState: picks.rngState,
        handRerollCost: Math.ceil(state.handRerollCost * 1.8),
      };
    }

    case 'USE_CONSUMABLE': {
      const { consumable } = action;
      if (!state.consumables.includes(consumable)) return state;
      const newConsumables = [...state.consumables];
      newConsumables.splice(newConsumables.indexOf(consumable), 1);
      // Check use-consumable bounties
      const bountiesAfterConsumable = state.activeBounties.map(b =>
        !b.completed && checkBountyCondition(b, { usedConsumable: true })
          ? { ...b, completed: true } : b
      );

      if (consumable === ConsumableType.SCRATCH_TICKET) {
        const scratch = rollScratchMultiplier(state.rngState) as { value: number; rngState: number };
        const mult = scratch.value;
        return {
          ...state,
          consumables: newConsumables,
          scratchMultiplier: mult,
          rngState: scratch.rngState,
          usedConsumableThisRound: true,
          activeBounties: bountiesAfterConsumable,
          consumableResult: {
            title: '🎫 Scratch Ticket',
            message: mult === 1
              ? 'No luck — ×1 multiplier this time.'
              : `You scratched ×${mult}! Your next hand scores ${mult}× chips.`,
          },
        };
      }
      if (consumable === ConsumableType.HIGH_CARD_DRAW) {
        const drawn = state.deck.slice(0, 2);
        const newDeck = state.deck.slice(2);
        const cardNames = drawn.map((c: Card) => `${rankName(c.rank)}${suitSymbol(c.suit)}`).join(' and ');
        return {
          ...state,
          consumables: newConsumables,
          hand: [...state.hand, ...drawn],
          deck: newDeck,
          usedConsumableThisRound: true,
          activeBounties: bountiesAfterConsumable,
          consumableResult: {
            title: '🃏 High Card Draw',
            message: drawn.length === 0
              ? 'Deck is empty — no cards to draw.'
              : `Drew ${cardNames} into your hand.`,
          },
        };
      }
      if (consumable === ConsumableType.BURNED_HAND) {
        const handsLeft = state.maxHandsPerRound - state.handsPlayedThisRound;
        if (handsLeft <= 1) {
          return {
            ...state,
            consumableResult: { title: '🔥 Burned Hand', message: "Can't burn your last hand!" },
          };
        }
        return {
          ...state,
          consumables: newConsumables,
          handsPlayedThisRound: state.handsPlayedThisRound + 1,
          scratchMultiplier: 3,
          usedConsumableThisRound: true,
          activeBounties: bountiesAfterConsumable,
          consumableResult: {
            title: '🔥 Burned Hand',
            message: 'One hand sacrificed to the fire. Your next hand scores ×3.',
          },
        };
      }
      return { ...state, consumables: newConsumables, usedConsumableThisRound: true, activeBounties: bountiesAfterConsumable };
    }

    case 'ROULETTE_SPIN': {
      const roll = nextInt(state.rngState, 37);
      const result = roll.value;
      const splitBet = action.betType === 'number' && action.pickedNumbers.length > 0
        ? Math.floor(action.betAmount / action.pickedNumbers.length)
        : action.betAmount;
      const red = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
      let win = false;
      let delta = -action.betAmount;
      if (action.betType === 'red') {
        win = red.has(result);
        delta = win ? action.betAmount : -action.betAmount;
      } else if (action.betType === 'black') {
        win = result !== 0 && !red.has(result);
        delta = win ? action.betAmount : -action.betAmount;
      } else {
        win = action.pickedNumbers.includes(result);
        delta = win ? splitBet * 35 : -action.betAmount;
      }
      return {
        ...state,
        rngState: roll.state,
        personalChips: Math.max(0, state.personalChips + delta),
        rouletteWins: win ? state.rouletteWins + 1 : state.rouletteWins,
        consumableResult: {
          title: win ? '🎰 You Won!' : '🎰 The House Wins',
          message: win ? `Ball landed on ${result}. +${delta} chips.` : `Ball landed on ${result}. ${delta} chips.`,
        },
      };
    }

    case 'DISMISS_RESULT':
      return { ...state, consumableResult: null, forgeResult: null };

    case 'BUY_ITEM':
    case 'BUY_BOOSTER': {
      const itemId = action.type === 'BUY_ITEM' ? action.itemId : action.itemId;
      const item = state.shopItems.find(i => i.id === itemId);
      if (!item || state.openedBooster) return state;

      // If booster was already purchased/opened this visit, reopen same options (no re-roll, no extra charge)
      if (state.armedBoosters.includes(item.id)) {
        const cached = state.boosterOptionsCache[item.id];
        if (!cached || cached.length === 0) return state;
        return {
          ...state,
          openedBooster: { boosterId: item.id, options: cached },
        };
      }

      if (state.personalChips < item.cost) return state;
      const rolled = generateBoosterOptions(state, item);
      const options = rolled.options;
      return {
        ...state,
        personalChips: state.personalChips - item.cost,
        rngState: rolled.rngState,
        openedBooster: { boosterId: item.id, options },
        boosterOptionsCache: { ...state.boosterOptionsCache, [item.id]: options },
        armedBoosters: [...state.armedBoosters, item.id],
      };
    }

    case 'DISMISS_BOOSTER':
      return { ...state, openedBooster: null };

    case 'SELECT_BOOSTER_OPTION': {
      if (!state.openedBooster || state.openedBooster.boosterId !== action.boosterId) return state;
      const pick = state.openedBooster.options.find(o => o.id === action.optionId);
      if (!pick) return state;
      const nextCache = { ...state.boosterOptionsCache };
      delete nextCache[action.boosterId];
      let next = {
        ...state,
        openedBooster: null,
        boosterOptionsCache: nextCache,
        armedBoosters: state.armedBoosters.filter(id => id !== action.boosterId),
        shopItems: state.shopItems.map(i => i.id === action.boosterId ? { ...i, cost: 0, subtitle: 'Sold' } : i),
      };
      const maxChips = state.purchasedUpgrades.includes(UpgradeType.EXTRA_CHIP_SLOT) ? 6 : MAX_CHIPS;

      if (pick.kind === 'chip' && pick.chipType) {
        if (next.chipStack.length < maxChips) next = { ...next, chipStack: [...next.chipStack, pick.chipType] };
        else next = { ...next, personalChips: next.personalChips + 45 };
      }
      if (pick.kind === 'hand-upgrade' && pick.handRank) {
        const lv = next.handLevels[pick.handRank] ?? 1;
        next = { ...next, handLevels: { ...next.handLevels, [pick.handRank]: lv + 1 } };
      }
      if (pick.kind === 'consumable' && pick.consumableType) {
        if (next.consumables.length < next.consumableSlots) next = { ...next, consumables: [...next.consumables, pick.consumableType] };
        else next = { ...next, personalChips: next.personalChips + 25 };
      }
      if (pick.kind === 'skim-upgrade') next = { ...next, skimRate: Math.min(0.40, next.skimRate + 0.05) };
      if (pick.kind === 'chips') next = { ...next, personalChips: next.personalChips + (pick.chipsAmount ?? 30) };
      if (pick.kind === 'bounty' && pick.bountyId) {
        next = {
          ...next,
          availableBounties: next.availableBounties.map(b => b.id === pick.bountyId ? { ...b, accepted: true } : b),
        };
      }
      if (pick.kind === 'forge') {
        const rarity = pick.forgeRarity ?? 'common';
        const rarityPool: Record<string, CardModifierValue[]> = {
          common: ['POLISHED', 'SCARRED'],
          uncommon: ['CHARGED', 'HOT', 'WILD'],
          rare: ['VOLATILE', 'GHOST'],
          legendary: ['CURSED', 'MIMIC'],
        };
        const pool = rarityPool[rarity];
        let s = next.rngState;
        const m = nextInt(s, pool.length); s = m.state;
        const modifier = pool[m.value];
        const eligible = next.ownedDeck.filter(c => !c.modifier);
        if (eligible.length > 0) {
          const t = nextInt(s, eligible.length); s = t.state;
          const target = eligible[t.value];
          next = {
            ...next,
            ownedDeck: next.ownedDeck.map(c => c.id === target.id ? { ...c, modifier } : c),
            deck: next.deck.map(c => c.id === target.id ? { ...c, modifier } : c),
            hand: next.hand.map(c => c.id === target.id ? { ...c, modifier } : c),
            forgeResult: { card: { ...target, modifier }, modifier },
            rngState: s,
          };
        }
      }
      return next;
    }

    case 'REROLL_BOOSTERS': {
      if (state.personalChips < state.boosterRerollCost || state.openedBooster) return state;
      const shop = generateShop(state.consumables, state.chipStack, state.round, state.ante, state.shopDiscount, state.purchasedUpgrades, state);
      return {
        ...state,
        personalChips: state.personalChips - state.boosterRerollCost,
        boosterRerollCost: Math.ceil(state.boosterRerollCost * 1.7),
        shopItems: shop.items,
        rngState: shop.rngState,
        openedBooster: null,
        boosterOptionsCache: {},
        armedBoosters: [],
      };
    }

    case 'BUY_FORGE': {
      const forgeCosts: Record<string, number> = { common: 20, uncommon: 45, rare: 90, legendary: 200 };
      const cost = forgeCosts[action.rarity];
      if (state.personalChips < cost) return state;

      const rarityPool: Record<string, CardModifierValue[]> = {
        common:    ['POLISHED', 'SCARRED'],
        uncommon:  ['CHARGED', 'HOT', 'WILD'],
        rare:      ['VOLATILE', 'GHOST'],
        legendary: ['CURSED', 'MIMIC'],
      };
      const pool = rarityPool[action.rarity] as CardModifierValue[];
      let s = state.rngState;
      const m = nextInt(s, pool.length); s = m.state;
      const modifier = pool[m.value];

      // Pick a random card from ownedDeck that doesn't already have a modifier
      const eligible = state.ownedDeck.filter(c => !c.modifier);
      if (eligible.length === 0) return state; // no unmodified cards

      const t = nextInt(s, eligible.length); s = t.state;
      const target = eligible[t.value];
      const newOwned = state.ownedDeck.map(c => c.id === target.id ? { ...c, modifier } : c);
      const newDeck = state.deck.map(c => c.id === target.id ? { ...c, modifier } : c);
      const newHand = state.hand.map(c => c.id === target.id ? { ...c, modifier } : c);

      return {
        ...state,
        personalChips: state.personalChips - cost,
        ownedDeck: newOwned,
        deck: newDeck,
        hand: newHand,
        forgeResult: { card: { ...target, modifier }, modifier },
        rngState: s,
      };
    }

    case 'BUY_PACK': {
      const cost = 60;
      if (state.personalChips < cost) return state;
      const rolled = computePackResult(state.deck, action.packType, state.rngState);
      return { ...state, personalChips: state.personalChips - cost, pendingPackResult: rolled.result, rngState: rolled.rngState };
    }

    case 'CONFIRM_PACK': {
      if (!state.pendingPackResult) return state;
      const newDeck = applyPackResult(state.deck, state.pendingPackResult);
      // Also update ownedDeck so new cards persist into future rounds
      const newOwnedDeck = applyPackResult(state.ownedDeck, state.pendingPackResult);
      return { ...state, deck: newDeck, ownedDeck: newOwnedDeck, pendingPackResult: null };
    }

    case 'END_SHOP': {
      const nextRound = state.round + 1;
      const nextRoundInAnte = state.roundInAnte + 1;
      if (nextRoundInAnte > 3) {
        // Move to next ante
        const nextAnte = state.ante + 1;
        return {
          ...state,
          phase: 'ante-complete',
          round: nextRound,
          ante: nextAnte,
          roundInAnte: 1,
          vaultTarget: calcVaultTarget(nextAnte, 1),
        };
      }
      return {
        ...state,
        phase: 'dealing',
        round: nextRound,
        roundInAnte: nextRoundInAnte,
        vaultTarget: calcVaultTarget(state.ante, nextRoundInAnte),
      };
    }

    case 'NEXT_ROUND': {
      const vaultFilled = state.vault >= state.vaultTarget;
      const vaultPct = Math.min(100, Math.floor((state.vault / state.vaultTarget) * 100));
      const handsRemaining = state.maxHandsPerRound - state.handsPlayedThisRound;
      const result: RoundResult = { round: state.round, vaultFilled, vaultPct, personalChips: state.roundChips, skimRate: state.skimRate };

      // Check end-of-round bounties and apply rewards
      const endCtx = {
        vaultFilled,
        skimRate: state.skimRate,
        handsRemaining,
        discarded: state.discardedThisRound > 0,
      };
      let bonusChips = 0;
      let vaultReduction = 0;
      let skimBoost = 0;
      let extraHand = 0;
      const resolvedBounties = state.activeBounties.map(b => {
        const done = b.completed || checkBountyCondition(b, endCtx);
        if (done && !b.completed) {
          if (b.reward === BountyReward.CHIPS) bonusChips += b.rewardValue;
          if (b.reward === BountyReward.VAULT_REDUCE) vaultReduction += b.rewardValue;
          if (b.reward === BountyReward.SKIM_BOOST) skimBoost += b.rewardValue / 100;
          if (b.reward === BountyReward.EXTRA_HAND) extraHand += b.rewardValue;
        }
        return done ? { ...b, completed: true } : b;
      });

      if (!vaultFilled) {
        return { ...state, phase: 'game-over', roundHistory: [...state.roundHistory, result], activeBounties: resolvedBounties };
      }

      const nextRoundInAnte = state.roundInAnte >= 3 ? 1 : state.roundInAnte + 1;
      const bountyRoll = generateBounties(nextRoundInAnte, state.rngState) as { bounties: Bounty[]; rngState: number };
      const shop = generateShop(state.consumables, state.chipStack, state.round, state.ante, state.shopDiscount, state.purchasedUpgrades, { ...state, rngState: bountyRoll.rngState });
      const handRoll = pickHandUpgrades(shop.rngState);
      return {
        ...state,
        phase: 'shop',
        shopItems: shop.items,
        shopHandUpgrades: handRoll.handUpgrades,
        handRerollCost: 10,
        openedBooster: null,
        boosterRerollCost: 20,
        boosterOptionsCache: {},
        armedBoosters: [],
        roundHistory: [...state.roundHistory, result],
        activeBounties: resolvedBounties,
        availableBounties: bountyRoll.bounties,
        personalChips: state.personalChips + bonusChips,
        skimRate: Math.min(0.40, state.skimRate + skimBoost),
        rngState: handRoll.rngState,
      };
    }

    case 'CONTINUE_SCORE_REVIEW':
      return { ...state, phase: 'round-end' };

    case 'START_ANTE':
      return { ...state, phase: 'dealing', rngState: state.initialSeedState };

    case 'ACCEPT_BOUNTY': {
      const target = state.availableBounties.find(b => b.id === action.bountyId);
      if (!target) return state;
      const fee = target.fee ?? 10;
      if (!target.accepted && state.personalChips < fee) return state; // can't afford
      const delta = target.accepted ? fee : -fee; // refund if un-accepting
      const updated = state.availableBounties.map(b =>
        b.id === action.bountyId ? { ...b, accepted: !b.accepted } : b
      );
      return { ...state, availableBounties: updated, personalChips: state.personalChips + delta };
    }

    case 'REORDER_CHIPS': {
      const { fromIndex, toIndex } = action;
      const chips = [...state.chipStack];
      const [moved] = chips.splice(fromIndex, 1);
      chips.splice(toIndex, 0, moved);
      return { ...state, chipStack: chips };
    }

    case 'CLEAR_NEW_COMMUNITY':
      return { ...state, newCommunityIds: [] };

    case 'DEBUG_WIN':
      return {
        ...state,
        vault: state.vaultTarget,
        personalChips: state.personalChips + 1000,
        phase: 'round-end',
      };

    case 'RESET': {
      const runSeed = makeRandomSeed();
      const initialSeedState = seedFromString(runSeed);
      return { ...initialState, runSeed, initialSeedState, rngState: initialSeedState };
    }

    default:
      return state;
  }
}

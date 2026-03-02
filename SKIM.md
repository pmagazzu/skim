# SKIM — Game Design Document
**Version:** 0.1 (Prototype)
**Target:** Web browser (React + TypeScript), eventual React Native iOS App Store release

---

## 🎯 Concept

SKIM is a cooperative card game for 2–4 players where everyone works together to fill a shared **Vault** score — but each player is also quietly taking a personal cut. The team wins or loses together, but only one player walks away the MVP.

Inspired by Balatro's poker-hand scoring loop and casino consumable cards.

---

## 🃏 Core Loop

Each **round**:
1. Players are dealt a hand of cards (from a shared shuffled deck)
2. Players take turns selecting cards to play as a **poker hand**
3. Played hand earns **chips** — split between the Vault and the player's personal Skim
4. Between turns, players may use **Casino Consumables** from their held slots
5. Round ends when Vault reaches the target score
6. End-of-round **Skim Report** shows each player's contribution and personal cut
7. A **shop phase** lets players buy new consumables with earned chips
8. Next round begins with a higher Vault target

---

## 🏦 Vault & Skim Mechanic

### Vault
- Shared target score (chips needed to win the round)
- Everyone contributes to it by playing hands
- If Vault isn't filled before deck runs out → **team loses the round**

### Skim Rate
- Each player has a **Skim Rate** (starts at 10%)
- When you score chips, `skim%` goes to your personal ledger, rest goes to Vault
- Example: play a Flush worth 100 chips at 10% skim → 10 chips to you, 90 to Vault
- Skim rate can be increased via consumables and shop upgrades — but at the cost of Vault contribution

### Solidarity Bonus
- If your Vault contribution % is above threshold at round end → bonus chips multiplier on personal score
- Rewards team players without eliminating competition

---

## 🎲 Poker Hands (scoring base)

| Hand | Base Chips | Multiplier |
|------|-----------|------------|
| High Card | 5 | x1 |
| One Pair | 10 | x2 |
| Two Pair | 20 | x2 |
| Three of a Kind | 30 | x3 |
| Straight | 40 | x4 |
| Flush | 50 | x4 |
| Full House | 60 | x4 |
| Four of a Kind | 80 | x7 |
| Straight Flush | 100 | x8 |
| Royal Flush | 120 | x8 |

Final chips = (Base Chips + card values) × Multiplier

---

## 🎰 Casino Consumables

Held like Tarot cards in Balatro (max 4 slots). Usable once per turn (some once per round).

| Card | Effect |
|------|--------|
| **Slot Spin** | Draw 3 random bonus chip values (5/10/25/50/100) — take the highest |
| **Scratch Ticket** | Reveal a hidden multiplier (x1 to x5) applied to your next hand |
| **High Card Draw** | Draw 2 extra cards, keep 1, discard 1 |
| **Roulette** | Bet up to 50 chips from your personal ledger — double or nothing |
| **Prize Wheel** | Spin for a random effect: +chips, +skim rate, +vault boost, or "The House Wins" (nothing) |
| **Double Down** | Challenge another player — both reveal top card, higher card wins the other's next-turn skim |
| **Cut the Deck** | The active hand being played gets redrawn for everyone at that table position |
| **Blackjack Mini** | Play a quick 2-card blackjack vs. dealer target (17) — win doubles your current hand score |
| **Craps Roll** | Roll 2d6: 7 or 11 = bonus chips added to Vault; 2, 3, 12 = lose 10 chips; any other = nothing |

---

## 🛒 Shop Phase

Between rounds, players spend personal chips:
- Buy new consumables (random selection of 4 offered)
- Upgrade Skim Rate (+5% per upgrade, max 40%)
- Buy "Multiplier Chips" — persistent card value bonuses
- Re-roll shop selection (costs 5 chips)

---

## 📊 Scoring & Progression

### Within a Run (multiple rounds):
- Vault target scales each round (×1.5 difficulty multiplier)
- Personal chips carry over between rounds
- Consumables carry over (slots permitting)

### End of Run:
- If team fills all Vault targets → **Victory**
- If deck runs out before Vault filled → **Bust**
- MVP = player with highest personal chip total
- Badges awarded:
  - 🏆 **MVP** — most personal chips
  - 🤝 **Most Honest** — highest Vault contribution %
  - 🐀 **The Rat** — highest skim rate at end
  - 🎰 **High Roller** — won the most consumable gambles

---

## 🎮 Difficulty / Deck Config

| Mode | Decks | Starting Hand Size | Vault Multiplier |
|------|----|----|----|
| Easy | 2 | 8 cards | ×1.0 |
| Normal | 1 | 7 cards | ×1.2 |
| Hard | 1 | 6 cards | ×1.5 |

---

## 🖥️ Prototype Scope (v0.1)

Focus on **single-player** first to validate the game loop before multiplayer:

### Must Have
- [ ] Deck of 52 cards, shuffle, deal
- [ ] Hand selection (pick 5 from 7-8 cards)
- [ ] Poker hand evaluator
- [ ] Chip scoring (base × multiplier)
- [ ] Vault progress bar with target
- [ ] Personal skim ledger
- [ ] Round win/loss detection
- [ ] End-of-round stats screen (skim report)
- [ ] At least 3 consumables implemented: Scratch Ticket, High Card Draw, Roulette
- [ ] Shop phase (buy consumables between rounds)
- [ ] 3-round run with escalating difficulty

### Nice to Have (v0.2)
- [ ] All 9 consumables
- [ ] Multiplier Chips in shop
- [ ] Badges system
- [ ] 2-player local (hot seat)
- [ ] Animations (card flip, chip counter)
- [ ] Sound effects

### Defer
- [ ] Online multiplayer
- [ ] Full 4-player
- [ ] Mobile/native build

---

## 🎨 Visual Style

- Dark background — deep navy/black (#0f0e17)
- Casino felt green for the play area
- Gold/amber chip colors
- Card faces: clean, minimal — white with suit colors (red/black)
- Retro serif font for titles, clean sans for numbers
- Consumable cards: illustrated casino-themed icons
- Vault: chunky progress bar, glows when full

---

## 📁 Project Structure

```
skim/
├── SKIM.md              ← this file
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── game/
│   │   ├── deck.ts          ← Card types, deck creation, shuffle
│   │   ├── hands.ts         ← Poker hand evaluation
│   │   ├── scoring.ts       ← Chip calculation
│   │   ├── gameState.ts     ← Core game state machine
│   │   ├── consumables.ts   ← Consumable card effects
│   │   └── shop.ts          ← Shop logic
│   ├── components/
│   │   ├── Card.tsx         ← Playing card component
│   │   ├── Hand.tsx         ← Player hand display
│   │   ├── Vault.tsx        ← Vault progress
│   │   ├── SkimLedger.tsx   ← Personal chip tracker
│   │   ├── Consumables.tsx  ← Consumable slots
│   │   ├── Shop.tsx         ← Shop screen
│   │   └── SkimReport.tsx   ← End-of-round stats
│   └── hooks/
│       └── useGameState.ts  ← Game state hook
```

---

*Design by Pete & Sirius — March 2026*

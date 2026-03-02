import { useReducer } from 'react';
import { gameReducer, initialState } from '../game/gameState';
import type { GameState, GameAction } from '../game/gameState';
import { evaluateHand } from '../game/hands';
import { chipValue } from '../game/scoring';
import type { HandResult } from '../game/hands';

interface UseGameStateReturn {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  selectedHandResult: HandResult | null;
  selectedChipValue: number;
}

export function useGameState(): UseGameStateReturn {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const allCards = [...state.hand, ...state.communityCards];
  const selectedCards = allCards.filter(c => state.selectedIds.includes(c.id));
  const selectedHandResult = selectedCards.length >= 1 ? evaluateHand(selectedCards) : null;
  const selectedChipValue = selectedHandResult
    ? chipValue(selectedHandResult, selectedCards, state.scratchMultiplier)
    : 0;

  return { state, dispatch, selectedHandResult, selectedChipValue };
}

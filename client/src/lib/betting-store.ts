import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BetSelection {
  id: number;
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  marketType: string;
  odds: number;
}

interface BettingState {
  bets: BetSelection[];
  addBet: (bet: BetSelection) => void;
  removeBet: (id: number) => void;
  clearBets: () => void;
  hasBet: (id: number) => boolean;
}

export const useBettingStore = create<BettingState>()(
  persist(
    (set, get) => ({
      bets: [],
      
      addBet: (bet) => {
        set((state) => ({
          bets: [...state.bets, bet]
        }));
      },
      
      removeBet: (id) => {
        set((state) => ({
          bets: state.bets.filter(bet => bet.id !== id)
        }));
      },
      
      clearBets: () => {
        set({ bets: [] });
      },
      
      hasBet: (id) => {
        return get().bets.some(bet => bet.id === id);
      }
    }),
    {
      name: 'football-betting-store'
    }
  )
);

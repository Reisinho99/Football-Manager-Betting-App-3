import { getMarketLabel } from "@/lib/utils";
import { BetSelection } from "@/lib/betting-store";

interface BetItemProps {
  bet: BetSelection;
  onRemove: () => void;
}

export default function BetItem({ bet, onRemove }: BetItemProps) {
  return (
    <div className="bg-gray-100 rounded-md p-3 relative">
      <button 
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        onClick={onRemove}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <div className="font-medium text-black">{bet.homeTeam || 'Team 1'} vs {bet.awayTeam || 'Team 2'}</div>
      <div className="flex justify-between mt-1">
        <span className="text-sm text-gray-600">
          {getMarketLabel(bet.marketType || 'Unknown')} ({bet.marketType || 'N/A'})
        </span>
        <span className="font-semibold">{bet.odds ? bet.odds.toFixed(2) : '0.00'}</span>
      </div>
    </div>
  );
}

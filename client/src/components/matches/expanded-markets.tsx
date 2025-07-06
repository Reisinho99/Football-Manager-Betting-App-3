
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatOdds, getMarketLabel } from "@/lib/utils";
import { Market } from "@shared/schema";
import { useBettingStore } from "@/lib/betting-store";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ExpandedMarketsProps {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  allMarkets: Market[];
}

export default function ExpandedMarkets({ matchId, homeTeam, awayTeam, allMarkets }: ExpandedMarketsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { addBet, removeBet, hasBet } = useBettingStore();
  const { toast } = useToast();

  const handleToggleBet = (market: Market) => {
    if (market.isLocked) {
      toast({
        title: "Market is locked",
        description: "This market is currently locked and unavailable for betting.",
        variant: "destructive"
      });
      return;
    }
    
    if (hasBet(market.id)) {
      removeBet(market.id);
    } else {
      addBet({
        id: market.id,
        matchId: matchId,
        homeTeam: homeTeam,
        awayTeam: awayTeam,
        marketType: market.type,
        odds: market.odds
      });
    }
  };

  // Group markets by category
  const mainMarkets = allMarkets.filter(m => ["1", "X", "2"].includes(m.type));
  const goalMarkets = allMarkets.filter(m => 
    (m.type.includes("OVER") || m.type.includes("UNDER")) && 
    !m.type.includes("HT")
  );
  const bttsMarkets = allMarkets.filter(m => m.type.includes("BTTS") && !m.type.includes("HT"));
  const doubleChanceMarkets = allMarkets.filter(m => m.type.includes("DC"));
  const drawNoBetMarkets = allMarkets.filter(m => m.type.includes("DNB"));
  const halfTimeMarkets = allMarkets.filter(m => m.type.includes("HT") && !m.type.includes("BTTS") && !m.type.includes("OVER") && !m.type.includes("UNDER"));
  const halfTimeGoalMarkets = allMarkets.filter(m => m.type.includes("HT") && (m.type.includes("OVER") || m.type.includes("UNDER")));
  const halfTimeBttsMarkets = allMarkets.filter(m => m.type.includes("HT_BTTS"));
  const handicapMarkets = allMarkets.filter(m => m.type.includes("HANDICAP"));
  const winBothHalvesMarkets = allMarkets.filter(m => m.type.includes("WIN_BOTH_HALVES"));
  const winEitherHalfMarkets = allMarkets.filter(m => m.type.includes("WIN_EITHER_HALF"));
  const customMarkets = allMarkets.filter(m => 
    !["1", "X", "2", "OVER", "UNDER", "BTTS", "DC", "DNB", "HT", "HANDICAP", "WIN_BOTH_HALVES", "WIN_EITHER_HALF"].some(prefix => m.type.includes(prefix))
  );

  const extraMarketsCount = allMarkets.length - mainMarkets.length;

  if (extraMarketsCount === 0) {
    return null;
  }

  const MarketButton = ({ market }: { market: Market }) => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => handleToggleBet(market)}
      className={`${market.isLocked ? 'opacity-50 cursor-not-allowed' : ''} ${
        hasBet(market.id) ? 'bg-yellow-400 text-black' : 'bg-secondary text-secondary-foreground'
      } hover:bg-secondary/80 py-1 rounded text-xs font-medium flex-1 min-w-0`}
      disabled={market.isLocked}
    >
      <span className="truncate">{getMarketLabel(market.type)}</span>
      <span className="font-semibold ml-1">{formatOdds(market.odds)}</span>
    </Button>
  );

  const MarketSection = ({ title, markets }: { title: string; markets: Market[] }) => {
    if (markets.length === 0) return null;
    
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
        <div className="grid grid-cols-2 gap-2">
          {markets.map(market => (
            <MarketButton key={market.id} market={market} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <span>Mais mercados ({extraMarketsCount})</span>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {isExpanded && (
        <div className="mt-4 space-y-4 p-3 bg-muted/50 rounded-md">
          <MarketSection title="Resultado (Final)" markets={mainMarkets} />
          <MarketSection title="Total de Golos" markets={goalMarkets} />
          <MarketSection title="Ambas as Equipas Marcam" markets={bttsMarkets} />
          <MarketSection title="Dupla Hipótese" markets={doubleChanceMarkets} />
          <MarketSection title="Empate Anula Aposta" markets={drawNoBetMarkets} />
          <MarketSection title="Resultado 1º Tempo" markets={halfTimeMarkets} />
          <MarketSection title="Golos 1º Tempo" markets={halfTimeGoalMarkets} />
          <MarketSection title="Ambas Marcam 1º Tempo" markets={halfTimeBttsMarkets} />
          <MarketSection title="Handicaps" markets={handicapMarkets} />
          <MarketSection title="Vencer Ambas as Partes" markets={winBothHalvesMarkets} />
          <MarketSection title="Vencer Pelo Menos Uma Parte" markets={winEitherHalfMarkets} />
          <MarketSection title="Mercados Personalizados" markets={customMarkets} />
        </div>
      )}
    </div>
  );
}

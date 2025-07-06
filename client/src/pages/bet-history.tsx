
import { useQuery } from "@tanstack/react-query";
import { BetWithSelections } from "@shared/schema";
import { formatMoney, formatDateTime, getMarketLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TeamEmblem } from "@/components/ui/team-emblem";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function BetHistory() {
  const { toast } = useToast();
  
  const { data: bets = [] } = useQuery<BetWithSelections[]>({
    queryKey: ['/api/bets'],
  });

  const handleScoreChange = (matchId: number, type: "home" | "away", score: number) => {
    const updatedBets = bets.map(bet => ({
      ...bet,
      selections: bet.selections.map(selection => {
        if (selection.market.match.id === matchId) {
          return {
            ...selection,
            market: {
              ...selection.market,
              match: {
                ...selection.market.match,
                [type === "home" ? "homeScore" : "awayScore"]: score
              }
            }
          };
        }
        return selection;
      })
    }));
    // Atualizar o estado local dos resultados
    queryClient.setQueryData(['/api/bets'], updatedBets);
  };

  const checkBetResult = (bet: BetWithSelections): "WON" | "LOST" => {
    return bet.selections.every(selection => {
      const match = selection.market.match;
      const marketType = selection.market.type;
      
      // Verificar se os scores foram definidos
      if (match.homeScore === undefined || match.awayScore === undefined) return false;

      const goalDifference = match.homeScore - match.awayScore;

      switch (marketType) {
        case "1": // Vitória Casa (V1)
          return goalDifference > 0; // Casa tem mais gols que Fora
        case "X": // Empate
          return goalDifference === 0; // Mesmo número de gols
        case "2": // Vitória Fora (V2)
          return goalDifference < 0; // Fora tem mais gols que Casa
        default:
          return false;
      }
    }) ? "WON" : "LOST";
  };

  const handleResolveBet = async (betId: number) => {
    const bet = bets.find(b => b.id === betId);
    if (!bet) return;

    // Verificar se todos os jogos têm resultados
    const hasAllScores = bet.selections.every(s => 
      s.market.match.homeScore !== undefined && 
      s.market.match.awayScore !== undefined
    );

    if (!hasAllScores) {
      toast({
        title: "Erro",
        description: "Preencha todos os resultados antes de resolver a aposta.",
        variant: "destructive"
      });
      return;
    }

    const status = checkBetResult(bet);

    try {
      await apiRequest("PATCH", `/api/bets/${betId}/resolve`, { status });
      queryClient.invalidateQueries({ queryKey: ['/api/bets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
      
      toast({
        title: "Aposta atualizada",
        description: `A aposta foi marcada como ${status === "WON" ? "ganha" : "perdida"}.`
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a aposta.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteBet = async (betId: number) => {
    try {
      await apiRequest("DELETE", `/api/bets/${betId}`);
      queryClient.invalidateQueries({ queryKey: ['/api/bets'] });
      
      toast({
        title: "Aposta removida",
        description: "A aposta foi removida do histórico."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover a aposta.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6 text-black">Histórico de Apostas</h1>
      
      <Accordion type="single" collapsible className="space-y-4">
        {bets.map(bet => (
          <AccordionItem key={bet.id} value={`bet-${bet.id}`} className="bg-white rounded-lg shadow">
            <AccordionTrigger className="px-4 py-2 hover:no-underline">
              <div className="flex justify-between items-center w-full">
                <div>
                  <span className="text-sm text-gray-500">
                    {formatDateTime(new Date(bet.createdAt))}
                  </span>
                  <div className="font-semibold text-black">
                    Stake: {formatMoney(bet.stake)}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-green-600 font-semibold">
                    Potencial: {formatMoney(bet.potentialWin)}
                  </div>
                  {bet.status !== "PENDING" && (
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      bet.status === "WON" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {bet.status === "WON" ? "Ganhou" : "Perdeu"}
                    </span>
                  )}
                </div>
              </div>
            </AccordionTrigger>
            
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-2 mb-4">
                {bet.selections.map(selection => (
                  <div key={selection.id} className="flex flex-col space-y-2 bg-gray-50 p-2 rounded">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <TeamEmblem team={selection.market.match.homeTeam} size="sm" />
                        <span className="text-black font-medium">
                          {selection.market.match.homeTeam?.name || selection.market.match.homeTeamName}
                        </span>
                        <span className="text-black">vs</span>
                        <span className="text-black font-medium">
                          {selection.market.match.awayTeam?.name || selection.market.match.awayTeamName}
                        </span>
                        <TeamEmblem team={selection.market.match.awayTeam} size="sm" />
                      </div>
                      <div className="text-sm text-black">
                        {getMarketLabel(selection.market.type)} @ {selection.odds}
                      </div>
                    </div>
                    {bet.status === "PENDING" && (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="0"
                          placeholder="Casa"
                          className="w-20"
                          value={selection.market.match.homeScore ?? ""}
                          onChange={(e) => handleScoreChange(selection.market.match.id, "home", e.target.value === "" ? undefined : parseInt(e.target.value))}
                        />
                        <span>-</span>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Fora"
                          className="w-20"
                          value={selection.market.match.awayScore ?? ""}
                          onChange={(e) => handleScoreChange(selection.market.match.id, "away", e.target.value === "" ? undefined : parseInt(e.target.value))}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center">
                {bet.status === "PENDING" && (
                  <div className="space-x-2">
                    <Button
                      onClick={() => handleResolveBet(bet.id)}
                      className="bg-yellow-400 hover:bg-yellow-500 text-black"
                    >
                      Verificar Resultado
                    </Button>
                  </div>
                )}
                <Button
                  onClick={() => handleDeleteBet(bet.id)}
                  variant="ghost"
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

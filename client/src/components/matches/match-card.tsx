import { Button } from "@/components/ui/button";
import { formatDateTime, formatOdds, getStatusClass, getStatusLabel } from "@/lib/utils";
import { useState } from "react";
import { Market, MatchWithTeamsAndMarkets } from "@shared/schema";
import { useBettingStore } from "@/lib/betting-store";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { TeamEmblem } from "@/components/ui/team-emblem";
import ExpandedMarkets from "./expanded-markets";

interface MatchCardProps {
  match: MatchWithTeamsAndMarkets;
  onRefresh?: () => void;
}

export default function MatchCard({ match, onRefresh }: MatchCardProps) {
  const [favorited, setFavorited] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditScoreDialogOpen, setIsEditScoreDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [homeScore, setHomeScore] = useState(match.homeScore?.toString() || "");
  const [awayScore, setAwayScore] = useState(match.awayScore?.toString() || "");
  const [htHomeScore, setHtHomeScore] = useState(match.htHomeScore?.toString() || "");
  const [htAwayScore, setHtAwayScore] = useState(match.htAwayScore?.toString() || "");
  const [matchStatus, setMatchStatus] = useState(match.status);
  const { addBet, removeBet, hasBet } = useBettingStore();
  const { toast } = useToast();

  const homeTeam = match.homeTeam;
  const awayTeam = match.awayTeam;
  const markets = match.markets;

  // Get home, draw, away markets (1, X, 2)
  const homeMarket = markets.find(m => m.type === "1");
  const drawMarket = markets.find(m => m.type === "X");
  const awayMarket = markets.find(m => m.type === "2");

  const handleToggleFavorite = () => {
    setFavorited(!favorited);
  };

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
        matchId: match.id,
        homeTeam: match.homeTeam?.name || match.homeTeamName || "Unknown",
        awayTeam: match.awayTeam?.name || match.awayTeamName || "Unknown",
        marketType: market.type,
        odds: market.odds
      });
    }
  };

  const handleDeleteMatch = async () => {
    setIsLoading(true);
    try {
      await apiRequest("DELETE", `/api/matches/${match.id}`);

      toast({
        title: "Match deleted",
        description: "The match has been successfully deleted."
      });

      // Invalidate matches cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/matches'] });

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      toast({
        title: "Error deleting match",
        description: "There was an error deleting the match.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMarketLock = async (market: Market) => {
    try {
      await apiRequest("PATCH", `/api/markets/${market.id}/toggle-lock`, { 
        isLocked: !market.isLocked 
      });

      toast({
        title: market.isLocked ? "Market unlocked" : "Market locked",
        description: market.isLocked 
          ? "The market is now available for betting." 
          : "The market is now locked and unavailable for betting."
      });

      // Invalidate matches cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/matches'] });

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      toast({
        title: "Error toggling market lock",
        description: "There was an error updating the market.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateScore = async () => {
    setIsLoading(true);
    try {
      const homeScoreNum = parseInt(homeScore) || 0;
      const awayScoreNum = parseInt(awayScore) || 0;

      await apiRequest("PATCH", `/api/matches/${match.id}/score`, {
        homeScore: homeScoreNum,
        awayScore: awayScoreNum,
        htHomeScore: parseInt(htHomeScore) || 0,
        htAwayScore: parseInt(htAwayScore) || 0,
        status: matchStatus
      });

      toast({
        title: "Score updated",
        description: `Match result updated to ${homeScoreNum}:${awayScoreNum}`
      });

      // Invalidate matches cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/matches'] });

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      toast({
        title: "Error updating score",
        description: "There was an error updating the match score.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsEditScoreDialogOpen(false);
    }
  };

  return (
    <>
      <div className="bg-card border border-border rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-200">
        <div className="flex justify-between items-center text-sm text-muted-foreground mb-2">
          <div className="flex items-center">
            <span>{formatDateTime(match.startTime)}</span>
            {match.status !== "UPCOMING" && (
              <span className={`ml-2 px-2 py-0.5 ${getStatusClass(match.status)} text-xs rounded`}>
                {getStatusLabel(match.status)}
              </span>
            )}
            {match.isCustom && (
              <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-white text-xs rounded">
                Custom
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button 
              className={`text-gray-400 hover:text-yellow-500 ${favorited ? 'text-yellow-500' : ''}`}
              onClick={handleToggleFavorite}
              aria-label="Favorite"
            >
              {favorited ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              )}
            </button>
            <button 
              className="text-gray-400 hover:text-blue-500"
              onClick={() => setIsEditScoreDialogOpen(true)}
              aria-label="Edit Score"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button 
              className="text-gray-400 hover:text-red-500"
              onClick={() => setIsDeleteDialogOpen(true)}
              aria-label="Delete Match"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center flex-1">
            <TeamEmblem 
              team={{
                id: match.homeTeam?.id || 0,
                name: match.homeTeam?.name || match.homeTeamName || "Unknown",
                shortName: match.homeTeam?.shortName || "",
                country: match.homeTeam?.country || "",
                league: match.homeTeam?.league || "",
                logo: match.homeTeamLogo || match.homeTeam?.logo || null
              }}
              teamName={match.homeTeam?.name || match.homeTeamName} 
              showName={true} 
              size="md" 
            />
            <div className="ml-1 text-xs text-muted-foreground">Home</div>
          </div>

          <div className="text-center px-4">
            {match.homeScore !== null && match.awayScore !== null ? (
              <div className="font-bold text-xl">{match.homeScore}:{match.awayScore}</div>
            ) : (
              <div className="font-bold text-lg">- : -</div>
            )}
            {match.status === "UPCOMING" && (
              <div className="text-xs text-gray-500">{getStatusLabel(match.status)}</div>
            )}
          </div>

          <div className="flex items-center flex-1 justify-end">
            <div className="mr-1 text-xs text-muted-foreground text-right">Away</div>
            <TeamEmblem 
              team={{
                id: match.awayTeam?.id || 0,
                name: match.awayTeam?.name || match.awayTeamName || "Unknown",
                shortName: match.awayTeam?.shortName || "",
                country: match.awayTeam?.country || "",
                league: match.awayTeam?.league || "",
                logo: match.awayTeamLogo || match.awayTeam?.logo || null
              }}
              teamName={match.awayTeam?.name || match.awayTeamName} 
              showName={true} 
              namePosition="right"
              size="md" 
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          {homeMarket && (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleBet(homeMarket)}
                className={`${homeMarket.isLocked ? 'opacity-50 cursor-not-allowed' : ''} ${hasBet(homeMarket.id) ? 'bg-yellow-400 text-black' : 'bg-secondary text-secondary-foreground'} hover:bg-secondary/80 py-1 rounded text-sm font-medium w-full`}
                disabled={homeMarket.isLocked}
              >
                Home <span className="font-semibold">{formatOdds(homeMarket.odds)}</span>
                {homeMarket.isLocked && (
                  <span className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0110 0v4"></path>
                    </svg>
                  </span>
                )}
              </Button>
              <button 
                onClick={() => handleToggleMarketLock(homeMarket)}
                className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-secondary rounded-full p-1 text-xs shadow-sm hover:bg-secondary/80"
                title={homeMarket.isLocked ? "Unlock market" : "Lock market"}
              >
                {homeMarket.isLocked ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0110 0v4"></path>
                    <line x1="12" y1="16" x2="12" y2="16.01"></line>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0110 0v4"></path>
                  </svg>
                )}
              </button>
            </div>
          )}

          {drawMarket && (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleBet(drawMarket)}
                className={`${drawMarket.isLocked ? 'opacity-50 cursor-not-allowed' : ''} ${hasBet(drawMarket.id) ? 'bg-yellow-400 text-black' : 'bg-secondary text-secondary-foreground'} hover:bg-secondary/80 py-1 rounded text-sm font-medium w-full`}
                disabled={drawMarket.isLocked}
              >
                Draw <span className="font-semibold">{formatOdds(drawMarket.odds)}</span>
                {drawMarket.isLocked && (
                  <span className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0110 0v4"></path>
                    </svg>
                  </span>
                )}
              </Button>
              <button 
                onClick={() => handleToggleMarketLock(drawMarket)}
                className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-secondary rounded-full p-1 text-xs shadow-sm hover:bg-secondary/80"
                title={drawMarket.isLocked ? "Unlock market" : "Lock market"}
              >
                {drawMarket.isLocked ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0110 0v4"></path>
                    <line x1="12" y1="16" x2="12" y2="16.01"></line>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0110 0v4"></path>
                  </svg>
                )}
              </button>
            </div>
          )}

          {awayMarket && (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleBet(awayMarket)}
                className={`${awayMarket.isLocked ? 'opacity-50 cursor-not-allowed' : ''} ${hasBet(awayMarket.id) ? 'bg-yellow-400 text-black' : 'bg-secondary text-secondary-foreground'} hover:bg-secondary/80 py-1 rounded text-sm font-medium w-full`}
                disabled={awayMarket.isLocked}
              >
                Away <span className="font-semibold">{formatOdds(awayMarket.odds)}</span>
                {awayMarket.isLocked && (
                  <span className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0110 0v4"></path>
                    </svg>
                  </span>
                )}
              </Button>
              <button 
                onClick={() => handleToggleMarketLock(awayMarket)}
                className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-secondary rounded-full p-1 text-xs shadow-sm hover:bg-secondary/80"
                title={awayMarket.isLocked ? "Unlock market" : "Lock market"}
              >
                {awayMarket.isLocked ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0110 0v4"></path>
                    <line x1="12" y1="16" x2="12" y2="16.01"></line>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0110 0v4"></path>
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>

        <ExpandedMarkets 
          matchId={match.id}
          homeTeam={match.homeTeam?.name || match.homeTeamName || "Unknown"}
          awayTeam={match.awayTeam?.name || match.awayTeamName || "Unknown"}
          allMarkets={markets}
        />

        {match.isCustom && (
          <div className="mt-3 text-right">
            <button className="text-primary hover:text-primary/80 text-sm flex items-center justify-end ml-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Custom Match
            </button>
          </div>
        )}
      </div>

      

      <Dialog open={isEditScoreDialogOpen} onOpenChange={setIsEditScoreDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Match Score</DialogTitle>
            <DialogDescription>
              Update the score for this match. This will mark the match as finished.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="homeScore" className="text-right">
                Home Score
              </Label>
              <Input
                id="homeScore"
                type="number"
                min="0"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="awayScore" className="text-right">
                Away Score
              </Label>
              <Input
                id="awayScore"
                type="number"
                min="0"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="htHomeScore" className="text-right">
                HT Home
              </Label>
              <Input
                id="htHomeScore"
                type="number"
                min="0"
                value={htHomeScore}
                onChange={(e) => setHtHomeScore(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="htAwayScore" className="text-right">
                HT Away
              </Label>
              <Input
                id="htAwayScore"
                type="number"
                min="0"
                value={htAwayScore}
                onChange={(e) => setHtAwayScore(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="matchStatus">Match Status</Label>
              <select
                id="matchStatus"
                value={matchStatus}
                onChange={(e) => setMatchStatus(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="UPCOMING">Upcoming</option>
                <option value="LIVE">Live</option>
                <option value="FINISHED">Finished</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditScoreDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateScore}
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Update Score"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
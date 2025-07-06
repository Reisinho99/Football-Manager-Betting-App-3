import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBettingStore } from "@/lib/betting-store";
import BetItem from "./bet-item";
import { formatMoney, formatOdds, calculateTotalOdds, calculatePotentialWin } from "@/lib/utils";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BettingSlipProps {
  open: boolean;
  onClose: () => void;
}

export default function BettingSlip({ open, onClose }: BettingSlipProps) {
  const { bets, removeBet, clearBets } = useBettingStore();
  const [stake, setStake] = useState<string>("10");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get user balance
  const { data: balanceData } = useQuery({
    queryKey: ['/api/balance'],
  });
  
  const userBalance = balanceData?.balance || 0;
  
  const totalOdds = calculateTotalOdds(bets.map(bet => bet.odds));
  const potentialWin = calculatePotentialWin(parseFloat(stake) || 0, totalOdds);
  
  // Listen for open-betting-slip event
  useEffect(() => {
    const handleOpenBettingSlip = () => onClose();
    document.addEventListener("open-betting-slip", handleOpenBettingSlip);
    return () => document.removeEventListener("open-betting-slip", handleOpenBettingSlip);
  }, [onClose]);
  
  const placeBetMutation = useMutation({
    mutationFn: async () => {
      const stakeAmount = parseFloat(stake);
      if (isNaN(stakeAmount) || stakeAmount <= 0) {
        throw new Error("Please enter a valid stake amount");
      }
      
      if (stakeAmount > userBalance) {
        throw new Error("Insufficient balance to place this bet");
      }
      
      if (bets.length === 0) {
        throw new Error("Please add at least one selection to your betting slip");
      }
      
      // Create bet payload with current date
      const betData = {
        stake: stakeAmount,
        totalOdds: totalOdds,
        potentialWin: potentialWin,
        status: "PENDING",
        createdAt: new Date(),
        selections: bets.map(bet => ({
          marketId: bet.id
        }))
      };
      
      const result = await apiRequest("POST", "/api/bets", betData);
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Bet placed successfully!",
        description: "Your fictional bet has been placed.",
      });
      
      // Clear the form and close the betting slip
      setStake("10");
      clearBets();
      onClose();
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bets'] });
    },
    onError: (error: any) => {
      console.error("Error placing bet:", error);
      toast({
        title: "Error placing bet",
        description: error.message || "Failed to place bet. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const handlePlaceBet = () => {
    if (parseFloat(stake) > userBalance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough balance to place this bet.",
        variant: "destructive",
      });
      return;
    }
    
    placeBetMutation.mutate();
  };
  
  return (
    <>
      {open && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={onClose}
        >
          <div 
            className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-lg flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-primary text-white p-4 flex justify-between items-center">
              <h3 className="font-semibold text-lg text-white">Betting Slip</h3>
              <button className="text-white hover:text-gray-200" onClick={onClose}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {bets.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                    <path d="M16 13H8" />
                    <path d="M16 17H8" />
                    <path d="M10 9H8" />
                  </svg>
                  <p>Your betting slip is empty</p>
                  <p className="text-sm">Select odds to add bets</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bets.map(bet => (
                    <BetItem
                      key={bet.id}
                      bet={bet}
                      onRemove={() => removeBet(bet.id)}
                    />
                  ))}
                </div>
              )}
            </div>
            
            <div className="border-t p-4">
              <div className="flex justify-between mb-2">
                <span className="font-medium text-black">Balance:</span>
                <span className="font-semibold text-black">{formatMoney(userBalance)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-medium text-black">Total Odds:</span>
                <span className="font-semibold text-black">{formatOdds(totalOdds)}</span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="font-medium text-black">Potential Win:</span>
                <span className="font-semibold text-green-600">{formatMoney(potentialWin)}</span>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-black mb-1">Stake Amount (€)</label>
                <Input
                  type="number"
                  value={stake}
                  onChange={e => setStake(e.target.value)}
                  placeholder="Enter stake"
                  min="1"
                  max={userBalance.toString()}
                  className="w-full"
                />
              </div>
              
              <Button
                onClick={handlePlaceBet}
                disabled={placeBetMutation.isPending || bets.length === 0 || !stake || parseFloat(stake) <= 0 || parseFloat(stake) > userBalance}
                className="w-full bg-yellow-400 text-primary font-medium py-3 hover:bg-yellow-500"
              >
                {placeBetMutation.isPending ? "Placing Bet..." : "Place Bet"}
              </Button>
              
              {parseFloat(stake) > userBalance && (
                <p className="text-red-500 text-sm mt-2">
                  Insufficient balance. Maximum stake available: {formatMoney(userBalance)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

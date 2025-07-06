import { formatMoney } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Link } from "wouter";
import BettingSlip from "../betting/betting-slip";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [bettingSlipOpen, setBettingSlipOpen] = useState(false);
  
  const { data: balanceData } = useQuery({
    queryKey: ['/api/balance'],
    staleTime: 60000, // 1 minute
  });
  
  const balance = balanceData?.balance || 10000;
  
  return (
    <header className="bg-primary shadow-md">
      <div className="px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <button 
            className="md:hidden mr-2 text-white" 
            onClick={onMenuClick}
            aria-label="Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-3.5c.73 0 1.41-.06 2-.18.59.12 1.27.18 2 .18 2.21 0 4-0.89 4-2s-1.79-2-4-2c-.73 0-1.41.06-2 .18-.59-.12-1.27-.18-2-.18-2.21 0-4 0.89-4 2s1.79 2 4 2z"/>
          </svg>
          <h1 className="text-white font-semibold text-xl">FM24 Sportsbook</h1>
        </div>
        <div className="flex items-center">
          <div className="flex items-center mr-4">
            <span className="text-white mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400 inline mr-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
              </svg>
              <span>{formatMoney(balance)}</span>
            </span>
            <button 
              onClick={() => {
                fetch('/api/balance/add', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ amount: 1000 })
                })
                .then(res => res.json())
                .then(() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
                });
              }}
              className="bg-green-500 text-white text-sm px-2 py-1 rounded hover:bg-green-600"
            >
              +1000€
            </button>
          </div>
          <Link
            to="/history"
            className="mr-4 text-white hover:text-yellow-400"
          >
            Histórico
          </Link>
          <button 
            onClick={() => setBettingSlipOpen(true)}
            className="bg-yellow-400 text-primary px-3 py-1.5 rounded-md font-medium flex items-center"
          >
            <span>Betting Slip</span>
            <span className="ml-2 bg-primary text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
              0
            </span>
          </button>
        </div>
      </div>
      
      <BettingSlip
        open={bettingSlipOpen}
        onClose={() => setBettingSlipOpen(false)}
      />
    </header>
  );
}

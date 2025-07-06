import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getMarketLabel(marketType: string): string {
  switch (marketType) {
    case "1":
      return "Casa";
    case "X":
      return "Empate";
    case "2":
      return "Fora";
    case "OVER_1_5":
      return "Mais de 1.5 Golos";
    case "UNDER_1_5":
      return "Menos de 1.5 Golos";
    case "OVER_2_5":
      return "Mais de 2.5 Golos";
    case "UNDER_2_5":
      return "Menos de 2.5 Golos";
    case "OVER_3_5":
      return "Mais de 3.5 Golos";
    case "UNDER_3_5":
      return "Menos de 3.5 Golos";
    case "BTTS_YES":
      return "Ambas Marcam - Sim";
    case "BTTS_NO":
      return "Ambas Marcam - Não";
    case "DNB_1":
      return "Casa (Empate Anula)";
    case "DNB_2":
      return "Fora (Empate Anula)";
    case "DC_1X":
      return "Casa ou Empate";
    case "DC_12":
      return "Casa ou Fora";
    case "DC_X2":
      return "Empate ou Fora";
    case "HT_1":
      return "1º Tempo - Casa";
    case "HT_X":
      return "1º Tempo - Empate";
    case "HT_2":
      return "1º Tempo - Fora";
    case "HT_OVER_0_5":
      return "1º Tempo - Mais de 0.5";
    case "HT_UNDER_0_5":
      return "1º Tempo - Menos de 0.5";
    case "HT_OVER_1_5":
      return "1º Tempo - Mais de 1.5";
    case "HT_UNDER_1_5":
      return "1º Tempo - Menos de 1.5";
    case "HT_BTTS_YES":
      return "1º Tempo - Ambas Marcam";
    case "HT_BTTS_NO":
      return "1º Tempo - Nem Ambas Marcam";
    case "HANDICAP_1_MINUS_1":
      return "Casa (-1)";
    case "HANDICAP_1_MINUS_2":
      return "Casa (-2)";
    case "HANDICAP_2_MINUS_1":
      return "Fora (-1)";
    case "HANDICAP_2_MINUS_2":
      return "Fora (-2)";
    case "WIN_BOTH_HALVES_1":
      return "Casa Vence Ambas as Partes";
    case "WIN_BOTH_HALVES_2":
      return "Fora Vence Ambas as Partes";
    case "WIN_EITHER_HALF_1":
      return "Casa Vence Pelo Menos Uma Parte";
    case "WIN_EITHER_HALF_2":
      return "Fora Vence Pelo Menos Uma Parte";
    default:
      return marketType;
  }
}

export function formatDateTime(date: Date | string): string {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "MMM d, h:mm a");
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatOdds(odds: number): string {
  return odds.toFixed(2);
}

export function calculateTotalOdds(odds: number[]): number {
  if (!odds.length) return 0;
  return odds.reduce((total, odd) => total * odd, 1);
}

export function calculatePotentialWin(stake: number, totalOdds: number): number {
  return stake * totalOdds;
}

type BetMarketTypes = "1" | "X" | "2" | "OVER_1_5" | "UNDER_1_5" | "OVER_2_5" | "UNDER_2_5" | "OVER_3_5" | "UNDER_3_5" | "BTTS_YES" | "BTTS_NO" | "DNB_1" | "DNB_2" | "DC_1X" | "DC_12" | "DC_X2" | "HT_1" | "HT_X" | "HT_2" | "HT_OVER_0_5" | "HT_UNDER_0_5" | "HT_OVER_1_5" | "HT_UNDER_1_5" | "HT_BTTS_YES" | "HT_BTTS_NO" | "HANDICAP_1_MINUS_1" | "HANDICAP_1_MINUS_2" | "HANDICAP_2_MINUS_1" | "HANDICAP_2_MINUS_2" | "WIN_BOTH_HALVES_1" | "WIN_BOTH_HALVES_2" | "WIN_EITHER_HALF_1" | "WIN_EITHER_HALF_2" | "CORRECT_SCORE" | "CUSTOM";

// Function to determine if a bet wins based on match result and market type
export function isBetWinner(
  marketType: string, 
  homeScore: number, 
  awayScore: number, 
  htHomeScore: number = 0, 
  htAwayScore: number = 0
): boolean {
  const totalGoals = homeScore + awayScore;
  const htTotalGoals = htHomeScore + htAwayScore;
  
  switch (marketType) {
    // 1X2 Markets
    case "1": return homeScore > awayScore;
    case "X": return homeScore === awayScore;
    case "2": return awayScore > homeScore;
    
    // Total Goals Markets
    case "OVER_1_5": return totalGoals > 1.5;
    case "UNDER_1_5": return totalGoals < 1.5;
    case "OVER_2_5": return totalGoals > 2.5;
    case "UNDER_2_5": return totalGoals < 2.5;
    case "OVER_3_5": return totalGoals > 3.5;
    case "UNDER_3_5": return totalGoals < 3.5;
    
    // Both Teams To Score
    case "BTTS_YES": return homeScore > 0 && awayScore > 0;
    case "BTTS_NO": return homeScore === 0 || awayScore === 0;
    
    // Draw No Bet
    case "DNB_1": return homeScore > awayScore; // Push if draw
    case "DNB_2": return awayScore > homeScore; // Push if draw
    
    // Double Chance
    case "DC_1X": return homeScore >= awayScore;
    case "DC_12": return homeScore !== awayScore;
    case "DC_X2": return awayScore >= homeScore;
    
    // Half Time Markets
    case "HT_1": return htHomeScore > htAwayScore;
    case "HT_X": return htHomeScore === htAwayScore;
    case "HT_2": return htAwayScore > htHomeScore;
    case "HT_OVER_0_5": return htTotalGoals > 0.5;
    case "HT_UNDER_0_5": return htTotalGoals < 0.5;
    case "HT_OVER_1_5": return htTotalGoals > 1.5;
    case "HT_UNDER_1_5": return htTotalGoals < 1.5;
    case "HT_BTTS_YES": return htHomeScore > 0 && htAwayScore > 0;
    case "HT_BTTS_NO": return htHomeScore === 0 || htAwayScore === 0;
    
    // Handicap Markets
    case "HANDICAP_1_MINUS_1": return (homeScore - 1) > awayScore;
    case "HANDICAP_1_MINUS_2": return (homeScore - 2) > awayScore;
    case "HANDICAP_2_MINUS_1": return homeScore < (awayScore - 1);
    case "HANDICAP_2_MINUS_2": return homeScore < (awayScore - 2);
    
    // Win Both Halves (assuming we have half time scores)
    case "WIN_BOTH_HALVES_1": 
      return htHomeScore > htAwayScore && (homeScore - htHomeScore) > (awayScore - htAwayScore);
    case "WIN_BOTH_HALVES_2": 
      return htAwayScore > htHomeScore && (awayScore - htAwayScore) > (homeScore - htHomeScore);
    
    // Win Either Half
    case "WIN_EITHER_HALF_1": 
      return htHomeScore > htAwayScore || (homeScore - htHomeScore) > (awayScore - htAwayScore);
    case "WIN_EITHER_HALF_2": 
      return htAwayScore > htHomeScore || (awayScore - htAwayScore) > (homeScore - htHomeScore);
    
    default: return false;
  }
}

// Function to check if a bet is a push (stake returned)
export function isBetPush(marketType: string, homeScore: number, awayScore: number): boolean {
  switch (marketType) {
    case "DNB_1": return homeScore === awayScore;
    case "DNB_2": return homeScore === awayScore;
    default: return false;
  }
}



// Function to calculate related odds based on main market odds
export function calculateRelatedOdds(homeOdds: number, drawOdds: number, awayOdds: number) {
  const totalImpliedProb = (1/homeOdds + 1/drawOdds + 1/awayOdds);
  const margin = totalImpliedProb - 1;

  // Estimate team strengths
  const homeProb = (1/homeOdds) / totalImpliedProb;
  const drawProb = (1/drawOdds) / totalImpliedProb;
  const awayProb = (1/awayOdds) / totalImpliedProb;

  return {
    // Total Goals markets
    OVER_1_5: Number((1 / (0.85 - margin * 0.5)).toFixed(2)),
    UNDER_1_5: Number((1 / (0.15 + margin * 0.5)).toFixed(2)),
    OVER_2_5: Number((1 / (0.60 - margin * 0.5)).toFixed(2)),
    UNDER_2_5: Number((1 / (0.40 + margin * 0.5)).toFixed(2)),
    OVER_3_5: Number((1 / (0.35 - margin * 0.5)).toFixed(2)),
    UNDER_3_5: Number((1 / (0.65 + margin * 0.5)).toFixed(2)),

    // Both Teams To Score
    BTTS_YES: Number((1 / (0.55 - margin * 0.5)).toFixed(2)),
    BTTS_NO: Number((1 / (0.45 + margin * 0.5)).toFixed(2)),

    // Draw No Bet
    DNB_1: Number((homeOdds * (homeProb + drawProb) / homeProb).toFixed(2)),
    DNB_2: Number((awayOdds * (awayProb + drawProb) / awayProb).toFixed(2)),

    // Double Chance
    DC_1X: Number((1 / (homeProb + drawProb + margin * 0.5)).toFixed(2)),
    DC_12: Number((1 / (homeProb + awayProb + margin * 0.5)).toFixed(2)),
    DC_X2: Number((1 / (drawProb + awayProb + margin * 0.5)).toFixed(2)),

    // Half Time (estimated)
    HT_1: Number((homeOdds * 1.4).toFixed(2)),
    HT_X: Number((drawOdds * 0.8).toFixed(2)),
    HT_2: Number((awayOdds * 1.4).toFixed(2)),

    // Half Time Goals
    HT_OVER_0_5: Number((1 / (0.75 - margin * 0.5)).toFixed(2)),
    HT_UNDER_0_5: Number((1 / (0.25 + margin * 0.5)).toFixed(2)),
    HT_OVER_1_5: Number((1 / (0.35 - margin * 0.5)).toFixed(2)),
    HT_UNDER_1_5: Number((1 / (0.65 + margin * 0.5)).toFixed(2)),

    // Half Time Both Teams Score
    HT_BTTS_YES: Number((1 / (0.35 - margin * 0.5)).toFixed(2)),
    HT_BTTS_NO: Number((1 / (0.65 + margin * 0.5)).toFixed(2)),

    // Handicaps
    HANDICAP_1_MINUS_1: Number((homeOdds * 1.6).toFixed(2)),
    HANDICAP_1_MINUS_2: Number((homeOdds * 2.2).toFixed(2)),
    HANDICAP_2_MINUS_1: Number((awayOdds * 1.6).toFixed(2)),
    HANDICAP_2_MINUS_2: Number((awayOdds * 2.2).toFixed(2)),

    // Win Both Halves
    WIN_BOTH_HALVES_1: Number((homeOdds * 2.5).toFixed(2)),
    WIN_BOTH_HALVES_2: Number((awayOdds * 2.5).toFixed(2)),

    // Win Either Half
    WIN_EITHER_HALF_1: Number((homeOdds * 0.7).toFixed(2)),
    WIN_EITHER_HALF_2: Number((awayOdds * 0.7).toFixed(2))
  };
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "LIVE": return "LIVE";
    case "UPCOMING": return "Upcoming";
    case "FINISHED": return "Finished";
    default: return status;
  }
}

export function getStatusClass(status: string): string {
  switch (status) {
    case "LIVE": return "bg-green-600 text-white";
    case "UPCOMING": return "bg-blue-500 text-white";
    case "FINISHED": return "bg-gray-500 text-white";
    default: return "bg-gray-200 text-gray-800";
  }
}

export function generateInitials(name: string): string {
  if (!name) return "";

  return name
    .split(" ")
    .map(word => word[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}
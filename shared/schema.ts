import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  balance: real("balance").notNull().default(10000),
});

// League table
export const leagues = pgTable("leagues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

// Teams table
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  country: text("country").notNull(),
  logo: text("logo"),
  league: text("league"),
});

// Matches table
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  homeTeamId: integer("home_team_id"),
  awayTeamId: integer("away_team_id"),
  homeTeamName: text("home_team_name"),
  awayTeamName: text("away_team_name"),
  homeTeamLogo: text("home_team_logo"),
  awayTeamLogo: text("away_team_logo"),
  leagueId: integer("league_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  htHomeScore: integer("ht_home_score"),
  htAwayScore: integer("ht_away_score"),
  status: text("status").notNull().default("UPCOMING"), // UPCOMING, LIVE, FINISHED
  isCustom: boolean("is_custom").notNull().default(false),
});

// Markets table
export const markets = pgTable("markets", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull(),
  type: text("type").notNull(), // 1, X, 2, OVER, UNDER, etc.
  odds: real("odds").notNull(),
  isLocked: boolean("is_locked").notNull().default(false),
});

// Bets table 
export const bets = pgTable("bets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  stake: real("stake").notNull(),
  totalOdds: real("total_odds").notNull(),
  potentialWin: real("potential_win").notNull(),
  status: text("status").notNull().default("PENDING"), // PENDING, WON, LOST
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Bet selections table
export const betSelections = pgTable("bet_selections", {
  id: serial("id").primaryKey(),
  betId: integer("bet_id").notNull(),
  marketId: integer("market_id").notNull(),
  odds: real("odds").notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  balance: true,
});

export const insertLeagueSchema = createInsertSchema(leagues).pick({
  name: true,
  country: true,
  isActive: true,
});

export const insertTeamSchema = createInsertSchema(teams).pick({
  name: true,
  shortName: true,
  country: true,
  logo: true,
  league: true,
});

// Custom schema for match with date validation
const baseMatchSchema = createInsertSchema(matches).pick({
  homeTeamId: true,
  awayTeamId: true,
  homeTeamName: true,
  awayTeamName: true,
  leagueId: true,
  startTime: true,
  homeScore: true,
  awayScore: true,
  status: true,
  isCustom: true,
});

// Create a modified schema with custom date handling
export const insertMatchSchema = baseMatchSchema.extend({
  homeTeamId: z.number().optional(),
  awayTeamId: z.number().optional(),
  homeTeamName: z.string().optional(),
  awayTeamName: z.string().optional(),
  homeTeamLogo: z.string().optional(),
  awayTeamLogo: z.string().optional(),
  htHomeScore: z.number().optional(),
  htAwayScore: z.number().optional(),
  startTime: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ])
});

export const insertMarketSchema = createInsertSchema(markets).pick({
  matchId: true,
  type: true,
  odds: true,
  isLocked: true,
});

// Extended market types
export type MarketType = 
  | "1" | "X" | "2"           // 1X2
  | "OVER_1_5" | "UNDER_1_5"  // Total Goals 1.5
  | "OVER_2_5" | "UNDER_2_5"  // Total Goals 2.5 
  | "OVER_3_5" | "UNDER_3_5"  // Total Goals 3.5
  | "BTTS_YES" | "BTTS_NO"    // Both Teams To Score
  | "DNB_1" | "DNB_2"         // Draw No Bet
  | "DC_1X" | "DC_12" | "DC_X2" // Double Chance
  | "HT_1" | "HT_X" | "HT_2"  // Half Time Result
  | "HT_OVER_0_5" | "HT_UNDER_0_5" // Half Time Goals 0.5
  | "HT_OVER_1_5" | "HT_UNDER_1_5" // Half Time Goals 1.5
  | "HT_BTTS_YES" | "HT_BTTS_NO"   // Half Time Both Teams Score
  | "HANDICAP_1_MINUS_1" | "HANDICAP_1_MINUS_2" // Home Handicap -1, -2
  | "HANDICAP_2_MINUS_1" | "HANDICAP_2_MINUS_2" // Away Handicap -1, -2
  | "WIN_BOTH_HALVES_1" | "WIN_BOTH_HALVES_2"   // Win Both Halves
  | "WIN_EITHER_HALF_1" | "WIN_EITHER_HALF_2"   // Win Either Half
  | "CORRECT_SCORE"           // Correct Score (specific scores)
  | "CUSTOM";                 // Custom markets

export const insertBetSchema = createInsertSchema(bets).pick({
  userId: true,
  stake: true,
  totalOdds: true,
  potentialWin: true,
  status: true,
});

export const insertBetSelectionSchema = createInsertSchema(betSelections).pick({
  betId: true,
  marketId: true,
  odds: true,
});

// Extended types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertLeague = z.infer<typeof insertLeagueSchema>;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type InsertMarket = z.infer<typeof insertMarketSchema>;
export type InsertBet = z.infer<typeof insertBetSchema>;
export type InsertBetSelection = z.infer<typeof insertBetSelectionSchema>;

export type User = typeof users.$inferSelect;
export type League = typeof leagues.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type Market = typeof markets.$inferSelect;
export type Bet = typeof bets.$inferSelect;
export type BetSelection = typeof betSelections.$inferSelect;

// Extended types for the frontend
export interface MatchWithTeamsAndMarkets {
  id: number;
  homeTeam?: Team;
  awayTeam?: Team;
  homeTeamName?: string;
  awayTeamName?: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  league: League;
  startTime: Date;
  homeScore: number | null;
  awayScore: number | null;
  htHomeScore: number | null;
  htAwayScore: number | null;
  status: string;
  isCustom: boolean;
  markets: Market[];
}

export interface BetWithSelections {
  id: number;
  userId: number;
  stake: number;
  totalOdds: number;
  potentialWin: number;
  status: string;
  createdAt: Date;
  selections: (BetSelection & {
    market: Market & {
      match: MatchWithTeamsAndMarkets;
    };
  })[];
}
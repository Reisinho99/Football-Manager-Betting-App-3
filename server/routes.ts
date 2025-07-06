import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertMatchSchema, 
  insertMarketSchema, 
  insertBetSchema, 
  insertBetSelectionSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = express.Router();

  // GET /api/countries - Get all countries with leagues
  apiRouter.get("/countries", async (req, res) => {
    try {
      const leagues = await storage.getLeagues();

      // Continents mapping
      const continentMap: Record<string, string> = {
        "Romania": "Europe",
        "Portugal": "Europe",
        "Spain": "Europe",
        "England": "Europe",
        "Italy": "Europe",
        "Germany": "Europe",
        "France": "Europe",
        "Austria": "Europe",
        "Netherlands": "Europe",
        "Belgium": "Europe",
        "Brazil": "South America",
        "Argentina": "South America",
        "Colombia": "South America",
        "United States": "North America",
        "Mexico": "North America",
        "Japan": "Asia",
        "South Korea": "Asia",
        "China": "Asia",
        "Egypt": "Africa",
        "South Africa": "Africa",
        "Morocco": "Africa"
      };

      // Group leagues by country and continent
      const countriesMap = new Map<string, { 
        name: string; 
        continent: string;
        leagues: { id: number; name: string }[] 
      }>();

      leagues.forEach(league => {
        if (!countriesMap.has(league.country)) {
          countriesMap.set(league.country, {
            name: league.country,
            continent: continentMap[league.country] || "Other",
            leagues: []
          });
        }

        countriesMap.get(league.country)?.leagues.push({
          id: league.id,
          name: league.name
        });
      });

      // Convert map to array
      const countries = Array.from(countriesMap.values());

      // Group by continent
      const continentsMap = new Map<string, { 
        name: string;
        countries: { 
          name: string; 
          leagues: { id: number; name: string }[] 
        }[]
      }>();

      countries.forEach(country => {
        if (!continentsMap.has(country.continent)) {
          continentsMap.set(country.continent, {
            name: country.continent,
            countries: []
          });
        }

        continentsMap.get(country.continent)?.countries.push({
          name: country.name,
          leagues: country.leagues
        });
      });

      // Convert to array of continents
      const continents = Array.from(continentsMap.values());

      res.json(continents);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/leagues - Get all leagues
  apiRouter.get("/leagues", async (req, res) => {
    try {
      const leagues = await storage.getLeagues();
      res.json(leagues);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/leagues/:country - Get leagues by country
  apiRouter.get("/leagues/:country", async (req, res) => {
    try {
      const country = req.params.country;
      const leagues = await storage.getLeaguesByCountry(country);
      res.json(leagues);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/teams - Get all teams
  apiRouter.get("/teams", async (req, res) => {
    try {
      const teams = await storage.getTeams();
      res.json(teams);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/teams/:country - Get teams by country
  apiRouter.get("/teams/:country", async (req, res) => {
    try {
      const country = req.params.country;
      const teams = await storage.getTeamsByCountry(country);
      res.json(teams);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/matches - Get all matches with details
  apiRouter.get("/matches", async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      let matches = await storage.getMatchesWithDetails();

      // Filter by status if provided
      if (status) {
        matches = matches.filter(match => match.status === status.toUpperCase());
      }

      // Sort matches: LIVE first, then UPCOMING, then FINISHED
      matches.sort((a, b) => {
        const statusOrder = { LIVE: 0, UPCOMING: 1, FINISHED: 2 };
        const statusA = statusOrder[a.status as keyof typeof statusOrder] || 3;
        const statusB = statusOrder[b.status as keyof typeof statusOrder] || 3;

        if (statusA !== statusB) return statusA - statusB;

        // If same status, sort by start time (newest first)
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
      });

      res.json(matches);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/matches/:id - Get match by ID with details
  apiRouter.get("/matches/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid match ID" });
      }

      const match = await storage.getMatchWithDetails(id);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }

      res.json(match);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/matches - Create a new match
  apiRouter.post("/matches", async (req, res) => {
    try {
      const matchData = {
        ...req.body,
        homeTeamLogo: req.body.homeLogo || null,
        awayTeamLogo: req.body.awayLogo || null
      };

      // Create the match with logo data
      const match = await storage.createMatch(matchData);

      // Create default markets if provided
      if (req.body.markets && Array.isArray(req.body.markets)) {
        for (const marketData of req.body.markets) {
          const validMarketData = insertMarketSchema.parse({
            ...marketData,
            matchId: match.id
          });
          await storage.createMarket(validMarketData);
        }
      }

      res.status(201).json(match);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid match data", errors: error.errors });
      }
      console.error('Error creating match:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // PATCH /api/matches/:id - Update match status and score
  apiRouter.patch("/matches/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid match ID" });
      }

      const { status, homeScore, awayScore } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const match = await storage.updateMatchStatus(id, status, homeScore, awayScore);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }

      res.json(match);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // PATCH /api/matches/:id/score - Update match score specifically
  apiRouter.patch("/matches/:id/score", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid match ID" });
      }

      const { homeScore, awayScore, htHomeScore, htAwayScore, status } = req.body;
      if (homeScore === undefined || awayScore === undefined) {
        return res.status(400).json({ message: "Both homeScore and awayScore are required" });
      }

      const match = await storage.updateMatchStatus(
        id, 
        status || "FINISHED", 
        parseInt(homeScore), 
        parseInt(awayScore),
        htHomeScore ? parseInt(htHomeScore) : null,
        htAwayScore ? parseInt(htAwayScore) : null
      );
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }

      // If match is finished, resolve all pending bets for this match
      if (status === "FINISHED") {
        await storage.resolveBetsForMatch(id);
      }

      res.json(match);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // DELETE /api/matches/:id - Delete a match
  apiRouter.delete("/matches/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid match ID" });
      }

      const success = await storage.deleteMatch(id);
      if (!success) {
        return res.status(404).json({ message: "Match not found" });
      }

      res.status(200).json({ message: "Match deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/markets - Create a new market
  apiRouter.post("/markets", async (req, res) => {
    try {
      const marketData = insertMarketSchema.parse(req.body);
      const market = await storage.createMarket(marketData);

      res.status(201).json(market);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid market data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // PATCH /api/markets/:id/toggle-lock - Toggle the locked status of a market
  apiRouter.patch("/markets/:id/toggle-lock", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid market ID" });
      }

      const { isLocked } = req.body;
      if (typeof isLocked !== 'boolean') {
        return res.status(400).json({ message: "isLocked must be a boolean" });
      }

      const market = await storage.toggleMarketLock(id, isLocked);
      if (!market) {
        return res.status(404).json({ message: "Market not found" });
      }

      res.json(market);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/balance - Get user balance
  apiRouter.get("/balance", async (req, res) => {
    try {
      // For demo purposes, always return the first user
      const user = await storage.getUser(1);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ balance: user.balance });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/balance/add - Add to user balance
  apiRouter.post("/balance/add", async (req, res) => {
    try {
      const { amount } = req.body;
      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const user = await storage.getUser(1);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.updateUserBalance(user.id, user.balance + amount);
      res.json({ balance: updatedUser?.balance });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/bets - Place a new bet
  apiRouter.post("/bets", async (req, res) => {
    try {
      // Validate bet data
      const betData = insertBetSchema.omit({ userId: true }).parse(req.body);
      const selections = req.body.selections;

      // Validate selections
      if (!selections || !Array.isArray(selections) || selections.length === 0) {
        return res.status(400).json({ message: "At least one selection is required" });
      }

      // For demo purposes, always use the first user
      const user = await storage.getUser(1);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has enough balance
      if (user.balance < betData.stake) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Validate all selections
      const validSelections: z.infer<typeof insertBetSelectionSchema>[] = [];
      for (const selection of selections) {
        const marketId = selection.marketId;
        const market = await storage.getMarket(marketId);
        if (!market) {
          return res.status(400).json({ message: `Market with ID ${marketId} not found` });
        }

        validSelections.push({
          marketId: market.id,
          odds: market.odds,
          betId: 0 // This will be set by the storage
        });
      }

      // Create the bet
      const bet = await storage.createBet(
        { ...betData, userId: user.id },
        validSelections
      );

      // Update user balance
      await storage.updateUserBalance(user.id, user.balance - betData.stake);

      res.status(201).json(bet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bet data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });  // PATCH /api/bets/:id/resolve - Resolve a bet
  apiRouter.patch("/bets/:id/resolve", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
      await storage.resolveBet(parseInt(id), status);
      res.json({ message: "Bet resolved successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete bet
  apiRouter.delete("/api/bets/:id", async (req, res) => {
    const { id } = req.params;

    try {
      await storage.deleteBet(parseInt(id));
      res.json({ message: "Bet deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/bets - Get user's bets
  apiRouter.get("/bets", async (req, res) => {
    try {
      // For demo purposes, always use the first user
      const user = await storage.getUser(1);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const bets = await storage.getBetsWithSelections(user.id);
      res.json(bets);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.use("/api", apiRouter);

      // Create new league
    app.post("/api/leagues", async (req, res) => {
      try {
        const leagueData = insertLeagueSchema.parse(req.body);
        const league = await storage.createLeague(leagueData);
        res.json(league);
      } catch (error: any) {
        console.error("Error creating league:", error);
        res.status(400).json({ 
          message: "Failed to create league", 
          error: error.message 
        });
      }
    });

    app.post("/api/bets/:id/resolve", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
      await storage.resolveBet(parseInt(id), status);
      res.json({ message: "Bet resolved successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
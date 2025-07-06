import { 
  users, type User, type InsertUser,
  leagues, type League, type InsertLeague,
  teams, type Team, type InsertTeam,
  matches, type Match, type InsertMatch,
  markets, type Market, type InsertMarket,
  bets, type Bet, type InsertBet,
  betSelections, type BetSelection, type InsertBetSelection,
  type MatchWithTeamsAndMarkets,
  type BetWithSelections
} from "@shared/schema";
import { allEsportsTeams } from "./esports-teams";

// Storage interface
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(id: number, balance: number): Promise<User | undefined>;

  // Leagues
  getLeagues(): Promise<League[]>;
  getLeaguesByCountry(country: string): Promise<League[]>;
  getLeague(id: number): Promise<League | undefined>;
  createLeague(league: InsertLeague): Promise<League>;

  // Teams
  getTeams(): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  getTeamsByCountry(country: string): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeamLogo(teamId: number, logo: string): Promise<Team | undefined>;

  // Matches
  getMatches(): Promise<Match[]>;
  getMatchesWithDetails(): Promise<MatchWithTeamsAndMarkets[]>;
  getMatch(id: number): Promise<Match | undefined>;
  getMatchWithDetails(id: number): Promise<MatchWithTeamsAndMarkets | undefined>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatchStatus(
    id: number, 
    status: string, 
    homeScore?: number, 
    awayScore?: number,
    htHomeScore?: number | null,
    htAwayScore?: number | null
  ): Promise<Match | undefined>;
  deleteMatch(id: number): Promise<boolean>;

  // Markets
  getMarkets(): Promise<Market[]>;
  getMarketsByMatchId(matchId: number): Promise<Market[]>;
  getMarket(id: number): Promise<Market | undefined>;
  createMarket(market: InsertMarket): Promise<Market>;
  toggleMarketLock(id: number, isLocked: boolean): Promise<Market | undefined>;

  // Bets
  getBets(): Promise<Bet[]>;
  getBetsByUserId(userId: number): Promise<Bet[]>;
  getBetsWithSelections(userId: number): Promise<BetWithSelections[]>;
  getBet(id: number): Promise<Bet | undefined>;
  createBet(bet: InsertBet, selections: InsertBetSelection[]): Promise<Bet>;
  deleteBet(id: number): Promise<boolean>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private leagues: Map<number, League>;
  private teams: Map<number, Team>;
  private matches: Map<number, Match>;
  private markets: Map<number, Market>;
  private bets: Map<number, Bet>;
  private betSelections: Map<number, BetSelection>;

  private currentUserID: number;
  private currentLeagueID: number;
  private currentTeamID: number;
  private currentMatchID: number;
  private currentMarketID: number;
  private currentBetID: number;
  private currentBetSelectionID: number;

  constructor() {
    this.users = new Map();
    this.leagues = new Map();
    this.teams = new Map();
    this.matches = new Map();
    this.markets = new Map();
    this.bets = new Map();
    this.betSelections = new Map();

    this.currentUserID = 1;
    this.currentLeagueID = 1;
    this.currentTeamID = 1;
    this.currentMatchID = 1;
    this.currentMarketID = 1;
    this.currentBetID = 1;
    this.currentBetSelectionID = 1;

    // Initialize with default data
    this.initializeDefaultData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserID++;
    const user: User = { 
      ...insertUser, 
      id, 
      balance: insertUser.balance || 1000 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(id: number, balance: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const updatedUser = { ...user, balance };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // League methods
  async getLeagues(): Promise<League[]> {
    return Array.from(this.leagues.values());
  }

  async getLeaguesByCountry(country: string): Promise<League[]> {
    return Array.from(this.leagues.values()).filter(
      (league) => league.country === country
    );
  }

  async getLeague(id: number): Promise<League | undefined> {
    return this.leagues.get(id);
  }

  async createLeague(insertLeague: InsertLeague): Promise<League> {
    const id = this.currentLeagueID++;
    const league: League = { 
      ...insertLeague, 
      id, 
      isActive: insertLeague.isActive !== undefined ? insertLeague.isActive : true 
    };
    this.leagues.set(id, league);
    return league;
  }

  // Team methods
  async getTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  async getTeam(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async getTeamsByCountry(country: string): Promise<Team[]> {
    return Array.from(this.teams.values()).filter(
      (team) => team.country === country
    );
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const id = this.currentTeamID++;
    const newTeam: Team = { 
      ...team, 
      id,
      logo: team.logo || null,
      league: team.league || null
    };
    this.teams.set(id, newTeam);
    return newTeam;
  }

  async updateTeamLogo(teamId: number, logo: string): Promise<Team | undefined> {
    const team = await this.getTeam(teamId);
    if (!team) return undefined;

    const updatedTeam = { ...team, logo };
    this.teams.set(teamId, updatedTeam);
    return updatedTeam;
  }

  // Match methods
  async getMatches(): Promise<Match[]> {
    return Array.from(this.matches.values());
  }

  async getMatchesWithDetails(): Promise<MatchWithTeamsAndMarkets[]> {
    const matches = await this.getMatches();
    const result: MatchWithTeamsAndMarkets[] = [];

    for (const match of matches) {
      const league = await this.getLeague(match.leagueId);
      const matchMarkets = await this.getMarketsByMatchId(match.id);

      if (!league) continue;

      // Get team data if team IDs are provided, otherwise use custom names
      const homeTeam = match.homeTeamId ? await this.getTeam(match.homeTeamId) : undefined;
      const awayTeam = match.awayTeamId ? await this.getTeam(match.awayTeamId) : undefined;

      result.push({
        ...match,
        homeTeam,
        awayTeam,
        homeTeamName: match.homeTeamName ? match.homeTeamName : undefined,
        awayTeamName: match.awayTeamName ? match.awayTeamName : undefined,
        league,
        markets: matchMarkets
      });
    }

    return result;
  }

  async getMatch(id: number): Promise<Match | undefined> {
    return this.matches.get(id);
  }

  async getMatchWithDetails(id: number): Promise<MatchWithTeamsAndMarkets | undefined> {
    const match = await this.getMatch(id);
    if (!match) return undefined;

    const league = await this.getLeague(match.leagueId);
    const markets = await this.getMarketsByMatchId(id);

    if (!league) return undefined;

    // Get team data if team IDs are provided, otherwise use custom names
    const homeTeam = match.homeTeamId ? await this.getTeam(match.homeTeamId) : undefined;
    const awayTeam = match.awayTeamId ? await this.getTeam(match.awayTeamId) : undefined;

    return {
      ...match,
      homeTeam,
      awayTeam,
      homeTeamName: match.homeTeamName || undefined,
      awayTeamName: match.awayTeamName || undefined,
      league,
      markets
    };
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const id = this.currentMatchID++;

    // Debug logging for logo data
    console.log('🔍 Creating match with logo data:', {
      homeTeamLogo: insertMatch.homeTeamLogo,
      awayTeamLogo: insertMatch.awayTeamLogo,
      homeTeamName: insertMatch.homeTeamName,
      awayTeamName: insertMatch.awayTeamName
    });

    const match: Match = { 
      ...insertMatch, 
      id,
      status: insertMatch.status || 'UPCOMING',
      homeTeamId: insertMatch.homeTeamId || null,
      awayTeamId: insertMatch.awayTeamId || null,
      homeTeamName: insertMatch.homeTeamName || null,
      awayTeamName: insertMatch.awayTeamName || null,
      homeScore: insertMatch.homeScore || null,
      awayScore: insertMatch.awayScore || null,
      isCustom: insertMatch.isCustom || false,
      homeTeamLogo: insertMatch.homeTeamLogo || null,
      awayTeamLogo: insertMatch.awayTeamLogo || null
    };
    this.matches.set(id, match);

    console.log('✅ Match created with ID:', id, 'Logo data saved:', {
      homeTeamLogo: match.homeTeamLogo,
      awayTeamLogo: match.awayTeamLogo
    });

    return match;
  }

  async updateMatchStatus(
    id: number, 
    status: string, 
    homeScore?: number, 
    awayScore?: number,
    htHomeScore?: number | null,
    htAwayScore?: number | null
  ): Promise<Match | undefined> {
    const match = await this.getMatch(id);
    if (!match) return undefined;

    const updatedMatch = { 
      ...match, 
      status,
      homeScore: homeScore !== undefined ? homeScore : match.homeScore,
      awayScore: awayScore !== undefined ? awayScore : match.awayScore,
      htHomeScore: htHomeScore !== undefined ? htHomeScore : match.htHomeScore,
      htAwayScore: htAwayScore !== undefined ? htAwayScore : match.htAwayScore
    };

    this.matches.set(id, updatedMatch);

    if (status === "FINISHED") {
      await this.resolveBetsForMatch(id);
    }

    return updatedMatch;
  }

  async deleteMatch(id: number): Promise<boolean> {
    const match = await this.getMatch(id);
    if (!match) return false;

    // Delete associated markets first
    const markets = await this.getMarketsByMatchId(id);
    for (const market of markets) {
      this.markets.delete(market.id);
    }

    // Delete the match
    this.matches.delete(id);
    return true;
  }

  // Market methods
  async getMarkets(): Promise<Market[]> {
    return Array.from(this.markets.values());
  }

  async getMarketsByMatchId(matchId: number): Promise<Market[]> {
    return Array.from(this.markets.values()).filter(
      (market) => market.matchId === matchId
    );
  }

  async getMarket(id: number): Promise<Market | undefined> {
    return this.markets.get(id);
  }

  async createMarket(insertMarket: InsertMarket): Promise<Market> {
    const id = this.currentMarketID++;
    const market: Market = { 
      ...insertMarket, 
      id,
      isLocked: insertMarket.isLocked || false
    };
    this.markets.set(id, market);
    return market;
  }

  async toggleMarketLock(id: number, isLocked: boolean): Promise<Market | undefined> {
    const market = await this.getMarket(id);
    if (!market) return undefined;

    const updatedMarket = { 
      ...market, 
      isLocked
    };

    this.markets.set(id, updatedMarket);
    return updatedMarket;
  }

  // Bet methods
  async getBets(): Promise<Bet[]> {
    return Array.from(this.bets.values());
  }

  async getBetsByUserId(userId: number): Promise<Bet[]> {
    return Array.from(this.bets.values()).filter(
      (bet) => bet.userId === userId
    );
  }

  async getBetsWithSelections(userId: number): Promise<BetWithSelections[]> {
    const userBets = await this.getBetsByUserId(userId);
    const result: BetWithSelections[] = [];

    for (const bet of userBets) {
      const selections = Array.from(this.betSelections.values())
        .filter((selection) => selection.betId === bet.id);

      const selectionsWithDetails = await Promise.all(
        selections.map(async (selection) => {
          const market = await this.getMarket(selection.marketId);
          if (!market) return null;

          const match = await this.getMatchWithDetails(market.matchId);
          if (!match) return null;

          return {
            ...selection,
            market: {
              ...market,
              match
            }
          };
        })
      );

      // Filter out null values and cast to the correct type
      const validSelections = selectionsWithDetails.filter(
        (selection): selection is NonNullable<typeof selection> => selection !== null
      );

      result.push({
        ...bet,
        selections: validSelections
      });
    }

    return result;
  }

  async getBet(id: number): Promise<Bet | undefined> {
    return this.bets.get(id);
  }

  async createBet(insertBet: InsertBet, selectionInserts: InsertBetSelection[]): Promise<Bet> {
    const id = this.currentBetID++;

    // Ensure all required fields have values
    const bet: Bet = { 
      ...insertBet, 
      id,
      status: insertBet.status || "PENDING",
      createdAt: new Date()
    };

    this.bets.set(id, bet);

    // Create bet selections
    for (const selectionInsert of selectionInserts) {
      const selectionId = this.currentBetSelectionID++;
      const selection: BetSelection = { 
        ...selectionInsert, 
        id: selectionId,
        betId: id
      };
      this.betSelections.set(selectionId, selection);
    }

    return bet;
  }

  async resolveBet(betId: number, status: string) {
    if (status === "WON") {
      const bet = this.bets.get(betId);
      if (bet) {
        const user = await this.getUser(bet.userId);
        if(user){
          await this.updateUserBalance(user.id, user.balance + bet.potentialWin);
        }
      }
    }

    const bet = this.bets.get(betId);
    if (bet) {
      const updatedBet = {...bet, status};
      this.bets.set(betId, updatedBet);
    }
  }

  async resolveBetsForMatch(matchId: number): Promise<void> {
    // Note: We'll need to duplicate these functions here since we can't import from client
    function isBetWinner(
      marketType: string, 
      homeScore: number, 
      awayScore: number, 
      htHomeScore: number = 0, 
      htAwayScore: number = 0
    ): boolean {
      const totalGoals = homeScore + awayScore;
      const htTotalGoals = htHomeScore + htAwayScore;

      switch (marketType) {
        case "1": return homeScore > awayScore;
        case "X": return homeScore === awayScore;
        case "2": return awayScore > homeScore;
        case "OVER_1_5": return totalGoals > 1.5;
        case "UNDER_1_5": return totalGoals < 1.5;
        case "OVER_2_5": return totalGoals > 2.5;
        case "UNDER_2_5": return totalGoals < 2.5;
        case "OVER_3_5": return totalGoals > 3.5;
        case "UNDER_3_5": return totalGoals < 3.5;
        case "BTTS_YES": return homeScore > 0 && awayScore > 0;
        case "BTTS_NO": return homeScore === 0 || awayScore === 0;
        case "DNB_1": return homeScore > awayScore;
        case "DNB_2": return awayScore > homeScore;
        case "DC_1X": return homeScore >= awayScore;
        case "DC_12": return homeScore !== awayScore;
        case "DC_X2": return awayScore >= homeScore;
        case "HT_1": return htHomeScore > htAwayScore;
        case "HT_X": return htHomeScore === htAwayScore;
        case "HT_2": return htAwayScore > htHomeScore;
        case "HT_OVER_0_5": return htTotalGoals > 0.5;
        case "HT_UNDER_0_5": return htTotalGoals < 0.5;
        case "HT_OVER_1_5": return htTotalGoals > 1.5;
        case "HT_UNDER_1_5": return htTotalGoals < 1.5;
        case "HT_BTTS_YES": return htHomeScore > 0 && htAwayScore > 0;
        case "HT_BTTS_NO": return htHomeScore === 0 || htAwayScore === 0;
        case "HANDICAP_1_MINUS_1": return (homeScore - 1) > awayScore;
        case "HANDICAP_1_MINUS_2": return (homeScore - 2) > awayScore;
        case "HANDICAP_2_MINUS_1": return homeScore < (awayScore - 1);
        case "HANDICAP_2_MINUS_2": return homeScore < (awayScore - 2);
        case "WIN_BOTH_HALVES_1": {
          const secondHalfHome = homeScore - htHomeScore;
          const secondHalfAway = awayScore - htAwayScore;
          return htHomeScore > htAwayScore && secondHalfHome > secondHalfAway;
        }
        case "WIN_BOTH_HALVES_2": {
          const secondHalfHome = homeScore - htHomeScore;
          const secondHalfAway = awayScore - htAwayScore;
          return htAwayScore > htHomeScore && secondHalfAway > secondHalfHome;
        }
        case "WIN_EITHER_HALF_1": {
          const secondHalfHome = homeScore - htHomeScore;
          const secondHalfAway = awayScore - htAwayScore;
          return htHomeScore > htAwayScore || secondHalfHome > secondHalfAway;
        }
        case "WIN_EITHER_HALF_2": {
          const secondHalfHome = homeScore - htHomeScore;
          const secondHalfAway = awayScore - htAwayScore;
          return htAwayScore > htHomeScore || secondHalfAway > secondHalfHome;
        }
        default: return false;
      }
    }
  
    function isBetPush(marketType: string, homeScore: number, awayScore: number): boolean {
      switch (marketType) {
        case "DNB_1": return homeScore === awayScore;
        case "DNB_2": return homeScore === awayScore;
        default: return false;
      }
    }

    const matchesArray = Array.from(this.matches.values());

    const match = matchesArray.find((match) => match.id === matchId);
    if (!match || match.status !== "FINISHED" || match.homeScore === null || match.awayScore === null) {
      return;
    }

    for (const bet of Array.from(this.bets.values())) {
      if (bet.status === "PENDING") {
        let allSelectionsWon = true;
        let hasAnyPush = false;

        for (const selection of Array.from(this.betSelections.values()).filter(selection => selection.betId === bet.id)) {
          const market = this.markets.get(selection.marketId);
          if (!market) continue;

          if (market.matchId === matchId) {
            const isWinner = isBetWinner(
              market.type,
              match.homeScore,
              match.awayScore,
              match.htHomeScore || 0,
              match.htAwayScore || 0
            );

            const isPush = isBetPush(market.type, match.homeScore, match.awayScore);

            if (isPush) {
              hasAnyPush = true;
            } else if (!isWinner) {
              allSelectionsWon = false;
              break;
            }
          }
        }

        if (allSelectionsWon) {
          if (hasAnyPush) {
            this.resolveBet(bet.id, "PUSH");
          } else {
            this.resolveBet(bet.id, "WON");
          }
        } else {
          this.resolveBet(bet.id, "LOST");
        }
      }
    }
  }

  async deleteBet(id: number): Promise<boolean> {
    const bet = this.bets.get(id);
    if (!bet) return false;
    this.bets.delete(id);
    return true;
  }

  // Initialize default data
  private async initializeDefaultData() {
    // Create a default user
    await this.createUser({
      username: "user",
      password: "password",
      balance: 10000
    });

    // Create countries and leagues - Add new continents and countries
    const countries = [
      // Europe
      { name: "Romania", code: "ro", continent: "Europe", leagues: ["Liga 1", "Liga 2", "Cupa României", "Supercupa României"] },
      { name: "Portugal", code: "pt", continent: "Europe", leagues: ["Primeira Liga", "Liga Portugal 2", "Taça de Portugal"] },
      { name: "Spain", code: "es", continent: "Europe", leagues: ["La Liga", "La Liga 2", "Copa del Rey"] },
      { name: "England", code: "gb-eng", continent: "Europe", leagues: ["Premier League", "Championship", "FA Cup"] },
      { name: "Italy", code: "it", continent: "Europe", leagues: ["Serie A", "Serie B", "Coppa Italia"] },
      { name: "Germany", code: "de", continent: "Europe", leagues: ["Bundesliga", "2. Bundesliga", "DFB-Pokal"] },
      { name: "France", code: "fr", continent: "Europe", leagues: ["Ligue 1", "Ligue 2", "Coupe de France"] },
      { name: "Austria", code: "at", continent: "Europe", leagues: ["Bundesliga", "2. Liga", "ÖFB-Cup"] },
      { name: "Netherlands", code: "nl", continent: "Europe", leagues: ["Eredivisie", "Eerste Divisie", "KNVB Cup"] },
      { name: "Belgium", code: "be", continent: "Europe", leagues: ["Pro League", "Challenger Pro League", "Belgian Cup"] },
      { name: "Andorra", code: "ad", continent: "Europe", leagues: ["Primera Divisió"] },
      { name: "Norway", code: "no", continent: "Europe", leagues: ["Eliteserien", "OBOS-ligaen", "Norwegian Cup"] },

      // Baltic Countries
      { name: "Latvia", code: "lv", continent: "Europe", leagues: ["Optibet Virslīga", "1. līga", "Latvian Cup"] },
      { name: "Estonia", code: "ee", continent: "Europe", leagues: ["Meistriliiga", "Esiliiga", "Estonian Cup"] },
      { name: "Lithuania", code: "lt", continent: "Europe", leagues: ["A Lyga", "1 Lyga", "Lithuanian Cup"] },

      // Balkans
      { name: "Croatia", code: "hr", continent: "Europe", leagues: ["HNL", "Druga HNL", "Croatian Cup"] },
      { name: "Serbia", code: "rs", continent: "Europe", leagues: ["SuperLiga", "Prva Liga Srbije", "Serbian Cup"] },
      { name: "Slovenia", code: "si", continent: "Europe", leagues: ["PrvaLiga", "Druga Liga", "Slovenian Cup"] },
      { name: "North Macedonia", code: "mk", continent: "Europe", leagues: ["First League", "Second League", "Macedonian Cup"] },
      { name: "Montenegro", code: "me", continent: "Europe", leagues: ["First League", "Second League", "Montenegrin Cup"] },
      { name: "Bosnia and Herzegovina", code: "ba", continent: "Europe", leagues: ["Premier League", "First League FBiH", "Bosnian Cup"] },
      { name: "Albania", code: "al", continent: "Europe", leagues: ["Kategoria Superiore", "Kategoria e Parë", "Albanian Cup"] },
      { name: "Kosovo", code: "xk", continent: "Europe", leagues: ["Football Superleague", "First League", "Kosovar Cup"] },

      // Other European Countries
      { name: "Czech Republic", code: "cz", continent: "Europe", leagues: ["Fortuna Liga", "Fortuna:Národní Liga", "Czech Cup"] },
      { name: "Slovakia", code: "sk", continent: "Europe", leagues: ["Fortuna Liga", "2. Liga", "Slovak Cup"] },
      { name: "Poland", code: "pl", continent: "Europe", leagues: ["Ekstraklasa", "I Liga", "Polish Cup"] },
      { name: "Hungary", code: "hu", continent: "Europe", leagues: ["OTP Bank Liga", "NB II", "Hungarian Cup"] },
      { name: "Bulgaria", code: "bg", continent: "Europe", leagues: ["First League", "Second League", "Bulgarian Cup"] },
      { name: "Moldova", code: "md", continent: "Europe", leagues: ["Divizia Naţională", "Divizia A", "Moldovan Cup"] },
      { name: "Belarus", code: "by", continent: "Europe", leagues: ["Vysshaya Liga", "Pervaya Liga", "Belarusian Cup"] },
      { name: "Ukraine", code: "ua", continent: "Europe", leagues: ["Premier League", "First League", "Ukrainian Cup"] },
      { name: "Finland", code: "fi", continent: "Europe", leagues: ["Veikkausliiga", "Ykkönen", "Finnish Cup"] },
      { name: "Sweden", code: "se", continent: "Europe", leagues: ["Allsvenskan", "Superettan", "Svenska Cupen"] },
      { name: "Denmark", code: "dk", continent: "Europe", leagues: ["Superliga", "NordicBet Liga", "Danish Cup"] },
      { name: "Iceland", code: "is", continent: "Europe", leagues: ["Úrvalsdeild", "1. deild", "Icelandic Cup"] },

      // South America
      { name: "Brazil", code: "br", continent: "South America", leagues: ["Serie A", "Serie B", "Copa do Brasil"] },
      { name: "Argentina", code: "ar", continent: "South America", leagues: ["Primera División", "Primera Nacional", "Copa Argentina"] },
      { name: "Colombia", code: "co", continent: "South America", leagues: ["Categoría Primera A", "Categoría Primera B", "Copa Colombia"] },

      // North America
      { name: "United States", code: "us", continent: "North America", leagues: ["MLS", "USL Championship", "US Open Cup"] },
      { name: "Mexico", code: "mx", continent: "North America", leagues: ["Liga MX", "Liga de Expansión MX", "Copa MX"] },

      // Asia
      { name: "Japan", code: "jp", continent: "Asia", leagues: ["J1 League", "J2 League", "Emperor's Cup"] },
      { name: "South Korea", code: "kr", continent: "Asia", leagues: ["K League 1", "K League 2", "Korean FA Cup"] },
      { name: "China", code: "cn", continent: "Asia", leagues: ["Chinese Super League", "China League One", "Chinese FA Cup"] },

      // Africa
      { name: "Egypt", code: "eg", continent: "Africa", leagues: ["Egyptian Premier League", "Egypt Cup"] },
      { name: "South Africa", code: "za", continent: "Africa", leagues: ["Premier Soccer League", "National First Division"] },
      { name: "Morocco", code: "ma", continent: "Africa", leagues: ["Botola Pro", "Botola 2"] },

      // eSports
      { name: "Global", code: "global", continent: "eSports", leagues: ["Call of Duty League", "Halo Championship Series", "League of Legends World Championship"] }
    ];

    // Create leagues
    for (const country of countries) {
      for (const leagueName of country.leagues) {
        await this.createLeague({
          name: leagueName,
          country: country.name,
          isActive: true
        });
      }
    }

    // Create teams
    const romanianTeams = [
      { name: "FCSB", shortName: "FCSB", country: "Romania" },
      { name: "CFR Cluj", shortName: "CFR", country: "Romania" },
      { name: "Universitatea Craiova", shortName: "UCR", country: "Romania" },
      { name: "Rapid București", shortName: "RPD", country: "Romania" },
      { name: "FC Urziceni", shortName: "FCU", country: "Romania" },
      { name: "Dinamo București", shortName: "DIN", country: "Romania" },
      { name: "FC Argeș", shortName: "ARG", country: "Romania" },
      { name: "Petrolul Ploiești", shortName: "PET", country: "Romania" },
      { name: "FC Botoșani", shortName: "FCB", country: "Romania" },
      { name: "Farul Constanța", shortName: "FAR", country: "Romania" },
      { name: "UTA Arad", shortName: "UTA", country: "Romania" },
      { name: "Sepsi OSK", shortName: "SEP", country: "Romania" },
      { name: "FC Voluntari", shortName: "VOL", country: "Romania" },
      { name: "Gloria Buzău", shortName: "GLO", country: "Romania" },
      { name: "Unirea Urziceni", shortName: "UNR", country: "Romania" },
      { name: "CS Mioveni", shortName: "MIO", country: "Romania" }
    ];

    const portugueseTeams = [
      { name: "Sporting CP", shortName: "SCP", country: "Portugal" },
      { name: "SL Benfica", shortName: "SLB", country: "Portugal" },
      { name: "FC Porto", shortName: "FCP", country: "Portugal" },
      { name: "SC Braga", shortName: "SCB", country: "Portugal" },
      { name: "Vitória de Guimarães", shortName: "VIT", country: "Portugal" },
      { name: "Boavista FC", shortName: "BOA", country: "Portugal" },
      { name: "Marítimo", shortName: "MAR", country: "Portugal" },
      { name: "Gil Vicente FC", shortName: "GIL", country: "Portugal" },
      { name: "FC Famalicão", shortName: "FAM", country: "Portugal" },
      { name: "Portimonense", shortName: "POR", country: "Portugal" },
      { name: "Rio Ave FC", shortName: "RIO", country: "Portugal" },
      { name: "Belenenses SAD", shortName: "BEL", country: "Portugal" },
      { name: "Santa Clara", shortName: "SCL", country: "Portugal" },
      { name: "Moreirense FC", shortName: "MOR", country: "Portugal" },
      { name: "Paços de Ferreira", shortName: "PAC", country: "Portugal" },
      { name: "Estoril Praia", shortName: "EST", country: "Portugal" }
    ];

    const spanishTeams = [
      { name: "Real Madrid", shortName: "RMD", country: "Spain" },
      { name: "Barcelona", shortName: "BAR", country: "Spain" },
      { name: "Atlético Madrid", shortName: "ATM", country: "Spain" },
      { name: "Sevilla FC", shortName: "SEV", country: "Spain" },
      { name: "Real Sociedad", shortName: "SOC", country: "Spain" },
      { name: "Real Betis", shortName: "BET", country: "Spain" },
      { name: "Villarreal CF", shortName: "VIL", country: "Spain" },
      { name: "Athletic Bilbao", shortName: "ATH", country: "Spain" },
      { name: "Valencia CF", shortName: "VAL", country: "Spain" },
      { name: "Celta Vigo", shortName: "CEL", country: "Spain" },
      { name: "RCD Espanyol", shortName: "ESP", country: "Spain" },
      { name: "Getafe CF", shortName: "GET", country: "Spain" },
      { name: "Levante UD", shortName: "LEV", country: "Spain" },
      { name: "Granada CF", shortName: "GRA", country: "Spain" },
      { name: "Osasuna", shortName: "OSA", country: "Spain" },
      { name: "Mallorca", shortName: "MAL", country: "Spain" },
      { name: "Cádiz CF", shortName: "CAD", country: "Spain" },
      { name: "Rayo Vallecano", shortName: "RAY", country: "Spain" },
      { name: "Elche CF", shortName: "ELC", country: "Spain" },
      { name: "Alavés", shortName: "ALA", country: "Spain" }
    ];

    const englishTeams = [
      { name: "Manchester City", shortName: "MCI", country: "England" },
      { name: "Liverpool", shortName: "LIV", country: "England" },
      { name: "Chelsea", shortName: "CHE", country: "England" },
      { name: "Arsenal", shortName: "ARS", country: "England" },
      { name: "Tottenham Hotspur", shortName: "TOT", country: "England" },
      { name: "Manchester United", shortName: "MUN", country: "England" },
      { name: "West Ham United", shortName: "WHU", country: "England" },
      { name: "Leicester City", shortName: "LEI", country: "England" },
      { name: "Brighton", shortName: "BHA", country: "England" },
      { name: "Wolverhampton", shortName: "WOL", country: "England" },
      { name: "Newcastle United", shortName: "NEW", country: "England" },
      { name: "Crystal Palace", shortName: "CRY", country: "England" },
      { name: "Brentford", shortName: "BRE", country: "England" },
      { name: "Aston Villa", shortName: "AVL", country: "England" },
      { name: "Southampton", shortName: "SOU", country: "England" },
      { name: "Everton", shortName: "EVE", country: "England" },
      { name: "Leeds United", shortName: "LEE", country: "England" },
      { name: "Burnley", shortName: "BUR", country: "England" },
      { name: "Watford", shortName: "WAT", country: "England" },
      { name: "Norwich City", shortName: "NOR", country: "England" }
    ];

    const italianTeams = [
      { name: "Internazionale", shortName: "INT", country: "Italy" },
      { name: "AC Milan", shortName: "MIL", country: "Italy" },
      { name: "Napoli", shortName: "NAP", country: "Italy" },
      { name: "Juventus", shortName: "JUV", country: "Italy" },
      { name: "Atalanta", shortName: "ATA", country: "Italy" },
      { name: "Roma", shortName: "ROM", country: "Italy" },
      { name: "Lazio", shortName: "LAZ", country: "Italy" },
      { name: "Fiorentina", shortName: "FIO", country: "Italy" },
      { name: "Verona", shortName: "VER", country: "Italy" },
      { name: "Torino", shortName: "TOR", country: "Italy" },
      { name: "Sassuolo", shortName: "SAS", country: "Italy" },
      { name: "Udinese", shortName: "UDI", country: "Italy" },
      { name: "Bologna", shortName: "BOL", country: "Italy" },
      { name: "Empoli", shortName: "EMP", country: "Italy" },
      { name: "Sampdoria", shortName: "SAM", country: "Italy" },
      { name: "Spezia", shortName: "SPE", country: "Italy" },
      { name: "Cagliari", shortName: "CAG", country: "Italy" },
      { name: "Venezia", shortName: "VEN", country: "Italy" },
      { name: "Genoa", shortName: "GEN", country: "Italy" },
      { name: "Salernitana", shortName: "SAL", country: "Italy" }
    ];

    const germanTeams = [
      { name: "Bayern Munich", shortName: "BAY", country: "Germany" },
      { name: "Borussia Dortmund", shortName: "BVB", country: "Germany" },
      { name: "Bayer Leverkusen", shortName: "B04", country: "Germany" },
      { name: "RB Leipzig", shortName: "RBL", country: "Germany" },
      { name: "Borussia Mönchengladbach", shortName: "BMG", country: "Germany" },
      { name: "Eintracht Frankfurt", shortName: "SGE", country: "Germany" },
      { name: "Wolfsburg", shortName: "WOB", country: "Germany" },
      { name: "Mainz 05", shortName: "M05", country: "Germany" },
      { name: "1. FC Köln", shortName: "KOE", country: "Germany" },
      { name: "Union Berlin", shortName: "FCU", country: "Germany" },
      { name: "Freiburg", shortName: "SCF", country: "Germany" },
      { name: "Hoffenheim", shortName: "TSG", country: "Germany" },
      { name: "VfB Stuttgart", shortName: "VFB", country: "Germany" },
      { name: "Hertha Berlin", shortName: "BSC", country: "Germany" },
      { name: "Augsburg", shortName: "FCA", country: "Germany" },
      { name: "Arminia Bielefeld", shortName: "DSC", country: "Germany" },
      { name: "Werder Bremen", shortName: "SVW", country: "Germany" },
      { name: "Schalke 04", shortName: "S04", country: "Germany" }
    ];

    const frenchTeams = [
      { name: "Paris Saint-Germain", shortName: "PSG", country: "France" },
      { name: "Lille", shortName: "LIL", country: "France" },
      { name: "Monaco", shortName: "MON", country: "France" },
      { name: "Lyon", shortName: "OL", country: "France" },
      { name: "Marseille", shortName: "OM", country: "France" },
      { name: "Rennes", shortName: "REN", country: "France" },
      { name: "Lens", shortName: "LEN", country: "France" },
      { name: "Nice", shortName: "NIC", country: "France" },
      { name: "Montpellier", shortName: "MTP", country: "France" },
      { name: "Strasbourg", shortName: "RCS", country: "France" },
      { name: "Angers", shortName: "ANG", country: "France" },
      { name: "Nantes", shortName: "FCN", country: "France" },
      { name: "Reims", shortName: "SDR", country: "France" },
      { name: "Brest", shortName: "BST", country: "France" },
      { name: "Bordeaux", shortName: "BOR", country: "France" },
      { name: "Saint-Etienne", shortName: "ASSE", country: "France" },
      { name: "Lorient", shortName: "LOR", country: "France" },
      { name: "Troyes", shortName: "TRO", country: "France" },
      { name: "Metz", shortName: "MET", country: "France" },
      { name: "Clermont Foot", shortName: "CF63", country: "France" }
    ];

    const austrianTeams = [
      { name: "RB Salzburg", shortName: "RBS", country: "Austria" },
      { name: "Sturm Graz", shortName: "STU", country: "Austria" },
      { name: "Rapid Wien", shortName: "RAP", country: "Austria" },
      { name: "LASK Linz", shortName: "LASK", country: "Austria" },
      { name: "Wolfsberger AC", shortName: "WAC", country: "Austria" },
      { name: "Austria Wien", shortName: "FAK", country: "Austria" },
      { name: "Hartberg", shortName: "HTB", country: "Austria" },
      { name: "Austria Klagenfurt", shortName: "KLA", country: "Austria" },
      { name: "WSG Tirol", shortName: "WSG", country: "Austria" },
      { name: "Altach", shortName: "ALT", country: "Austria" },
      { name: "Admira Wacker", shortName: "ADM", country: "Austria" },
      { name: "SV Ried", shortName: "RIE", country: "Austria" }
    ];

    // Create European teams
    const europeanTeams = [
      // Norway
      { name: "Bodø/Glimt", shortName: "BOD", country: "Norway", league: "Eliteserien" },
      { name: "Molde", shortName: "MOL", country: "Norway", league: "Eliteserien" },
      { name: "Brann", shortName: "BRA", country: "Norway", league: "Eliteserien" },
      { name: "Viking", shortName: "VIK", country: "Norway", league: "Eliteserien" },
      { name: "Tromsø", shortName: "TRO", country: "Norway", league: "Eliteserien" },
      { name: "Lillestrøm", shortName: "LSK", country: "Norway", league: "Eliteserien" },
      { name: "Rosenborg", shortName: "RBK", country: "Norway", league: "Eliteserien" },
      { name: "Vålerenga", shortName: "VIF", country: "Norway", league: "Eliteserien" },
      { name: "Strømsgodset", shortName: "SIF", country: "Norway", league: "Eliteserien" },
      { name: "HamKam", shortName: "HAM", country: "Norway", league: "Eliteserien" },
      { name: "Haugesund", shortName: "FKH", country: "Norway", league: "Eliteserien" },
      { name: "Sandefjord", shortName: "SAN", country: "Norway", league: "Eliteserien" },
      { name: "Fredrikstad", shortName: "FFK", country: "Norway", league: "Eliteserien" },
      { name: "KFUM Oslo", shortName: "KFU", country: "Norway", league: "Eliteserien" },
      { name: "Kristiansund", shortName: "KBK", country: "Norway", league: "Eliteserien" },
      { name: "Aalesund", shortName: "AaFK", country: "Norway", league: "Eliteserien" },

      // Andorra
      { name: "FC Andorra", shortName: "AND", country: "Andorra", league: "Primera Divisió" },
      { name: "Inter Club d'Escaldes", shortName: "ICE", country: "Andorra", league: "Primera Divisió" },
      { name: "UE Santa Coloma", shortName: "USC", country: "Andorra", league: "Primera Divisió" },
      { name: "UE Engordany", shortName: "ENG", country: "Andorra", league: "Primera Divisió" },
      { name: "FC Santa Coloma", shortName: "FSC", country: "Andorra", league: "Primera Divisió" },
      { name: "Atlètic Club d'Escaldes", shortName: "ACE", country: "Andorra", league: "Primera Divisió" },
      { name: "CE Carroi", shortName: "CAR", country: "Andorra", league: "Primera Divisió" },
      { name: "Penya Encarnada", shortName: "PEN", country: "Andorra", league: "Primera Divisió" },

      // Croatia
      { name: "Dinamo Zagreb", shortName: "DZG", country: "Croatia", league: "HNL" },
      { name: "Hajduk Split", shortName: "HAJ", country: "Croatia", league: "HNL" },
      { name: "Rijeka", shortName: "RIJ", country: "Croatia", league: "HNL" },
      { name: "Osijek", shortName: "OSI", country: "Croatia", league: "HNL" },
      { name: "Lokomotiva Zagreb", shortName: "LOK", country: "Croatia", league: "HNL" },
      { name: "Gorica", shortName: "GOR", country: "Croatia", league: "HNL" },
      { name: "Varaždin", shortName: "VAR", country: "Croatia", league: "HNL" },
      { name: "Šibenik", shortName: "SIB", country: "Croatia", league: "HNL" },
      { name: "Istra 1961", shortName: "IST", country: "Croatia", league: "HNL" },
      { name: "Slaven Belupo", shortName: "SLB", country: "Croatia", league: "HNL" },

      // Serbia
      { name: "Red Star Belgrade", shortName: "CZV", country: "Serbia", league: "SuperLiga" },
      { name: "Partizan Belgrade", shortName: "PAR", country: "Serbia", league: "SuperLiga" },
      { name: "FK TSC", shortName: "TSC", country: "Serbia", league: "SuperLiga" },
      { name: "Vojvodina", shortName: "VOJ", country: "Serbia", league: "SuperLiga" },
      { name: "Čukarički", shortName: "CUK", country: "Serbia", league: "SuperLiga" },
      { name: "Radnički Niš", shortName: "RAD", country: "Serbia", league: "SuperLiga" },
      { name: "Novi Pazar", shortName: "NOP", country: "Serbia", league: "SuperLiga" },
      { name: "Spartak Subotica", shortName: "SPA", country: "Serbia", league: "SuperLiga" },
      { name: "Javor Ivanjica", shortName: "JAV", country: "Serbia", league: "SuperLiga" },
      { name: "Mladost Lučani", shortName: "MLA", country: "Serbia", league: "SuperLiga" },

      // Latvia
      { name: "Riga FC", shortName: "RIG", country: "Latvia", league: "Optibet Virslīga" },
      { name: "FK Liepāja", shortName: "LIE", country: "Latvia", league: "Optibet Virslīga" },
      { name: "Valmiera FC", shortName: "VAL", country: "Latvia", league: "Optibet Virslīga" },
      { name: "FK Jelgava", shortName: "JEL", country: "Latvia", league: "Optibet Virslīga" },
      { name: "FK Ventspils", shortName: "VEN", country: "Latvia", league: "Optibet Virslīga" },
      { name: "FK Daugavpils", shortName: "DAU", country: "Latvia", league: "Optibet Virslīga" },
      { name: "Metta/LU", shortName: "MET", country: "Latvia", league: "Optibet Virslīga" },
      { name: "FK Auda", shortName: "AUD", country: "Latvia", league: "Optibet Virslīga" },

      // Estonia
      { name: "Flora Tallinn", shortName: "FLO", country: "Estonia", league: "Meistriliiga" },
      { name: "FCI Levadia", shortName: "LEV", country: "Estonia", league: "Meistriliiga" },
      { name: "Paide Linnameeskond", shortName: "PAI", country: "Estonia", league: "Meistriliiga" },
      { name: "FC Trans", shortName: "TRA", country: "Estonia", league: "Meistriliiga" },
      { name: "Nõmme Kalju", shortName: "KAL", country: "Estonia", league: "Meistriliiga" },
      { name: "Tulevik Viljandi", shortName: "TUL", country: "Estonia", league: "Meistriliiga" },
      { name: "Tallinna Kalev", shortName: "TKA", country: "Estonia", league: "Meistriliiga" },
      { name: "FC Kuressaare", shortName: "KUR", country: "Estonia", league: "Meistriliiga" },

      // Lithuania
      { name: "FK Žalgiris", shortName: "ZAL", country: "Lithuania", league: "A Lyga" },
      { name: "FK Sūduva", shortName: "SUD", country: "Lithuania", league: "A Lyga" },
      { name: "FK Kauno Žalgiris", shortName: "KZA", country: "Lithuania", league: "A Lyga" },
      { name: "FK Panevėžys", shortName: "PAN", country: "Lithuania", league: "A Lyga" },
      { name: "FK Džiugas", shortName: "DZI", country: "Lithuania", league: "A Lyga" },
      { name: "FK Banga", shortName: "BAN", country: "Lithuania", league: "A Lyga" },
      { name: "FK Hegelmann", shortName: "HEG", country: "Lithuania", league: "A Lyga" },
      { name: "FK Jonava", shortName: "JON", country: "Lithuania", league: "A Lyga" },

      // Slovenia
      { name: "NK Maribor", shortName: "MAR", country: "Slovenia", league: "PrvaLiga" },
      { name: "NK Olimpija Ljubljana", shortName: "OLI", country: "Slovenia", league: "PrvaLiga" },
      { name: "NK Celje", shortName: "CEL", country: "Slovenia", league: "PrvaLiga" },
      { name: "NK Koper", shortName: "KOP", country: "Slovenia", league: "PrvaLiga" },
      { name: "NK Mura", shortName: "MUR", country: "Slovenia", league: "PrvaLiga" },
      { name: "NK Bravo", shortName: "BRA", country: "Slovenia", league: "PrvaLiga" },
      { name: "NK Domžale", shortName: "DOM", country: "Slovenia", league: "PrvaLiga" },
      { name: "NK Radomlje", shortName: "RAD", country: "Slovenia", league: "PrvaLiga" },

      // North Macedonia
      { name: "FK Vardar", shortName: "VAR", country: "North Macedonia", league: "First League" },
      { name: "FK Shkupi", shortName: "SKU", country: "North Macedonia", league: "First League" },
      { name: "FK Sileks", shortName: "SIL", country: "North Macedonia", league: "First League" },
      { name: "FK Renova", shortName: "REN", country: "North Macedonia", league: "First League" },
      { name: "FK Akademija Pandev", shortName: "AKA", country: "North Macedonia", league: "First League" },
      { name: "FK Struga", shortName: "STR", country: "North Macedonia", league: "First League" },
      { name: "FK Pobeda", shortName: "POB", country: "North Macedonia", league: "First League" },
      { name: "FK Skendija", shortName: "SKE", country: "North Macedonia", league: "First League" },
    ];

    // Create Dutch teams
    const dutchTeams = [
      { name: "Ajax", shortName: "AJX", country: "Netherlands", league: "Eredivisie" },
      { name: "PSV Eindhoven", shortName: "PSV", country: "Netherlands", league: "Eredivisie" },
      { name: "Feyenoord", shortName: "FEY", country: "Netherlands", league: "Eredivisie" },
      { name: "AZ Alkmaar", shortName: "AZ", country: "Netherlands", league: "Eredivisie" },
      { name: "FC Utrecht", shortName: "UTR", country: "Netherlands", league: "Eredivisie" },
      { name: "Vitesse", shortName: "VIT", country: "Netherlands", league: "Eredivisie" },
      { name: "FC Groningen", shortName: "GRO", country: "Netherlands", league: "Eredivisie" },
      { name: "FC Twente", shortName: "TWE", country: "Netherlands", league: "Eredivisie" },
      { name: "Heerenveen", shortName: "HEE", country: "Netherlands", league: "Eredivisie" },
      { name: "Sparta Rotterdam", shortName: "SPA", country: "Netherlands", league: "Eredivisie" },
      { name: "NEC Nijmegen", shortName: "NEC", country: "Netherlands", league: "Eredivisie" },
      { name: "Fortuna Sittard", shortName: "FOR", country: "Netherlands", league: "Eredivisie" },
      { name: "Go Ahead Eagles", shortName: "GAE", country: "Netherlands", league: "Eredivisie" },
      { name: "FC Emmen", shortName: "EMM", country: "Netherlands", league: "Eredivisie" },
      { name: "RKC Waalwijk", shortName: "RKC", country: "Netherlands", league: "Eredivisie" },
      { name: "Cambuur", shortName: "CAM", country: "Netherlands", league: "Eredivisie" },
      { name: "Willem II", shortName: "WIL", country: "Netherlands", league: "Eredivisie" },
      { name: "PEC Zwolle", shortName: "PEC", country: "Netherlands", league: "Eredivisie" }
    ];

    // Create Belgian teams
    const belgianTeams = [
      { name: "Club Brugge", shortName: "BRU", country: "Belgium", league: "Pro League" },
      { name: "Anderlecht", shortName: "AND", country: "Belgium", league: "Pro League" },
      { name: "Standard Liège", shortName: "STL", country: "Belgium", league: "Pro League" },
      { name: "Genk", shortName: "GNK", country: "Belgium", league: "Pro League" },
      { name: "Gent", shortName: "GNT", country: "Belgium", league: "Pro League" },
      { name: "Royal Antwerp", shortName: "ANT", country: "Belgium", league: "Pro League" },
      { name: "Charleroi", shortName: "CHA", country: "Belgium", league: "Pro League" },
      { name: "Mechelen", shortName: "MEC", country: "Belgium", league: "Pro League" },
      { name: "Oostende", shortName: "OST", country: "Belgium", league: "Pro League" },
      { name: "Cercle Brugge", shortName: "CER", country: "Belgium", league: "Pro League" },
      { name: "Sint-Truiden", shortName: "STR", country: "Belgium", league: "Pro League" },
      { name: "Union SG", shortName: "USG", country: "Belgium", league: "Pro League" },
      { name: "Kortrijk", shortName: "KOR", country: "Belgium", league: "Pro League" },
      { name: "Zulte Waregem", shortName: "ZUL", country: "Belgium", league: "Pro League" },
      { name: "Beerschot", shortName: "BEE", country: "Belgium", league: "Pro League" },
      { name: "Eupen", shortName: "EUP", country: "Belgium", league: "Pro League" }
    ];

    // Create Brazilian teams
    const brazilianTeams = [
      { name: "Flamengo", shortName: "FLA", country: "Brazil", league: "Serie A" },
      { name: "Palmeiras", shortName: "PAL", country: "Brazil", league: "Serie A" },
      { name: "Atlético Mineiro", shortName: "CAM", country: "Brazil", league: "Serie A" },
      { name: "São Paulo", shortName: "SAO", country: "Brazil", league: "Serie A" },
      { name: "Fluminense", shortName: "FLU", country: "Brazil", league: "Serie A" },
      { name: "Internacional", shortName: "INT", country: "Brazil", league: "Serie A" },
      { name: "Corinthians", shortName: "COR", country: "Brazil", league: "Serie A" },
      { name: "Botafogo", shortName: "BOT", country: "Brazil", league: "Serie A" },
      { name: "Grêmio", shortName: "GRE", country: "Brazil", league: "Serie A" },
      { name: "Santos", shortName: "SAN", country: "Brazil", league: "Serie A" },
      { name: "Athletico Paranaense", shortName: "CAP", country: "Brazil", league: "Serie A" },
      { name: "Fortaleza", shortName: "FOR", country: "Brazil", league: "Serie A" },
      { name: "Bahia", shortName: "BAH", country: "Brazil", league: "Serie A" },
      { name: "Ceará", shortName: "CEA", country: "Brazil", league: "Serie A" },
      { name: "Goiás", shortName: "GOI", country: "Brazil", league: "Serie A" },
      { name: "Red Bull Bragantino", shortName: "RBB", country: "Brazil", league: "Serie A" },
      { name: "Vasco da Gama", shortName: "VAS", country: "Brazil", league: "Serie A" },
      { name: "Coritiba", shortName: "CFC", country: "Brazil", league: "Serie A" },
      { name: "Cuiabá", shortName: "CUI", country: "Brazil", league: "Serie A" },
      { name: "Juventude", shortName: "JUV", country: "Brazil", league: "Serie A" }
    ];

    // Create Argentinian teams
    const argentinianTeams = [
      { name: "Boca Juniors", shortName: "BOC", country: "Argentina", league: "Primera División" },
      { name: "River Plate", shortName: "RIV", country: "Argentina", league: "Primera División" },
      { name: "Racing Club", shortName: "RAC", country: "Argentina", league: "Primera División" },
      { name: "Independiente", shortName: "IND", country: "Argentina", league: "Primera División" },
      { name: "San Lorenzo", shortName: "SLO", country: "Argentina", league: "Primera División" },
      { name: "Vélez Sarsfield", shortName: "VEL", country: "Argentina", league: "Primera División" },
      { name: "Estudiantes", shortName: "EST", country: "Argentina", league: "Primera División" },
      { name: "Rosario Central", shortName: "ROS", country: "Argentina", league: "Primera División" },
      { name: "Newell's Old Boys", shortName: "NOB", country: "Argentina", league: "Primera División" },
      { name: "Talleres", shortName: "TAL", country: "Argentina", league: "Primera División" },
      { name: "Huracán", shortName: "HUR", country: "Argentina", league: "Primera División" },
      { name: "Defensa y Justicia", shortName: "DYJ", country: "Argentina", league: "Primera División" },
      { name: "Lanús", shortName: "LAN", country: "Argentina", league: "Primera División" },
      { name: "Colón", shortName: "COL", country: "Argentina", league: "Primera División" },
      { name: "Argentinos Juniors", shortName: "ARG", country: "Argentina", league: "Primera División" },
      { name: "Gimnasia", shortName: "GIM", country: "Argentina", league: "Primera División" },
      { name: "Unión", shortName: "UNI", country: "Argentina", league: "Primera División" },
      { name: "Banfield", shortName: "BAN", country: "Argentina", league: "Primera División" },
      { name: "Godoy Cruz", shortName: "GCR", country: "Argentina", league: "Primera División" },
      { name: "Central Córdoba", shortName: "CCO", country: "Argentina", league: "Primera División" }
    ];

    // Create Colombian teams
    const colombianTeams = [
      { name: "Atlético Nacional", shortName: "NAC", country: "Colombia", league: "Categoría Primera A" },
      { name: "Millonarios", shortName: "MIL", country: "Colombia", league: "Categoría Primera A" },
      { name: "América de Cali", shortName: "AME", country: "Colombia", league: "Categoría Primera A" },
      { name: "Deportivo Cali", shortName: "CAL", country: "Colombia", league: "Categoría Primera A" },
      { name: "Independiente Santa Fe", shortName: "SFE", country: "Colombia", league: "Categoría Primera A" },
      { name: "Junior", shortName: "JUN", country: "Colombia", league: "Categoría Primera A" },
      { name: "Once Caldas", shortName: "ONC", country: "Colombia", league: "Categoría Primera A" },
      { name: "Deportes Tolima", shortName: "TOL", country: "Colombia", league: "Categoría Primera A" },
      { name: "La Equidad", shortName: "EQU", country: "Colombia", league: "Categoría Primera A" },
      { name: "Independiente Medellín", shortName: "DIM", country: "Colombia", league: "Categoría Primera A" },
      { name: "Envigado", shortName: "ENV", country: "Colombia", league: "Categoría Primera A" },
      { name: "Atlético Bucaramanga", shortName: "BUC", country: "Colombia", league: "Categoría Primera A" },
      { name: "Deportivo Pasto", shortName: "PAS", country: "Colombia", league: "Categoría Primera A" },
      { name: "Jaguares de Córdoba", shortName: "JAG", country: "Colombia", league: "Categoría Primera A" },
      { name: "Patriotas", shortName: "PAT", country: "Colombia", league: "Categoría Primera A" },
      { name: "Águilas Doradas", shortName: "AGD", country: "Colombia", league: "Categoría Primera A" }
    ];

    // Create teams from United States (MLS)
    const usTeams = [
      { name: "Atlanta United", shortName: "ATL", country: "United States", league: "MLS" },
      { name: "Austin FC", shortName: "ATX", country: "United States", league: "MLS" },
      { name: "Charlotte FC", shortName: "CLT", country: "United States", league: "MLS" },
      { name: "Chicago Fire", shortName: "CHI", country: "United States", league: "MLS" },
      { name: "FC Cincinnati", shortName: "CIN", country: "United States", league: "MLS" },
      { name: "Colorado Rapids", shortName: "COL", country: "United States", league: "MLS" },
      { name: "Columbus Crew", shortName: "CLB", country: "United States", league: "MLS" },
      { name: "D.C. United", shortName: "DC", country: "United States", league: "MLS" },
      { name: "FC Dallas", shortName: "DAL", country: "United States", league: "MLS" },
      { name: "Houston Dynamo", shortName: "HOU", country: "United States", league: "MLS" },
      { name: "Sporting Kansas City", shortName: "SKC", country: "United States", league: "MLS" },
      { name: "LA Galaxy", shortName: "LA", country: "United States", league: "MLS" },
      { name: "Los Angeles FC", shortName: "LAFC", country: "United States", league: "MLS" },
      { name: "Inter Miami", shortName: "MIA", country: "UnitedStates", league: "MLS" },
      { name: "Minnesota United", shortName: "MIN", country: "United States", league: "MLS" },
      { name: "CF Montréal", shortName: "MTL", country: "United States", league: "MLS" },
      { name: "Nashville SC", shortName: "NSH", country: "United States", league: "MLS" },
      { name: "New England Revolution", shortName: "NE", country: "United States", league: "MLS" },
      { name: "New York City FC", shortName: "NYC", country: "United States", league: "MLS" },
      { name: "New York Red Bulls", shortName: "RBNY", country: "United States", league: "MLS" },
      { name: "Orlando City", shortName: "ORL", country: "United States", league: "MLS" },
      { name: "Philadelphia Union", shortName: "PHI", country: "United States", league: "MLS" },
      { name: "Portland Timbers", shortName: "POR", country: "United States", league: "MLS" },
      { name: "Real Salt Lake", shortName: "RSL", country: "United States", league: "MLS" },
      { name: "San Jose Earthquakes", shortName: "SJ", country: "United States", league: "MLS" },
      { name: "Seattle Sounders", shortName: "SEA", country: "United States", league: "MLS" },
      { name: "Toronto FC", shortName: "TOR", country: "United States", league: "MLS" },
      { name: "Vancouver Whitecaps", shortName: "VAN", country: "United States", league: "MLS" }
    ];

    // Create Mexican teams
    const mexicanTeams = [
      { name: "América", shortName: "AME", country: "Mexico", league: "Liga MX" },
      { name: "Guadalajara", shortName: "GDL", country: "Mexico", league: "Liga MX" },
      { name: "Cruz Azul", shortName: "CAZ", country: "Mexico", league: "Liga MX" },
      { name: "UNAM Pumas", shortName: "PUM", country: "Mexico", league: "Liga MX" },
      { name: "Tigres UANL", shortName: "TIG", country: "Mexico", league: "Liga MX" },
      { name: "Monterrey", shortName: "MTY", country: "Mexico", league: "Liga MX" },
      { name: "Santos Laguna", shortName: "SAN", country: "Mexico", league: "Liga MX" },
      { name: "Toluca", shortName: "TOL", country: "Mexico", league: "Liga MX" },
      { name: "León", shortName: "LEO", country: "Mexico", league: "Liga MX" },
      { name: "Atlas", shortName: "ATL", country: "Mexico", league: "Liga MX" },
      { name: "Tijuana", shortName: "TIJ", country: "Mexico", league: "Liga MX" },
      { name: "Pachuca", shortName: "PAC", country: "Mexico", league: "Liga MX" },
      { name: "Querétaro", shortName: "QRO", country: "Mexico", league: "Liga MX" },
      { name: "Puebla", shortName: "PUE", country: "Mexico", league: "Liga MX" },
      { name: "Necaxa", shortName: "NEC", country: "Mexico", league: "Liga MX" },
      { name: "Mazatlán", shortName: "MAZ", country: "Mexico", league: "Liga MX" },
      { name: "Juárez", shortName: "JUA", country: "Mexico", league: "Liga MX" },
      { name: "Atlético San Luis", shortName: "SL", country: "Mexico", league: "Liga MX" }
    ];

    // Create Japanese teams
    const japaneseTeams = [
      { name: "Kawasaki Frontale", shortName: "KAW", country: "Japan", league: "J1 League" },
      { name: "Yokohama F. Marinos", shortName: "YFM", country: "Japan", league: "J1 League" },
      { name: "Vissel Kobe", shortName: "VKO", country: "Japan", league: "J1 League" },
      { name: "Urawa Red Diamonds", shortName: "URA", country: "Japan", league: "J1 League" },
      { name: "Kashima Antlers", shortName: "KAS", country: "Japan", league: "J1 League" },
      { name: "FC Tokyo", shortName: "FCT", country: "Japan", league: "J1 League" },
      { name: "Cerezo Osaka", shortName: "COS", country: "Japan", league: "J1 League" },
      { name: "Nagoya Grampus", shortName: "NAG", country: "Japan", league: "J1 League" },
      { name: "Gamba Osaka", shortName: "GOS", country: "Japan", league: "J1 League" },
      { name: "Sanfrecce Hiroshima", shortName: "SHI", country: "Japan", league: "J1 League" },
      { name: "Kashiwa Reysol", shortName: "KRE", country: "Japan", league: "J1 League" },
      { name: "Consadole Sapporo", shortName: "CSA", country: "Japan", league: "J1 League" },
      { name: "Sagan Tosu", shortName: "STO", country: "Japan", league: "J1 League" },
      { name: "Shimizu S-Pulse", shortName: "SSP", country: "Japan", league: "J1 League" },
      { name: "Avispa Fukuoka", shortName: "AFU", country: "Japan", league: "J1 League" },
      { name: "Shonan Bellmare", shortName: "SBE", country: "Japan", league: "J1 League" },
      { name: "Jubilo Iwata", shortName: "JIW", country: "Japan", league: "J1 League" },
      { name: "Kyoto Sanga", shortName: "KYO", country: "Japan", league: "J1 League" }
    ];

    // Create South Korean teams
    const koreanTeams = [
      { name: "Jeonbuk Hyundai Motors", shortName: "JEO", country: "South Korea", league: "K League 1" },
      { name: "Ulsan Hyundai", shortName: "ULS", country: "South Korea", league: "K League 1" },
      { name: "Pohang Steelers", shortName: "POH", country: "South Korea", league: "K League 1" },
      { name: "FC Seoul", shortName: "SEO", country: "South Korea", league: "K League 1" },
      { name: "Suwon Samsung Bluewings", shortName: "SSB", country: "South Korea", league: "K League 1" },
      { name: "Daegu FC", shortName: "DAE", country: "South Korea", league: "K League 1" },
      { name: "Jeju United", shortName: "JEJ", country: "South Korea", league: "K League 1" },
      { name: "Incheon United", shortName: "INC", country: "South Korea", league: "K League 1" },
      { name: "Suwon FC", shortName: "SFC", country: "South Korea", league: "K League 1" },
      { name: "Gangwon FC", shortName: "GAN", country: "South Korea", league: "K League 1" },
      { name: "Seongnam FC", shortName: "SEO", country: "South Korea", league: "K League 1" },
      { name: "Gimcheon Sangmu", shortName: "GIM", country: "South Korea", league: "K League 1" }
    ];

    // Create Chinese teams
    const chineseTeams = [
      { name: "Shanghai Port", shortName: "SHP", country: "China", league: "Chinese Super League" },
      { name: "Guangzhou FC", shortName: "GFC", country: "China", league: "Chinese Super League" },
      { name: "Shandong Taishan", shortName: "SDT", country: "China", league: "Chinese Super League" },
      { name: "Beijing Guoan", shortName: "BEI", country: "China", league: "Chinese Super League" },
      { name: "Changchun Yatai", shortName: "CHA", country: "China", league: "Chinese Super League" },
      { name: "Hebei FC", shortName: "HEB", country: "China", league: "Chinese Super League" },
      { name: "Shanghai Shenhua", shortName: "SHS", country: "China", league: "Chinese Super League" },
      { name: "Shenzhen FC", shortName: "SHE", country: "China", league: "Chinese Super League" },
      { name: "Henan Songshan Longmen", shortName: "HEN", country: "China", league: "Chinese Super League" },
      { name: "Cangzhou Mighty Lions", shortName: "CML", country: "China", league: "Chinese Super League" },
      { name: "Guangzhou City", shortName: "GZC", country: "China", league: "Chinese Super League" },
      { name: "Dalian Pro", shortName: "DAL", country: "China", league: "Chinese Super League" },
      { name: "Wuhan FC", shortName: "WUH", country: "China", league: "Chinese Super League" },
      { name: "Chongqing Liangjiang", shortName: "CQL", country: "China", league: "Chinese Super League" },
      { name: "Tianjin Jinmen Tiger", shortName: "TJT", country: "China", league: "Chinese Super League" },
      { name: "Qingdao FC", shortName: "QIN", country: "China", league: "Chinese Super League" }
    ];

    // Create Egyptian teams
    const egyptianTeams = [
      { name: "Al Ahly", shortName: "AHL", country: "Egypt", league: "Egyptian Premier League" },
      { name: "Zamalek", shortName: "ZAM", country: "Egypt", league: "Egyptian Premier League" },
      { name: "Pyramids FC", shortName: "PYR", country: "Egypt", league: "Egyptian Premier League" },
      { name: "Ismaily", shortName: "ISM", country: "Egypt", league: "Egyptian Premier League" },
      { name: "Al Masry", shortName: "MAS", country: "Egypt", league: "Egyptian Premier League" },
      { name: "El Gaish", shortName: "GAI", country: "Egypt", league: "Egyptian Premier League" },
      { name: "ENPPI", shortName: "ENP", country: "Egypt", league: "Egyptian Premier League" },
      { name: "Misr El Makkasa", shortName: "MEM", country: "Egypt", league: "Egyptian Premier League" },
      { name: "Al Ittihad", shortName: "ITT", country: "Egypt", league: "Egyptian Premier League" },
      { name: "Smouha", shortName: "SMO", country: "Egypt", league: "Egyptian Premier League" },
      { name: "El Mokawloon", shortName: "MOK", country: "Egypt", league: "Egyptian Premier League" },
      { name: "Ghazl El Mahalla", shortName: "GEM", country: "Egypt", league: "Egyptian Premier League" },
      { name: "Ceramica Cleopatra", shortName: "CER", country: "Egypt", league: "Egyptian Premier League" },
      { name: "Future FC", shortName: "FUT", country: "Egypt", league: "Egyptian Premier League" },
      { name: "Pharco", shortName: "PHA", country: "Egypt", league: "Egyptian Premier League" },
      { name: "Al Ahly Bank", shortName: "AAB", country: "Egypt", league: "Egyptian Premier League" }
    ];

    // Create South African teams
    const southAfricanTeams = [
      { name: "Mamelodi Sundowns", shortName: "SUN", country: "South Africa", league: "Premier Soccer League" },
      { name: "Kaizer Chiefs", shortName: "KCH", country: "South Africa", league: "Premier Soccer League" },
      { name: "Orlando Pirates", shortName: "OPR", country: "South Africa", league: "Premier Soccer League" },
      { name: "SuperSport United", shortName: "SSU", country: "South Africa", league: "Premier Soccer League" },
      { name: "Cape Town City", shortName: "CTC", country: "South Africa", league: "Premier Soccer League" },
      { name: "Stellenbosch FC", shortName: "STE", country: "South Africa", league: "Premier Soccer League" },
      { name: "Royal AM", shortName: "RAM", country: "South Africa", league: "Premier Soccer League" },
      { name: "Sekhukhune United", shortName: "SEK", country: "South Africa", league: "Premier Soccer League" },
      { name: "AmaZulu", shortName: "AMA", country: "South Africa", league: "Premier Soccer League" },
      { name: "Chippa United", shortName: "CHI", country: "South Africa", league: "Premier Soccer League" },
      { name: "Maritzburg United", shortName: "MAR", country: "South Africa", league: "Premier Soccer League" },
      { name: "TS Galaxy", shortName: "TSG", country: "South Africa", league: "Premier Soccer League" },
      { name: "Swallows FC", shortName: "SWA", country: "South Africa", league: "Premier Soccer League" },
      { name: "Marumo Gallants", shortName: "MAG", country: "South Africa", league: "Premier Soccer League" },
      { name: "Richards Bay", shortName: "RIB", country: "South Africa", league: "Premier Soccer League" },
      { name: "Golden Arrows", shortName: "GOA", country: "South Africa", league: "Premier Soccer League" }
    ];

    // Create Moroccan teams
    const moroccanTeams = [
      { name: "Wydad Casablanca", shortName: "WAC", country: "Morocco", league: "Botola Pro" },
      { name: "Raja Casablanca", shortName: "RCA", country: "Morocco", league: "Botola Pro" },
      { name: "RS Berkane", shortName: "RSB", country: "Morocco", league: "Botola Pro" },
      { name: "FAR Rabat", shortName: "FAR", country: "Morocco", league: "Botola Pro" },
      { name: "Moghreb Tétouan", shortName: "MAT", country: "Morocco", league: "Botola Pro" },
      { name: "FUS Rabat", shortName: "FUS", country: "Morocco", league: "Botola Pro" },
      { name: "Difaâ El Jadida", shortName: "DHJ", country: "Morocco", league: "Botola Pro" },
      { name: "Mouloudia Oujda", shortName: "MCO", country: "Morocco", league: "Botola Pro" },
      { name: "Olympic Safi", shortName: "OCS", country: "Morocco", league: "Botola Pro" },
      { name: "Hassania Agadir", shortName: "HUSA", country: "Morocco", league: "Botola Pro" },
      { name: "Ittihad Tanger", shortName: "IRT", country: "Morocco", league: "Botola Pro" },
      { name: "Youssoufia Berrechid", shortName: "CAYB", country: "Morocco", league: "Botola Pro" },
      { name: "Renaissance Zemamra", shortName: "RCAZ", country: "Morocco", league: "Botola Pro" },
      { name: "Rapide Oued Zem", shortName: "RCOZ", country: "Morocco", league: "Botola Pro" },
      { name: "Maghreb Fez", shortName: "MAS", country: "Morocco", league: "Botola Pro" },
      { name: "Moghreb Athletic Tétouan", shortName: "MAT", country: "Morocco", league: "Botola Pro" }
    ];

    // Create Nordic teams
    const nordicTeams = [
      // Finland
      { name: "HJK Helsinki", shortName: "HJK", country: "Finland", league: "Veikkausliiga" },
      { name: "KuPS", shortName: "KuPS", country: "Finland", league: "Veikkausliiga" },
      { name: "FC Inter Turku", shortName: "INT", country: "Finland", league: "Veikkausliiga" },
      { name: "IFK Mariehamn", shortName: "IFK", country: "Finland", league: "Veikkausliiga" },

      // Sweden
      { name: "Malmö FF", shortName: "MFF", country: "Sweden", league: "Allsvenskan" },
      { name: "AIK", shortName: "AIK", country: "Sweden", league: "Allsvenskan" },
      { name: "Djurgårdens IF", shortName: "DIF", country: "Sweden", league: "Allsvenskan" },
      { name: "Hammarby IF", shortName: "HIF", country: "Sweden", league: "Allsvenskan" },

      // Denmark
      { name: "FC Copenhagen", shortName: "FCK", country: "Denmark", league: "Superliga" },
      { name: "FC Midtjylland", shortName: "FCM", country: "Denmark", league: "Superliga" },
      { name: "Brøndby IF", shortName: "BIF", country: "Denmark", league: "Superliga" },
      { name: "AGF", shortName: "AGF", country: "Denmark", league: "Superliga" },

      // Iceland
      { name: "KR Reykjavik", shortName: "KR", country: "Iceland", league: "Úrvalsdeild" },
      { name: "Valur", shortName: "VAL", country: "Iceland", league: "Úrvalsdeild" },
      { name: "FH Hafnarfjörður", shortName: "FH", country: "Iceland", league: "Úrvalsdeild" }
    ];

    // Create Eastern European teams
    const easternEuropeanTeams = [
      // Czech Republic
      { name: "Slavia Prague", shortName: "SLA", country: "Czech Republic", league: "Fortuna Liga" },
      { name: "Sparta Prague", shortName: "SPA", country: "Czech Republic", league: "Fortuna Liga" },
      { name: "Viktoria Plzen", shortName: "PLZ", country: "Czech Republic", league: "Fortuna Liga" },

      // Slovakia
      { name: "Slovan Bratislava", shortName: "SLO", country: "Slovakia", league: "Fortuna Liga" },
      { name: "Spartak Trnava", shortName: "TRN", country: "Slovakia", league: "Fortuna Liga" },

      // Poland
      { name: "Legia Warsaw", shortName: "LEG", country: "Poland", league: "Ekstraklasa" },
      { name: "Lech Poznan", shortName: "LEC", country: "Poland", league: "Ekstraklasa" },
      { name: "Wisła Kraków", shortName: "WIS", country: "Poland", league: "Ekstraklasa" },

      // Hungary
      { name: "Ferencváros", shortName: "FTC", country: "Hungary", league: "OTP Bank Liga" },
      { name: "MOL Fehérvár", shortName: "MOL", country: "Hungary", league: "OTP Bank Liga" },

      // Bulgaria
      { name: "Ludogorets", shortName: "LUD", country: "Bulgaria", league: "First League" },
      { name: "CSKA Sofia", shortName: "CSK", country: "Bulgaria", league: "First League" },
      { name: "Levski Sofia", shortName: "LEV", country: "Bulgaria", league: "First League" }
    ];

    // Create all teams
    const allTeams = [
      ...romanianTeams, 
      ...portugueseTeams, 
      ...spanishTeams, 
      ...englishTeams, 
      ...italianTeams, 
      ...germanTeams, 
      ...frenchTeams, 
      ...austrianTeams,
      ...dutchTeams,
      ...belgianTeams,
      ...brazilianTeams,
      ...argentinianTeams,
      ...colombianTeams,
      ...usTeams,
      ...mexicanTeams,
      ...japaneseTeams,
      ...koreanTeams,
      ...chineseTeams,
      ...egyptianTeams,
      ...southAfricanTeams,
      ...moroccanTeams,
      ...europeanTeams,
      ...nordicTeams,
      ...easternEuropeanTeams,
      ...allEsportsTeams
    ];
    for (const team of allTeams) {
      await this.createTeam({
        name: team.name,
        shortName: team.shortName,
        country: team.country,
        logo: null,
        league: (team as any).league || null // Use a propriedade league para times eSports
      });
    }

    // Get created teams by name for reference
    const getTeamByName = async (name: string): Promise<Team | undefined> => {
      const teams = await this.getTeams();
      return teams.find(team => team.name === name);
    };

    // Get leagues by country and name for reference
    const getLeagueByCountryAndName = async (country: string, name: string): Promise<League | undefined> => {
      const leagues = await this.getLeaguesByCountry(country);
      return leagues.find(league => league.name === name);
    };

    // Create matches
    const now = new Date();

    // Romanian Liga 1 matches
    const romaniaLiga1 = await getLeagueByCountryAndName("Romania", "Liga 1");
    if (romaniaLiga1) {
      const fcsb = await getTeamByName("FCSB");
      const cfrCluj = await getTeamByName("CFR Cluj");
      const uCraiova = await getTeamByName("Universitatea Craiova");
      const rapid = await getTeamByName("Rapid București");
      const urziceni = await getTeamByName("FC Urziceni");
      const dinamo = await getTeamByName("Dinamo București");

      if (fcsb && cfrCluj) {
        // Finished match
        const match1 = await this.createMatch({
          homeTeamId: fcsb.id,
          awayTeamId: cfrCluj.id,
          leagueId: romaniaLiga1.id,
          startTime: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Yesterday
          homeScore: 2,
          awayScore: 1,
          status: "FINISHED",
          isCustom: false
        });

        // Create markets for match1
        await this.createMarket({ matchId: match1.id, type: "1", odds: 1.85 });
        await this.createMarket({ matchId: match1.id, type: "X", odds: 3.40 });
        await this.createMarket({ matchId: match1.id, type: "2", odds: 4.20 });
      }

      if (uCraiova && rapid) {
        // Upcoming match
        const match2 = await this.createMatch({
          homeTeamId: uCraiova.id,
          awayTeamId: rapid.id,
          leagueId: romaniaLiga1.id,
          startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
          status: "UPCOMING",
          isCustom: false
        });

        // Create markets for match2
        await this.createMarket({ matchId: match2.id, type: "1", odds: 2.10 });
        await this.createMarket({ matchId: match2.id, type: "X", odds: 3.25 });
        await this.createMarket({ matchId: match2.id, type: "2", odds: 3.50 });
      }

      if (urziceni && dinamo) {
        // Custom upcoming match
        const match3 = await this.createMatch({
          homeTeamId: urziceni.id,
          awayTeamId: dinamo.id,
          leagueId: romaniaLiga1.id,
          startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
          status: "UPCOMING",
          isCustom: true
        });

        // Create markets for match3
        await this.createMarket({ matchId: match3.id, type: "1", odds: 2.25 });
        await this.createMarket({ matchId: match3.id, type: "X", odds: 3.10 });
        await this.createMarket({ matchId: match3.id, type: "2", odds: 3.25 });
      }
    }

    // Portuguese Primera Liga matches
    const primeiraLiga = await getLeagueByCountryAndName("Portugal", "Primeira Liga");
    if (primeiraLiga) {
      const sporting = await getTeamByName("Sporting CP");
      const benfica = await getTeamByName("SL Benfica");
      const braga = await getTeamByName("SC Braga");

      if (sporting && benfica) {
        // Upcoming match
        const match4 = await this.createMatch({
          homeTeamId: sporting.id,
          awayTeamId: benfica.id,
          leagueId: primeiraLiga.id,
          startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
          status: "UPCOMING",
          isCustom: false
        });

        // Create markets for match4
        await this.createMarket({ matchId: match4.id, type: "1", odds: 2.40 });
        await this.createMarket({ matchId: match4.id, type: "X", odds: 3.20 });
        await this.createMarket({ matchId: match4.id, type: "2", odds: 2.90 });
      }

      if (sporting && braga) {
        // Custom upcoming match
        const match5 = await this.createMatch({
          homeTeamId: sporting.id,
          awayTeamId: braga.id,
          leagueId: primeiraLiga.id,
          startTime: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Yesterday
          status: "UPCOMING",
          isCustom: true
        });

        // Create markets for match5
        await this.createMarket({ matchId: match5.id, type: "1", odds: 1.95 });
        await this.createMarket({ matchId: match5.id, type: "X", odds: 3.40 });
        await this.createMarket({ matchId: match5.id, type: "2", odds: 3.80 });
      }
    }

    // eSports matches
    // Call of Duty League
    const codLeague = await getLeagueByCountryAndName("Global", "Call of Duty League");
    if (codLeague) {
      const atlantaFaze = await getTeamByName("Atlanta FaZe");
      const bostonBreach = await getTeamByName("Boston Breach");
      const opticTexas = await getTeamByName("OpTic Texas");
      const seattleSurge = await getTeamByName("Seattle Surge");

      if (atlantaFaze && bostonBreach) {
        // Upcoming eSports match
        const codMatch1 = await this.createMatch({
          homeTeamId: atlantaFaze.id,
          awayTeamId: bostonBreach.id,
          leagueId: codLeague.id,
          startTime: new Date(now.getTime() + 12 * 60 * 60 * 1000), // 12 hours from now
          status: "UPCOMING",
          isCustom: false
        });

        // Create markets for COD match (only 1 and 2, no draw in eSports)
        await this.createMarket({ matchId: codMatch1.id, type: "1", odds: 1.65 });
        await this.createMarket({ matchId: codMatch1.id, type: "2", odds: 2.35 });
      }

      if (opticTexas && seattleSurge) {
        // Live eSports match
        const codMatch2 = await this.createMatch({
          homeTeamId: opticTexas.id,
          awayTeamId: seattleSurge.id,
          leagueId: codLeague.id,
          startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
          homeScore: 2,
          awayScore: 1,
          status: "LIVE",
          isCustom: false
        });

        // Create markets for COD match (only 1 and 2, no draw in eSports)
        await this.createMarket({ matchId: codMatch2.id, type: "1", odds: 1.25 });
        await this.createMarket({ matchId: codMatch2.id, type: "2", odds: 3.85 });
      }
    }

    // Halo Championship Series
    const haloLeague = await getLeagueByCountryAndName("Global", "Halo Championship Series");
    if (haloLeague) {
      const cloud9 = await getTeamByName("Cloud9");
      const sentinels = await getTeamByName("Sentinels");
      const fazeHalo = await getTeamByName("FaZe Clan");
      const opticHalo = await getTeamByName("OpTic Gaming");

      if (cloud9 && sentinels) {
        // Upcoming Halo match
        const haloMatch1 = await this.createMatch({
          homeTeamId: cloud9.id,
          awayTeamId: sentinels.id,
          leagueId: haloLeague.id,
          startTime: new Date(now.getTime() + 36 * 60 * 60 * 1000), // 36 hours from now
          status: "UPCOMING",
          isCustom: false
        });

        // Create markets for Halo match (only 1 and 2, no draw in eSports)
        await this.createMarket({ matchId: haloMatch1.id, type: "1", odds: 1.90 });
        await this.createMarket({ matchId: haloMatch1.id, type: "2", odds: 1.90 });
      }

      if (fazeHalo && opticHalo) {
        // Completed Halo match
        const haloMatch2 = await this.createMatch({
          homeTeamId: fazeHalo.id,
          awayTeamId: opticHalo.id,
          leagueId: haloLeague.id,
          startTime: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Yesterday
          homeScore: 1,
          awayScore: 3,
          status: "FINISHED",
          isCustom: false
        });

        // Create markets for finished Halo match
        await this.createMarket({ matchId: haloMatch2.id, type: "1", odds: 2.10, isLocked: true });
        await this.createMarket({ matchId: haloMatch2.id, type: "X", odds: 3.40, isLocked: true });
        await this.createMarket({ matchId: haloMatch2.id, type: "2", odds: 2.75, isLocked: true });
      }
    }
  }
}

export const storage = new MemStorage();
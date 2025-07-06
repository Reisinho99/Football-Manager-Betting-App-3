import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { calculateRelatedOdds } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, Edit3, Plus, X } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CreateLeagueDialog from "@/components/leagues/create-league-dialog";

// Create a schema for the form
const formSchema = z.object({
  leagueId: z.string().min(1, "League is required"),
  homeTeamId: z.string().optional(),
  awayTeamId: z.string().optional(),
  homeTeamName: z.string().optional(),
  awayTeamName: z.string().optional(),
  homeLogo: z.string().optional(),
  awayLogo: z.string().optional(),
  startTime: z.string().min(1, "Start time is required"),
  homeOdds: z.number().min(1.01, "Odds must be greater than 1"),
  drawOdds: z.number().min(1.01, "Odds must be greater than 1"),
  awayOdds: z.number().min(1.01, "Odds must be greater than 1")
}).refine(
  (data) => data.homeTeamId || data.homeTeamName,
  { message: "Home team is required", path: ["homeTeamId"] }
).refine(
  (data) => data.awayTeamId || data.awayTeamName,
  { message: "Away team is required", path: ["awayTeamId"] }
);

interface Continent {
  name: string;
  countries: {
    name: string;
    leagues: {
      id: number;
      name: string;
    }[];
  }[];
}

interface League {
  id: number;
  name: string;
  country: string;
  isActive: boolean;
}

interface Team {
  id: number;
  name: string;
  shortName: string;
  country: string;
  logo: string | null;
  league: string | null;
}

type FormValues = z.infer<typeof formSchema>;

export default function CreateMatch() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
  const [homeTeamMode, setHomeTeamMode] = useState<'predefined' | 'manual'>('predefined');
  const [awayTeamMode, setAwayTeamMode] = useState<'predefined' | 'manual'>('predefined');
  const [customMarkets, setCustomMarkets] = useState<{type: string, odds: number}[]>([]);
  const [generateRelatedMarkets, setGenerateRelatedMarkets] = useState(true);

  // Fetch continents, leagues and teams
  const { data: continents = [] } = useQuery<Continent[]>({
    queryKey: ['/api/countries'],
  });

  const { data: leagues = [] } = useQuery<League[]>({
    queryKey: ['/api/leagues'],
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
  });

  // Setup form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      leagueId: "",
      homeTeamId: "",
      awayTeamId: "",
      homeTeamName: "",
      awayTeamName: "",
      homeLogo: "",
      awayLogo: "",
      startTime: new Date().toISOString().slice(0, 16), // Current date/time as default
      homeOdds: 2.00,
      drawOdds: 3.00,
      awayOdds: 4.00,
    },
  });

  // Watch the leagueId field to update the filtered teams
  const leagueId = form.watch('leagueId');

  useEffect(() => {
    if (leagueId) {
      const league = leagues.find(l => l.id === parseInt(leagueId));
      if (league) {
        setSelectedCountry(league.country);
        setSelectedLeague(league.id);

        // Update filtered teams based on league and country
        let teamsToShow = [];

        // Special handling for eSports leagues - filter by league name
        if (league.country === "Global") {
          teamsToShow = teams.filter(team => team.league === league.name);
        } else {
          // For traditional football leagues - filter by country
          teamsToShow = teams.filter(team => team.country === league.country);
        }

        setFilteredTeams(teamsToShow);

        // Reset team selections when league changes
        form.setValue('homeTeamId', '');
        form.setValue('awayTeamId', '');
        form.setValue('homeTeamName', '');
        form.setValue('awayTeamName', '');
      }
    }
  }, [leagueId, leagues, teams, form]);

  // State to track if the current selection is an eSports league
  const [isEsportsLeague, setIsEsportsLeague] = useState(false);

  // Functions to handle mode changes
  const handleHomeTeamModeChange = () => {
    const newMode = homeTeamMode === 'predefined' ? 'manual' : 'predefined';
    setHomeTeamMode(newMode);

    // Clear both fields when switching modes
    form.setValue('homeTeamId', '');
    form.setValue('homeTeamName', '');
  };

  const handleAwayTeamModeChange = () => {
    const newMode = awayTeamMode === 'predefined' ? 'manual' : 'predefined';
    setAwayTeamMode(newMode);

    // Clear both fields when switching modes  
    form.setValue('awayTeamId', '');
    form.setValue('awayTeamName', '');
  };

  const addCustomMarket = () => {
    setCustomMarkets([...customMarkets, { type: '', odds: 2.00 }]);
  };

  const removeCustomMarket = (index: number) => {
    setCustomMarkets(customMarkets.filter((_, i) => i !== index));
  };

  const updateCustomMarket = (index: number, field: 'type' | 'odds', value: string | number) => {
    const updated = [...customMarkets];
    updated[index] = { ...updated[index], [field]: value };
    setCustomMarkets(updated);
  };

  // Update isEsportsLeague when league changes
  useEffect(() => {
    if (leagueId) {
      const league = leagues.find(l => l.id === parseInt(leagueId));
      if (league) {
        const isEsports = league.country === "Global";
        setIsEsportsLeague(isEsports);

        // If changing to eSports league, set a higher default for home/away odds
        if (isEsports) {
          form.setValue('homeOdds', 1.90);
          form.setValue('awayOdds', 1.90);
        }
      }
    }
  }, [leagueId, leagues, form]);

  // Create match mutation
  const createMatchMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Parse the startTime to ensure it's a valid date
      let startTimeDate: Date;
      try {
        startTimeDate = new Date(values.startTime);
        if (isNaN(startTimeDate.getTime())) {
          throw new Error("Invalid date");
        }
      } catch (error) {
        throw new Error("Invalid start time format");
      }

      let markets = isEsportsLeague 
        ? [
            { type: "1", odds: values.homeOdds },
            { type: "2", odds: values.awayOdds }
          ]
        : [
            { type: "1", odds: values.homeOdds },
            { type: "X", odds: values.drawOdds },
            { type: "2", odds: values.awayOdds }
          ];

      // Add related markets if enabled and not eSports
      if (generateRelatedMarkets && !isEsportsLeague) {
        const relatedOdds = {
          OVER_1_5: 1.25,
          UNDER_1_5: 3.75,
          OVER_2_5: 1.85,
          UNDER_2_5: 1.95,
          OVER_3_5: 2.85,
          UNDER_3_5: 1.40,
          BTTS_YES: 1.70,
          BTTS_NO: 2.10,
          DNB_1: values.homeOdds > 1.50 ? values.homeOdds - 0.20 : 1.30,
          DNB_2: values.awayOdds > 1.50 ? values.awayOdds - 0.20 : 1.30,
          DC_1X: 1.25,
          DC_12: 1.35,
          DC_X2: 1.30,
          HT_1: values.homeOdds + 0.50,
          HT_X: 2.20,
          HT_2: values.awayOdds + 0.50,
          HT_OVER_0_5: 1.60,
          HT_UNDER_0_5: 2.30,
          HT_OVER_1_5: 3.20,
          HT_UNDER_1_5: 1.30,
          HT_BTTS_YES: 2.40,
          HT_BTTS_NO: 1.55,
          HANDICAP_1_MINUS_1: values.homeOdds + 0.80,
          HANDICAP_1_MINUS_2: values.homeOdds + 1.50,
          HANDICAP_2_MINUS_1: values.awayOdds + 0.80,
          HANDICAP_2_MINUS_2: values.awayOdds + 1.50,
          WIN_BOTH_HALVES_1: values.homeOdds + 2.50,
          WIN_BOTH_HALVES_2: values.awayOdds + 2.50,
          WIN_EITHER_HALF_1: values.homeOdds - 0.30,
          WIN_EITHER_HALF_2: values.awayOdds - 0.30
        };

        markets = [
          ...markets,
          // Total Goals
          { type: "OVER_1_5", odds: relatedOdds.OVER_1_5 },
          { type: "UNDER_1_5", odds: relatedOdds.UNDER_1_5 },
          { type: "OVER_2_5", odds: relatedOdds.OVER_2_5 },
          { type: "UNDER_2_5", odds: relatedOdds.UNDER_2_5 },
          { type: "OVER_3_5", odds: relatedOdds.OVER_3_5 },
          { type: "UNDER_3_5", odds: relatedOdds.UNDER_3_5 },
          // Both Teams to Score
          { type: "BTTS_YES", odds: relatedOdds.BTTS_YES },
          { type: "BTTS_NO", odds: relatedOdds.BTTS_NO },
          // Draw No Bet
          { type: "DNB_1", odds: relatedOdds.DNB_1 },
          { type: "DNB_2", odds: relatedOdds.DNB_2 },
          // Double Chance
          { type: "DC_1X", odds: relatedOdds.DC_1X },
          { type: "DC_12", odds: relatedOdds.DC_12 },
          { type: "DC_X2", odds: relatedOdds.DC_X2 },
          // Half Time Result
          { type: "HT_1", odds: relatedOdds.HT_1 },
          { type: "HT_X", odds: relatedOdds.HT_X },
          { type: "HT_2", odds: relatedOdds.HT_2 },
          // Half Time Goals
          { type: "HT_OVER_0_5", odds: relatedOdds.HT_OVER_0_5 },
          { type: "HT_UNDER_0_5", odds: relatedOdds.HT_UNDER_0_5 },
          { type: "HT_OVER_1_5", odds: relatedOdds.HT_OVER_1_5 },
          { type: "HT_UNDER_1_5", odds: relatedOdds.HT_UNDER_1_5 },
          // Half Time Both Teams Score
          { type: "HT_BTTS_YES", odds: relatedOdds.HT_BTTS_YES },
          { type: "HT_BTTS_NO", odds: relatedOdds.HT_BTTS_NO },
          // Handicaps
          { type: "HANDICAP_1_MINUS_1", odds: relatedOdds.HANDICAP_1_MINUS_1 },
          { type: "HANDICAP_1_MINUS_2", odds: relatedOdds.HANDICAP_1_MINUS_2 },
          { type: "HANDICAP_2_MINUS_1", odds: relatedOdds.HANDICAP_2_MINUS_1 },
          { type: "HANDICAP_2_MINUS_2", odds: relatedOdds.HANDICAP_2_MINUS_2 },
          // Win Both Halves
          { type: "WIN_BOTH_HALVES_1", odds: relatedOdds.WIN_BOTH_HALVES_1 },
          { type: "WIN_BOTH_HALVES_2", odds: relatedOdds.WIN_BOTH_HALVES_2 },
          // Win Either Half
          { type: "WIN_EITHER_HALF_1", odds: relatedOdds.WIN_EITHER_HALF_1 },
          { type: "WIN_EITHER_HALF_2", odds: relatedOdds.WIN_EITHER_HALF_2 }
        ];
      }

      // Add custom markets
      const validCustomMarkets = customMarkets.filter(m => m.type.trim() !== '' && m.odds > 1);
      markets = [...markets, ...validCustomMarkets];

      // Determine if we're using predefined teams or custom names
      const homeTeamId = values.homeTeamId ? parseInt(values.homeTeamId) : undefined;
      const awayTeamId = values.awayTeamId ? parseInt(values.awayTeamId) : undefined;

      const matchData = {
        leagueId: parseInt(values.leagueId),
        homeTeamId,
        awayTeamId,
        homeTeamName: values.homeTeamName,
        awayTeamName: values.awayTeamName,
        startTime: startTimeDate,
        status: "UPCOMING",
        isCustom: true,
        markets,
        homeLogo: values.homeLogo,
        awayLogo: values.awayLogo
      };

      // Validation: same team IDs if using predefined teams
      if (homeTeamId && awayTeamId && homeTeamId === awayTeamId) {
        throw new Error("Home team and away team cannot be the same");
      }

      // Validation: same custom names
      if (values.homeTeamName && values.awayTeamName && 
          values.homeTeamName.trim().toLowerCase() === values.awayTeamName.trim().toLowerCase()) {
        throw new Error("Home team and away team cannot have the same name");
      }

      return apiRequest("POST", "/api/matches", matchData);
    },
    onSuccess: () => {
      toast({
        title: "Match created",
        description: "Your custom match has been created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating match",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (values: FormValues) => {
    createMatchMutation.mutate(values);
  };

  // Organize leagues by continent and country for better selection
  const organizedLeagues = continents.map(continent => ({
    continent: continent.name,
    countries: continent.countries.map(country => ({
      name: country.name,
      leagues: country.leagues.map(league => {
        const fullLeague = leagues.find(l => l.id === league.id);
        return {
          id: league.id,
          name: league.name,
          isActive: fullLeague?.isActive || false
        };
      }).filter(league => league.isActive)
    }))
  }));

  return (
    <div className="max-w-2xl mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Custom Match</CardTitle>
          <CardDescription>Create your own match with custom odds</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="leagueId"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>League</FormLabel>
                        <CreateLeagueDialog />
                      </div>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a league" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {organizedLeagues.map(group => (
                            <SelectGroup key={group.continent}>
                              <SelectLabel>{group.continent}</SelectLabel>
                              {group.countries.map(country => (
                                <div key={country.name}>
                                  {country.leagues.length > 0 && (
                                    <>
                                      <div className="px-2 pt-1 text-xs text-muted-foreground">
                                        {country.name}
                                      </div>
                                      {country.leagues.map(league => (
                                        <SelectItem key={league.id} value={league.id.toString()}>
                                          {league.name}
                                        </SelectItem>
                                      ))}
                                    </>
                                  )}
                                </div>
                              ))}
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  {/* Home Team Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FormLabel>Home Team</FormLabel>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleHomeTeamModeChange}
                        className="p-1 h-6 w-6"
                      >
                        {homeTeamMode === 'predefined' ? <ChevronDown className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {homeTeamMode === 'predefined' ? 'Predefined' : 'Manual'}
                      </span>
                    </div>

                    {homeTeamMode === 'predefined' ? (
                      <FormField
                        control={form.control}
                        name="homeTeamId"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={!selectedCountry}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={selectedCountry ? "Select home team" : "Select a league first"} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {filteredTeams.map(team => (
                                  <SelectItem key={team.id} value={team.id.toString()}>
                                    {team.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <FormField
                        control={form.control}
                        name="homeTeamName"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                placeholder="Enter home team name" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Away Team Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FormLabel>Away Team</FormLabel>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleAwayTeamModeChange}
                        className="p-1 h-6 w-6"
                      >
                        {awayTeamMode === 'predefined' ? <ChevronDown className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {awayTeamMode === 'predefined' ? 'Predefined' : 'Manual'}
                      </span>
                    </div>

                    {awayTeamMode === 'predefined' ? (
                      <FormField
                        control={form.control}
                        name="awayTeamId"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={!selectedCountry}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={selectedCountry ? "Select away team" : "Select a league first"} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {filteredTeams.map(team => (
                                  <SelectItem key={team.id} value={team.id.toString()}>
                                    {team.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <FormField
                        control={form.control}
                        name="awayTeamName"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                placeholder="Enter away team name" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  <FormField
                    control={form.control}
                    name="homeLogo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Home Team Logo URL (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/logo.png" {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Use direct image URLs ending in .jpg, .png, .gif, .webp or .svg. For best results, use URLs from image hosting services.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="awayLogo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Away Team Logo URL (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/logo.png" {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Use direct image URLs ending in .jpg, .png, .gif, .webp or .svg. For best results, use URLs from image hosting services.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">
                    {isEsportsLeague ? "Market Odds (Win/Lose)" : "Market Odds (1X2)"}
                  </h3>
                  <div className={`grid ${isEsportsLeague ? 'grid-cols-2' : 'grid-cols-3'} gap-4`}>
                    <FormField
                      control={form.control}
                      name="homeOdds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{isEsportsLeague ? "Team 1 Win" : "Home"}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              min="1.01" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {!isEsportsLeague && (
                      <FormField
                        control={form.control}
                        name="drawOdds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Draw</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                min="1.01" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="awayOdds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{isEsportsLeague ? "Team 2 Win" : "Away"}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              min="1.01" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {!isEsportsLeague && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="generateRelatedMarkets"
                      checked={generateRelatedMarkets}
                      onChange={(e) => setGenerateRelatedMarkets(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="generateRelatedMarkets" className="text-sm">
                      Gerar mercados relacionados automaticamente
                    </label>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Mercados Personalizados</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addCustomMarket}
                        className="flex items-center gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar Mercado
                      </Button>
                    </div>

                    {customMarkets.map((market, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          placeholder="Nome do mercado (ex: Primeiro a marcar)"
                          value={market.type}
                          onChange={(e) => updateCustomMarket(index, 'type', e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          min="1.01"
                          placeholder="Odd"
                          value={market.odds}
                          onChange={(e) => updateCustomMarket(index, 'odds', parseFloat(e.target.value) || 1.01)}
                          className="w-24"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCustomMarket(index)}
                          className="p-1"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="mr-2"
                  onClick={() => navigate("/")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMatchMutation.isPending}
                >
                  {createMatchMutation.isPending ? "Creating..." : "Create Match"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
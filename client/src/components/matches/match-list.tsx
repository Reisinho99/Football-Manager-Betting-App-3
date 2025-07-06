import { useQuery } from "@tanstack/react-query";
import MatchCard from "./match-card";
import { MatchWithTeamsAndMarkets } from "@shared/schema";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export default function MatchList() {
  const [activeTab, setActiveTab] = useState("ALL");
  const [categoryTab, setCategoryTab] = useState("ALL");
  const [matchStatusFilter, setMatchStatusFilter] = useState("all");
  
  const { data: matches = [], isLoading, refetch } = useQuery<MatchWithTeamsAndMarkets[]>({
    queryKey: ['/api/matches'],
  });
  
  // Separate matches by category (Football or eSports)
  const footballMatches = matches.filter(match => 
    match.league.country !== "Global"
  );
  
  const esportsMatches = matches.filter(match => 
    match.league.country === "Global"
  );
  
  // Determine which matches to display based on category selection
  let matchesToFilter = matches;
  if (categoryTab === "FOOTBALL") {
    matchesToFilter = footballMatches;
  } else if (categoryTab === "ESPORTS") {
    matchesToFilter = esportsMatches;
  }
  
  // Further filter matches based on status
  const filteredMatches = matchesToFilter.filter(match => {
    // Filter by status
    if (matchStatusFilter !== "all") {
      if (matchStatusFilter === "live" && match.status !== "LIVE") return false;
      if (matchStatusFilter === "upcoming" && match.status !== "UPCOMING") return false;
      if (matchStatusFilter === "finished" && match.status !== "FINISHED") return false;
    }
    
    return true;
  });
  
  // Group eSports matches by league name
  const esportsMatchesByLeague = esportsMatches.reduce((acc, match) => {
    const leagueName = match.league.name;
    if (!acc[leagueName]) {
      acc[leagueName] = [];
    }
    acc[leagueName].push(match);
    return acc;
  }, {} as Record<string, MatchWithTeamsAndMarkets[]>);
  
  // Group football matches by country
  const footballMatchesByCountry = footballMatches.reduce((acc, match) => {
    const country = match.league.country;
    if (!acc[country]) {
      acc[country] = [];
    }
    acc[country].push(match);
    return acc;
  }, {} as Record<string, MatchWithTeamsAndMarkets[]>);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Featured Matches</h2>
        <div className="relative">
          <Select onValueChange={setMatchStatusFilter} defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Matches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Matches</SelectItem>
              <SelectItem value="live">Live Matches</SelectItem>
              <SelectItem value="upcoming">Upcoming Matches</SelectItem>
              <SelectItem value="finished">Finished Matches</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sport Category Tabs */}
      <Tabs defaultValue="ALL" onValueChange={setCategoryTab} className="w-full">
        <TabsList className="border-b mb-4 w-full justify-start space-x-1 rounded-none bg-transparent p-0">
          <TabsTrigger 
            value="ALL" 
            className="rounded-t-md data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            All Sports
          </TabsTrigger>
          <TabsTrigger 
            value="FOOTBALL" 
            className="rounded-t-md data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            Football
          </TabsTrigger>
          <TabsTrigger 
            value="ESPORTS" 
            className="rounded-t-md data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            eSports
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Market Type Tabs */}
      <Tabs defaultValue="ALL" onValueChange={setActiveTab} className="w-full">
        <TabsList className="border-b mb-4 w-full justify-start space-x-1 rounded-none bg-transparent p-0">
          <TabsTrigger 
            value="ALL" 
            className="rounded-t-md data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            All Markets
          </TabsTrigger>
          <TabsTrigger 
            value="1X2" 
            className="rounded-t-md data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            1X2
          </TabsTrigger>
          <TabsTrigger 
            value="OU" 
            className="rounded-t-md data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            O/U
          </TabsTrigger>
          <TabsTrigger 
            value="DNB" 
            className="rounded-t-md data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            DNB
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-48"></div>
          ))}
        </div>
      ) : filteredMatches.length > 0 ? (
        <>
          {/* Show matches by category when in category view */}
          {categoryTab === "ESPORTS" && (
            <div className="space-y-8">
              {Object.entries(esportsMatchesByLeague).map(([leagueName, matches]) => (
                <div key={leagueName} className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-primary">{leagueName}</h3>
                    <Separator className="mt-2" />
                  </div>
                  <div className="space-y-4">
                    {matches.map(match => (
                      <MatchCard key={match.id} match={match} onRefresh={refetch} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {categoryTab === "FOOTBALL" && (
            <div className="space-y-8">
              {Object.entries(footballMatchesByCountry).map(([country, matches]) => (
                <div key={country} className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-primary">{country}</h3>
                    <Separator className="mt-2" />
                  </div>
                  <div className="space-y-4">
                    {matches.map(match => (
                      <MatchCard key={match.id} match={match} onRefresh={refetch} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Default view - all matches */}
          {categoryTab === "ALL" && (
            <div className="space-y-4">
              {filteredMatches.map(match => (
                <MatchCard key={match.id} match={match} onRefresh={refetch} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 15h8" />
            <path d="M9 9h.01" />
            <path d="M15 9h.01" />
          </svg>
          <p className="text-gray-500 font-medium">No matches found</p>
          <p className="text-sm text-gray-400 mt-1">Try changing your filters or check back later</p>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface League {
  id: number;
  name: string;
}

interface Country {
  name: string;
  leagues: League[];
}

interface Continent {
  name: string;
  countries: Country[];
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const [location] = useLocation();
  const [expandedContinents, setExpandedContinents] = useState<Record<string, boolean>>({
    "Europe": true
  });
  
  const [expandedCountries, setExpandedCountries] = useState<Record<string, boolean>>({
    "Romania": true,
    "Portugal": true
  });
  
  const { data: continents = [] } = useQuery<Continent[]>({
    queryKey: ['/api/countries'],
  });
  
  const toggleContinent = (continent: string) => {
    setExpandedContinents(prev => ({
      ...prev,
      [continent]: !prev[continent]
    }));
  };
  
  const toggleCountry = (country: string) => {
    setExpandedCountries(prev => ({
      ...prev,
      [country]: !prev[country]
    }));
  };
  
  const getFlagUrl = (country: string) => {
    const countryCode = getCountryCode(country);
    return `https://flagcdn.com/20x15/${countryCode}.png`;
  };
  
  const getCountryCode = (country: string): string => {
    switch (country) {
      case "Romania": return "ro";
      case "Portugal": return "pt";
      case "Spain": return "es";
      case "England": return "gb-eng";
      case "Italy": return "it";
      case "Germany": return "de";
      case "France": return "fr";
      case "Austria": return "at";
      case "Netherlands": return "nl";
      case "Belgium": return "be";
      case "Brazil": return "br";
      case "Argentina": return "ar";
      case "Colombia": return "co";
      case "United States": return "us";
      case "Mexico": return "mx";
      case "Japan": return "jp";
      case "South Korea": return "kr";
      case "China": return "cn";
      case "Egypt": return "eg";
      case "South Africa": return "za";
      case "Morocco": return "ma";
      default: return "xx";
    }
  };
  
  const getContinentIcon = (continent: string) => {
    switch (continent) {
      case "Europe":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a10 10 0 0 1 10 10c0 5.5-4.5 10-10 10S2 17.5 2 12 6.5 2 12 2zM2 12h20" />
            <path d="M12 2v20" />
          </svg>
        );
      case "South America":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a10 10 0 0 1 10 10c0 5.5-4.5 10-10 10S2 17.5 2 12 6.5 2 12 2z" />
          </svg>
        );
      case "North America":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a10 10 0 0 1 10 10c0 5.5-4.5 10-10 10S2 17.5 2 12 6.5 2 12 2z" />
          </svg>
        );
      case "Asia":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a10 10 0 0 1 10 10c0 5.5-4.5 10-10 10S2 17.5 2 12 6.5 2 12 2z" />
          </svg>
        );
      case "Africa":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a10 10 0 0 1 10 10c0 5.5-4.5 10-10 10S2 17.5 2 12 6.5 2 12 2z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
    }
  };
  
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={onClose}
        />
      )}
      
      <aside 
        className={cn(
          "w-64 bg-primary text-white overflow-y-auto custom-scrollbar fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:z-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              Leagues
            </h2>
            <button
              className="md:hidden text-white"
              onClick={onClose}
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {continents.map(continent => (
            <div key={continent.name} className="mb-4">
              <div 
                className="flex items-center py-2 px-2 bg-primary hover:bg-opacity-90 cursor-pointer rounded"
                onClick={() => toggleContinent(continent.name)}
              >
                {getContinentIcon(continent.name)}
                <span className="font-medium">{continent.name}</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-4 w-4 ml-auto transition-transform duration-200 ${expandedContinents[continent.name] ? 'transform rotate-180' : ''}`} 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              
              {expandedContinents[continent.name] && (
                <div className="pl-2 mt-2 space-y-2">
                  {continent.countries.map(country => (
                    <div key={country.name} className="country-group">
                      <div 
                        className="flex items-center py-1 px-2 bg-primary-foreground/10 hover:bg-primary-foreground/15 cursor-pointer rounded"
                        onClick={() => toggleCountry(country.name)}
                      >
                        <img 
                          src={getFlagUrl(country.name)} 
                          alt={country.name} 
                          className="mr-2" 
                          width="20" 
                          height="15"
                        />
                        <span className="font-medium text-sm">{country.name}</span>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`h-3 w-3 ml-auto transition-transform duration-200 ${expandedCountries[country.name] ? 'transform rotate-180' : ''}`} 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                      
                      {expandedCountries[country.name] && (
                        <div className="pl-4 space-y-1 mt-1">
                          {country.leagues.map(league => (
                            <div key={league.id} className="league-item flex items-center py-1 px-2 rounded cursor-pointer hover:bg-primary-foreground/5">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-400 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                              </svg>
                              <span className="text-sm">{league.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          <div className="border-t border-gray-700 my-4 pt-4">
            <div className="w-full bg-green-700 hover:bg-green-800 text-white py-2 rounded-md flex items-center justify-center">
              <Link href="/create">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Create Match</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

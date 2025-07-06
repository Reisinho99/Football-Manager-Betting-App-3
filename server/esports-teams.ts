// eSports teams for various leagues

// Call of Duty League teams
export const codTeams = [
  { name: "Atlanta FaZe", shortName: "ATL", country: "Global", league: "Call of Duty League" },
  { name: "Boston Breach", shortName: "BOS", country: "Global", league: "Call of Duty League" },
  { name: "New York Subliners", shortName: "NYS", country: "Global", league: "Call of Duty League" },
  { name: "OpTic Texas", shortName: "TEX", country: "Global", league: "Call of Duty League" },
  { name: "Seattle Surge", shortName: "SEA", country: "Global", league: "Call of Duty League" },
  { name: "Los Angeles Thieves", shortName: "LAT", country: "Global", league: "Call of Duty League" },
  { name: "Toronto Ultra", shortName: "TOR", country: "Global", league: "Call of Duty League" },
  { name: "Minnesota RØKKR", shortName: "MIN", country: "Global", league: "Call of Duty League" },
  { name: "Los Angeles Guerrillas", shortName: "LAG", country: "Global", league: "Call of Duty League" },
  { name: "Florida Mutineers", shortName: "FLA", country: "Global", league: "Call of Duty League" },
  { name: "Vegas Legion", shortName: "VEG", country: "Global", league: "Call of Duty League" },
  { name: "Carolina Royal Ravens", shortName: "CAR", country: "Global", league: "Call of Duty League" }
];

// Halo Championship Series teams
export const haloTeams = [
  { name: "Cloud9", shortName: "C9", country: "Global", league: "Halo Championship Series" },
  { name: "OpTic Gaming", shortName: "OPT", country: "Global", league: "Halo Championship Series" },
  { name: "Sentinels", shortName: "SEN", country: "Global", league: "Halo Championship Series" },
  { name: "FaZe Clan", shortName: "FZE", country: "Global", league: "Halo Championship Series" },
  { name: "eUnited", shortName: "EUN", country: "Global", league: "Halo Championship Series" },
  { name: "G2 Esports", shortName: "G2", country: "Global", league: "Halo Championship Series" },
  { name: "Fnatic", shortName: "FNC", country: "Global", league: "Halo Championship Series" },
  { name: "Spacestation Gaming", shortName: "SSG", country: "Global", league: "Halo Championship Series" },
  { name: "Complexity", shortName: "COL", country: "Global", league: "Halo Championship Series" },
  { name: "NAVI", shortName: "NAV", country: "Global", league: "Halo Championship Series" },
  { name: "Team Liquid", shortName: "TL", country: "Global", league: "Halo Championship Series" },
  { name: "XSET", shortName: "XST", country: "Global", league: "Halo Championship Series" }
];

// League of Legends World Championship teams
export const lolTeams = [
  { name: "T1", shortName: "T1", country: "Global", league: "League of Legends World Championship" },
  { name: "Gen.G", shortName: "GEN", country: "Global", league: "League of Legends World Championship" },
  { name: "JD Gaming", shortName: "JDG", country: "Global", league: "League of Legends World Championship" },
  { name: "Bilibili Gaming", shortName: "BLG", country: "Global", league: "League of Legends World Championship" },
  { name: "Team Liquid", shortName: "TL", country: "Global", league: "League of Legends World Championship" },
  { name: "G2 Esports", shortName: "G2", country: "Global", league: "League of Legends World Championship" },
  { name: "Fnatic", shortName: "FNC", country: "Global", league: "League of Legends World Championship" },
  { name: "MAD Lions", shortName: "MAD", country: "Global", league: "League of Legends World Championship" },
  { name: "Cloud9", shortName: "C9", country: "Global", league: "League of Legends World Championship" },
  { name: "DRX", shortName: "DRX", country: "Global", league: "League of Legends World Championship" },
  { name: "Top Esports", shortName: "TES", country: "Global", league: "League of Legends World Championship" },
  { name: "100 Thieves", shortName: "100T", country: "Global", league: "League of Legends World Championship" }
];

// All eSports teams combined
export const allEsportsTeams = [
  ...codTeams,
  ...haloTeams,
  ...lolTeams
];
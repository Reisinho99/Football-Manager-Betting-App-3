import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Team } from "@shared/schema";
import { generateInitials } from "@/lib/utils";
import { SiLeagueoflegends, SiGamejolt, SiPlaystation } from "react-icons/si";
import { FaGamepad } from "react-icons/fa";
import { useState } from "react";

interface TeamEmblemProps {
  team?: Team;
  teamName?: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  namePosition?: "right" | "bottom";
}

export function TeamEmblem({ 
  team, 
  teamName,
  size = "md", 
  showName = false,
  namePosition = "right"
}: TeamEmblemProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16"
  };

  const fontSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-lg"
  };

  const effectiveTeamName = team?.name || teamName || "Unknown Team";
  const isEsports = team?.country === "Global";

  // Priority: team.logo first, then fallback
  const logoUrl = team?.logo;

  const getEsportsIcon = () => {
    if (!team?.league) return <FaGamepad className="h-5 w-5" />;

    if (team.league.includes("Call of Duty")) {
      return <SiGamejolt className="h-5 w-5" />;
    } else if (team.league.includes("Halo")) {
      return <SiPlaystation className="h-5 w-5" />;
    } else if (team.league.includes("League of Legends")) {
      return <SiLeagueoflegends className="h-5 w-5" />;
    }

    return <FaGamepad className="h-5 w-5" />;
  };

  const getTeamColor = () => {
    const hash = effectiveTeamName.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    const colors = [
      "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", 
      "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500",
      "bg-orange-500", "bg-cyan-500", "bg-amber-500", "bg-lime-500",
      "bg-emerald-500", "bg-sky-500", "bg-violet-500", "bg-fuchsia-500"
    ];

    return colors[Math.abs(hash) % colors.length];
  };

  const shouldShowLogo = logoUrl && !imageError && typeof logoUrl === 'string' && logoUrl.trim() !== '';

  return (
    <div className={`flex items-center ${namePosition === 'bottom' ? 'flex-col space-y-2' : 'space-x-3'}`}>
      <Avatar className={`${sizeClasses[size]} ${!shouldShowLogo ? (isEsports ? 'bg-gray-900' : getTeamColor()) : ''}`}>
        {shouldShowLogo && (
          <AvatarImage 
            src={logoUrl}
            alt={effectiveTeamName}
            onError={(e) => {
              console.error(`❌ Image failed to load for ${effectiveTeamName}:`, logoUrl, e);
              setImageError(true);
            }}
            onLoad={() => {
              console.log(`✅ Image loaded successfully for ${effectiveTeamName}:`, logoUrl);
            }}
            className="object-contain w-full h-full"
          />
        )}
        <AvatarFallback className={`font-bold text-white ${fontSizeClasses[size]} ${isEsports ? 'flex items-center justify-center' : ''}`}>
          {isEsports ? getEsportsIcon() : generateInitials(effectiveTeamName)}
        </AvatarFallback>
      </Avatar>

      {showName && (
        <span className={`font-medium ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : ''}`}>
          {effectiveTeamName}
        </span>
      )}
    </div>
  );
}
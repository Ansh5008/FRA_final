// Color coding for different land types in FRA claims
export const LAND_TYPE_COLORS = {
  "Agricultural": {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    border: "border-amber-300 dark:border-amber-700",
    text: "text-amber-800 dark:text-amber-200",
    badge: "bg-amber-500",
    hex: "#f59e0b"
  },
  "Community Forest Resource": {
    bg: "bg-green-100 dark:bg-green-900/30", 
    border: "border-green-300 dark:border-green-700",
    text: "text-green-800 dark:text-green-200",
    badge: "bg-green-600",
    hex: "#059669"
  },
  "Habitation": {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    border: "border-blue-300 dark:border-blue-700", 
    text: "text-blue-800 dark:text-blue-200",
    badge: "bg-blue-500",
    hex: "#3b82f6"
  },
  "Water Bodies": {
    bg: "bg-cyan-100 dark:bg-cyan-900/30",
    border: "border-cyan-300 dark:border-cyan-700",
    text: "text-cyan-800 dark:text-cyan-200", 
    badge: "bg-cyan-500",
    hex: "#06b6d4"
  },
  "Grazing": {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    border: "border-emerald-300 dark:border-emerald-700",
    text: "text-emerald-800 dark:text-emerald-200",
    badge: "bg-emerald-500",
    hex: "#10b981"
  }
} as const;

export type LandType = keyof typeof LAND_TYPE_COLORS;

export function getLandTypeColor(landType: string | undefined): typeof LAND_TYPE_COLORS[LandType] {
  // Default to Agricultural if no land type specified
  return LAND_TYPE_COLORS[landType as LandType] || LAND_TYPE_COLORS.Agricultural;
}

export function getLandTypeIcon(landType: string | undefined): string {
  const icons: Record<string, string> = {
    "Agricultural": "🌾",
    "Community Forest Resource": "🌳", 
    "Habitation": "🏘️",
    "Water Bodies": "💧",
    "Grazing": "🌿"
  };
  return icons[landType || "Agricultural"] || "🌾";
}
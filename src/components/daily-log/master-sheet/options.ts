import type { ActivityType } from "@/types/storage";

export const ACTIVITY_TYPES: { label: string; value: ActivityType }[] = [
  { label: "Irrigation & Water", value: "IRRIGATION" },
  { label: "Weeding & Cleaning", value: "WEEDING" },
  { label: "Fertilizer Application", value: "FERTILIZER_APPLICATION" },
  { label: "Spraying & Pest Control", value: "SPRAYING" },
  { label: "Harvesting & Picking", value: "HARVESTING" },
  { label: "Sowing & Planting", value: "SOWING" },
  { label: "Land Preparation", value: "LAND_PREPARATION" },
  { label: "Pruning & Tying", value: "PRUNING" },
  { label: "Machinery Maintenance", value: "MAINTENANCE" },
  { label: "Other / Custom Activity", value: "OTHER" },
];

export const COMMON_FERTILIZERS = [
  "Urea (46% N)",
  "DAP (18-46-0)",
  "MOP (Muriate of Potash)",
  "NPK 19-19-19",
  "NPK 20-20-0",
  "Ammonium Sulphate",
  "Neem Cake / Organic Manure",
  "Zinc Sulphate Micronutrient",
  "Boron & Micronutrient Mix",
  "Cow Dung Compost",
];

export const PURCHASE_CATEGORIES = [
  "General Estate Supplies",
  "Tools & Hardware",
  "Machinery Spares & Repairs",
  "Irrigation & Piping",
  "Pesticides & Bio",
  "Seeds & Saplings",
  "Fertilizer & Nutrition",
];

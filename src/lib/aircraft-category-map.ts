// src/lib/aircraft-category-map.ts

const PEXJET_TO_TRAVIATOR_CATEGORY: Record<string, string> = {
  ULTRA_LONG_RANGE: "Ultra Long Range Jet",
  SUPER_MIDSIZE_JET: "Super Midsize Jet",
  MIDSIZE_JET: "Midsize Jet",
  LIGHT_JET: "Light Jet",
  VERY_LIGHT_JET: "Very Light Jet",
  TURBOPROP: "Turboprop",
};

export function normalizeAircraftCategory(input?: string | null): string | null {
  if (!input) return null;

  return PEXJET_TO_TRAVIATOR_CATEGORY[input] ?? formatFallback(input);
}

// fallback if new unknown types come in
function formatFallback(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

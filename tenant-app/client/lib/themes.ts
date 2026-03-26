export type ThemeName = "celebration-red" | "festive-green" | "diwali-gold" | "night-purple" | "vibrant-orange";

export interface Theme {
  id: ThemeName;
  name: string;
  description: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  isDark: boolean;
  category: "light" | "dark";
}

export const THEMES: Record<ThemeName, Theme> = {
  "celebration-red": {
    id: "celebration-red",
    name: "Celebration Red",
    tagline: "Festive & Bold",
    description: "Dark background with vibrant red fireworks energy - perfect for celebration-themed crackers",
    primaryColor: "#dc2626",
    secondaryColor: "#991b1b",
    accentColor: "#fbbf24",
    backgroundColor: "#0f172a",
    textColor: "#f3f4f6",
    isDark: true,
    category: "dark",
  },
  "festive-green": {
    id: "festive-green",
    name: "Festive Green",
    tagline: "Fresh & Modern",
    description: "Bright green with modern design - inspired by Besway Sivakasi online store",
    primaryColor: "#22c55e",
    secondaryColor: "#16a34a",
    accentColor: "#facc15",
    backgroundColor: "#f0fdf4",
    textColor: "#166534",
    isDark: false,
    category: "light",
  },
  "diwali-gold": {
    id: "diwali-gold",
    name: "Diwali Gold",
    tagline: "Warm & Celebratory",
    description: "Golden yellow with warm tones - captures the essence of Diwali celebrations",
    primaryColor: "#d97706",
    secondaryColor: "#b45309",
    accentColor: "#fbbf24",
    backgroundColor: "#fffbeb",
    textColor: "#78350f",
    isDark: false,
    category: "light",
  },
  "night-purple": {
    id: "night-purple",
    name: "Night Purple",
    tagline: "Mysterious & Premium",
    description: "Dark purple with neon accents - premium look for night celebrations",
    primaryColor: "#a855f7",
    secondaryColor: "#7c3aed",
    accentColor: "#ec4899",
    backgroundColor: "#1e1b4b",
    textColor: "#f3f4f6",
    isDark: true,
    category: "dark",
  },
  "vibrant-orange": {
    id: "vibrant-orange",
    name: "Vibrant Orange",
    tagline: "Energy & Fun",
    description: "Vibrant orange with energetic design - perfect for family celebrations and bulk orders",
    primaryColor: "#f97316",
    secondaryColor: "#ea580c",
    accentColor: "#fbbf24",
    backgroundColor: "#fff7ed",
    textColor: "#7c2d12",
    isDark: false,
    category: "light",
  },
};

export const THEME_LIST = Object.values(THEMES);

export interface ThemeCustomization {
  theme: ThemeName;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  customFontFamily?: string;
  borderRadius?: number;
}

function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0 0% 0%";

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  const hDeg = Math.round(h * 360);
  const sPct = Math.round(s * 100);
  const lPct = Math.round(l * 100);

  return `${hDeg} ${sPct}% ${lPct}%`;
}

export function getTheme(themeName: ThemeName): Theme {
  return THEMES[themeName] || THEMES["celebration-red"];
}

export function applyTheme(customization: ThemeCustomization) {
  const root = document.documentElement;

  // Set theme data attribute
  root.setAttribute("data-theme", customization.theme);

  const theme = getTheme(customization.theme);

  // Prefer runtime overrides if provided, else fall back to theme defaults
  const primaryHex = customization.primaryColor || theme.primaryColor;
  const secondaryHex = customization.secondaryColor || theme.secondaryColor;
  const accentHex = customization.accentColor || theme.accentColor;
  const bgHex = theme.backgroundColor;
  const textHex = theme.textColor;

  // Convert hex colors to HSL and apply as CSS variables
  const primaryHsl = hexToHsl(primaryHex);
  const secondaryHsl = hexToHsl(secondaryHex);
  const accentHsl = hexToHsl(accentHex);
  const bgHsl = hexToHsl(bgHex);
  const textHsl = hexToHsl(textHex);

  root.style.setProperty("--border", primaryHsl);
  root.style.setProperty("--input", primaryHsl);
  root.style.setProperty("--ring", primaryHsl);
  root.style.setProperty("--background", bgHsl);
  root.style.setProperty("--foreground", textHsl);
  root.style.setProperty("--primary", primaryHsl);
  root.style.setProperty("--primary-foreground", textHsl);
  root.style.setProperty("--secondary", secondaryHsl);
  root.style.setProperty("--secondary-foreground", textHsl);
  root.style.setProperty("--accent", accentHsl);
  root.style.setProperty("--accent-foreground", textHsl);

  if (customization.customFontFamily) {
    root.style.setProperty("--font-family", customization.customFontFamily);
  }

  // Store in localStorage for persistence
  localStorage.setItem("theme-customization", JSON.stringify(customization));
}

export function getSavedThemeCustomization(): ThemeCustomization | null {
  const saved = localStorage.getItem("theme-customization");
  return saved ? JSON.parse(saved) : null;
}

export function loadSavedTheme() {
  const saved = getSavedThemeCustomization();
  if (saved) {
    applyTheme(saved);
  }
}

// Map database theme names to color theme names
export function mapDatabaseThemeNameToColorTheme(dbThemeName?: string): ThemeName {
  if (!dbThemeName) return "vibrant-orange";

  const nameMap: Record<string, ThemeName> = {
    "Modern": "vibrant-orange",
    "Festive Red": "celebration-red",
    "Golden Glow": "diwali-gold",
    "Celebration Blue": "vibrant-orange",
    "Classic": "vibrant-orange",
    "Minimal": "celebration-red",
    "Bold": "night-purple",
    "Elegant": "night-purple",
    "Night Sky": "night-purple",
    "theme-b": "vibrant-orange",
    "theme-a": "celebration-red",
  };

  return nameMap[dbThemeName] || "vibrant-orange";
}

// Wishlist helpers (localStorage)
export function getWishlist(): string[] {
  try {
    const raw = localStorage.getItem("wishlist");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function toggleWishlist(productId: string) {
  const list = new Set(getWishlist());
  if (list.has(productId)) list.delete(productId);
  else list.add(productId);
  localStorage.setItem("wishlist", JSON.stringify(Array.from(list)));
}

export function isInWishlist(productId: string) {
  return getWishlist().includes(productId);
}

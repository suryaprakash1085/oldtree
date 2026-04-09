export type TemplateName = "theme-a" | "theme-b" | "theme-c" | "theme-d" | "theme-e";

export interface TemplateInfo {
  id: TemplateName;
  name: string;
  description: string;
  preview: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export const TEMPLATES: Record<TemplateName, TemplateInfo> = {
  "theme-a": {
    id: "theme-a",
    name: "Theme A - Professional Booking",
    description: "Professional data-table layout with vintage aesthetic. Features detailed product information in organized table format with purple dividers and warm beige styling. Perfect for detailed product catalogs and bulk ordering.",
    preview: "Dark header, beige product table with purple separators, detailed row information",
    colors: {
      primary: "#8b5a3c",
      secondary: "#a855f7",
      accent: "#f5f5dc",
    },
  },
  "theme-b": {
    id: "theme-b",
    name: "Theme B - Vibrant Showcase",
    description: "Modern vibrant design with colorful product cards, orange banner, and dynamic layouts. Features product grids with promotional badges, lifestyle imagery sections, and engaging call-to-action buttons. Perfect for festival and celebration-focused stores.",
    preview: "Orange promotional banner, white product grid with yellow CTAs, red sale badges, lifestyle sections",
    colors: {
      primary: "#f97316",
      secondary: "#ea580c",
      accent: "#facc15",
    },
  },
  "theme-c": {
    id: "theme-c",
    name: "Theme C - Category Grid Showcase",
    description: "Blue category-focused grid layout with large product images. Features prominent category buttons, organized product grid display with image galleries, and professional enterprise styling. Perfect for category-driven wholesale businesses.",
    preview: "Blue header, grid category buttons with images, professional white background, organized product display",
    colors: {
      primary: "#1a73e8",
      secondary: "#0d47a1",
      accent: "#2196f3",
    },
  },
  "theme-d": {
    id: "theme-d",
    name: "Theme D - Table Catalog",
    description: "Purple professional table-based product catalog. Features detailed product information in organized table format with premium styling, direct factory pricing, and comprehensive product details. Perfect for B2B wholesale catalogs.",
    preview: "Purple header, detailed product table with specifications, professional B2B layout, price listings",
    colors: {
      primary: "#7c3aed",
      secondary: "#6d28d9",
      accent: "#c084fc",
    },
  },
  "theme-e": {
    id: "theme-e",
    name: "Theme E - Modern Showcase",
    description: "Contemporary design with clean lines and modern aesthetics. Features minimalist product displays, subtle animations, and a sleek user interface. Perfect for tech-savvy audiences and modern retail environments.",
    preview: "Clean header, minimalist product grid, subtle animations, modern UI elements",
    colors: {
      primary: "#7c3aed",
      secondary: "#6d28d9",
      accent: "#c084fc",
    },
  },
};

export async function loadTemplate(templateId: TemplateName) {
  try {
    let component;
    switch (templateId) {
      case "theme-a":
        component = await import("../templates/ThemeATemplate");
        break;
      case "theme-b":
        component = await import("../templates/ThemeBTemplate");
        break;
      case "theme-c":
        component = await import("../templates/ThemeCTemplate");
        break;
      case "theme-d":
        component = await import("../templates/ThemeDTemplate");
        break;
       case "theme-e":
        component = await import("../templates/ThemeETemplate");
        break;
      default:
        component = await import("../templates/ThemeBTemplate");
    }
    return component.default;
  } catch (error: any) {
    const errorMsg = String(error?.message || error || "");
    const isMimeTypeError = errorMsg.includes("MIME type") || errorMsg.includes("Expected a JavaScript");

    if (isMimeTypeError) {
      console.error(
        `[MIME Type Error] Failed to load template ${templateId}. This usually means static assets are being served with text/html instead of application/javascript. Check your deployment server configuration.`,
        error
      );
    } else {
      console.error(`Failed to load template ${templateId}:`, error);
    }

    // Fallback to theme-b if template loading fails
    if (templateId !== "theme-b") {
      try {
        console.log("Attempting fallback to theme-b...");
        const fallback = await import("../templates/ThemeBTemplate");
        return fallback.default;
      } catch (fallbackError) {
        console.error("Failed to load fallback template:", fallbackError);
        throw new Error(
          `Unable to load any template. ${
            isMimeTypeError
              ? "MIME type error - check deployment server configuration for static asset serving."
              : errorMsg
          }`
        );
      }[[[[[[[[[[[[[[[[[[[[[[[[]]]]]]]]]]]]]]]]]]]]]]]]
    }
    throw error;
  }
}

export function getSavedTemplate(): TemplateName {
  const saved = localStorage.getItem("tenant-template");
  return (saved as TemplateName) || "theme-b";
}

export function setSavedTemplate(template: TemplateName) {
  localStorage.setItem("tenant-template", template);
}

import { getTenantIdFromEnv } from "@/lib/utils";

export async function fetchTenantTemplate(): Promise<TemplateName> {
  try {
    const tenantId = getTenantIdFromEnv();
    let apiBase = (import.meta.env.VITE_BACKEND_URL as string) || "http://localhost:8080";
    apiBase = apiBase.replace(/\/+$/g, "");
    if (!apiBase.endsWith("/api")) apiBase = apiBase + "/api";
    const url = `${apiBase}/store/${tenantId}/config`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        console.warn(`[Config] HTTP ${response.status} from ${url}. Using fallback template.`);
        return getSavedTemplate();
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await response.text();
        console.error(`[Config] Expected JSON from ${url}, got non-JSON. Response starts with: ${text.slice(0, 100)}`);
        return getSavedTemplate();
      }

      const data = await response.json();

      // expose the config (template, theme, seo, heroSliders) globally so templates can read it
      try {
        (window as any).__STORE_CONFIG = data.data;
      } catch (e) {
        // ignore
      }

      const template = data.data?.template as TemplateName;
      if (template && TEMPLATES[template]) {
        setSavedTemplate(template);
        return template;
      }
    } catch (fetchError) {
      console.warn("[Config] Fetch error:", fetchError);
      return getSavedTemplate();
    }
  } catch (error) {
    console.error("[Config] Unexpected error:", error);
  }

  return getSavedTemplate();
}

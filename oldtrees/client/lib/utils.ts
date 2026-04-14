import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extract the template limit from a plan's features array
 * @param features Array of feature strings like "up to 2 Templates", "unlimited templates"
 * @returns The template limit as a number, or null if unlimited or not found
 */
export function getTemplateLimitFromFeatures(features: string[]): number | null {
  if (!Array.isArray(features)) return null;

  for (const feature of features) {
    const lowerFeature = feature.toLowerCase();

    // Check for unlimited templates
    if (lowerFeature.includes("unlimited") && lowerFeature.includes("template")) {
      return null; // null represents unlimited
    }

    // Check for "up to X templates" pattern
    const match = lowerFeature.match(/up\s+to\s+(\d+)\s+templates?/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }

  return null; // Default to unlimited if not specified
}

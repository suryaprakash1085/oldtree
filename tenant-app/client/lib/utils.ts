import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(price);
}

export function getTenantIdFromEnv(): string {
  // Prefer tenant id present in the URL: /store/:tenantId
  try {
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    const match = path.match(/\/store\/([^\/\?]+)/);
    if (match && match[1]) return match[1];
  } catch (e) {
    // ignore
  }

  return import.meta.env.VITE_TENANT_ID || "demo-tenant";
}

export function getTenantNameFromEnv(): string {
  return import.meta.env.VITE_TENANT_NAME || "My Store";
}

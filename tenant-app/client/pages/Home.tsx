import React, { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { loadTemplate, fetchTenantTemplate } from "@/lib/templateLoader";
import { getStorefrontConfig } from "@/lib/api";
import { getTenantIdFromEnv } from "@/lib/utils";
import { applyTheme, mapDatabaseThemeNameToColorTheme } from "@/lib/themes";
import Fireworks from "@/components/Fireworks";

export default function Home() {
  const [TemplateComponent, setTemplateComponent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadCurrentTemplate = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        // ---------------- TEMPLATE ----------------
        const templateId = await fetchTenantTemplate();
        const Template = await loadTemplate(templateId);
        setTemplateComponent(() => Template);

        // ---------------- CONFIG ----------------
        const tenantId = getTenantIdFromEnv();
        const config = await getStorefrontConfig(tenantId);

        const seo = (config as any)?.seo || {
          title: "MKP Crackers - Buy Fireworks Online | Sivakasi",
          description:
            "Buy premium quality fireworks and crackers from MKP Crackers, Sivakasi. Best prices, safe delivery across Tamil Nadu.",
          keywords: "crackers, fireworks, sivakasi crackers, buy crackers online",
        };

        // ---------------- SEO ----------------

        // ✅ Helper functions (define FIRST)
        const setMeta = (name: string, content?: string) => {
          if (!content) return;
          let el = document.querySelector(`meta[name="${name}"]`);
          if (!el) {
            el = document.createElement("meta");
            el.setAttribute("name", name);
            document.head.appendChild(el);
          }
          el.setAttribute("content", content);
        };

        const setPropertyMeta = (prop: string, content?: string) => {
          if (!content) return;
          let el = document.querySelector(`meta[property="${prop}"]`);
          if (!el) {
            el = document.createElement("meta");
            el.setAttribute("property", prop);
            document.head.appendChild(el);
          }
          el.setAttribute("content", content);
        };

        // ✅ UNIQUE TITLE PER PAGE
        if (seo?.title) {
          const cleanTitle = seo.title
            .replace(/Call.*|Mobile.*|\d{10,}/gi, "")
            .trim();

          const path = window.location.pathname.replace("/", "") || "home";
          // const pageName =
          //   path.charAt(0).toUpperCase() + path.slice(1);
const params = new URLSearchParams(window.location.search);
const page = params.get("page");

let pageName = path.charAt(0).toUpperCase() + path.slice(1);

if (path === "products" && page) {
  pageName = `Products Page ${page}`;
}
          document.title = `${pageName} | ${cleanTitle}`;
        }

        // ✅ META TAGS
        if (seo.description) {
          // setMeta("description", seo.description);
          const path = window.location.pathname.replace("/", "") || "home";

// let pageDescription = "";

// if (path === "home") {
//   pageDescription = "Buy premium quality fireworks from MKP Crackers in Sivakasi. Best price and safe delivery.";
// } else if (path === "products") {
//   pageDescription = "Explore a wide range of crackers and fireworks at MKP Crackers. Affordable prices and top quality.";
// } else if (path === "contact") {
//   pageDescription = "Contact MKP Crackers for bulk orders and safe delivery across Tamil Nadu.";
// } else {
//   pageDescription = seo.description;
// }
let pageDescription = "";

if (path === "home") {
  pageDescription = "Buy premium quality fireworks from MKP Crackers in Sivakasi. Best price and safe delivery.";
} else if (path === "products") {
  const params = new URLSearchParams(window.location.search);
  const page = params.get("page");

  if (page) {
    pageDescription = `Explore crackers page ${page} at MKP Crackers. Best price and quality.`;
  } else {
    pageDescription = "Explore a wide range of crackers and fireworks at MKP Crackers. Affordable prices and top quality.";
  }
} else if (path === "contact") {
  pageDescription = "Contact MKP Crackers for bulk orders and safe delivery across Tamil Nadu.";
} else {
  pageDescription = seo.description;
}

// ✅ apply unique description
setMeta("description", pageDescription);
          // setPropertyMeta("og:description", seo.description);
          setPropertyMeta("og:description", pageDescription);
        }

        if (seo.keywords) {
          setMeta("keywords", seo.keywords);
        }

        if (seo.title) {
          setPropertyMeta("og:title", seo.title);
          setMeta("twitter:title", seo.title);
        }

        // ✅ IMAGE
        const heroRaw =
          (window as any).__STORE_CONFIG?.heroSliders?.[0]?.image_url;

        const API_HOST = (import.meta.env.VITE_BACKEND_URL as string)?.replace(
          /\/api$/,
          ""
        );

        const heroImage = heroRaw
          ? /^https?:\/\//i.test(heroRaw)
            ? heroRaw
            : `${API_HOST}${heroRaw.startsWith("/") ? "" : "/"}${heroRaw}`
          : undefined;

        if (heroImage) {
          setPropertyMeta("og:image", heroImage);
          setMeta("twitter:image", heroImage);
        }

        // ✅ CANONICAL
        let linkCanon = document.querySelector(
          "link[rel='canonical']"
        ) as HTMLLinkElement | null;

        if (!linkCanon) {
          linkCanon = document.createElement("link");
          linkCanon.rel = "canonical";
          document.head.appendChild(linkCanon);
        }

        linkCanon.href = window.location.href;

        // ---------------- THEME ----------------
        if (config?.theme) {
          const themeNameFromDb = (config.theme as any).themeName;

          const colorThemeName =
            mapDatabaseThemeNameToColorTheme(themeNameFromDb);

          applyTheme({
            theme: colorThemeName,
            primaryColor: config.theme.primaryColor,
            secondaryColor: config.theme.secondaryColor,
            customFontFamily: config.theme.fontFamily,
          });
        }
      } catch (error) {
        console.error("Failed to load template:", error);
        setLoadError("Failed to load store");
      } finally {
        setLoading(false);
      }
    };

    loadCurrentTemplate();
  }, []);

  // ---------------- UI ----------------

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-white">Loading store...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{loadError}</p>
      </div>
    );
  }

  return (
    <>
      <Fireworks />
      <Toaster position="top-right" duration={1000} />
      {TemplateComponent && <TemplateComponent />}
    </>
  );
}
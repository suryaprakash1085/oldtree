import React, { useEffect, useState, Suspense } from "react";
import { Toaster, toast } from "sonner";
import { loadTemplate, fetchTenantTemplate, type TemplateName } from "@/lib/templateLoader";
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
        const templateId = await fetchTenantTemplate();
        const Template = await loadTemplate(templateId);
        setTemplateComponent(() => Template);

        // Fetch server-provided theme and apply
        const tenantId = getTenantIdFromEnv();
        const config = await getStorefrontConfig(tenantId);
        if (config?.theme) {
          const themeNameFromDb = (config.theme as any).themeName;
          const colorThemeName = mapDatabaseThemeNameToColorTheme(themeNameFromDb);
          applyTheme({
            theme: colorThemeName,
            primaryColor: config.theme.primaryColor,
            secondaryColor: config.theme.secondaryColor,
            customFontFamily: config.theme.fontFamily,
          });
        }

        // Apply SEO settings if available
        try {
          const seo = (config as any).seo;
          if (seo) {
            if (seo.title) {
              document.title = seo.title;
            }

            const setMeta = (name: string, content?: string) => {
              let el = document.querySelector(`meta[name="${name}"]`);
              if (!el) {
                el = document.createElement('meta');
                el.setAttribute('name', name);
                document.head.appendChild(el);
              }
              if (content) el.setAttribute('content', content);
            };

            const setPropertyMeta = (prop: string, content?: string) => {
              let el = document.querySelector(`meta[property="${prop}"]`);
              if (!el) {
                el = document.createElement('meta');
                el.setAttribute('property', prop);
                document.head.appendChild(el);
              }
              if (content) el.setAttribute('content', content);
            };

            if (seo.description) {
              setMeta('description', seo.description);
              setPropertyMeta('og:description', seo.description);
            }
            if (seo.keywords) setMeta('keywords', seo.keywords);
            if (seo.searchConsoleMeta) setMeta('google-site-verification', seo.searchConsoleMeta);

            // Open Graph / Twitter
            if (seo.title) {
              setPropertyMeta('og:title', seo.title);
              setMeta('twitter:title', seo.title);
            }

            // Use hero slider image or favicon as og:image fallback
            const heroRaw = (window as any).__STORE_CONFIG?.heroSliders?.[0]?.image_url;
            const API_HOST = (((import.meta.env.VITE_BACKEND_URL as string) )).replace(/\/api$/, "");
            const heroImage = heroRaw ? (/^https?:\/\//i.test(heroRaw) ? heroRaw : `${API_HOST}${heroRaw.startsWith("/") ? "" : "/"}${heroRaw}`) : undefined;
            const ogImage = heroImage || seo.faviconUrl || undefined;
            if (ogImage) {
              setPropertyMeta('og:image', ogImage);
              setMeta('twitter:image', ogImage);
            }

            // canonical
            let linkCanon: HTMLLinkElement | null = document.querySelector("link[rel='canonical']");
            if (!linkCanon) {
              linkCanon = document.createElement('link');
              linkCanon.rel = 'canonical';
              document.head.appendChild(linkCanon);
            }
            linkCanon.href = window.location.href;

            // Inject Google Analytics gtag if provided
            if (seo.gtagId && seo.gtagId.trim()) {
              const gtagId = seo.gtagId.trim();
              const existing = document.querySelector(`script[src*="gtag/js"]`);
              if (!existing) {
                const s1 = document.createElement('script');
                s1.async = true;
                s1.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gtagId)}`;
                document.head.appendChild(s1);

                const s2 = document.createElement('script');
                s2.innerHTML = `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gtagId.replace(/'/g, "\\'")}');`;
                document.head.appendChild(s2);
                console.log('Google Analytics initialized with gtag ID:', gtagId);
              }
            }

            // Favicon
            if (seo.faviconUrl) {
              let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
              if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
              }
              // Use the favicon URL as-is (supports absolute URLs and relative paths via proxy)
              link.href = seo.faviconUrl;
              link.type = 'image/x-icon';
            }

            // Add site-level JSON-LD (Organization + WebSite)
            try {
              const org = {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: (window as any).__STORE_CONFIG?.theme?.companyName || (window as any).__STORE_CONFIG?.company_name || document.title || "",
                url: window.location.origin,
                logo: seo.faviconUrl || undefined,
              };

              const website = {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: seo.title || document.title || "",
                url: window.location.origin,
                potentialAction: {
                  "@type": "SearchAction",
                  target: `${window.location.origin}/?q={search_term_string}`,
                  "query-input": "required name=search_term_string",
                },
              };

              const existingOrg = document.getElementById('jsonld-org');
              if (existingOrg) existingOrg.remove();
              const sOrg = document.createElement('script');
              sOrg.type = 'application/ld+json';
              sOrg.id = 'jsonld-org';
              sOrg.text = JSON.stringify(org);
              document.head.appendChild(sOrg);

              const existingSite = document.getElementById('jsonld-site');
              if (existingSite) existingSite.remove();
              const sSite = document.createElement('script');
              sSite.type = 'application/ld+json';
              sSite.id = 'jsonld-site';
              sSite.text = JSON.stringify(website);
              document.head.appendChild(sSite);
            } catch (err) {
              console.warn('Failed to add JSON-LD', err);
            }
          }
        } catch (err) {
          console.warn('Failed to apply SEO settings', err);
        }
      } catch (error) {
        console.error("Failed to load template:", error);
        const errorMsg = error instanceof Error ? error.message : "Failed to load template";
        setLoadError(errorMsg);
        try {
          toast.error("Failed to load template. Attempting fallback...");
          // Fallback to theme-b template
          const { default: ThemeB } = await import(
            "../templates/ThemeBTemplate"
          );
          setTemplateComponent(() => ThemeB);
          setLoadError(null);
        } catch (fallbackError) {
          console.error("Failed to load fallback template:", fallbackError);
          setLoadError("Unable to load storefront. Please try refreshing the page.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadCurrentTemplate();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <Toaster position="top-right" duration={1000} />
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 font-semibold">Loading store...</p>
        </div>
      </div>
    );
  }

  if (loadError && !TemplateComponent) {
    const isMimeError = loadError.includes("MIME type") || loadError.includes("Expected a JavaScript");

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <Toaster position="top-right" duration={1000} />
        <div className="text-center max-w-lg">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Unable to Load Store</h1>

          {isMimeError ? (
            <div className="text-left bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
              <p className="text-gray-300 mb-3">
                <strong>MIME Type Error:</strong> Static assets are being served with incorrect content type.
              </p>
              <p className="text-gray-400 text-sm mb-3">This typically indicates a server configuration issue:</p>
              <ul className="text-gray-400 text-sm space-y-1 ml-4">
                <li>• Check that your web server (Nginx/Apache) is configured to serve .js files with `application/javascript`</li>
                <li>• Verify the static assets folder (`/assets`, `/js`) is properly configured</li>
                <li>• Ensure SPA fallback is only applied to HTML requests, not asset requests</li>
              </ul>
            </div>
          ) : (
            <p className="text-gray-300 mb-6 text-sm bg-red-900/20 border border-red-500 rounded p-3">
              {loadError}
            </p>
          )}

          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
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

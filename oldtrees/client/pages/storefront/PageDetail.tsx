import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { getStorefrontPage, getStorefrontConfig } from "@/lib/api";
import { Toaster, toast } from "sonner";
import {
  Search,
  Menu,
  ShoppingCart,
  User,
  ChevronDown,
  LogOut,
  Heart,
  ArrowLeft,
} from "lucide-react";

export default function PageDetail() {
  const { tenantId, slug } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    loadConfig();
    loadPage();
  }, [tenantId, slug]);

  const loadConfig = async () => {
    try {
      const config = await getStorefrontConfig(tenantId || "");
      if (config?.data?.theme) {
        const theme = config.data.theme;
        const root = document.documentElement;
        if (theme.primaryColor) {
          root.style.setProperty("--primary", theme.primaryColor);
        }
        if (theme.secondaryColor) {
          root.style.setProperty("--secondary", theme.secondaryColor);
        }
        if (theme.fontFamily) {
          root.style.fontFamily = theme.fontFamily;
        }
      }
    } catch (error) {
      console.error("Failed to load storefront config:", error);
    }
  };

  useEffect(() => {
    if (page) {
      document.title = page.seo_title || page.title;

      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement("meta");
        metaDescription.setAttribute("name", "description");
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute("content", page.seo_description || page.excerpt || "");

      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement("meta");
        metaKeywords.setAttribute("name", "keywords");
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute("content", page.seo_keywords || "");

      // Open Graph meta tags
      let metaOgTitle = document.querySelector('meta[property="og:title"]');
      if (!metaOgTitle) {
        metaOgTitle = document.createElement("meta");
        metaOgTitle.setAttribute("property", "og:title");
        document.head.appendChild(metaOgTitle);
      }
      metaOgTitle.setAttribute("content", page.seo_title || page.title);

      let metaOgDescription = document.querySelector('meta[property="og:description"]');
      if (!metaOgDescription) {
        metaOgDescription = document.createElement("meta");
        metaOgDescription.setAttribute("property", "og:description");
        document.head.appendChild(metaOgDescription);
      }
      metaOgDescription.setAttribute("content", page.seo_description || page.excerpt || "");

      let metaOgType = document.querySelector('meta[property="og:type"]');
      if (!metaOgType) {
        metaOgType = document.createElement("meta");
        metaOgType.setAttribute("property", "og:type");
        document.head.appendChild(metaOgType);
      }
      metaOgType.setAttribute("content", "website");

      if (page.featured_image_url) {
        let metaOgImage = document.querySelector('meta[property="og:image"]');
        if (!metaOgImage) {
          metaOgImage = document.createElement("meta");
          metaOgImage.setAttribute("property", "og:image");
          document.head.appendChild(metaOgImage);
        }
        metaOgImage.setAttribute("content", page.featured_image_url);
      }

      // Twitter Card meta tags
      let metaTwitterCard = document.querySelector('meta[name="twitter:card"]');
      if (!metaTwitterCard) {
        metaTwitterCard = document.createElement("meta");
        metaTwitterCard.setAttribute("name", "twitter:card");
        document.head.appendChild(metaTwitterCard);
      }
      metaTwitterCard.setAttribute("content", "summary_large_image");

      let metaTwitterTitle = document.querySelector('meta[name="twitter:title"]');
      if (!metaTwitterTitle) {
        metaTwitterTitle = document.createElement("meta");
        metaTwitterTitle.setAttribute("name", "twitter:title");
        document.head.appendChild(metaTwitterTitle);
      }
      metaTwitterTitle.setAttribute("content", page.seo_title || page.title);

      let metaTwitterDescription = document.querySelector('meta[name="twitter:description"]');
      if (!metaTwitterDescription) {
        metaTwitterDescription = document.createElement("meta");
        metaTwitterDescription.setAttribute("name", "twitter:description");
        document.head.appendChild(metaTwitterDescription);
      }
      metaTwitterDescription.setAttribute("content", page.seo_description || page.excerpt || "");

      if (page.featured_image_url) {
        let metaTwitterImage = document.querySelector('meta[name="twitter:image"]');
        if (!metaTwitterImage) {
          metaTwitterImage = document.createElement("meta");
          metaTwitterImage.setAttribute("name", "twitter:image");
          document.head.appendChild(metaTwitterImage);
        }
        metaTwitterImage.setAttribute("content", page.featured_image_url);
      }

      // Canonical URL
      let metaCanonical = document.querySelector('link[rel="canonical"]');
      if (!metaCanonical) {
        metaCanonical = document.createElement("link");
        metaCanonical.setAttribute("rel", "canonical");
        document.head.appendChild(metaCanonical);
      }
      metaCanonical.setAttribute("href", `${window.location.origin}/store/${tenantId}/pages/${slug}`);
    }
  }, [page, tenantId, slug]);

  const loadPage = async () => {
    try {
      setLoading(true);
      const data = await getStorefrontPage(tenantId || "", slug || "");
      setPage(data.data);
    } catch (error) {
      console.error("Failed to load page:", error);
      toast.error("Page not found");
      navigate(`/store/${tenantId}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading page...</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 text-lg mb-4">Page not found</p>
          <Link to={`/store/${tenantId}`}>
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="border-b border-slate-200 sticky top-0 z-40 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              to={`/store/${tenantId}`}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">✦</span>
              </div>
              <span className="font-bold text-lg text-slate-900 hidden sm:inline">
                MyStore
              </span>
            </Link>

            <div className="hidden md:flex items-center bg-slate-100 rounded-lg px-4 py-2 w-64">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent outline-none text-sm w-full"
              />
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors hidden sm:inline-flex">
                <Heart className="w-5 h-5 text-slate-700" />
              </button>

              <button
                onClick={() => setCartOpen(!cartOpen)}
                className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-slate-700" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  <User className="w-5 h-5 text-slate-700" />
                  <ChevronDown className="w-4 h-4 text-slate-700" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-2">
                    <a
                      href="#"
                      className="px-4 py-2 text-slate-700 hover:bg-slate-50 block"
                    >
                      My Account
                    </a>
                    <a
                      href="#"
                      className="px-4 py-2 text-slate-700 hover:bg-slate-50 block"
                    >
                      Order History
                    </a>
                    <hr className="my-2" />
                    <a
                      href="#"
                      className="px-4 py-2 text-slate-700 hover:bg-slate-50 block flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </a>
                  </div>
                )}
              </div>

              <button className="p-2 md:hidden">
                <Menu className="w-5 h-5 text-slate-700" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          to={`/store/${tenantId}`}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-8 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            {page.title}
          </h1>
          {page.excerpt && (
            <p className="text-xl text-slate-600">
              {page.excerpt}
            </p>
          )}
        </header>

        {page.featured_image_url && (
          <div className="mb-8 rounded-lg overflow-hidden bg-slate-100 h-96">
            <img
              src={page.featured_image_url}
              alt={page.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="prose prose-lg max-w-none mb-12">
          {page.content?.split("\n").map((paragraph: string, index: number) => (
            <p key={index} className="text-slate-700 leading-relaxed mb-6 whitespace-pre-wrap">
              {paragraph}
            </p>
          ))}
        </div>

        {page.show_cta && page.cta_text && (
          <div className="bg-slate-100 rounded-lg p-8 text-center mb-12">
            <p className="text-lg text-slate-700 mb-4">
              {page.cta_description || "Ready to get started?"}
            </p>
            <Link to={`/store/${tenantId}`}>
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                {page.cta_text}
              </Button>
            </Link>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">✦</span>
                </div>
                <span className="font-bold">MyStore</span>
              </div>
              <p className="text-slate-400 text-sm">
                Your trusted online shopping destination for premium products.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Shop</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <Link
                    to={`/store/${tenantId}`}
                    className="hover:text-white transition"
                  >
                    Products
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    New Arrivals
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Sale
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Blog
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Terms & Conditions
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center text-slate-400 text-sm">
            <p>
              &copy; 2024 MyStore. All rights reserved. Powered by MultiTenant
              Platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

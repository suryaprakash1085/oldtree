import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { getStorefrontBlogPost, getStorefrontBlog, getStorefrontConfig } from "@/lib/api";
import { Toaster, toast } from "sonner";
import {
  Calendar,
  Tag,
  ArrowLeft,
  Search,
  Menu,
  ShoppingCart,
  User,
  ChevronDown,
  LogOut,
  Heart,
  Share2,
} from "lucide-react";

export default function BlogDetail() {
  const { tenantId, slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    loadConfig();
    loadPost();
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
    if (post) {
      document.title = post.seo_title || post.title;

      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement("meta");
        metaDescription.setAttribute("name", "description");
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute("content", post.seo_description || post.excerpt || "");

      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement("meta");
        metaKeywords.setAttribute("name", "keywords");
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute("content", post.seo_keywords || "");

      // Open Graph meta tags
      let metaOgTitle = document.querySelector('meta[property="og:title"]');
      if (!metaOgTitle) {
        metaOgTitle = document.createElement("meta");
        metaOgTitle.setAttribute("property", "og:title");
        document.head.appendChild(metaOgTitle);
      }
      metaOgTitle.setAttribute("content", post.seo_title || post.title);

      let metaOgDescription = document.querySelector('meta[property="og:description"]');
      if (!metaOgDescription) {
        metaOgDescription = document.createElement("meta");
        metaOgDescription.setAttribute("property", "og:description");
        document.head.appendChild(metaOgDescription);
      }
      metaOgDescription.setAttribute("content", post.seo_description || post.excerpt || "");

      let metaOgType = document.querySelector('meta[property="og:type"]');
      if (!metaOgType) {
        metaOgType = document.createElement("meta");
        metaOgType.setAttribute("property", "og:type");
        document.head.appendChild(metaOgType);
      }
      metaOgType.setAttribute("content", "article");

      if (post.featured_image_url) {
        let metaOgImage = document.querySelector('meta[property="og:image"]');
        if (!metaOgImage) {
          metaOgImage = document.createElement("meta");
          metaOgImage.setAttribute("property", "og:image");
          document.head.appendChild(metaOgImage);
        }
        metaOgImage.setAttribute("content", post.featured_image_url);
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
      metaTwitterTitle.setAttribute("content", post.seo_title || post.title);

      let metaTwitterDescription = document.querySelector('meta[name="twitter:description"]');
      if (!metaTwitterDescription) {
        metaTwitterDescription = document.createElement("meta");
        metaTwitterDescription.setAttribute("name", "twitter:description");
        document.head.appendChild(metaTwitterDescription);
      }
      metaTwitterDescription.setAttribute("content", post.seo_description || post.excerpt || "");

      if (post.featured_image_url) {
        let metaTwitterImage = document.querySelector('meta[name="twitter:image"]');
        if (!metaTwitterImage) {
          metaTwitterImage = document.createElement("meta");
          metaTwitterImage.setAttribute("name", "twitter:image");
          document.head.appendChild(metaTwitterImage);
        }
        metaTwitterImage.setAttribute("content", post.featured_image_url);
      }
    }
  }, [post]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const data = await getStorefrontBlogPost(tenantId || "", slug || "");
      setPost(data.data);

      // Load related posts
      const blogData = await getStorefrontBlog(tenantId || "", 10);
      const related = (blogData.data || [])
        .filter((p: any) => p.slug !== slug && p.category === data.data?.category)
        .slice(0, 3);
      setRelatedPosts(related);
    } catch (error) {
      console.error("Failed to load blog post:", error);
      toast.error("Blog post not found");
      navigate(`/store/${tenantId}/blog`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 text-lg mb-4">Article not found</p>
          <Link to={`/store/${tenantId}/blog`}>
            <Button>Back to Blog</Button>
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

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          to={`/store/${tenantId}/blog`}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-8 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formatDate(post.publish_date)}
            </div>
            {post.category && (
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  {post.category}
                </span>
              </div>
            )}
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors ml-auto">
              <Share2 className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </header>

        {post.featured_image_url && (
          <div className="mb-8 rounded-lg overflow-hidden bg-slate-100 h-96">
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {post.excerpt && (
          <p className="text-xl text-slate-600 italic mb-8 border-l-4 border-primary pl-4">
            {post.excerpt}
          </p>
        )}

        <div className="prose prose-lg max-w-none mb-12">
          {post.content?.split("\n").map((paragraph: string, index: number) => (
            <p key={index} className="text-slate-700 leading-relaxed mb-6 whitespace-pre-wrap">
              {paragraph}
            </p>
          ))}
        </div>

        {post.tags && (
          <div className="border-t border-slate-200 pt-8 mb-8">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {(Array.isArray(post.tags)
                ? post.tags
                : post.tags.split(",")
              ).map((tag: string) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm hover:bg-slate-200 transition-colors"
                >
                  #{tag.trim()}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="bg-slate-50 border-t border-slate-200 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-8">
              Related Articles
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  to={`/store/${tenantId}/blog/${relatedPost.slug}`}
                  className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {relatedPost.featured_image_url && (
                    <div className="h-40 overflow-hidden bg-slate-100">
                      <img
                        src={relatedPost.featured_image_url}
                        alt={relatedPost.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-sm text-slate-600 mb-2">
                      {formatDate(relatedPost.publish_date)}
                    </p>
                    <h3 className="font-semibold text-slate-900 hover:text-primary transition-colors line-clamp-2">
                      {relatedPost.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

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
                  <Link
                    to={`/store/${tenantId}/blog`}
                    className="hover:text-white transition"
                  >
                    Blog
                  </Link>
                </li>
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

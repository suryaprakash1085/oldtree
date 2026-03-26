import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { getStorefrontBlog, getStorefrontConfig } from "@/lib/api";
import { Toaster, toast } from "sonner";
import {
  Calendar,
  Tag,
  ArrowRight,
  Search,
  Menu,
  ShoppingCart,
  User,
  ChevronDown,
  LogOut,
  Heart,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const POSTS_PER_PAGE = 6;

export default function Blog() {
  const { tenantId } = useParams();
  const [allBlogPosts, setAllBlogPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadConfig();
    loadBlog();
  }, [tenantId]);

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

  const loadBlog = async () => {
    try {
      setLoading(true);
      const response = await getStorefrontBlog(tenantId || "", 200);
      console.log("Blog API Response:", response);
      const posts = response?.data || [];
      console.log("Loaded posts:", posts);
      setAllBlogPosts(Array.isArray(posts) ? posts : []);
      setCurrentPage(1);
      if (Array.isArray(posts) && posts.length === 0) {
        console.warn("No blog posts returned from API");
      }
    } catch (error) {
      console.error("Failed to load blog:", error);
      toast.error("Failed to load blog posts");
      setAllBlogPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = allBlogPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

  const categories = Array.from(
    new Set(allBlogPosts.map((p) => p.category).filter(Boolean))
  );

  // Reset to first page when search or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-purple-600/10 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Our Blog
          </h1>
          <p className="text-lg text-slate-600">
            Insights, tips, and stories from our team
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Search (Mobile) */}
            <div className="md:hidden mb-6">
              <div className="flex items-center bg-slate-100 rounded-lg px-4 py-2">
                <Search className="w-4 h-4 text-slate-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent outline-none text-sm w-full"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Categories
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    selectedCategory === null
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  All Categories
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      selectedCategory === category
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Posts */}
            {allBlogPosts.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 p-6 mt-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Recent Posts
                </h3>
                <div className="space-y-3">
                  {allBlogPosts.slice(0, 5).map((post) => (
                    <Link
                      key={post.id}
                      to={`/store/${tenantId}/blog/${post.slug}`}
                      className="block hover:text-primary transition-colors"
                    >
                      <p className="text-sm font-medium text-slate-900 hover:text-primary truncate">
                        {post.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(post.publish_date)}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Blog Posts */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-600">Loading blog posts...</p>
              </div>
            ) : paginatedPosts.length > 0 ? (
              <>
                <div className="space-y-8">
                  {paginatedPosts.map((post) => (
                    <article
                      key={post.id}
                      className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {post.featured_image_url && (
                        <div className="h-64 overflow-hidden bg-slate-100">
                          <img
                            src={post.featured_image_url}
                            alt={post.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-center gap-3 text-sm text-slate-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(post.publish_date)}
                          </div>
                          {post.category && (
                            <div className="flex items-center gap-1">
                              <Tag className="w-4 h-4" />
                              {post.category}
                            </div>
                          )}
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-3 hover:text-primary transition-colors">
                          <Link to={`/store/${tenantId}/blog/${post.slug}`}>
                            {post.title}
                          </Link>
                        </h2>
                        <p className="text-slate-600 mb-4">
                          {post.excerpt || post.content?.substring(0, 200) + "..."}
                        </p>
                        {post.tags && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {(Array.isArray(post.tags)
                              ? post.tags
                              : post.tags.split(",")
                            ).map((tag: string) => (
                              <span
                                key={tag}
                                className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded"
                              >
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                        <Link
                          to={`/store/${tenantId}/blog/${post.slug}`}
                          className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all font-medium"
                        >
                          Read More
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                <p className="text-slate-600 text-lg">
                  {searchQuery ? "No blog posts match your search" : "No blog posts yet"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Pagination in Footer */}
          {filteredPosts.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pb-8 mb-8 border-b border-slate-700">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={cn(
                  "p-2 rounded transition-colors",
                  currentPage === 1
                    ? "text-slate-600 cursor-not-allowed"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                )}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "w-10 h-10 rounded font-medium transition-colors",
                      currentPage === page
                        ? "bg-primary text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    )}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={cn(
                  "p-2 rounded transition-colors",
                  currentPage === totalPages
                    ? "text-slate-600 cursor-not-allowed"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                )}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

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
                  <Link to={`/store/${tenantId}`} className="hover:text-white transition">
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
                  <Link to={`/store/${tenantId}/blog`} className="hover:text-white transition">
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

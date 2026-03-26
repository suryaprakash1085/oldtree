import React, { useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { getTenantIdFromEnv, getTenantNameFromEnv } from '@/lib/utils';
import { getBlogPosts } from '@/lib/api';
import { Link } from 'react-router-dom';
import { Search, Calendar, Tag, ChevronRight } from 'lucide-react';

const POSTS_PER_PAGE = 12;

export default function Blog() {
  const tenantId = getTenantIdFromEnv();
  const tenantName = getTenantNameFromEnv();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const list = await getBlogPosts(tenantId, { limit: 50 });
        setPosts(list);
        document.title = `Blog • ${tenantName}`;
        const linkCanon = document.querySelector("link[rel='canonical']") || document.createElement('link');
        (linkCanon as HTMLLinkElement).rel = 'canonical';
        (linkCanon as HTMLLinkElement).href = window.location.href;
        if (!linkCanon.parentNode) document.head.appendChild(linkCanon);

        const metaDesc = document.querySelector("meta[name='description']") || document.createElement('meta');
        if (!metaDesc.parentNode) {
          metaDesc.setAttribute('name', 'description');
          document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', `Read the latest blog posts and articles on ${tenantName}`);
      } catch (e) {
        toast.error('Failed to load blog');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tenantId, tenantName]);

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(posts.map((p) => p.category).filter(Boolean)));
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <Toaster position="top-right" />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Our Blog</h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
              Explore insightful articles, tips, and stories from our team
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-slate-300 border border-white/20 focus:outline-none focus:border-white/40 transition-colors"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid lg:grid-cols-4 gap-8 mb-12">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            {/* Categories Filter */}
            {categories.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 sticky top-4 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-5">Categories</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => { setSelectedCategory(null); setCurrentPage(1); }}
                    className={`w-full text-left px-4 py-2.5 rounded-lg font-medium transition-all ${
                      selectedCategory === null
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    All Categories ({posts.length})
                  </button>
                  {categories.map((category) => {
                    const count = posts.filter(p => p.category === category).length;
                    return (
                      <button
                        key={category}
                        onClick={() => { setSelectedCategory(category); setCurrentPage(1); }}
                        className={`w-full text-left px-4 py-2.5 rounded-lg font-medium transition-all ${
                          selectedCategory === category
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {category} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>

          {/* Blog Posts Grid */}
          <main className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin h-12 w-12 border-4 border-slate-900 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-600 text-lg">Loading blog posts...</p>
              </div>
            ) : paginatedPosts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                <p className="text-slate-600 text-lg">
                  {searchQuery ? 'No blog posts match your search' : selectedCategory ? 'No posts in this category' : 'No blog posts yet'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                  {paginatedPosts.map((post) => (
                    <article
                      key={post.id}
                      className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-300"
                    >
                      {/* Featured Image */}
                      {post.featured_image_url && (
                        <div className="h-48 overflow-hidden bg-slate-100">
                          <img
                            src={post.featured_image_url}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-6">
                        {/* Meta Info */}
                        <div className="flex items-center gap-3 text-sm text-slate-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <time dateTime={post.publish_date}>{formatDate(post.publish_date)}</time>
                          </div>
                          {post.category && (
                            <div className="flex items-center gap-1">
                              <Tag className="w-4 h-4" />
                              <span>{post.category}</span>
                            </div>
                          )}
                        </div>

                        {/* Title */}
                        <h2 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-slate-700 transition-colors">
                          <Link to={`/blog/${encodeURIComponent(post.slug)}`}>
                            {post.title}
                          </Link>
                        </h2>

                        {/* Excerpt */}
                        <p className="text-slate-600 text-sm line-clamp-2 mb-4">
                          {post.excerpt || (post.content ? post.content.substring(0, 150) : '')}
                        </p>

                        {/* Tags */}
                        {post.tags && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {(Array.isArray(post.tags)
                              ? post.tags
                              : post.tags.split(',')
                            ).slice(0, 2).map((tag: string) => (
                              <span
                                key={tag}
                                className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full"
                              >
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Read More Link */}
                        <Link
                          to={`/blog/${encodeURIComponent(post.slug)}`}
                          className="inline-flex items-center gap-2 text-slate-900 font-semibold hover:text-slate-700 group/link"
                        >
                          Read Article
                          <ChevronRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-8 border-t border-slate-200">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum = i + 1;
                        if (totalPages > 5) {
                          if (currentPage > 3) pageNum = currentPage - 2 + i;
                        }
                        return (
                          pageNum <= totalPages && (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                                currentPage === pageNum
                                  ? 'bg-slate-900 text-white'
                                  : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          )
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-16 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-slate-400">&copy; 2024 {tenantName}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

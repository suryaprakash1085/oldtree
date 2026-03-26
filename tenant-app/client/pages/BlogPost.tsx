import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { getTenantIdFromEnv, getTenantNameFromEnv } from '@/lib/utils';
import { getBlogPostBySlug } from '@/lib/api';
import { Calendar, Tag, ChevronLeft, Share2 } from 'lucide-react';

export default function BlogPost() {
  const { slug } = useParams();
  const tenantId = getTenantIdFromEnv();
  const tenantName = getTenantNameFromEnv();
  const [post, setPost] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (!slug) {
          toast.error('Invalid blog post URL');
          return;
        }
        const p = await getBlogPostBySlug(tenantId, slug);
        setPost(p);

        const title = p?.seo_title || p?.title || `Blog • ${tenantName}`;
        const description = p?.seo_description || p?.excerpt || '';
        document.title = title;

        const setMeta = (name: string, content?: string) => {
          let el = document.querySelector(`meta[name="${name}"]`);
          if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el); }
          if (content) el.setAttribute('content', content);
        };
        const setProp = (prop: string, content?: string) => {
          let el = document.querySelector(`meta[property="${prop}"]`);
          if (!el) { el = document.createElement('meta'); el.setAttribute('property', prop); document.head.appendChild(el); }
          if (content) el.setAttribute('content', content);
        };

        setMeta('description', description);
        setMeta('keywords', p?.seo_keywords || '');
        setProp('og:title', title);
        setProp('og:description', description);
        if (p?.featured_image_url) setProp('og:image', p.featured_image_url);

        let linkCanon: HTMLLinkElement | null = document.querySelector("link[rel='canonical']");
        if (!linkCanon) { linkCanon = document.createElement('link'); linkCanon.rel = 'canonical'; document.head.appendChild(linkCanon); }
        linkCanon.href = window.location.href;

        // JSON-LD Article
        try {
          const existing = document.getElementById('jsonld-article');
          if (existing) existing.remove();
          const article = {
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: p?.title,
            description: description || undefined,
            image: p?.featured_image_url ? [p.featured_image_url] : undefined,
            author: p?.author_name ? { "@type": "Person", name: p.author_name } : { "@type": "Organization", name: tenantName },
            datePublished: p?.publish_date || undefined,
            dateModified: p?.updated_at || p?.publish_date || undefined,
            mainEntity: {
              "@type": "Article",
              headline: p?.title,
            }
          } as any;
          const s = document.createElement('script');
          s.type = 'application/ld+json';
          s.id = 'jsonld-article';
          s.text = JSON.stringify(article);
          document.head.appendChild(s);
        } catch {}
      } catch (e) {
        toast.error('Failed to load post');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tenantId, tenantName, slug]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const readingTime = post?.content
    ? Math.ceil(post.content.replace(/<[^>]*>/g, '').split(/\s+/).length / 200)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <Toaster position="top-right" />

      {/* Header with Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Blog
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {loading ? (
            <div className="text-center">
              <div className="animate-spin h-12 w-12 border-4 border-slate-900 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-600">Loading article...</p>
            </div>
          ) : !post ? (
            <div className="text-center py-16">
              <p className="text-slate-600 text-lg mb-4">Article not found</p>
              <Link to="/blog" className="text-slate-900 font-semibold hover:text-slate-700">
                Return to Blog
              </Link>
            </div>
          ) : (
            <>
              {/* Breadcrumb */}
              <nav className="mb-6 flex items-center gap-2 text-sm text-slate-600">
                <Link to="/blog" className="hover:text-slate-900">Blog</Link>
                <span>/</span>
                {post.category && (
                  <>
                    <span>{post.category}</span>
                    <span>/</span>
                  </>
                )}
                <span className="text-slate-900 font-medium">{post.title}</span>
              </nav>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                {post.title}
              </h1>

              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-4 md:gap-6 text-slate-600 mb-8 pb-8 border-b border-slate-200">
                {post.publish_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <time dateTime={post.publish_date} className="font-medium">
                      {formatDate(post.publish_date)}
                    </time>
                  </div>
                )}
                
                {readingTime > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📖</span>
                    <span className="font-medium">{readingTime} min read</span>
                  </div>
                )}

                {post.category && (
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-900">{post.category}</span>
                  </div>
                )}

                {post.author_name && (
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center text-xs font-bold text-white">
                      {post.author_name.charAt(0)}
                    </span>
                    <span className="font-medium text-slate-900">{post.author_name}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Featured Image */}
      {post?.featured_image_url && !loading && (
        <section className="bg-slate-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full h-96 object-cover rounded-xl shadow-lg"
            />
          </div>
        </section>
      )}

      {/* Article Content */}
      {!loading && post && (
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Share Buttons */}
          <div className="flex items-center gap-3 mb-8 pb-8 border-b border-slate-200">
            <span className="text-sm font-medium text-slate-600">Share:</span>
            <button
              onClick={() => {
                const url = window.location.href;
                const text = `Check out: ${post.title}`;
                if (navigator.share) {
                  navigator.share({ title: post.title, text: text, url: url });
                } else {
                  navigator.clipboard.writeText(url);
                  toast.success('Link copied to clipboard');
                }
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-700"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm">Share</span>
            </button>
          </div>

          {/* Article Body */}
          <article className="prose prose-lg max-w-none prose-slate mb-12">
            {/* Extract and render content with proper formatting */}
            <div
              className="text-slate-700 leading-relaxed space-y-6"
              dangerouslySetInnerHTML={{
                __html: post.content || '<p>No content available</p>'
              }}
            />
          </article>

          {/* Tags */}
          {post.tags && (
            <div className="mb-12 pb-12 border-b border-slate-200">
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(post.tags)
                  ? post.tags
                  : post.tags.split(',')
                ).map((tag: string) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm font-medium hover:bg-slate-200 transition-colors"
                  >
                    #{tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Author Info */}
          {post.author_name && (
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-6 mb-12">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-300 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
                  {post.author_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">About the Author</h3>
                  <p className="text-slate-600 text-sm">{post.author_name}</p>
                  <p className="text-slate-500 text-sm mt-2">Published on {formatDate(post.publish_date)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Related/Back Link */}
          <div className="text-center pt-8">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to All Articles
            </Link>
          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-16 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-slate-400">&copy; 2024 {tenantName}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

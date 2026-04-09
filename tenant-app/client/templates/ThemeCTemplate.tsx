import { useEffect, useState, useRef } from "react";
import { getStorefrontProductsWithPagination, createOrder, getStorefrontConfig, validateDiscount, getPublishedPages, getBlogPosts, getHeroSliders, getContactUs, getPaymentInfo } from "@/lib/api";
import { getTenantIdFromEnv, getTenantNameFromEnv, formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import "./ThemeCTemplate.css";
import "../components/SearchModal.css";
import { saveCart, loadCart } from "@/lib/cart";
import { useNavigate, Link } from "react-router-dom";
import { getWishlist, toggleWishlist } from "@/lib/themes";
import { Search, Heart, Package, X, Facebook, Instagram, Play, Star, Truck, CheckCircle, Award, Zap, Shield, Menu, Download } from "lucide-react";
import SearchModal from "@/components/SearchModal";
import ThemeCHeader from "@/components/ThemeCHeader";
import { InfoTabs } from "@/components/Tabs";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  stock_quantity: number;
  category: string;
}

export default function ThemeCTemplate() {
  const tenantId = getTenantIdFromEnv();
  const defaultTenantName = getTenantNameFromEnv();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [minOrderAmount, setMinOrderAmount] = useState(0);
  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState<any>(null);
  const [publishedPages, setPublishedPages] = useState<any[]>([]);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tenantName, setTenantName] = useState(defaultTenantName);
  const [tenantLogo, setTenantLogo] = useState<string | null>(null);
  const [heroSliders, setHeroSliders] = useState<any[]>([]);
  const [announcementMessage, setAnnouncementMessage] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState({ youtube: "", instagram: "", facebook: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [priceListUrl, setPriceListUrl] = useState<string | null>(null);
  const searchSectionRef = useRef<HTMLDivElement>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [tabs, setTabs] = useState<any[]>([]);
  const [contactUs, setContactUs] = useState<any>(null);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);

  useEffect(() => {
    const loadPersistedCart = () => {
      try {
        const cartItems = loadCart(tenantId);
        const cartMap = new Map(cartItems.map(item => [item.productId, item.quantity]));
        setCart(cartMap);
      } catch (err) {
        console.warn("Could not load cart:", err);
      }
    };

    const loadPersistedWishlist = () => {
      try {
        const saved = getWishlist();
        setWishlist(new Set(saved));
      } catch (err) {
        console.warn("Could not load wishlist:", err);
      }
    };

    const loadPriceListUrl = () => {
      try {
        const url = localStorage.getItem("priceListUrl");
        if (url) {
          setPriceListUrl(url);
        }
      } catch (err) {
        console.warn("Could not load price list URL:", err);
      }
    };

    loadPersistedCart();
    loadPersistedWishlist();
    loadPriceListUrl();
  }, [tenantId]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const result = await getStorefrontProductsWithPagination(tenantId, { page: 1, limit: 12 });
        setProducts(result.data);
        setCurrentPage(1);
        setTotalPages(result.pagination.pages);

        const extractedCategories = Array.from(new Set(result.data.map((p) => p.category).filter(Boolean))) as string[];
        setCategories(extractedCategories);

        const config: any = await getStorefrontConfig(tenantId);
        if (config?.seo?.minOrderAmount) {
          setMinOrderAmount(config.seo.minOrderAmount);
        }

        const API_HOST = (((import.meta.env.VITE_BACKEND_URL as string) || "http://localhost:8080").replace(/\/+$/g, "")).replace(/\/api$/, "");
        const toAbsoluteUrl = (u?: string | null): string | undefined => {
          if (!u) return undefined;
          if (/^https?:\/\//i.test(u)) return u;
          return `${API_HOST}${u.startsWith("/") ? "" : "/"}${u}`;
        };

        try {
          if (config?.theme?.companyName) {
            setTenantName(config.theme.companyName);
          }
          if (config?.theme?.logo) {
            setTenantLogo(toAbsoluteUrl(config.theme.logo)?? null);
          }
        } catch (err) {
          console.warn("Could not load business details:", err);
        }

        try {
          const sliders = await getHeroSliders(tenantId);
          if (Array.isArray(sliders)) {
            setHeroSliders(sliders);
          }
        } catch (err) {
          console.warn("Could not load hero sliders:", err);
        }

        if (config?.announcementMessage) {
          setAnnouncementMessage(config.announcementMessage);
        }

        try {
          setSocialLinks({
            youtube: config?.business?.youtubeUrl || "",
            instagram: config?.business?.instagramUrl || "",
            facebook: config?.business?.facebookUrl || "",
          });
        } catch (err) {
          console.warn("Could not load social media links:", err);
        }

        // Fetch and set tabs configuration
        try {
          if (config?.tabs && Array.isArray(config.tabs)) {
            setTabs(config.tabs);
          }
        } catch (err) {
          console.warn("Could not load tabs:", err);
        }

        // Fetch contact us info
        try {
          const contactData = await getContactUs(tenantId);
          if (contactData) {
            setContactUs(contactData);
          }
        } catch (err) {
          console.warn("Could not load contact info:", err);
        }

        // Fetch payment info
        try {
          const paymentData = await getPaymentInfo(tenantId);
          if (paymentData) {
            setPaymentInfo(paymentData);
          }
        } catch (err) {
          console.warn("Could not load payment info:", err);
        }

        try {
          document.title = config?.seo?.title || tenantName || 'Store';
          const metaDescription = document.querySelector('meta[name="description"]');
          if (metaDescription) {
            metaDescription.setAttribute('content', config?.seo?.description || 'Welcome to our store');
          }
        } catch (err) {
          console.warn("Could not update meta tags:", err);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [tenantId]);

  useEffect(() => {
    if (tenantName) {
      document.title = tenantName;
    }
  }, [tenantName]);

  useEffect(() => {
    try {
      saveCart(tenantId, cart);
    } catch (err) {
      console.warn("Could not save cart:", err);
    }
  }, [cart, tenantId]);

  useEffect(() => {
    const loadPagesAndPosts = async () => {
      try {
        const [pages, posts] = await Promise.all([
          getPublishedPages(tenantId),
          getBlogPosts(tenantId, { limit: 5 }),
        ]);
        setPublishedPages(pages);
        setRecentPosts(posts);
      } catch {}
    };
    loadPagesAndPosts();
  }, [tenantId]);

  useEffect(() => {
    const len = heroSliders.length || 1;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % len);
    }, 3000);
    return () => clearInterval(interval);
  }, [heroSliders.length]);

  const loadMoreProducts = async () => {
    if (currentPage >= totalPages) {
      toast.info("No more products to load");
      return;
    }

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      const result = await getStorefrontProductsWithPagination(tenantId, { page: nextPage, limit: 12 });
      setProducts(prev => [...prev, ...result.data]);
      setCurrentPage(nextPage);
      setTotalPages(result.pagination.pages);
    } catch (error) {
      toast.error("Failed to load more products");
    } finally {
      setLoadingMore(false);
    }
  };

  const computedCategories = Array.from(new Set(["All", ...products.map((p) => p.category)])).sort();

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const cartTotal = products.reduce((sum, product) => {
    const quantity = cart.get(product.id) || 0;
    return sum + product.price * quantity;
  }, 0);

  const discount = discountApplied ? discountApplied.discountAmount : 0;
  const total = cartTotal - discount;

  const addToCart = (productId: string) => {
    const newCart = new Map(cart);
    newCart.set(productId, (newCart.get(productId) || 0) + 1);
    setCart(newCart);
    toast.success("Added to cart");
  };

  const toggleWishlistItem = (productId: string) => {
    const isCurrentlyLiked = wishlist.has(productId);
    const updated = new Set(wishlist);
    if (isCurrentlyLiked) {
      updated.delete(productId);
      setWishlist(updated);
      toast.success("Removed from favorites");
    } else {
      updated.add(productId);
      setWishlist(updated);
      toast.success("Added to favorites");
    }
    toggleWishlist(productId);
  };

  const API_HOST = (((import.meta.env.VITE_BACKEND_URL as string) || "http://localhost:8080").replace(/\/+$/g, "")).replace(/\/api$/, "");
  const toUrl = (u?: string | null) => !u ? undefined : (/^https?:\/\//i.test(u) ? u : `${API_HOST}${u.startsWith("/") ? "" : "/"}${u}`);

  return (
    <div className="theme-c-container" data-testid="theme-c-container">
      {/* Announcement Banner */}
      {announcementMessage && (
        <div className="theme-c-announcement">
          <p>{announcementMessage}</p>
        </div>
      )}

      {/* Header */}
      <ThemeCHeader
        tenantName={tenantName}
        tenantLogo={tenantLogo}
        cartSize={cart.size}
        wishlistSize={wishlist.size}
        onSearchClick={() => setShowSearchModal(true)}
        onWishlistClick={() => setShowWishlistModal(true)}
        onCheckout={() => { saveCart(tenantId, cart); navigate('/checkout'); }}
        priceListUrl={priceListUrl}
        showContactUs={!!contactUs}
        showPaymentInfo={!!paymentInfo}
      />

      {/* Hero Carousel / Banner */}
      <section className="theme-c-hero">
        <div className="theme-c-hero-container">
          <div className="theme-c-hero-slide">
            {heroSliders.length > 0 && heroSliders[carouselIndex]?.image_url && (
              <img src={toUrl(heroSliders[carouselIndex].image_url)} alt="Hero" className="theme-c-hero-img" />
            )}
            <div className="theme-c-hero-content">
              <h2>{heroSliders.length > 0 ? (heroSliders[carouselIndex]?.title || tenantName) : tenantName}</h2>
              <p>{heroSliders.length > 0 ? (heroSliders[carouselIndex]?.subtitle || "Welcome to our store") : "Explore our exclusive collection"}</p>
            </div>
          </div>
          {heroSliders.length > 1 && (
            <div className="theme-c-hero-dots">
              {heroSliders.map((_, idx) => (
                <button
                  key={idx}
                  className={`theme-c-dot ${idx === carouselIndex ? "active" : ""}`}
                  onClick={() => setCarouselIndex(idx)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <div className="theme-c-main">
        {/* Search Bar */}
        {products.length > 0 && (
          <div className="theme-c-search-section" ref={searchSectionRef}>
            <div className="theme-c-search-wrapper">
              <Search size={20} className="theme-c-search-icon" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="theme-c-search-input"
              />
            </div>
          </div>
        )}

        {/* Products Section */}
        {loading ? (
          <div className="theme-c-loading">
            <div className="theme-c-loader"></div>
            <p>Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="theme-c-empty">
            <p>No products available</p>
          </div>
        ) : (
          <div className="theme-c-products-grid">
            {filteredProducts.map((product) => (
              <div key={product.id} className="theme-c-product-card">
        <div className="theme-c-card-image-wrapper">
  {product.imageUrl && (
    <img
      src={toUrl(product.imageUrl)}
      alt={product.name}
      className="theme-c-card-image"
      onClick={() => setLightboxImage(toUrl(product.imageUrl) || null)}
    />
  )}
</div>
                <div className="theme-c-card-content">
                  <h3 className="theme-c-card-title" onClick={() => navigate('/products')} style={{ cursor: 'pointer', color: 'inherit' }}>
                    {product.name}
                  </h3>
                  <p className="theme-c-card-desc">{product.description}</p>
                  <div className="theme-c-card-price">{formatPrice(product.price)}</div>
                  <div className="theme-c-card-actions">
                    <button
                      className="theme-c-card-btn"
                      onClick={() => addToCart(product.id)}
                      disabled={product.stock_quantity === 0}
                    >
                      Add to Cart
                    </button>
                    <button
                      onClick={() => toggleWishlistItem(product.id)}
                      className={`theme-c-favorite-btn ${wishlist.has(product.id) ? 'active' : ''}`}
                    >
                      <Heart size={18} fill={wishlist.has(product.id) ? "currentColor" : "none"} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && products.length > 0 && currentPage < totalPages && (
          <div className="theme-c-load-more-container">
            <button
              onClick={loadMoreProducts}
              disabled={loadingMore}
              className="theme-c-load-more-btn"
            >
              {loadingMore ? "Loading..." : "Load More Products"}
            </button>
          </div>
        )}
      </div>

      {/* Why Choose Us Section */}
      <section className="theme-c-why-section">
        <div className="theme-c-why-content">
          <h2 className="theme-c-why-title">Why Choose Us?</h2>
          <div className="theme-c-why-grid">
            <div className="theme-c-why-box">
              <div className="theme-c-why-icon"><Award size={40} /></div>
              <h3>Premium Quality</h3>
              <p>100% authentic products with quality guarantee</p>
            </div>
            <div className="theme-c-why-box">
              <div className="theme-c-why-icon"><Zap size={40} /></div>
              <h3>Fast Processing</h3>
              <p>Quick order processing and shipment</p>
            </div>
            <div className="theme-c-why-box">
              <div className="theme-c-why-icon"><Shield size={40} /></div>
              <h3>Secure Payments</h3>
              <p>Safe and encrypted payment processing</p>
            </div>
            <div className="theme-c-why-box">
              <div className="theme-c-why-icon"><Truck size={40} /></div>
              <h3>Reliable Delivery</h3>
              <p>Timely and secure delivery to your doorstep</p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="theme-c-stats-section">
        <div className="theme-c-stats-grid">
          <div className="theme-c-stat">
            <div className="theme-c-stat-number">10K+</div>
            <div className="theme-c-stat-label">Happy Customers</div>
          </div>
          <div className="theme-c-stat">
            <div className="theme-c-stat-number">5K+</div>
            <div className="theme-c-stat-label">Products Available</div>
          </div>
          <div className="theme-c-stat">
            <div className="theme-c-stat-number">24/7</div>
            <div className="theme-c-stat-label">Customer Support</div>
          </div>
          <div className="theme-c-stat">
            <div className="theme-c-stat-number">100%</div>
            <div className="theme-c-stat-label">Satisfaction Rate</div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="theme-c-testimonials-section">
        <h2 className="theme-c-testimonials-title">Customer Reviews</h2>
        <p className="theme-c-testimonials-subtitle">What our customers are saying</p>
        <div className="theme-c-testimonials-grid">
          <div className="theme-c-testimonial-card">
            <div className="theme-c-testimonial-stars">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className="theme-c-star-filled" />
              ))}
            </div>
            <p className="theme-c-testimonial-text">"Excellent quality products and very fast delivery. Highly recommend this store!"</p>
            <p className="theme-c-testimonial-author">— Sarah Johnson</p>
          </div>
          <div className="theme-c-testimonial-card">
            <div className="theme-c-testimonial-stars">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className="theme-c-star-filled" />
              ))}
            </div>
            <p className="theme-c-testimonial-text">"Great customer service and competitive prices. My go-to store for all my needs."</p>
            <p className="theme-c-testimonial-author">— Michael Chen</p>
          </div>
          <div className="theme-c-testimonial-card">
            <div className="theme-c-testimonial-stars">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className="theme-c-star-filled" />
              ))}
            </div>
            <p className="theme-c-testimonial-text">"Amazing variety of products. The quality exceeded my expectations."</p>
            <p className="theme-c-testimonial-author">— Emily Rodriguez</p>
          </div>
        </div>
      </section>

      {/* Info Tabs Section */}
      {tabs.length > 0 && (
        <section className="theme-c-info-tabs-section">
          <div className="theme-c-section">
            <div className="theme-c-tabs-wrapper">
              <InfoTabs
                tabs={tabs}
                tabListClassName="theme-c-tab-list"
                tabTriggerClassName="theme-c-tab-trigger"
                tabContentClassName="theme-c-tab-content"
              />
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="theme-c-footer">
        <div className="theme-c-footer-top">
          {(publishedPages.length > 0 || contactUs || paymentInfo) && (
            <div className="theme-c-footer-col">
              <h4>Pages</h4>
              <div className="theme-c-footer-links">
                {publishedPages.map((p) => (
                  <Link key={p.slug} to={`/page/${encodeURIComponent(p.slug)}`} className="theme-c-footer-link">{p.title}</Link>
                ))}
                {contactUs && <Link to="/page/contact" className="theme-c-footer-link">Contact Us</Link>}
                {paymentInfo && <Link to="/page/payment-info" className="theme-c-footer-link">Payment Info</Link>}
              </div>
            </div>
          )}
          {recentPosts.length > 0 && (
            <div className="theme-c-footer-col">
              <h4>Recent Posts</h4>
              <div className="theme-c-footer-links">
                {recentPosts.slice(0, 3).map((p) => (
                  <Link key={p.slug} to={`/blog/${encodeURIComponent(p.slug)}`} className="theme-c-footer-link">{p.title}</Link>
                ))}
                <Link to="/blog" className="theme-c-footer-link">View all</Link>
              </div>
            </div>
          )}
          {(socialLinks.facebook || socialLinks.instagram || socialLinks.youtube) && (
            <div className="theme-c-footer-col">
              <h4>Follow Us</h4>
              <div className="theme-c-footer-links">
                {socialLinks.facebook && (
                  <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="theme-c-footer-link" aria-label="Facebook"><Facebook size={18} className="inline mr-2" />Facebook</a>
                )}
                {socialLinks.instagram && (
                  <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="theme-c-footer-link" aria-label="Instagram"><Instagram size={18} className="inline mr-2" />Instagram</a>
                )}
                {socialLinks.youtube && (
                  <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="theme-c-footer-link" aria-label="YouTube"><Play size={18} className="inline mr-2" />YouTube</a>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="theme-c-footer-bottom">
          <p>&copy; 2024 {tenantName}. All rights reserved.</p>
        </div>
      </footer>

      {/* Wishlist Modal */}
      {showWishlistModal && (
        <div className="theme-c-modal-overlay" onClick={() => setShowWishlistModal(false)}>
          <div className="theme-c-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="theme-c-modal-header">
              <h2>My Favorites</h2>
              <button
                className="theme-c-modal-close"
                onClick={() => setShowWishlistModal(false)}
              >
                <X size={24} />
              </button>
            </div>
            <div className="theme-c-modal-body">
              {wishlist.size === 0 ? (
                <div className="theme-c-empty-wishlist">
                  <Heart size={48} />
                  <p>Your wishlist is empty</p>
                </div>
              ) : (
                <div className="theme-c-wishlist-items">
                  {products.filter(p => wishlist.has(p.id)).map((product) => (
                    <div key={product.id} className="theme-c-wishlist-item">
                      <div className="theme-c-wishlist-image">
                        {product.imageUrl && (
                          <img src={product.imageUrl} alt={product.name} />
                        )}
                      </div>
                      <div className="theme-c-wishlist-details">
                        <h4>{product.name}</h4>
                        <p>{formatPrice(product.price)}</p>
                      </div>
                      <button
                        className="theme-c-wishlist-add-btn"
                        onClick={() => addToCart(product.id)}
                        disabled={product.stock_quantity === 0}
                      >
                        Add
                      </button>
                      <button
                        className="theme-c-wishlist-remove-btn"
                        onClick={() => toggleWishlistItem(product.id)}
                      >
                        <Heart size={16} fill="currentColor" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        tenantId={tenantId}
        onAddToCart={addToCart}
        formatPriceFn={formatPrice}
      />

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="theme-c-lightbox-overlay"
          onClick={() => setLightboxImage(null)}
        >
          <div className="theme-c-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="theme-c-lightbox-close"
              onClick={() => setLightboxImage(null)}
              aria-label="Close lightbox"
            >
              <X size={32} />
            </button>
            <img
              src={lightboxImage}
              alt="Product preview"
              className="theme-c-lightbox-image"
            />
          </div>
        </div>
      )}

      {/* Fixed Footer Checkout */}
      {cart.size > 0 && (
        <div className="theme-c-fixed-footer">
          <div className="theme-c-footer-content">
            <div className="theme-c-footer-left">
              <span className="theme-c-footer-items">{cart.size} item{cart.size !== 1 ? 's' : ''} in cart</span>
              <span className="theme-c-footer-total">{formatPrice(total)}</span>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="theme-c-footer-checkout-btn"
            >
              Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

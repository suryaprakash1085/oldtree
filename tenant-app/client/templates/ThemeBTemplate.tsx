import { useEffect, useState, useRef } from "react";
import { getStorefrontProductsWithPagination, createOrder, getStorefrontConfig, validateDiscount, getPublishedPages, getBlogPosts, getHeroSliders, getContactUs, getPaymentInfo } from "@/lib/api";
import { getTenantIdFromEnv, getTenantNameFromEnv, formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import "./ThemeBTemplate.css";
import "../components/SearchModal.css";
import { saveCart, loadCart } from "@/lib/cart";
import { useNavigate, Link } from "react-router-dom";
import { getWishlist, toggleWishlist, isInWishlist } from "@/lib/themes";
import { ShoppingCart, Target, Star, CheckCircle, Search, Heart, Truck, MessageCircle, Gift, Facebook, Instagram, Play, X, Award, Zap, Lock, ArrowRight, ChevronDown, Menu, Download } from "lucide-react";
import SearchModal from "@/components/SearchModal";
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

interface CarouselItem {
  type: "banner" | "feature";
  id: string;
  title?: string;
  subtitle?: string;
  image?: string;
  index?: number;
  total?: number;
}

export default function ThemeBTemplate() {
  const tenantId = getTenantIdFromEnv();
  const defaultTenantName = getTenantNameFromEnv();
  const [products, setProducts] = useState<Product[]>([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
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
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    address: "",
  });
  const [email, setEmail] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [priceListUrl, setPriceListUrl] = useState<string | null>(null);
  const [tabs, setTabs] = useState<any[]>([]);
  const [contactUs, setContactUs] = useState<any>(null);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const searchSectionRef = useRef<HTMLDivElement>(null);

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
        const result = await getStorefrontProductsWithPagination(tenantId, { page: 1, limit: 10 });
        setProducts(result.data);
        setCurrentPage(1);
        setTotalPages(result.pagination.pages);

        const config = await getStorefrontConfig(tenantId);
        if (config?.seo?.minOrderAmount) {
          setMinOrderAmount(config.seo.minOrderAmount);
        }

        // Fetch and set business details (company name and logo)
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
            setTenantLogo(toAbsoluteUrl(config.theme.logo));
          }
        } catch (err) {
          console.warn("Could not load business details:", err);
        }

        // Fetch hero sliders
        try {
          const sliders = await getHeroSliders(tenantId);
          if (Array.isArray(sliders)) {
            setHeroSliders(sliders);
          }
        } catch (err) {
          console.warn("Could not load hero sliders:", err);
        }

        // Fetch announcement message
        if (config?.announcementMessage) {
          setAnnouncementMessage(config.announcementMessage);
        }

        // Fetch social media links
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

        // Update meta tags for SEO
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
        toast.error(
          error instanceof Error ? error.message : "Failed to load products"
        );
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [tenantId]);

  // Update meta tags when tenantName changes
  useEffect(() => {
    if (tenantName) {
      document.title = tenantName;
    }
  }, [tenantName]);

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    try {
      saveCart(tenantId, cart);
    } catch (err) {
      console.warn("Could not save cart:", err);
    }
  }, [cart, tenantId]);

  const loadMoreProducts = async () => {
    if (currentPage >= totalPages) {
      toast.info("No more products to load");
      return;
    }

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      const result = await getStorefrontProductsWithPagination(tenantId, { page: nextPage, limit: 10 });
      setProducts(prev => [...prev, ...result.data]);
      setCurrentPage(nextPage);
      setTotalPages(result.pagination.pages);
    } catch (error) {
      toast.error("Failed to load more products");
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    // default interval handled later after banners determined
  }, []);

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

  const categories = Array.from(new Set(["All", ...products.map((p) => p.category)]));
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const trendingProducts = products.slice(0, 8);
  const giftBoxProducts = products.filter((p) => p.category.toLowerCase().includes("gift")).slice(0, 4);

  // Inject Product JSON-LD for trending products
  useEffect(() => {
    try {
      const items = trendingProducts.slice(0, 20).map((p: any) => ({
        "@context": "https://schema.org",
        "@type": "Product",
        name: p.name,
        image: p.imageUrl ? [p.imageUrl] : [],
        description: p.description || undefined,
        sku: p.sku || undefined,
        brand: { "@type": "Brand", name: tenantName || undefined },
        offers: {
          "@type": "Offer",
          url: `${window.location.origin}/product/${p.id}`,
          priceCurrency: "INR",
          price: p.price?.toString?.() || "0",
          availability: p.stock_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        },
      }));

      const existing = document.getElementById('jsonld-products-trending');
      if (existing) existing.remove();
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.id = 'jsonld-products-trending';
      s.text = JSON.stringify(items.length === 1 ? items[0] : { "@graph": items });
      document.head.appendChild(s);
    } catch (err) {
      // ignore
    }
    return () => {
      const el = document.getElementById('jsonld-products-trending');
      if (el) el.remove();
    };
  }, [trendingProducts]);

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

  const cartTotal = products.reduce((sum, product) => {
    const quantity = cart.get(product.id) || 0;
    return sum + product.price * quantity;
  }, 0);

  const discount = discountApplied ? discountApplied.discountAmount : 0;
  const total = cartTotal - discount;

  const applyDiscount = async () => {
    try {
      const result = await validateDiscount(tenantId, discountCode, cartTotal);
      setDiscountApplied(result);
      toast.success("Discount applied!");
    } catch (error) {
      toast.error("Invalid discount code");
    }
  };

  const handleNewsletterSignup = async () => {
    if (!email) {
      toast.error("Please enter a valid email");
      return;
    }
    toast.success("Thank you for subscribing!");
    setEmail("");
  };

  const faqs = [
    {
      question: "What is your return policy?",
      answer: "We offer a 30-day return policy on all products. Items must be unused and in original packaging."
    },
    {
      question: "How long does shipping take?",
      answer: "Standard shipping takes 5-7 business days. Express shipping is available for faster delivery."
    },
    {
      question: "Are your products authentic?",
      answer: "Yes, all products are 100% authentic. We source directly from authorized distributors."
    },
    {
      question: "Do you offer bulk discounts?",
      answer: "Yes! Contact our sales team for special bulk pricing on large orders."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, debit cards, digital wallets, and bank transfers."
    }
  ];

  const handleCheckout = async () => {
    if (
      !formData.customerName ||
      !formData.customerEmail ||
      !formData.customerPhone ||
      !formData.address ||
      cart.size === 0
    ) {
      toast.error("Please fill in all required fields (name, email, phone, address)");
      return;
    }

    if (minOrderAmount > 0 && total < minOrderAmount) {
      toast.error(`Minimum order amount is ₹${minOrderAmount.toLocaleString()}. Current total: ₹${total.toLocaleString()}`);
      return;
    }

    try {
      const cartItems = Array.from(cart.entries()).map(([productId, quantity]) => ({
        productId,
        quantity,
      }));

      const order = await createOrder(tenantId, {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        items: cartItems,
        shippingAddress: {
          address: formData.address,
        },
        discountCode: discountApplied ? discountCode : undefined,
      });

      toast.success(`Order created! Order ID: ${order.data?.order_number || 'Pending'}`);
      const orderNumber = order.data?.orderNumber || order.data?.order_number;
      setCart(new Map());
      setCheckoutOpen(false);
      setFormData({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        address: "",
      });
      setDiscountApplied(null);
      setDiscountCode("");
      navigate(`/order/${orderNumber}`);
    } catch (error) {
      toast.error("Failed to create order");
    }
  };

  // Use hero sliders from API if present
  const API_HOST = (((import.meta.env.VITE_BACKEND_URL as string) || "http://localhost:8080").replace(/\/+$/g, "")).replace(/\/api$/, "");
  const toUrl = (u?: string | null) => !u ? undefined : (/^https?:\/\//i.test(u) ? u : `${API_HOST}${u.startsWith("/") ? "" : "/"}${u}`);
  const carouselBanners = heroSliders && heroSliders.length > 0
    ? heroSliders.map((h: any) => ({ title: h.title || "New Products", subtitle: h.subtitle || "Check out our latest collection", image: toUrl(h.image_url), bgColor: undefined }))
    : [
      { title: "WELCOME", subtitle: "Explore our collection", bgColor: "#3b82f6" },
      { title: "SPECIAL OFFERS", subtitle: "Limited time deals", bgColor: "#f97316" },
      { title: "NEW ARRIVALS", subtitle: "Latest products available", bgColor: "#8b5cf6" },
    ];

  useEffect(() => {
    const len = carouselBanners.length || 1;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % len);
    }, 3000);
    return () => clearInterval(interval);
  }, [carouselBanners.length]);

  return (
    <div className="theme-b-container" data-testid="theme-b-container">

      {/* Announcement Bar */}
      {announcementMessage && (
        <div className="theme-b-announcement">
          <p>{announcementMessage}</p>
        </div>
      )}

      {/* Header */}
      <header className="theme-b-header">
        <div className="theme-b-header-content">
          <div className="theme-b-logo">
            {tenantLogo ? (
              <img src={tenantLogo} alt={tenantName} className="theme-b-logo-img" />
            ) : (
              <span className="theme-b-logo-text">{tenantName}</span>
            )}
          </div>
          <button className="theme-b-nav-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <nav className={`theme-b-header-nav ${mobileMenuOpen ? 'open' : ''}`}>
            {categories.map((cat) => (
              <button
                key={cat}
                className="theme-b-header-btn"
                onClick={() => { setSelectedCategory(cat); setMobileMenuOpen(false); }}
              >
                {cat}
              </button>
            ))}
            <Link to="/blog" className="theme-b-header-btn" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
            <Link to="/track-order" className="theme-b-header-btn" onClick={() => setMobileMenuOpen(false)}>Track Order</Link>
            {publishedPages.map((p) => (
              <Link key={p.slug} to={`/page/${encodeURIComponent(p.slug)}`} className="theme-b-header-btn" onClick={() => setMobileMenuOpen(false)}>
                {p.title}
              </Link>
            ))}
            {contactUs && <Link to="/page/contact" className="theme-b-header-btn" onClick={() => setMobileMenuOpen(false)}>Contact Us</Link>}
            {paymentInfo && <Link to="/page/payment-info" className="theme-b-header-btn" onClick={() => setMobileMenuOpen(false)}>Payment Info</Link>}
          </nav>
          <div className="theme-b-header-actions">
            <button
              className="theme-b-header-action"
              onClick={() => setShowSearchModal(true)}
              title="Search products"
            >
              <Search size={20} />
            </button>
            <button
              className="theme-b-header-action"
              onClick={() => setShowWishlistModal(true)}
              title={`View wishlist (${wishlist.size})`}
            >
              <Heart size={20} />
            </button>
            {priceListUrl && (
              <a
                href={priceListUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="theme-b-header-action hover:opacity-75 transition-opacity"
                title="Download price list"
              >
                <Download size={20} />
              </a>
            )}
            {/* <div className="theme-b-cart-icon">
              <ShoppingCart size={24} />
              {cart.size > 0 && <span className="theme-b-cart-badge">{cart.size}</span>}
            </div> */}
          </div>
        </div>
      </header>


      {/* Hero Banner Carousel */}
      <section className="theme-b-carousel">
        <div className="theme-b-carousel-container">
          <div className="theme-b-carousel-slide">
            {carouselBanners[carouselIndex]?.image && (
              <img
                src={carouselBanners[carouselIndex].image}
                alt={carouselBanners[carouselIndex]?.title || 'Banner'}
                className="theme-b-carousel-image"
              />
            )}
            <div className="theme-b-carousel-content">
              <h2 className="theme-b-carousel-title">{carouselBanners[carouselIndex]?.title}</h2>
              <p className="theme-b-carousel-subtitle">{carouselBanners[carouselIndex]?.subtitle}</p>
            </div>
          </div>
          {carouselBanners.length > 1 && (
            <div className="theme-b-carousel-dots">
              {carouselBanners.map((_, idx) => (
                <button
                  key={idx}
                  className={`theme-b-carousel-dot ${idx === carouselIndex ? "active" : ""}`}
                  onClick={() => setCarouselIndex(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Feature Boxes */}
      <section className="theme-b-features">
        <div className="theme-b-features-content">
          <div className="theme-b-feature-box">
            <span className="theme-b-feature-emoji"><Target size={40} /></span>
            <h4>UPTO 90% OFF</h4>
            <p>Exclusive Discounts</p>
          </div>
          <div className="theme-b-feature-box">
            <span className="theme-b-feature-emoji"><span className="text-3xl">₹</span></span>
            <h4>BEST PRICE</h4>
            <p>Competitive Rates</p>
          </div>
          <div className="theme-b-feature-box">
            <span className="theme-b-feature-emoji"><Truck size={40} /></span>
            <h4>FAST DELIVERY</h4>
            <p>Across All India</p>
          </div>
          <div className="theme-b-feature-box">
            <span className="theme-b-feature-emoji"><Star size={40} /></span>
            <h4>PREMIUM QUALITY</h4>
            <p>100% Authentic</p>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      {products.length > 0 && (
        <section className="theme-b-search-section" ref={searchSectionRef}>
          <div className="theme-b-search-container">
            {/* <Search size={20} className="theme-b-search-icon" /> */}
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="theme-b-search-input"
            />
          </div>
        </section>
      )}

      {/* Trending Section */}
      <section className="theme-b-section">
        <div className="theme-b-section-header">
          <h2 className="theme-b-section-title">TRENDING NOW</h2>
          <p className="theme-b-section-subtitle">Most Popular Products This Season</p>
        </div>

        {loading ? (
          <div className="theme-b-loading">
            <div className="theme-b-loader"></div>
            <p>Loading products...</p>
          </div>
        ) : (filteredProducts.length === 0 && searchQuery) ? (
          <div className="theme-b-empty-state">
            <p>No products match your search</p>
          </div>
        ) : trendingProducts.filter(p => filteredProducts.some(fp => fp.id === p.id)).length > 0 ? (
          <div className="theme-b-product-grid">
            {trendingProducts.filter(p => filteredProducts.some(fp => fp.id === p.id)).map((product) => (
              <div key={product.id} className="theme-b-product-card">
                <div className="theme-b-card-image-wrapper">
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="theme-b-card-image"
                      onClick={() => setLightboxImage(product.imageUrl || null)}
                      style={{ cursor: 'pointer' }}
                    />
                  )}
                  <span className="theme-b-sale-badge">SALE</span>
                </div>
                <div className="theme-b-card-content">
                  <h4 className="theme-b-card-title">{product.name}</h4>
                  <p className="theme-b-card-desc">{product.description}</p>
                  <div className="theme-b-card-rating"><Star size={16} className="inline" /> (4.8)</div>
                  <div className="theme-b-card-price">
                    <span className="theme-b-price-mrp">₹{Math.round(product.price * 1.3)}</span>
                    <span className="theme-b-price-current">{formatPrice(product.price)}</span>
                  </div>
                  <div className="theme-b-card-button-group">
                    <button
                      className="theme-b-card-btn"
                      onClick={() => addToCart(product.id)}
                      disabled={product.stock_quantity === 0}
                    >
                      <ShoppingCart size={16} className="inline mr-1" /> Add to Cart
                    </button>
                    <button
                      onClick={() => toggleWishlistItem(product.id)}
                      className={`theme-b-favorite-btn ${wishlist.has(product.id) ? 'theme-b-favorite-active' : ''}`}
                      title={wishlist.has(product.id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart size={18} fill={wishlist.has(product.id) ? "currentColor" : "none"} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="theme-b-empty">
            <p>No trending products available</p>
          </div>
        )}
      </section>

      {/* Category Filter & Products */}
      <section className="theme-b-section">
        <div className="theme-b-category-filter">
          <h3 className="theme-b-filter-title">Filter by Category</h3>
          <div className="theme-b-filter-buttons">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`theme-b-filter-btn ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="theme-b-product-grid">
            {filteredProducts.map((product) => (
              <div key={product.id} className="theme-b-product-card">
                <div className="theme-b-card-image-wrapper">
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="theme-b-card-image"
                      onClick={() => setLightboxImage(product.imageUrl || null)}
                      style={{ cursor: 'pointer' }}
                    />
                  )}
                  {product.stock_quantity > 0 && <span className="theme-b-sale-badge">SALE</span>}
                </div>
                <div className="theme-b-card-content">
                  <h4 className="theme-b-card-title">{product.name}</h4>
                  <p className="theme-b-card-desc">{product.description}</p>
                  <div className="theme-b-card-rating"><Star size={16} className="inline" /> (4.8)</div>
                  <div className="theme-b-card-price">
                    <span className="theme-b-price-mrp">₹{Math.round(product.price * 1.3)}</span>
                    <span className="theme-b-price-current">{formatPrice(product.price)}</span>
                  </div>
                  <div className="theme-b-card-button-group">
                    <button
                      className="theme-b-card-btn"
                      onClick={() => addToCart(product.id)}
                      disabled={product.stock_quantity === 0}
                    >
                      ₹ Add to Cart
                    </button>
                    <button
                      onClick={() => toggleWishlistItem(product.id)}
                      className={`theme-b-favorite-btn ${wishlist.has(product.id) ? 'theme-b-favorite-active' : ''}`}
                      title={wishlist.has(product.id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart size={18} fill={wishlist.has(product.id) ? "currentColor" : "none"} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="theme-b-empty">
            <p>{searchQuery ? "No products match your search" : "No products in this category"}</p>
          </div>
        )}

        {selectedCategory === "All" && !loading && filteredProducts.length > 0 && currentPage < totalPages && (
          <div className="theme-b-load-more-container">
            <button
              onClick={loadMoreProducts}
              disabled={loadingMore}
              className="theme-b-load-more-btn"
            >
              {loadingMore ? "Loading..." : "Load More Products"}
            </button>
            <p className="theme-b-pagination-info">
              Showing {products.length} products
            </p>
          </div>
        )}
      </section>

      {/* Gift Boxes Section */}
      {products.filter(p => p.category.toLowerCase().includes("gift") && filteredProducts.some(fp => fp.id === p.id)).length > 0 && (
        <section className="theme-b-section theme-b-gift-section">
          <div className="theme-b-section-header">
            <h2 className="theme-b-section-title">GIFT BOXES</h2>
            <p className="theme-b-section-subtitle">Perfect for Celebrations</p>
          </div>
          <div className="theme-b-product-grid">
            {products.filter(p => p.category.toLowerCase().includes("gift") && filteredProducts.some(fp => fp.id === p.id)).slice(0, 4).map((product) => (
              <div key={product.id} className="theme-b-product-card">
                <div className="theme-b-card-image-wrapper">
                  {product.imageUrl && (
                    <img src={product.imageUrl} alt={product.name} className="theme-b-card-image" />
                  )}
                  <span className="theme-b-sale-badge">SALE</span>
                </div>
                <div className="theme-b-card-content">
                  <h4 className="theme-b-card-title">{product.name}</h4>
                  <p className="theme-b-card-desc">{product.description}</p>
                  <div className="theme-b-card-rating"><Star size={16} className="inline" /> (5.0)</div>
                  <div className="theme-b-card-price">
                    <span className="theme-b-price-mrp">₹{Math.round(product.price * 1.3)}</span>
                    <span className="theme-b-price-current">{formatPrice(product.price)}</span>
                  </div>
                  <div className="theme-b-card-button-group">
                    <button
                      className="theme-b-card-btn"
                      onClick={() => addToCart(product.id)}
                      disabled={product.stock_quantity === 0}
                    >
                      <Gift size={16} className="inline mr-1" /> Add Gift Box
                    </button>
                    <button
                      onClick={() => toggleWishlistItem(product.id)}
                      className={`theme-b-favorite-btn ${wishlist.has(product.id) ? 'theme-b-favorite-active' : ''}`}
                      title={wishlist.has(product.id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart size={18} fill={wishlist.has(product.id) ? "currentColor" : "none"} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Why Choose Us Section */}
      <section className="theme-b-why-section">
        <h2 className="theme-b-why-title">WHY CHOOSE US?</h2>
        <div className="theme-b-why-content">
          <div className="theme-b-why-block">
            <span className="theme-b-why-icon"><Truck size={40} /></span>
            <h4>Fast Shipping</h4>
            <p>Same-day delivery available in select areas with reliable courier partners.</p>
          </div>
          <div className="theme-b-why-block">
            <span className="theme-b-why-icon"><CheckCircle size={40} /></span>
            <h4>Quality Assured</h4>
            <p>All products undergo strict quality checks. Authenticity guaranteed.</p>
          </div>
          <div className="theme-b-why-block">
            <span className="theme-b-why-icon"><MessageCircle size={40} /></span>
            <h4>Customer Support</h4>
            <p>24/7 support team ready to assist. Satisfaction guaranteed or money back.</p>
          </div>
        </div>
      </section>

      {/* Cart Summary */}
      {cart.size > 0 && (
        <div className="theme-b-cart-summary">
          <div className="theme-b-cart-info">
            <span className="theme-b-cart-items">{cart.size} Items in Cart</span>
            <span className="theme-b-cart-total">{formatPrice(total)}</span>
          </div>
          <div className="theme-b-cart-actions">
            <button className="theme-b-clear-btn" onClick={() => setCart(new Map())}>
              Clear
            </button>
            <button className="theme-b-checkout-btn" onClick={() => { saveCart(tenantId, cart); navigate('/checkout'); }}>
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}

      {checkoutOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold">Checkout</h2>
              <button onClick={() => setCheckoutOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData({ ...formData, customerName: e.target.value })
                  }
                  placeholder="Full Name"
                  className="w-full border border-gray-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, customerEmail: e.target.value })
                  }
                  placeholder="Email"
                  className="w-full border border-gray-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, customerPhone: e.target.value })
                  }
                  placeholder="Phone"
                  className="w-full border border-gray-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Shipping Address"
                  className="w-full border border-gray-300 rounded-lg p-2"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Discount Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 border border-gray-300 rounded-lg p-2"
                  />
                  <button onClick={applyDiscount} className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300">
                    Apply
                  </button>
                </div>
                {discountApplied && (
                  <p className="text-sm text-green-600">
                    Discount applied: ₹{discount.toLocaleString()}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                {discountApplied && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>{formatPrice(total)}</span>
                </div>
                {minOrderAmount > 0 && total < minOrderAmount && (
                  <div className="flex justify-between text-sm text-red-600 pt-2">
                    <span>Min. Order:</span>
                    <span>{formatPrice(minOrderAmount)}</span>
                  </div>
                )}
              </div>

              <button onClick={handleCheckout} className="w-full py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600">
                Place Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Testimonials Section */}
      <section className="theme-b-testimonials-wrapper">
        <div className="theme-b-section">
          <div className="theme-b-section-header">
            <h2 className="theme-b-section-title">Customer Love Stories</h2>
            <p className="theme-b-section-subtitle">Hear from our satisfied customers</p>
          </div>
          <div className="theme-b-testimonials-carousel">
            <div className="theme-b-testimonial">
              <div className="theme-b-testimonial-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} className="theme-b-star-filled" />
                ))}
              </div>
              <p className="theme-b-testimonial-text">"Outstanding quality and excellent customer service. I'll definitely order again!"</p>
              <p className="theme-b-testimonial-author">- Priya Sharma</p>
              <p className="theme-b-testimonial-location">Verified Buyer from Mumbai</p>
            </div>
            <div className="theme-b-testimonial">
              <div className="theme-b-testimonial-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} className="theme-b-star-filled" />
                ))}
              </div>
              <p className="theme-b-testimonial-text">"Best prices in the market with super fast delivery. Highly recommended!"</p>
              <p className="theme-b-testimonial-author">- Rajesh Patel</p>
              <p className="theme-b-testimonial-location">Verified Buyer from Bangalore</p>
            </div>
            <div className="theme-b-testimonial">
              <div className="theme-b-testimonial-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} className="theme-b-star-filled" />
                ))}
              </div>
              <p className="theme-b-testimonial-text">"Amazing variety and authentic products. Worth every penny!"</p>
              <p className="theme-b-testimonial-author">- Anjali Verma</p>
              <p className="theme-b-testimonial-location">Verified Buyer from Delhi</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges Section */}
      <section className="theme-b-trust-badges">
        <div className="theme-b-section">
          <div className="theme-b-badges-grid">
            <div className="theme-b-badge">
              <div className="theme-b-badge-icon"><Award size={40} /></div>
              <h4>Certified Premium</h4>
              <p>Quality assured products</p>
            </div>
            <div className="theme-b-badge">
              <div className="theme-b-badge-icon"><Lock size={40} /></div>
              <h4>Secure Checkout</h4>
              <p>SSL encrypted payments</p>
            </div>
            <div className="theme-b-badge">
              <div className="theme-b-badge-icon"><Truck size={40} /></div>
              <h4>Free Shipping</h4>
              <p>On orders above ₹500</p>
            </div>
            <div className="theme-b-badge">
              <div className="theme-b-badge-icon"><CheckCircle size={40} /></div>
              <h4>30-Day Returns</h4>
              <p>Hassle-free returns</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="theme-b-faq-section">
        <div className="theme-b-section">
          <div className="theme-b-section-header">
            <h2 className="theme-b-section-title">Frequently Asked Questions</h2>
            <p className="theme-b-section-subtitle">Find answers to common questions</p>
          </div>
          <div className="theme-b-faq-container">
            {faqs.map((faq, idx) => (
              <div key={idx} className="theme-b-faq-item">
                <button
                  className="theme-b-faq-question"
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    size={20}
                    className={`theme-b-faq-icon ${expandedFaq === idx ? "expanded" : ""}`}
                  />
                </button>
                {expandedFaq === idx && (
                  <div className="theme-b-faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Info Tabs Section */}
      {tabs.length > 0 && (
        <section className="theme-b-info-tabs-section">
          <div className="theme-b-section">
            <div className="theme-b-tabs-wrapper">
              <InfoTabs
                tabs={tabs}
                tabListClassName="theme-b-tab-list"
                tabTriggerClassName="theme-b-tab-trigger"
                tabContentClassName="theme-b-tab-content"
              />
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="theme-b-footer">
        <div className="theme-b-footer-grid">
          {(publishedPages.length > 0 || contactUs || paymentInfo) && (
            <div className="theme-b-footer-col">
              <h4>Pages</h4>
              <div className="theme-b-footer-links">
                {publishedPages.map((p) => (
                  <p key={p.slug}><Link to={`/page/${encodeURIComponent(p.slug)}`} className="theme-b-footer-link">{p.title}</Link></p>
                ))}
                {contactUs && <p><Link to="/page/contact" className="theme-b-footer-link">Contact Us</Link></p>}
                {paymentInfo && <p><Link to="/page/payment-info" className="theme-b-footer-link">Payment Info</Link></p>}
              </div>
            </div>
          )}
          {recentPosts.length > 0 && (
            <div className="theme-b-footer-col">
              <h4>Recent Posts</h4>
              <div className="theme-b-footer-links">
                {recentPosts.slice(0, 3).map((p) => (
                  <p key={p.slug}><Link to={`/blog/${encodeURIComponent(p.slug)}`} className="theme-b-footer-link">{p.title}</Link></p>
                ))}
                <p><Link to="/blog" className="theme-b-footer-link">View all</Link></p>
              </div>
            </div>
          )}
          {(socialLinks.facebook || socialLinks.instagram || socialLinks.youtube) && (
            <div className="theme-b-footer-col">
              <h4>Follow Us</h4>
              <div className="theme-b-social-icons">
                {socialLinks.facebook && (
                  <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="theme-b-social-btn" aria-label="Facebook"><Facebook size={20} /></a>
                )}
                {socialLinks.instagram && (
                  <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="theme-b-social-btn" aria-label="Instagram"><Instagram size={20} /></a>
                )}
                {socialLinks.youtube && (
                  <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="theme-b-social-btn" aria-label="YouTube"><Play size={20} /></a>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="theme-b-footer-bottom">
          <p>&copy; 2024 {tenantName}. All Rights Reserved.</p>
        </div>
      </footer>

      {/* Wishlist Modal */}
      {showWishlistModal && (
        <div className="theme-b-modal-overlay" onClick={() => setShowWishlistModal(false)}>
          <div className="theme-b-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="theme-b-modal-header">
              <h2>My Favorites</h2>
              <button
                className="theme-b-modal-close"
                onClick={() => setShowWishlistModal(false)}
              >
                <X size={24} />
              </button>
            </div>
            <div className="theme-b-modal-body">
              {wishlist.size === 0 ? (
                <div className="theme-b-empty-wishlist">
                  <Heart size={48} />
                  <p>Your wishlist is empty</p>
                  <p className="theme-b-empty-wishlist-text">Add items to your favorites to see them here</p>
                </div>
              ) : (
                <div className="theme-b-wishlist-items">
                  {products.filter(p => wishlist.has(p.id)).map((product) => (
                    <div key={product.id} className="theme-b-wishlist-item">
                      <div className="theme-b-wishlist-item-image">
                        {product.imageUrl && (
                          <img src={product.imageUrl} alt={product.name} />
                        )}
                      </div>
                      <div className="theme-b-wishlist-item-details">
                        <h4>{product.name}</h4>
                        <p>{product.description}</p>
                        <div className="theme-b-wishlist-item-price">
                          {formatPrice(product.price)}
                        </div>
                      </div>
                      <div className="theme-b-wishlist-item-actions">
                        <button
                          className="theme-b-wishlist-add-btn"
                          onClick={() => addToCart(product.id)}
                          disabled={product.stock_quantity === 0}
                        >
                          Add to Cart
                        </button>
                        <button
                          className="theme-b-wishlist-remove-btn"
                          onClick={() => toggleWishlistItem(product.id)}
                          title="Remove from favorites"
                        >
                          <Heart size={20} fill="currentColor" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
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
          className="theme-b-lightbox-overlay"
          onClick={() => setLightboxImage(null)}
        >
          <div className="theme-b-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="theme-b-lightbox-close"
              onClick={() => setLightboxImage(null)}
              aria-label="Close lightbox"
            >
              <X size={32} />
            </button>
            <img
              src={lightboxImage}
              alt="Product preview"
              className="theme-b-lightbox-image"
            />
          </div>
        </div>
      )}

      {/* Fixed Footer Checkout */}
      {cart.size > 0 && (
        <div className="theme-b-fixed-footer">
          <div className="theme-b-footer-content">
            <div className="theme-b-footer-left">
              <span className="theme-b-footer-items">{cart.size} item{cart.size !== 1 ? 's' : ''} in cart</span>
              <span className="theme-b-footer-total">{formatPrice(total)}</span>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="theme-b-footer-checkout-btn"
            >
              Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

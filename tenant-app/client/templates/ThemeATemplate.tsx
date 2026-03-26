import { useEffect, useState, useRef } from "react";
import { getStorefrontProductsWithPagination, createOrder, getStorefrontConfig, validateDiscount, getPublishedPages, getBlogPosts, getHeroSliders, getContactUs, getPaymentInfo } from "@/lib/api";
import { getTenantIdFromEnv, getTenantNameFromEnv, formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import "./ThemeATemplate.css";
import "../components/SearchModal.css";
import { saveCart, loadCart } from "@/lib/cart";
import { useNavigate, Link } from "react-router-dom";
import { getWishlist, toggleWishlist, isInWishlist } from "@/lib/themes";
import { Download, Sparkles, Package, X, Facebook, Instagram, Play, Star, TrendingUp, Shield, Zap, Clock, Award, Search, Heart, Menu } from "lucide-react";
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

interface ExpandedCategory {
  [key: string]: boolean;
}

export default function ThemeATemplate() {
  const tenantId = getTenantIdFromEnv();
  const defaultTenantName = getTenantNameFromEnv();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [expandedCategories, setExpandedCategories] = useState<ExpandedCategory>({});
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
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [announcementMessage, setAnnouncementMessage] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState({ youtube: "", instagram: "", facebook: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const searchSectionRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    address: "",
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [priceListUrl, setPriceListUrl] = useState<string | null>(null);
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
        const result = await getStorefrontProductsWithPagination(tenantId, { page: 1, limit: 10 });
        setProducts(result.data);
        setCurrentPage(1);
        setTotalPages(result.pagination.pages);

        const extractedCategories = Array.from(new Set(result.data.map((p) => p.category).filter(Boolean))) as string[];
        setCategories(extractedCategories);
        const expanded: ExpandedCategory = {};
        extractedCategories.forEach((cat) => {
          expanded[cat] = true;
        });
        setExpandedCategories(expanded);

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

  const computedCategories = Array.from(
    new Set(products.map((p) => p.category))
  ).sort();

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const getCategoryProducts = (category: string) => {
    return filteredProducts.filter((p) => p.category === category);
  };

  const addToCart = (productId: string) => {
    const newCart = new Map(cart);
    newCart.set(productId, (newCart.get(productId) || 0) + 1);
    setCart(newCart);
    toast.success("Added to cart");
  };

  const incrementQuantity = (productId: string) => {
    const newCart = new Map(cart);
    newCart.set(productId, (newCart.get(productId) || 0) + 1);
    setCart(newCart);
  };

  const decrementQuantity = (productId: string) => {
    const newCart = new Map(cart);
    const current = newCart.get(productId) || 0;
    if (current > 0) {
      newCart.set(productId, current - 1);
      setCart(newCart);
    }
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

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

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

  const [email, setEmail] = useState("");
  const [testimonialsExpanded, setTestimonialsExpanded] = useState(false);

  const handleNewsletterSignup = async () => {
    if (!email) {
      toast.error("Please enter a valid email");
      return;
    }
    toast.success("Thank you for subscribing!");
    setEmail("");
  };

  return (
    <div className="theme-a-container" data-testid="theme-a-container">

      {/* Announcement Banner */}
      {announcementMessage && (
        <div className="theme-a-announcement">
          <p>{announcementMessage}</p>
        </div>
      )}

      {/* Fixed Top Bar */}
      <div className="theme-a-top-bar">
        <div className="theme-a-top-content">
          <div className="theme-a-top-left">
            {priceListUrl && (
              <a
                href={priceListUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="theme-a-store-title cursor-pointer hover:opacity-80 transition-opacity"
              >
                <Download size={20} className="inline mr-1" /> Download Price List
              </a>
            )}
            {!priceListUrl && (
              <h2 className="theme-a-store-title opacity-50 cursor-not-allowed">
                <Download size={20} className="inline mr-1" /> Price List
              </h2>
            )}
          </div>
          <div className="theme-a-top-center">
            {tenantLogo ? (
              <img src={tenantLogo} alt={tenantName} className="theme-a-logo" />
            ) : (
              <h1 className="theme-a-brand-name">{tenantName}</h1>
            )}
          </div>
          <div className="theme-a-top-right">
            <button
              className="theme-a-top-action-btn"
              onClick={() => setShowSearchModal(true)}
              title="Search products"
            >
              <Search size={20} />
            </button>
            <button
              className="theme-a-top-action-btn"
              onClick={() => setShowWishlistModal(true)}
              title={`View wishlist (${wishlist.size})`}
            >
              <Heart size={20} />
            </button>
            <div className="theme-a-cart-info">
              <span className="theme-a-cart-label">CART</span>
              {cart.size > 0 && <span className="theme-a-cart-count">{cart.size}</span>}
            </div>
            <div className="theme-a-net-total">
              <span className="theme-a-total-label">NET TOTAL</span>
              <span className="theme-a-total-amount">{formatPrice(total)}</span>
            </div>
            {cart.size > 0 && (
              <button onClick={() => { saveCart(tenantId, cart); navigate('/checkout'); }} className="theme-a-contact-btn">Checkout</button>
            )}
            <button onClick={() => navigate('/page/contact')} className="theme-a-contact-btn">Contact Us</button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="theme-a-nav">
        <div className="theme-a-nav-content">
          <button className="theme-a-nav-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className={`theme-a-nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
            <Link to="/blog" className="theme-a-nav-btn" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
            <Link to="/track-order" className="theme-a-nav-btn" onClick={() => setMobileMenuOpen(false)}>Track Order</Link>
            {publishedPages.map((p) => (
              <Link key={p.slug} to={`/page/${encodeURIComponent(p.slug)}`} className="theme-a-nav-btn" onClick={() => setMobileMenuOpen(false)}>
                {p.title}
              </Link>
            ))}
            {contactUs && <Link to="/page/contact" className="theme-a-nav-btn" onClick={() => setMobileMenuOpen(false)}>Contact Us</Link>}
            {paymentInfo && <Link to="/page/payment-info" className="theme-a-nav-btn" onClick={() => setMobileMenuOpen(false)}>Payment Info</Link>}
          </div>
        </div>
      </nav>

      {/* Hero Banner Carousel */}
      <section className="theme-a-hero-carousel">
        <div className="theme-a-carousel-container">
          {heroSliders.length > 0 ? (
            <>
              <div className="theme-a-carousel-slide">
                {heroSliders[carouselIndex]?.image_url && (
                  <img
                    src={(() => {
                      const url = heroSliders[carouselIndex].image_url;
                      if (!url) return '';
                      if (/^https?:\/\//i.test(url)) return url;
                      const API_HOST = (((import.meta.env.VITE_BACKEND_URL as string) || "http://localhost:8080").replace(/\/+$/g, "")).replace(/\/api$/, "");
                      return `${API_HOST}${url.startsWith("/") ? "" : "/"}${url}`;
                    })()}
                    alt={heroSliders[carouselIndex]?.title || 'Banner'}
                    className="theme-a-carousel-image"
                  />
                )}
                <div className="theme-a-carousel-content">
                  <h1 className="theme-a-carousel-title">{heroSliders[carouselIndex]?.title || tenantName}</h1>
                  <p className="theme-a-carousel-subtitle">{heroSliders[carouselIndex]?.subtitle || "Welcome to our store"}</p>
                </div>
              </div>
              {heroSliders.length > 1 && (
                <div className="theme-a-carousel-dots">
                  {heroSliders.map((_, idx) => (
                    <button
                      key={idx}
                      className={`theme-a-carousel-dot ${idx === carouselIndex ? "active" : ""}`}
                      onClick={() => setCarouselIndex(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="theme-a-carousel-slide theme-a-carousel-default">
              <div className="theme-a-carousel-content">
                <h1 className="theme-a-carousel-title">{tenantName}</h1>
                <p className="theme-a-carousel-subtitle">Your trusted online store</p>
              </div>
            </div>
          )}
        </div>
      </section>


      {/* Main Content */}
      <div className="theme-a-main">
        {/* Search Bar */}
        {products.length > 0 && (
          <div className="theme-a-search-container" ref={searchSectionRef}>
            <div className="theme-a-search-wrapper">
              <Search size={20} className="theme-a-search-icon" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="theme-a-search-input"
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="theme-a-loading">
            <div className="theme-a-loader"></div>
            <p>Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="theme-a-empty">
            <p>No products available</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="theme-a-empty">
            <p>No products match your search</p>
          </div>
        ) : (
          <div className="theme-a-categories">
            {computedCategories.map((category) => {
              const categoryProducts = getCategoryProducts(category);
              const isExpanded = expandedCategories[category];

              return (
                <div key={category} className="theme-a-category">
                  <div
                    className="theme-a-category-header"
                    onClick={() => toggleCategory(category)}
                  >
                    <span className="theme-a-category-toggle">
                      {isExpanded ? "▼" : "▶"}
                    </span>
                    <h3 className="theme-a-category-title">{category}</h3>
                    <span className="theme-a-category-count">
                      ({categoryProducts.length} items)
                    </span>
                  </div>

                  {(isExpanded !== false) && (
                    <div className="theme-a-category-content">
                      <table className="theme-a-products-table">
                        <thead>
                          <tr className="theme-a-table-header">
                            <th className="theme-a-col-icon">Icon</th>
                            <th className="theme-a-col-name">Product Name</th>
                            <th className="theme-a-col-description">Description</th>
                            <th className="theme-a-col-price">Price</th>
                            <th className="theme-a-col-qty">Qty Control</th>
                            <th className="theme-a-col-action">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categoryProducts.map((product) => (
                            <tr key={product.id} className="theme-a-table-row">
                              <td className="theme-a-col-icon">
                                {product.imageUrl ? (
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    onClick={() => setLightboxImage(product.imageUrl || null)}
                                    style={{ cursor: 'pointer' }}
                                  />
                                ) : (
                                  <span className="theme-a-icon-placeholder"><Package size={32} /></span>
                                )}
                              </td>
                              <td className="theme-a-col-name">
                                <span className="theme-a-product-name">{product.name}</span>
                              </td>
                              <td className="theme-a-col-description">
                                <span className="theme-a-product-desc">{product.description}</span>
                              </td>
                              <td className="theme-a-col-price">
                                <span className="theme-a-price">{formatPrice(product.price)}</span>
                              </td>
                              <td className="theme-a-col-qty">
                                <div className="theme-a-qty-control">
                                  <button
                                    className="theme-a-qty-btn"
                                    onClick={() => decrementQuantity(product.id)}
                                  >
                                    −
                                  </button>
                                  <input
                                    type="text"
                                    className="theme-a-qty-input"
                                    value={cart.get(product.id) || 0}
                                    readOnly
                                  />
                                  <button
                                    className="theme-a-qty-btn"
                                    onClick={() => incrementQuantity(product.id)}
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className="theme-a-col-action">
                                <div className="theme-a-action-buttons">
                                  <button
                                    onClick={() => addToCart(product.id)}
                                    disabled={product.stock_quantity === 0}
                                    className="theme-a-add-btn"
                                  >
                                    Add
                                  </button>
                                  <button
                                    onClick={() => toggleWishlistItem(product.id)}
                                    className={`theme-a-favorite-btn ${wishlist.has(product.id) ? 'theme-a-favorite-active' : ''}`}
                                    title={wishlist.has(product.id) ? 'Remove from favorites' : 'Add to favorites'}
                                  >
                                    <Heart size={18} fill={wishlist.has(product.id) ? "currentColor" : "none"} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && products.length > 0 && currentPage < totalPages && (
          <div className="theme-a-load-more-container">
            <button
              onClick={loadMoreProducts}
              disabled={loadingMore}
              className="theme-a-load-more-btn"
            >
              {loadingMore ? "Loading..." : "Load More Products"}
            </button>
            <p className="theme-a-pagination-info">
              Showing {products.length} of {Math.ceil((currentPage / totalPages) * products.length * totalPages)} products
            </p>
          </div>
        )}
      </div>

      {/* Trust & Stats Section */}
      <section className="theme-a-trust-section">
        <div className="theme-a-trust-header">
          <h2>Why Choose Us?</h2>
          <p>Trusted by thousands of customers worldwide</p>
        </div>
        <div className="theme-a-trust-grid">
          <div className="theme-a-trust-box">
            <div className="theme-a-trust-icon"><Award size={40} /></div>
            <h3>Premium Quality</h3>
            <p>100% authentic products with quality guarantee</p>
          </div>
          <div className="theme-a-trust-box">
            <div className="theme-a-trust-icon"><Zap size={40} /></div>
            <h3>Fast Processing</h3>
            <p>Quick order processing and shipment</p>
          </div>
          <div className="theme-a-trust-box">
            <div className="theme-a-trust-icon"><Shield size={40} /></div>
            <h3>Secure Payments</h3>
            <p>Safe and encrypted payment processing</p>
          </div>
          <div className="theme-a-trust-box">
            <div className="theme-a-trust-icon"><TrendingUp size={40} /></div>
            <h3>Best Prices</h3>
            <p>Competitive pricing with regular discounts</p>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="theme-a-stats-section">
        <div className="theme-a-stats-grid">
          <div className="theme-a-stat">
            <div className="theme-a-stat-number">10K+</div>
            <div className="theme-a-stat-label">Happy Customers</div>
          </div>
          <div className="theme-a-stat">
            <div className="theme-a-stat-number">5K+</div>
            <div className="theme-a-stat-label">Products Available</div>
          </div>
          <div className="theme-a-stat">
            <div className="theme-a-stat-number">24/7</div>
            <div className="theme-a-stat-label">Customer Support</div>
          </div>
          <div className="theme-a-stat">
            <div className="theme-a-stat-number">100%</div>
            <div className="theme-a-stat-label">Satisfaction Rate</div>
          </div>
        </div>
      </section>

      {/* Info Tabs Section */}
      {tabs.length > 0 && (
        <section className="theme-a-info-tabs-section">
          <div className="theme-a-container-section">
            <div className="theme-a-tabs-wrapper">
              <InfoTabs
                tabs={tabs}
                tabListClassName="theme-a-tab-list"
                tabTriggerClassName="theme-a-tab-trigger"
                tabContentClassName="theme-a-tab-content"
              />
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      <section className="theme-a-testimonials-section">
        <div className="theme-a-section-header">
          <h2>Customer Reviews</h2>
          <p>What our customers are saying</p>
        </div>
        <div className="theme-a-testimonials-grid">
          <div className="theme-a-testimonial-card">
            <div className="theme-a-testimonial-stars">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className="theme-a-star-filled" />
              ))}
            </div>
            <p className="theme-a-testimonial-text">"Excellent quality products and very fast delivery. Highly recommend this store!"</p>
            <p className="theme-a-testimonial-author">— Sarah Johnson</p>
          </div>
          <div className="theme-a-testimonial-card">
            <div className="theme-a-testimonial-stars">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className="theme-a-star-filled" />
              ))}
            </div>
            <p className="theme-a-testimonial-text">"Great customer service and competitive prices. My go-to store for all my needs."</p>
            <p className="theme-a-testimonial-author">— Michael Chen</p>
          </div>
          <div className="theme-a-testimonial-card">
            <div className="theme-a-testimonial-stars">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className="theme-a-star-filled" />
              ))}
            </div>
            <p className="theme-a-testimonial-text">"Amazing variety of products. The quality exceeded my expectations."</p>
            <p className="theme-a-testimonial-author">— Emily Rodriguez</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="theme-a-footer">
        <div className="theme-a-footer-top">
          {(publishedPages.length > 0 || contactUs || paymentInfo) && (
            <div className="theme-a-footer-col">
              <h4>Pages</h4>
              <div className="theme-a-footer-links">
                {publishedPages.map((p) => (
                  <Link key={p.slug} to={`/page/${encodeURIComponent(p.slug)}`} className="theme-a-footer-link">{p.title}</Link>
                ))}
                {contactUs && <Link to="/page/contact" className="theme-a-footer-link">Contact Us</Link>}
                {paymentInfo && <Link to="/page/payment-info" className="theme-a-footer-link">Payment Info</Link>}
              </div>
            </div>
          )}
          {recentPosts.length > 0 && (
            <div className="theme-a-footer-col">
              <h4>Recent Posts</h4>
              <div className="theme-a-footer-links">
                {recentPosts.slice(0, 3).map((p) => (
                  <Link key={p.slug} to={`/blog/${encodeURIComponent(p.slug)}`} className="theme-a-footer-link">{p.title}</Link>
                ))}
                <Link to="/blog" className="theme-a-footer-link">View all</Link>
              </div>
            </div>
          )}
          {(socialLinks.facebook || socialLinks.instagram || socialLinks.youtube) && (
            <div className="theme-a-footer-col">
              <h4>Follow Us</h4>
              <div className="theme-a-footer-links">
                {socialLinks.facebook && (
                  <p><a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="theme-a-footer-link" aria-label="Facebook"><Facebook size={18} className="inline mr-2" />Facebook</a></p>
                )}
                {socialLinks.instagram && (
                  <p><a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="theme-a-footer-link" aria-label="Instagram"><Instagram size={18} className="inline mr-2" />Instagram</a></p>
                )}
                {socialLinks.youtube && (
                  <p><a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="theme-a-footer-link" aria-label="YouTube"><Play size={18} className="inline mr-2" />YouTube</a></p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="theme-a-footer-bottom">
          <p>&copy; 2024 {tenantName}. All rights reserved.</p>
        </div>
      </footer>

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

      {/* Wishlist Modal */}
      {showWishlistModal && (
        <div className="theme-a-modal-overlay" onClick={() => setShowWishlistModal(false)}>
          <div className="theme-a-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="theme-a-modal-header">
              <h2>My Favorites</h2>
              <button
                className="theme-a-modal-close"
                onClick={() => setShowWishlistModal(false)}
              >
                <X size={24} />
              </button>
            </div>
            <div className="theme-a-modal-body">
              {wishlist.size === 0 ? (
                <div className="theme-a-empty-wishlist">
                  <Heart size={48} />
                  <p>Your wishlist is empty</p>
                  <p className="theme-a-empty-wishlist-text">Add items to your favorites to see them here</p>
                </div>
              ) : (
                <div className="theme-a-wishlist-items">
                  {products.filter(p => wishlist.has(p.id)).map((product) => (
                    <div key={product.id} className="theme-a-wishlist-item">
                      <div className="theme-a-wishlist-item-image">
                        {product.imageUrl && (
                          <img src={product.imageUrl} alt={product.name} />
                        )}
                      </div>
                      <div className="theme-a-wishlist-item-details">
                        <h4>{product.name}</h4>
                        <p>{product.description}</p>
                        <div className="theme-a-wishlist-item-price">
                          {formatPrice(product.price)}
                        </div>
                      </div>
                      <div className="theme-a-wishlist-item-actions">
                        <button
                          className="theme-a-wishlist-add-btn"
                          onClick={() => addToCart(product.id)}
                          disabled={product.stock_quantity === 0}
                        >
                          Add to Cart
                        </button>
                        <button
                          className="theme-a-wishlist-remove-btn"
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
          className="theme-a-lightbox-overlay"
          onClick={() => setLightboxImage(null)}
        >
          <div className="theme-a-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="theme-a-lightbox-close"
              onClick={() => setLightboxImage(null)}
              aria-label="Close lightbox"
            >
              <X size={32} />
            </button>
            <img
              src={lightboxImage}
              alt="Product preview"
              className="theme-a-lightbox-image"
            />
          </div>
        </div>
      )}

      {/* Fixed Footer Checkout */}
      {cart.size > 0 && (
        <div className="theme-a-fixed-footer">
          <div className="theme-a-footer-content">
            <div className="theme-a-footer-left">
              <span className="theme-a-footer-items">{cart.size} item{cart.size !== 1 ? 's' : ''} in cart</span>
              <span className="theme-a-footer-total">{formatPrice(total)}</span>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="theme-a-footer-checkout-btn"
            >
              Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

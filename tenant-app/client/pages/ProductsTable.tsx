import { useEffect, useState } from 'react';
import { getTenantIdFromEnv, getTenantNameFromEnv, formatPrice } from '@/lib/utils';
import { getStorefrontProductsWithPagination, getStorefrontConfig, getContactUs, getPaymentInfo } from '@/lib/api';
import { toast } from 'sonner';
import { Package, X, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ThemeCHeader from '@/components/ThemeCHeader';
import { saveCart, loadCart } from '@/lib/cart';
import { getWishlist, toggleWishlist } from '@/lib/themes';
import SearchModal from '@/components/SearchModal';
import "../templates/ThemeCTemplate.css";

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

export default function ProductsTable() {
  const tenantId = getTenantIdFromEnv();
  const defaultTenantName = getTenantNameFromEnv();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [cartLoaded, setCartLoaded] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<ExpandedCategory>({});
  const [tenantName, setTenantName] = useState(defaultTenantName);
  const [tenantLogo, setTenantLogo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [priceListUrl, setPriceListUrl] = useState<string | null>(null);
  const [contactUs, setContactUs] = useState<any>(null);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);

  // Load cart and wishlist from localStorage
  useEffect(() => {
    const loadPersistedCart = () => {
      try {
        const cartItems = loadCart(tenantId);
        const cartMap = new Map(cartItems.map(item => [item.productId, item.quantity]));
        setCart(cartMap);
      } catch (err) {
        console.warn("Could not load cart:", err);
      }
      setCartLoaded(true);
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

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const result = await getStorefrontProductsWithPagination(tenantId, { page: 1, limit: 50 });
        setProducts(result.data);

        const extractedCategories = Array.from(new Set(result.data.map((p) => p.category).filter(Boolean))) as string[];
        setCategories(extractedCategories);
        const expanded: ExpandedCategory = {};
        extractedCategories.forEach((cat) => {
          expanded[cat] = true;
        });
        setExpandedCategories(expanded);

        const config = await getStorefrontConfig(tenantId);

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
          document.title = config?.seo?.title || tenantName || 'Products';
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

  // Save cart to localStorage whenever it changes (but only after it's been loaded)
  useEffect(() => {
    if (!cartLoaded) return;
    try {
      saveCart(tenantId, cart);
    } catch (err) {
      console.warn("Could not save cart:", err);
    }
  }, [cart, tenantId, cartLoaded]);

  const computedCategories = Array.from(
    new Set(products.map((p) => p.category))
  ).sort();

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const getCategoryProducts = (category: string) => {
    return filteredProducts.filter((p) => p.category === category);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
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

  const cartTotal = products.reduce((sum, product) => {
    const quantity = cart.get(product.id) || 0;
    return sum + product.price * quantity;
  }, 0);

  return (
    <div className="theme-c-container">
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

      <div className="theme-c-main">
        {/* Search Bar */}
        {products.length > 0 && (
          <div className="theme-c-search-section">
            <div className="theme-c-search-wrapper">
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

        {loading ? (
          <div className="theme-c-loading">
            <div className="theme-c-loader"></div>
            <p>Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="theme-c-empty">
            <p>No products available</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="theme-c-empty">
            <p>No products match your search</p>
          </div>
        ) : (
          <div style={{ padding: '0 1rem' }}>
            {computedCategories.map((category) => {
              const categoryProducts = getCategoryProducts(category);
              const isExpanded = expandedCategories[category];

              return (
                <div key={category} style={{ marginBottom: '2rem' }}>
                  <div
                    onClick={() => toggleCategory(category)}
                    style={{
                      padding: '1rem',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <span style={{ fontWeight: 'bold' }}>
                      {isExpanded ? "▼" : "▶"}
                    </span>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>{category}</h3>
                    <span style={{ color: '#666' }}>
                      ({categoryProducts.length} items)
                    </span>
                  </div>

                  {isExpanded && (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        backgroundColor: 'white',
                        border: '1px solid #ddd',
                      }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f9f9f9', borderBottom: '2px solid #ddd' }}>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd', minWidth: '100px' }}>Icon</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd', minWidth: '200px' }}>Product Name</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd', minWidth: '200px' }}>Description</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid #ddd', minWidth: '100px' }}>Price</th>
                            <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #ddd', minWidth: '150px' }}>Qty Control</th>
                            <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', minWidth: '150px' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categoryProducts.map((product) => (
                            <tr key={product.id} style={{ borderBottom: '1px solid #ddd' }}>
                              <td style={{ padding: '1rem', borderRight: '1px solid #ddd', textAlign: 'center' }}>
                                {product.imageUrl ? (
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    onClick={() => setLightboxImage(product.imageUrl || null)}
                                    style={{ cursor: 'pointer', maxWidth: '80px', maxHeight: '80px', objectFit: 'cover', borderRadius: '0.25rem' }}
                                  />
                                ) : (
                                  <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80px' }}>
                                    <Package size={32} />
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '1rem', borderRight: '1px solid #ddd', fontWeight: '600' }}>
                                {product.name}
                              </td>
                              <td style={{ padding: '1rem', borderRight: '1px solid #ddd', color: '#666' }}>
                                {product.description}
                              </td>
                              <td style={{ padding: '1rem', borderRight: '1px solid #ddd', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                {formatPrice(product.price)}
                              </td>
                              <td style={{ padding: '1rem', borderRight: '1px solid #ddd' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                  <button
                                    onClick={() => decrementQuantity(product.id)}
                                    style={{
                                      padding: '0.5rem 0.75rem',
                                      border: '1px solid #ddd',
                                      backgroundColor: '#f5f5f5',
                                      cursor: 'pointer',
                                      borderRadius: '0.25rem',
                                      fontSize: '1rem',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    −
                                  </button>
                                  <input
                                    type="text"
                                    value={cart.get(product.id) || 0}
                                    readOnly
                                    style={{
                                      width: '40px',
                                      textAlign: 'center',
                                      border: '1px solid #ddd',
                                      padding: '0.5rem',
                                      borderRadius: '0.25rem',
                                    }}
                                  />
                                  <button
                                    onClick={() => incrementQuantity(product.id)}
                                    style={{
                                      padding: '0.5rem 0.75rem',
                                      border: '1px solid #ddd',
                                      backgroundColor: '#f5f5f5',
                                      cursor: 'pointer',
                                      borderRadius: '0.25rem',
                                      fontSize: '1rem',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                                  <button
                                    onClick={() => addToCart(product.id)}
                                    disabled={product.stock_quantity === 0}
                                    style={{
                                      padding: '0.5rem 1rem',
                                      backgroundColor: product.stock_quantity === 0 ? '#ccc' : '#007bff',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '0.25rem',
                                      cursor: product.stock_quantity === 0 ? 'not-allowed' : 'pointer',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    Add
                                  </button>
                                  <button
                                    onClick={() => toggleWishlistItem(product.id)}
                                    style={{
                                      padding: '0.5rem',
                                      backgroundColor: wishlist.has(product.id) ? '#ff6b6b' : '#f5f5f5',
                                      border: '1px solid #ddd',
                                      borderRadius: '0.25rem',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                    title={wishlist.has(product.id) ? 'Remove from favorites' : 'Add to favorites'}
                                  >
                                    <Heart size={18} fill={wishlist.has(product.id) ? "white" : "none"} color={wishlist.has(product.id) ? "white" : "black"} />
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
      </div>

      {/* Wishlist Modal */}
      {showWishlistModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowWishlistModal(false)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #ddd',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>My Favorites</h2>
              <button
                onClick={() => setShowWishlistModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                }}
              >
                <X size={24} />
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {wishlist.size === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <Heart size={48} style={{ margin: '0 auto', marginBottom: '1rem', color: '#ccc' }} />
                  <p style={{ margin: 0, fontSize: '1.1rem', color: '#666' }}>Your wishlist is empty</p>
                </div>
              ) : (
                <div>
                  {products.filter(p => wishlist.has(p.id)).map((product) => (
                    <div key={product.id} style={{
                      display: 'flex',
                      gap: '1rem',
                      padding: '1rem',
                      borderBottom: '1px solid #eee',
                      alignItems: 'flex-start',
                    }}>
                      {product.imageUrl && (
                        <img src={product.imageUrl} alt={product.name} style={{
                          width: '80px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '0.25rem',
                        }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>{product.name}</h4>
                        <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>{product.description}</p>
                        <p style={{ margin: 0, fontWeight: 'bold', color: '#007bff' }}>{formatPrice(product.price)}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => addToCart(product.id)}
                          disabled={product.stock_quantity === 0}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: product.stock_quantity === 0 ? '#ccc' : '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: product.stock_quantity === 0 ? 'not-allowed' : 'pointer',
                            fontSize: '0.9rem',
                          }}
                        >
                          Add
                        </button>
                        <button
                          onClick={() => toggleWishlistItem(product.id)}
                          style={{
                            padding: '0.5rem',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <Heart size={20} fill="currentColor" color="red" />
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
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setLightboxImage(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxImage(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: 0,
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '2rem',
              }}
            >
              <X size={32} />
            </button>
            <img
              src={lightboxImage}
              alt="Product preview"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}

      {/* Fixed Footer Checkout */}
      {cart.size > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'white',
          borderTop: '1px solid #ddd',
          padding: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
          zIndex: 100,
        }}>
          <div>
            <div style={{ color: '#666', fontSize: '0.9rem' }}>
              {cart.size} item{cart.size !== 1 ? 's' : ''} in cart
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#007bff' }}>
              {formatPrice(cartTotal)}
            </div>
          </div>
          <button
            onClick={() => { saveCart(tenantId, cart); navigate('/checkout'); }}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem',
            }}
          >
            Checkout
          </button>
        </div>
      )}
    </div>
  );
}

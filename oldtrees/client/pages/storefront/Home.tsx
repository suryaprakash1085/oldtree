import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import {
  getStorefrontProducts,
  getStorefrontConfig,
} from "@/lib/api";
import { Toaster, toast } from "sonner";
import {
  ShoppingCart,
  Heart,
  Search,
  Menu,
  User,
  LogOut,
  ChevronDown,
  Star,
  Truck,
  Shield,
  RotateCcw,
  X,
} from "lucide-react";

export default function StorefrontHome() {
  const { tenantId } = useParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadConfig();
    loadProducts();
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

  const loadProducts = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await getStorefrontProducts(tenantId || "");
      setProducts(data.data || []);
    } catch (error) {
      console.error("Failed to load products:", error);
      setLoadError("Failed to load store. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: any) => {
    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast.success("Added to cart!");
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(
        cart.map((item) =>
          item.id === productId ? { ...item, quantity } : item,
        ),
      );
    }
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const toggleFavorite = (productId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(productId)) {
      newFavorites.delete(productId);
      toast.success("Removed from favorites");
    } else {
      newFavorites.add(productId);
      toast.success("Added to favorites");
    }
    setFavorites(newFavorites);
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const subtotal = calculateSubtotal();
  const total = subtotal;

  // Show loading state while initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading store...</p>
        </div>
      </div>
    );
  }

  // Show error state if store failed to load
  if (loadError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Store Not Available</h2>
          <p className="text-slate-600 mb-6">{loadError}</p>
          <button onClick={() => window.location.reload()} className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition">
            Reload Store
          </button>
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
          {/* Top Navigation */}
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
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

              {/* Search Bar */}
              <div className="hidden md:flex items-center bg-slate-100 rounded-lg px-4 py-2 w-64">
                <Search className="w-4 h-4 text-slate-400 mr-2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent outline-none text-sm w-full"
                />
              </div>
            </div>

            {/* Right Navigation */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFavoritesModal(true)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors hidden sm:inline-flex relative"
                title={`View favorites (${favorites.size})`}
              >
                <Heart className="w-5 h-5 text-slate-700" />
                {favorites.size > 0 && (
                  <span className="absolute top-0 right-0 bg-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {favorites.size}
                  </span>
                )}
              </button>

              <button
                onClick={() => setCartOpen(!cartOpen)}
                className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-slate-700" />
                {cart.length > 0 && (
                  <span className="absolute top-0 right-0 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {cart.length}
                  </span>
                )}
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
                    <a
                      href="#"
                      className="px-4 py-2 text-slate-700 hover:bg-slate-50 block"
                    >
                      Wishlist
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

          {/* Category Navigation */}
          <div className="hidden md:flex items-center gap-8 h-12 border-t border-slate-200">
            {["New Arrivals", "Men", "Women", "Accessories", "Sale"].map(
              (cat) => (
                <button
                  key={cat}
                  className="text-sm text-slate-700 hover:text-slate-900 font-medium"
                >
                  {cat}
                </button>
              ),
            )}
          </div>
        </div>
      </header>

      {/* Shopping Cart Sidebar */}
      {cartOpen && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-lg z-50 flex flex-col">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xl font-bold">Shopping Cart</h2>
            <button onClick={() => setCartOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {cart.length > 0 ? (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">
                        {item.name}
                      </p>
                      <p className="text-sm text-slate-600">
                        ₹{item.price.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() =>
                            updateCartQuantity(item.id, item.quantity - 1)
                          }
                          className="px-2 py-1 bg-white border rounded"
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateCartQuantity(item.id, item.quantity + 1)
                          }
                          className="px-2 py-1 bg-white border rounded"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-600 py-8">
                Your cart is empty
              </p>
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-6 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-semibold">
                  ₹{subtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-t font-bold text-lg">
                <span>Total:</span>
                <span>₹{total.toLocaleString()}</span>
              </div>

              <Link
                to={`/store/${tenantId}/checkout`}
                state={{ cart }}
                onClick={() => setCartOpen(false)}
                className="block"
              >
                <Button className="w-full">
                  Proceed to Checkout
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}



      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-primary/10 to-purple-600/10 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                Welcome to MyStore
              </h1>
              <p className="text-lg text-slate-600 mb-8">
                Discover our exclusive collection of premium products handpicked
                just for you.
              </p>
              <Button size="lg" className="group">
                Shop Now
                <ShoppingCart className="ml-2 w-4 h-4 group-hover:scale-110 transition-transform" />
              </Button>
            </div>
            <div className="hidden md:block">
              <div className="bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-lg aspect-square flex items-center justify-center">
                <div className="text-center">
                  <ShoppingCart className="w-24 h-24 text-primary/50 mx-auto mb-4" />
                  <p className="text-slate-500">Featured Products</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-12">
          Our Products
        </h2>

        {products.length > 0 ? (
          <>
            {searchQuery && (
              <p className="text-slate-600 mb-6">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} found for "{searchQuery}"
              </p>
            )}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="bg-slate-100 aspect-square flex items-center justify-center overflow-hidden relative">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-primary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ShoppingCart className="w-12 h-12 text-primary/40" />
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900 line-clamp-2 flex-1">
                      {product.name}
                    </h3>
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className="ml-2 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      title={favorites.has(product.id) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          favorites.has(product.id)
                            ? "fill-red-500 text-red-500"
                            : "text-slate-400"
                        }`}
                      />
                    </button>
                  </div>

                  {product.stock_quantity !== undefined && (
                    <div className="text-xs text-slate-600 mb-2">
                      Stock: {product.stock_quantity}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, j) => (
                        <Star
                          key={j}
                          className={`w-4 h-4 ${
                            j < 4
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-600">(24 reviews)</span>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-bold text-slate-900">
                      ₹{product.price.toLocaleString()}
                    </span>
                  </div>

                  <Button
                    onClick={() => addToCart(product)}
                    className="w-full group/btn"
                  >
                    Add to Cart
                    <ShoppingCart className="ml-2 w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                  </Button>
                </div>
              </div>
              ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-600 text-lg">No products match your search</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-600 text-lg">No products available yet</p>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="bg-slate-50 border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Truck,
                title: "Free Shipping",
                desc: "On orders above ₹500",
              },
              {
                icon: Shield,
                title: "Secure Payment",
                desc: "100% safe transactions",
              },
              {
                icon: RotateCcw,
                title: "Easy Returns",
                desc: "30-day return policy",
              },
            ].map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
                  <a href="#" className="hover:text-white transition">
                    New Arrivals
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Best Sellers
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
              <h4 className="font-semibold mb-4">Customer</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Track Order
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    FAQs
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
                <li>
                  <a href="#" className="hover:text-white transition">
                    Shipping Info
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

      {/* Favorites Modal */}
      {showFavoritesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-900">My Favorites</h2>
              <button
                onClick={() => setShowFavoritesModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {favorites.size === 0 ? (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 font-medium">Your favorites list is empty</p>
                  <p className="text-slate-500 text-sm mt-2">Add products to your favorites to see them here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {products.filter(p => favorites.has(p.id)).map((product) => (
                    <div key={product.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex gap-4">
                        <div className="w-20 h-20 bg-slate-100 rounded flex items-center justify-center flex-shrink-0">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <ShoppingCart className="w-8 h-8 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 line-clamp-2">
                            {product.name}
                          </h3>
                          <p className="text-xl font-bold text-slate-900 mt-2">
                            ₹{product.price.toLocaleString()}
                          </p>
                          <div className="flex gap-2 mt-3">
                            <Button
                              onClick={() => {
                                addToCart(product);
                                setShowFavoritesModal(false);
                              }}
                              size="sm"
                              className="flex-1"
                            >
                              Add to Cart
                            </Button>
                            <button
                              onClick={() => toggleFavorite(product.id)}
                              className="px-3 py-2 hover:bg-slate-100 rounded transition-colors"
                              title="Remove from favorites"
                            >
                              <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

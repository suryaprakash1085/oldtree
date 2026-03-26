import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { trackOrder, getStorefrontConfig } from "@/lib/api";
import { getTenantIdFromEnv, getTenantNameFromEnv, formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { Search, ArrowLeft, Package, MapPin, DollarSign, Clock } from "lucide-react";
import ThemeCHeader from "@/components/ThemeCHeader";

export default function TrackOrder() {
  const tenantId = getTenantIdFromEnv();
  const defaultTenantName = getTenantNameFromEnv();
  const navigate = useNavigate();

  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [tenantName, setTenantName] = useState(defaultTenantName);
  const [tenantLogo, setTenantLogo] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await getStorefrontConfig(tenantId);
        if (config?.theme?.companyName) {
          setTenantName(config.theme.companyName);
        }
        if (config?.theme?.logo) {
          const API_HOST = (((import.meta.env.VITE_BACKEND_URL as string) || "http://localhost:8080").replace(/\/+$/g, "")).replace(/\/api$/, "");
          const logoUrl = config.theme.logo;
          const absoluteUrl = /^https?:\/\//i.test(logoUrl) ? logoUrl : `${API_HOST}${logoUrl.startsWith("/") ? "" : "/"}${logoUrl}`;
          setTenantLogo(absoluteUrl);
        }
      } catch (err) {
        console.warn("Could not load tenant config:", err);
      }
    };

    loadConfig();
  }, [tenantId]);

  useEffect(() => {
    document.title = `Track Order • ${tenantName}`;
  }, [tenantName]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderNumber.trim()) {
      toast.error("Please enter an order number");
      return;
    }

    console.log("[TrackOrder] Searching with tenantId:", tenantId, "orderNumber:", orderNumber);
    try {
      setLoading(true);
      setError(null);
      const orderData = await trackOrder(tenantId, orderNumber.trim());
      console.log("[TrackOrder] Order data received:", orderData);

      if (orderData) {
        setOrder(orderData);
        setSearched(true);
      } else {
        setOrder(null);
        setError("Order not found. Please check the order number and try again.");
        setSearched(true);
      }
    } catch (err) {
      console.error("Failed to track order:", err);
      let errorMessage = "Failed to find order. Please check the order number and try again.";

      if (err instanceof Error) {
        if (err.message.includes("404") || err.message.includes("not found")) {
          errorMessage = "Order not found. Please check the order number and try again.";
        } else if (err.message.includes("network")) {
          errorMessage = "Network error. Please check your connection and try again.";
        }
      }

      setError(errorMessage);
      setOrder(null);
      setSearched(true);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const items = order && Array.isArray(order.items) ? order.items : [];
  const shippingAddress = order && typeof order.shipping_address === 'string' 
    ? JSON.parse(order.shipping_address) 
    : order?.shipping_address;

  const discountAmount = order ? Number(order.discount_amount) || 0 : 0;
  const totalAmount = order ? Number(order.total_amount) || 0 : 0;
  const subtotalAmount = totalAmount + discountAmount;

  const handleSearchClick = () => {
    // Navigate to search on home page
    navigate("/");
  };

  const handleWishlistClick = () => {
    // Navigate to wishlist on home page
    navigate("/");
  };

  const handleCheckout = () => {
    // Navigate to checkout on home page
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <ThemeCHeader
        tenantName={tenantName}
        tenantLogo={tenantLogo}
        cartSize={0}
        wishlistSize={0}
        onSearchClick={handleSearchClick}
        onWishlistClick={handleWishlistClick}
        onCheckout={handleCheckout}
        priceListUrl={null}
      />

      <header className="bg-gradient-to-r from-blue-700 to-blue-600 shadow-lg border-b-4 border-blue-400">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white">Track Your Order</h1>
          <p className="text-blue-100 mt-2">Enter your order number below to check the status</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Enter your order number (e.g., ORD-12345)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition"
            >
              <Search size={20} />
              {loading ? "Searching..." : "Track"}
            </button>
          </form>
        </div>

        {/* No search yet */}
        {!searched && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 text-center">
            <Package size={48} className="mx-auto text-blue-600 mb-4" />
            <h2 className="text-2xl font-bold text-blue-700 mb-2">Track Your Order</h2>
            <p className="text-gray-700 max-w-md mx-auto">
              Enter your order number to view detailed information about your order status, items, and delivery details.
            </p>
          </div>
        )}

        {/* Error state */}
        {searched && (error || !order) && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 text-center">
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-700 mb-2">Order Not Found</h2>
            <p className="text-gray-700 mb-6">{error || "We couldn't find your order. Please check the order number and try again."}</p>
            <button
              onClick={() => {
                setSearched(false);
                setOrderNumber("");
                setOrder(null);
              }}
              className="inline-block bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Order Details */}
        {searched && order && (
          <div className="space-y-6">
            {/* Status Message */}
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
              <div className="flex items-center gap-4">
                <div className="text-4xl">✓</div>
                <div>
                  <h2 className="text-2xl font-bold text-green-700 mb-1">Order Found</h2>
                  <p className="text-gray-700">Order Number: <span className="font-bold">{order.order_number}</span></p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Order Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Order Status and Details */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock size={24} className="text-blue-600" />
                    Order Status
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Order Status</p>
                      <p className="text-lg font-bold text-gray-900 capitalize">{order.status || "Pending"}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                      <p className="text-lg font-bold text-gray-900 capitalize">{order.payment_status || "Pending"}</p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Package size={24} className="text-blue-600" />
                    Order Items
                  </h3>
                  <div className="space-y-3">
                    {items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{item.product_name}</p>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatPrice(item.total_price)}</p>
                          <p className="text-sm text-gray-600">@ {formatPrice(item.unit_price)} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign size={24} className="text-blue-600" />
                    Price Details
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Subtotal</span>
                      <span className="font-semibold text-gray-900">{formatPrice(subtotalAmount)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span className="font-semibold">-{formatPrice(discountAmount)}</span>
                      </div>
                    )}
                    <div className="border-t-2 border-gray-200 pt-2 flex justify-between">
                      <span className="font-bold text-gray-900">Total Amount</span>
                      <span className="text-2xl font-bold text-blue-700">{formatPrice(totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-semibold text-gray-900">{order.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-gray-900 break-all">{order.customer_email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold text-gray-900">{order.customer_phone}</p>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                {shippingAddress && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin size={20} className="text-blue-600" />
                      Shipping Address
                    </h3>
                    <p className="text-gray-900">
                      {shippingAddress.address || "No address provided"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Back Button */}
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition"
              >
                <ArrowLeft size={20} />
                Back to Home
              </button>
              <button
                onClick={() => {
                  setSearched(false);
                  setOrderNumber("");
                  setOrder(null);
                }}
                className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-medium transition"
              >
                <Search size={20} />
                Track Another Order
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-12 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400">&copy; {new Date().getFullYear()} {tenantName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

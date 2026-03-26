import React, { useEffect, useMemo, useState } from "react";
import { Toaster, toast } from "sonner";
import { getStorefrontProducts, createOrder, validateDiscount, getStorefrontConfig } from "@/lib/api";
import { getTenantIdFromEnv, getTenantNameFromEnv, formatPrice } from "@/lib/utils";
import { loadCart, clearCart } from "@/lib/cart";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Minus, Trash2, Lock, Truck } from "lucide-react";
import "./Checkout.css";

export default function CheckoutPage() {
  const tenantId = getTenantIdFromEnv();
  const tenantName = getTenantNameFromEnv();
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState<any>(null);
  const [minOrderAmount, setMinOrderAmount] = useState(0);
  const [tenantLogo, setTenantLogo] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    address: "",
  });
  const [sendEmail, setSendEmail] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [prods, cfg] = await Promise.all([
          getStorefrontProducts(tenantId),
          getStorefrontConfig(tenantId).catch(() => ({ seo: {}, theme: {} }) as any)
        ]);
        setProducts(prods);
        const cart = loadCart(tenantId);
        setItems(cart);
        const min = (cfg as any)?.seo?.minOrderAmount || 0;
        setMinOrderAmount(min);

        const API_HOST = (((import.meta.env.VITE_BACKEND_URL as string) || "http://localhost:8080").replace(/\/+$/g, "")).replace(/\/api$/, "");
        const toAbsoluteUrl = (u?: string | null): string | undefined => {
          if (!u) return undefined;
          if (/^https?:\/\//i.test(u)) return u;
          return `${API_HOST}${u.startsWith("/") ? "" : "/"}${u}`;
        };

        if (cfg?.theme?.logo) {
          setTenantLogo(toAbsoluteUrl(cfg.theme.logo));
        }

        document.title = `Checkout - ${tenantName}`;
      } catch (e) {
        toast.error("Failed to load checkout");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [tenantId, tenantName]);

  const productMap = useMemo(() => {
    const m = new Map<string, any>();
    for (const p of products) m.set(p.id, p);
    return m;
  }, [products]);

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + (productMap.get(it.productId)?.price || 0) * it.quantity, 0),
    [items, productMap]
  );
  const discount = discountApplied ? discountApplied.discountAmount : 0;
  const total = subtotal - discount;

  const applyDiscount = async () => {
    if (!discountCode.trim()) {
      toast.error("Please enter a discount code");
      return;
    }
    try {
      const result = await validateDiscount(tenantId, discountCode, subtotal);
      setDiscountApplied(result);
      toast.success("Discount applied successfully!");
    } catch {
      toast.error("Invalid discount code");
      setDiscountApplied(null);
    }
  };

  const updateQty = (productId: string, qty: number) => {
    const newQty = Math.max(1, qty);
    setItems(prev =>
      prev.map(it => (it.productId === productId ? { ...it, quantity: newQty } : it))
    );
  };

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(it => it.productId !== productId));
    toast.success("Item removed from cart");
  };

  const placeOrder = async () => {
    if (!formData.customerName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!formData.customerEmail.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (!formData.customerPhone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }
    if (!formData.address.trim()) {
      toast.error("Please enter your shipping address");
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (minOrderAmount > 0 && total < minOrderAmount) {
      toast.error(`Minimum order amount is ₹${minOrderAmount.toLocaleString()}. Current total: ₹${total.toLocaleString()}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress: { address: formData.address },
        discountCode: discountApplied ? discountCode : undefined,
        sendEmail,
      };
      const res = await createOrder(tenantId, orderPayload);
      clearCart(tenantId);
      toast.success(`Order placed successfully! Order #${res.data?.orderNumber || res.data?.order_number || 'Pending'}`);
      const orderNumber = res.data?.orderNumber || res.data?.order_number;

      // Store email sent flag for the confirmation page
      const emailWasSent = res.emailSent !== false;
      if (orderNumber) {
        localStorage.setItem(`order_${orderNumber}_emailSent`, JSON.stringify(emailWasSent));
      }

      navigate(`/order/${orderNumber}`);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Failed to place order";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="checkout-page">
        <div className="checkout-loading">
          <div className="checkout-spinner"></div>
          <p>Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="checkout-header">
        <div className="checkout-header-content">
          <button
            onClick={() => navigate(-1)}
            className="checkout-back-btn"
            title="Continue shopping"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <div className="checkout-header-title">
            <h1>Checkout</h1>
            <p className="checkout-header-subtitle">Complete your order</p>
          </div>
          {tenantLogo && (
            <img src={tenantLogo} alt={tenantName} className="checkout-logo" />
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="checkout-main">
        <div className="checkout-container">
          {/* Left Section - Cart Items */}
          <section className="checkout-left">
            <h2 className="checkout-section-title">Order Summary</h2>

            {items.length === 0 ? (
              <div className="checkout-empty">
                <p>Your cart is empty</p>
                <button
                  onClick={() => navigate("/")}
                  className="checkout-continue-btn"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="checkout-items">
                {items.map(it => {
                  const p = productMap.get(it.productId);
                  if (!p) return null;

                  return (
                    <div key={it.productId} className="checkout-item">
                      {p.imageUrl && (
                        <img src={p.imageUrl} alt={p.name} className="checkout-item-img" />
                      )}
                      <div className="checkout-item-details">
                        <h3 className="checkout-item-name">{p.name}</h3>
                        <p className="checkout-item-price">{formatPrice(p.price)}</p>
                      </div>
                      <div className="checkout-item-qty">
                        <button
                          onClick={() => updateQty(it.productId, it.quantity - 1)}
                          className="checkout-qty-btn"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={16} />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={e => updateQty(it.productId, parseInt(e.target.value || "1", 10))}
                          className="checkout-qty-input"
                          aria-label="Quantity"
                        />
                        <button
                          onClick={() => updateQty(it.productId, it.quantity + 1)}
                          className="checkout-qty-btn"
                          aria-label="Increase quantity"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="checkout-item-total">
                        {formatPrice(p.price * it.quantity)}
                      </div>
                      <button
                        onClick={() => removeItem(it.productId)}
                        className="checkout-remove-btn"
                        title="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Right Section - Order Summary & Form */}
          <aside className="checkout-right">
            {/* Price Summary */}
            <div className="checkout-summary-card">
              <h2 className="checkout-section-title">Order Total</h2>
              <div className="checkout-summary">
                <div className="checkout-summary-row">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discountApplied && (
                  <div className="checkout-summary-row checkout-discount">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                {minOrderAmount > 0 && (
                  <div className="checkout-min-order">
                    <span className="checkout-min-label">Minimum Order</span>
                    <span>{formatPrice(minOrderAmount)}</span>
                  </div>
                )}
                <div className="checkout-summary-divider"></div>
                <div className="checkout-summary-total">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {/* Discount Code */}
            <div className="checkout-discount-card">
              <h3 className="checkout-subsection-title">Promo Code</h3>
              <div className="checkout-discount-input-group">
                <input
                  type="text"
                  placeholder="Enter discount code"
                  value={discountCode}
                  onChange={e => setDiscountCode(e.target.value)}
                  onKeyPress={e => e.key === "Enter" && applyDiscount()}
                  className="checkout-discount-input"
                  disabled={!!discountApplied}
                />
                <button
                  onClick={applyDiscount}
                  className="checkout-discount-apply-btn"
                  disabled={!!discountApplied}
                >
                  {discountApplied ? "Applied" : "Apply"}
                </button>
              </div>
              {discountApplied && (
                <p className="checkout-discount-success">✓ Discount applied</p>
              )}
            </div>

            {/* Customer Information */}
            <div className="checkout-form-card">
              <h3 className="checkout-subsection-title">
                <Lock size={18} className="inline mr-2" />
                Delivery Information
              </h3>
              <div className="checkout-form">
                <div className="checkout-form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.customerName}
                    onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                    className="checkout-form-input"
                    required
                  />
                </div>

                <div className="checkout-form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.customerEmail}
                    onChange={e => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="checkout-form-input"
                    required
                  />
                </div>

                <div className="checkout-form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.customerPhone}
                    onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="checkout-form-input"
                    required
                  />
                </div>

                <div className="checkout-form-group">
                  <label htmlFor="address">Shipping Address</label>
                  <textarea
                    id="address"
                    placeholder="123 Street Name, City, State, Postal Code"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="checkout-form-textarea"
                    rows={3}
                    required
                  ></textarea>
                </div>

                <div className="checkout-form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    id="sendEmail"
                    type="checkbox"
                    checked={sendEmail}
                    onChange={e => setSendEmail(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="sendEmail" style={{ cursor: 'pointer', margin: 0 }}>
                    Send order confirmation email to {formData.customerEmail || 'my email'}
                  </label>
                </div>
              </div>
            </div>

            {/* Trust & Security */}
            <div className="checkout-security">
              <div className="checkout-security-item">
                <Lock size={20} />
                <div>
                  <p className="checkout-security-title">Secure Payment</p>
                  <p className="checkout-security-text">SSL encrypted checkout</p>
                </div>
              </div>
              <div className="checkout-security-item">
                <Truck size={20} />
                <div>
                  <p className="checkout-security-title">Fast Delivery</p>
                  <p className="checkout-security-text">Quick shipment processing</p>
                </div>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              onClick={placeOrder}
              disabled={isSubmitting || items.length === 0}
              className="checkout-place-order-btn"
            >
              {isSubmitting ? "Processing..." : "Place Order"}
            </button>

            {minOrderAmount > 0 && total < minOrderAmount && (
              <div className="checkout-warning">
                <p>Minimum order amount not met</p>
                <p className="checkout-warning-amount">
                  Add {formatPrice(minOrderAmount - total)} more to complete your order
                </p>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="checkout-footer">
        <div className="checkout-footer-content">
          <p>&copy; 2024 {tenantName}. All rights reserved.</p>
          <p className="checkout-footer-text">Secure checkout • Your information is protected</p>
        </div>
      </footer>
    </div>
  );
}

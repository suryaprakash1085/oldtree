import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import {
  createStorefrontOrder,
  validateDiscount,
  getStorefrontConfig,
} from "@/lib/api";
import { Toaster, toast } from "sonner";
import {
  ChevronRight,
  Check,
  ShoppingCart,
  Truck,
  Lock,
} from "lucide-react";

export default function Checkout() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const cart = location.state?.cart || [];
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmation, setOrderConfirmation] = useState<any>(null);
  
  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shippingAddress: "",
    shippingCity: "",
    shippingState: "",
    shippingZip: "",
    billingAddress: "",
    billingCity: "",
    billingState: "",
    billingZip: "",
    useBillingAsShipping: true,
  });

  useEffect(() => {
    loadConfig();
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

  const [cardData, setCardData] = useState({
    cardName: "",
    cardNumber: "",
    cardExpiry: "",
    cardCVC: "",
  });

  if (!cart || cart.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
          <p className="text-slate-600 mb-6">Add items to your cart before checking out</p>
          <Button onClick={() => navigate(`/store/${tenantId}`)}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  const calculateSubtotal = () => {
    return cart.reduce((total: number, item: any) => total + item.price * item.quantity, 0);
  };

  const subtotal = calculateSubtotal();
  const discount = discountApplied ? discountApplied.discountAmount : 0;
  const total = subtotal - discount;

  const applyDiscount = async () => {
    try {
      const discount = await validateDiscount(
        tenantId || "",
        discountCode,
        subtotal,
      );
      setDiscountApplied(discount.data);
      toast.success("Discount applied!");
    } catch (error) {
      toast.error("Invalid discount code");
    }
  };

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateShipping = () => {
    if (!formData.customerName || !formData.customerEmail || !formData.customerPhone) {
      toast.error("Please fill in contact information");
      return false;
    }
    if (!formData.shippingAddress || !formData.shippingCity || !formData.shippingState || !formData.shippingZip) {
      toast.error("Please fill in complete shipping address");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.customerEmail)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const validateBilling = () => {
    if (formData.useBillingAsShipping) return true;
    if (!formData.billingAddress || !formData.billingCity || !formData.billingState || !formData.billingZip) {
      toast.error("Please fill in complete billing address");
      return false;
    }
    return true;
  };

  const validatePayment = () => {
    if (!cardData.cardName || !cardData.cardNumber || !cardData.cardExpiry || !cardData.cardCVC) {
      toast.error("Please fill in all card details");
      return false;
    }
    if (cardData.cardNumber.length !== 16) {
      toast.error("Card number must be 16 digits");
      return false;
    }
    if (!/^\d{2}\/\d{2}$/.test(cardData.cardExpiry)) {
      toast.error("Expiry must be in MM/YY format");
      return false;
    }
    if (cardData.cardCVC.length !== 3) {
      toast.error("CVC must be 3 digits");
      return false;
    }
    return true;
  };

  const handleStepChange = (newStep: number) => {
    if (newStep < step) {
      setStep(newStep);
      return;
    }
    
    if (step === 1 && !validateShipping()) return;
    if (step === 2 && !validateBilling()) return;
    if (step === 3 && !validatePayment()) return;
    
    setStep(newStep);
  };

  const handleCheckout = async () => {
    if (!validatePayment()) return;

    const minOrderAmount = (window as any).__STORE_CONFIG?.seo?.minOrderAmount || 0;
    if (total < minOrderAmount) {
      toast.error(`Minimum order amount is ₹${minOrderAmount.toLocaleString()}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await createStorefrontOrder(tenantId || "", {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        items: cart.map((item: any) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        shippingAddress: {
          address: formData.shippingAddress,
          city: formData.shippingCity,
          state: formData.shippingState,
          zip: formData.shippingZip,
        },
        discountCode: discountApplied ? discountCode : undefined,
      });

      setOrderConfirmation(order.data);
      setStep(4);
      toast.success(`Order created successfully!`);
    } catch (error: any) {
      console.error("Checkout error:", error);
      const errorMessage = error?.message || "Failed to create order";
      const displayMessage = errorMessage.includes("Minimum order amount")
        ? `Error: ${errorMessage}`
        : "Failed to create order. Please try again.";
      toast.error(displayMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderConfirmation) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Order Confirmed!
              </h1>
              <p className="text-slate-600">Thank you for your purchase</p>
            </div>

            <div className="bg-slate-50 rounded-lg p-6 mb-8">
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Order Number</p>
                  <p className="text-lg font-bold text-slate-900">
                    {orderConfirmation.order_number}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Order Date</p>
                  <p className="text-lg font-bold text-slate-900">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Amount</p>
                  <p className="text-lg font-bold text-slate-900">
                    ₹{total.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-slate-900 mb-4">Order Items</h3>
                <div className="space-y-3">
                  {cart.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-slate-900">{item.name}</p>
                        <p className="text-sm text-slate-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-slate-900">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <p className="text-sm text-blue-900">
                <strong>📧 Confirmation Email:</strong> A confirmation email has been sent to {formData.customerEmail}
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => navigate(`/store/${tenantId}`)}
                className="flex-1"
              >
                Continue Shopping
              </Button>
              <Button
                onClick={() => navigate(`/store/${tenantId}/orders/${orderConfirmation.order_number}`)}
                variant="outline"
                className="flex-1"
              >
                Track Order
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-right" />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Checkout</h1>

        {/* Steps Indicator */}
        <div className="mb-8 flex items-center justify-between">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center flex-1">
              <button
                onClick={() => handleStepChange(stepNum)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  step >= stepNum
                    ? "bg-primary text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {stepNum}
              </button>
              <div
                className={`flex-1 h-1 mx-2 ${
                  step > stepNum ? "bg-primary" : "bg-slate-200"
                }`}
              />
            </div>
          ))}
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold bg-slate-200 text-slate-600">
            3
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-8">
              {/* Step 1: Shipping */}
              {step >= 1 && (
                <div className={step === 1 ? "" : "opacity-50 pointer-events-none"}>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">
                    1. Shipping Information
                  </h2>
                  <div className="space-y-4 mb-8">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-900">
                          Full Name *
                        </label>
                        <Input
                          name="customerName"
                          value={formData.customerName}
                          onChange={handleShippingChange}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-900">
                          Email Address *
                        </label>
                        <Input
                          name="customerEmail"
                          type="email"
                          value={formData.customerEmail}
                          onChange={handleShippingChange}
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-900">
                        Phone Number *
                      </label>
                      <Input
                        name="customerPhone"
                        value={formData.customerPhone}
                        onChange={handleShippingChange}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-900">
                        Street Address *
                      </label>
                      <Input
                        name="shippingAddress"
                        value={formData.shippingAddress}
                        onChange={handleShippingChange}
                        placeholder="123 Main Street"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-900">
                          City *
                        </label>
                        <Input
                          name="shippingCity"
                          value={formData.shippingCity}
                          onChange={handleShippingChange}
                          placeholder="New York"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-900">
                          State/Province *
                        </label>
                        <Input
                          name="shippingState"
                          value={formData.shippingState}
                          onChange={handleShippingChange}
                          placeholder="NY"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-900">
                        Postal Code *
                      </label>
                      <Input
                        name="shippingZip"
                        value={formData.shippingZip}
                        onChange={handleShippingChange}
                        placeholder="10001"
                      />
                    </div>
                  </div>
                  {step === 1 && (
                    <Button
                      onClick={() => handleStepChange(2)}
                      className="w-full"
                    >
                      Continue to Billing
                      <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}

              {/* Step 2: Billing */}
              {step >= 2 && (
                <div className={step === 2 ? "" : "opacity-50 pointer-events-none"}>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6 mt-8">
                    2. Billing Address
                  </h2>
                  <div className="space-y-4 mb-8">
                    <label className="flex items-center gap-3 text-slate-900">
                      <input
                        type="checkbox"
                        checked={formData.useBillingAsShipping}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            useBillingAsShipping: e.target.checked,
                          })
                        }
                        className="w-5 h-5 rounded border-slate-300"
                      />
                      <span className="font-medium">Same as shipping address</span>
                    </label>
                    {!formData.useBillingAsShipping && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-slate-900">
                            Street Address *
                          </label>
                          <Input
                            name="billingAddress"
                            value={formData.billingAddress}
                            onChange={handleBillingChange}
                            placeholder="123 Main Street"
                          />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2 text-slate-900">
                              City *
                            </label>
                            <Input
                              name="billingCity"
                              value={formData.billingCity}
                              onChange={handleBillingChange}
                              placeholder="New York"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2 text-slate-900">
                              State/Province *
                            </label>
                            <Input
                              name="billingState"
                              value={formData.billingState}
                              onChange={handleBillingChange}
                              placeholder="NY"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-slate-900">
                            Postal Code *
                          </label>
                          <Input
                            name="billingZip"
                            value={formData.billingZip}
                            onChange={handleBillingChange}
                            placeholder="10001"
                          />
                        </div>
                      </>
                    )}
                  </div>
                  {step === 2 && (
                    <div className="flex gap-4">
                      <Button
                        onClick={() => setStep(1)}
                        variant="outline"
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={() => handleStepChange(3)}
                        className="flex-1"
                      >
                        Continue to Payment
                        <ChevronRight className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Payment */}
              {step >= 3 && (
                <div className={step === 3 ? "" : "opacity-50 pointer-events-none"}>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6 mt-8">
                    3. Payment Information
                  </h2>
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <Lock className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-blue-900">
                        Your payment information is secure and encrypted
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-900">
                        Cardholder Name *
                      </label>
                      <Input
                        value={cardData.cardName}
                        onChange={(e) =>
                          setCardData({ ...cardData, cardName: e.target.value })
                        }
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-900">
                        Card Number *
                      </label>
                      <Input
                        value={cardData.cardNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 16);
                          setCardData({ ...cardData, cardNumber: val });
                        }}
                        placeholder="1234 5678 9012 3456"
                        maxLength={16}
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-900">
                          Expiry (MM/YY) *
                        </label>
                        <Input
                          value={cardData.cardExpiry}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, "");
                            if (val.length >= 2) {
                              val = val.slice(0, 2) + "/" + val.slice(2, 4);
                            }
                            setCardData({ ...cardData, cardExpiry: val });
                          }}
                          placeholder="MM/YY"
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-900">
                          CVC *
                        </label>
                        <Input
                          value={cardData.cardCVC}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 3);
                            setCardData({ ...cardData, cardCVC: val });
                          }}
                          placeholder="123"
                          maxLength={3}
                          type="password"
                        />
                      </div>
                    </div>
                  </div>
                  {step === 3 && (
                    <div className="flex gap-4">
                      <Button
                        onClick={() => setStep(2)}
                        variant="outline"
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={handleCheckout}
                        disabled={isSubmitting}
                        className="flex-1"
                      >
                        {isSubmitting ? "Processing..." : "Complete Order"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6">
                Order Summary
              </h3>
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {cart.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-slate-900">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 pt-4 space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-semibold text-slate-900">
                    ₹{subtotal.toLocaleString()}
                  </span>
                </div>
                {discountApplied && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-₹{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-3">
                  <span>Total</span>
                  <span className="text-primary">₹{total.toLocaleString()}</span>
                </div>
              </div>

              {step < 3 && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-900">
                    Discount Code (Optional)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      placeholder="Enter code"
                      className="text-sm"
                    />
                    <Button
                      onClick={applyDiscount}
                      variant="outline"
                      className="text-sm"
                    >
                      Apply
                    </Button>
                  </div>
                  {discountApplied && (
                    <p className="text-sm text-emerald-600 font-medium">
                      ✓ Discount applied
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

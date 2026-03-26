import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getOrder, trackOrder } from "@/lib/api";
import { getTenantIdFromEnv, getTenantNameFromEnv, formatPrice } from "@/lib/utils";
import { toast } from "sonner";

export default function OrderConfirmation() {
  const tenantId = getTenantIdFromEnv();
  const tenantName = getTenantNameFromEnv();
  const navigate = useNavigate();
  const { orderNumber } = useParams<{ orderNumber: string }>();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        if (!orderNumber) {
          setError("Invalid order number");
          setLoading(false);
          return;
        }

        setLoading(true);
        const orderData = await trackOrder(tenantId, orderNumber);
        setOrder(orderData);

        // Check if email was sent for this order
        const storedEmailSent = localStorage.getItem(`order_${orderNumber}_emailSent`);
        if (storedEmailSent !== null) {
          setEmailSent(JSON.parse(storedEmailSent));
          // Clean up localStorage after reading
          localStorage.removeItem(`order_${orderNumber}_emailSent`);
        }

        document.title = `Order ${orderNumber} • ${tenantName}`;
      } catch (err) {
        console.error("Failed to load order:", err);
        setError("Failed to load order details. Please try again.");
        toast.error("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [tenantId, orderNumber, tenantName]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-700 mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-6">{error || "We couldn't find your order. Please check the order number and try again."}</p>
          <Link
            to="/"
            className="inline-block bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-800 transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const shippingAddress = typeof order.shipping_address === 'string' 
    ? JSON.parse(order.shipping_address) 
    : order.shipping_address;

  const discountAmount = Number(order.discount_amount) || 0;
  const totalAmount = Number(order.total_amount) || 0;
  const subtotalAmount = totalAmount + discountAmount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-gradient-to-r from-green-700 to-green-600 shadow-lg border-b-4 border-green-400">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white">Order Confirmation</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Success Message */}
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="text-4xl">✓</div>
            <div>
              <h2 className="text-2xl font-bold text-green-700 mb-2">Order Placed Successfully!</h2>
              <p className="text-gray-700">Thank you for your order. Your order has been confirmed and is being processed.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 bg-white rounded-lg border-2 border-green-200 p-6">
            <h2 className="text-xl font-bold text-green-700 mb-6">Order Details</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600 font-medium">Order Number</p>
                <p className="text-lg font-bold text-green-700">{order.order_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Order Date</p>
                <p className="text-lg font-semibold">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Status</p>
                <p className="text-lg font-semibold capitalize px-3 py-1 bg-blue-100 text-blue-700 rounded-full inline-block">
                  {order.status || 'Pending'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Payment Status</p>
                <p className="text-lg font-semibold capitalize px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full inline-block">
                  {order.payment_status || 'Pending'}
                </p>
              </div>
            </div>

            {/* Customer Information */}
            <div className="border-t pt-6 mb-6">
              <h3 className="text-lg font-bold text-green-700 mb-4">Customer Information</h3>
              <div className="space-y-2">
                <p><span className="font-medium text-gray-700">Name:</span> <span className="text-gray-900">{order.customer_name}</span></p>
                <p><span className="font-medium text-gray-700">Email:</span> <span className="text-gray-900">{order.customer_email}</span></p>
                <p><span className="font-medium text-gray-700">Phone:</span> <span className="text-gray-900">{order.customer_phone}</span></p>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="border-t pt-6 mb-6">
              <h3 className="text-lg font-bold text-green-700 mb-4">Shipping Address</h3>
              <p className="text-gray-700">{shippingAddress?.address || 'Not provided'}</p>
            </div>

            {/* Order Items */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-green-700 mb-4">Items in Order</h3>
              {items.length > 0 ? (
                <div className="space-y-4">
                  {items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center border-b pb-4">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{item.product_name || item.name}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Unit Price: {formatPrice(Number(item.unit_price) || 0)}</p>
                        <p className="font-bold text-green-700">{formatPrice(Number(item.total_price) || 0)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 italic">No items in this order</p>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg border-2 border-green-200 p-6 h-fit">
            <h2 className="text-xl font-bold text-green-700 mb-6">Order Summary</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-700">Subtotal</span>
                <span className="font-semibold">{formatPrice(subtotalAmount)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-semibold">-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between text-lg font-bold text-green-700">
                <span>Total</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                to="/"
                className="w-full block text-center bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 transition font-medium"
              >
                Continue Shopping
              </Link>
            </div>

            {emailSent && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>📧 Confirmation Email:</strong> A confirmation email has been sent to {order.customer_email}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 bg-amber-50 border-l-4 border-amber-400 p-4">
          <p className="text-amber-800">
            <strong>⏱️ Next Steps:</strong> Your order is now being processed. You will receive a shipping confirmation soon. You can track your order using order number <strong>{order.order_number}</strong>.
          </p>
        </div>
      </main>

      <footer className="bg-gray-800 text-gray-400 mt-16 py-8 px-4 border-t-4 border-green-700">
        <div className="max-w-6xl mx-auto text-center text-sm">Thank you for your order! • {tenantName}</div>
      </footer>
    </div>
  );
}

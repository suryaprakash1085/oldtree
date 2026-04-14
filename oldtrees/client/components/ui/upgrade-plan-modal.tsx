import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

type BillingPlan = {
  id: string;
  name: string;
  description?: string;
  price?: number | null;
  currency?: string;
  billing_period?: string;
  features?: string[];
  popular?: boolean;
};

interface UpgradePlanModalProps {
  open: boolean;
  message?: string;
  plans: BillingPlan[];
  selectedPlan: string;
  onSelectPlan: (plan: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  submitting?: boolean;
}

export default function UpgradePlanModal({
  open,
  message,
  plans,
  selectedPlan,
  onSelectPlan,
  onClose,
  onConfirm,
  submitting = false,
}: UpgradePlanModalProps) {
  if (!open) return null;

  const icons: Record<string, string> = {
    Free: "🆓",
    Basic: "📦",
    Pro: "🚀",
    Enterprise: "🏢",
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
      
      {/* Modal */}
      <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-[32px] bg-white shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 h-10 w-10 flex items-center justify-center rounded-full bg-white border shadow hover:bg-slate-100"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8 md:p-12 space-y-10">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">
              Plan Upgrade
            </p>
            <h2 className="mt-4 text-4xl font-bold text-slate-900">
              Upgrade your plan
            </h2>
            <p className="mt-4 text-slate-600 text-sm leading-6">
              {message ||
                "You’ve reached your limit. Upgrade your plan to unlock more features and continue growing."}
            </p>
          </div>

          {/* Plans */}
          <div className="grid gap-6 md:grid-cols-3">
            {plans.length === 0 ? (
              <div className="col-span-full text-center p-10 text-slate-500">
                Loading plans...
              </div>
            ) : (
              plans.map((plan) => {
                const isSelected = selectedPlan === plan.name;

                return (
                  <button
                    key={plan.id}
                    onClick={() => onSelectPlan(plan.name)}
                    className={`relative text-left rounded-3xl p-6 border transition-all duration-300 transform ${
                      isSelected
                        ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-white shadow-xl scale-[1.02]"
                        : "border-slate-200 bg-white hover:-translate-y-2 hover:shadow-xl"
                    }`}
                  >
                    {/* Popular Badge */}
                    {plan.popular && (
                      <span className="absolute top-4 right-4 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    )}

                    {/* Icon */}
                    <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-2xl mb-5">
                      {icons[plan.name] || "✨"}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-semibold text-slate-900">
                      {plan.name}
                    </h3>

                    {/* Description */}
                    <p className="mt-2 text-sm text-slate-600 min-h-[40px]">
                      {plan.description ||
                        `Best for growing users who need more power.`}
                    </p>

                    {/* Price */}
                    <div className="mt-5">
                      <p className="text-3xl font-bold text-slate-900">
                        {plan.price != null
                          ? `${plan.currency || "₹"}${Number(
                              plan.price
                            ).toLocaleString()}`
                          : "Free"}
                        {plan.price != null && (
                          <span className="text-sm text-slate-500 font-medium">
                            {" "}
                            / {plan.billing_period}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Features */}
                    <ul className="mt-5 space-y-2 text-sm text-slate-600">
                      {(plan.features || [
                        "Unlimited usage",
                        "Priority support",
                        "Advanced analytics",
                      ]).map((feature, i) => (
                        <li key={i}>✔ {feature}</li>
                      ))}
                    </ul>

                    {/* Select Button */}
                    <div className="mt-6">
                      <span
                        className={`block text-center py-2 rounded-xl text-sm font-semibold ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {isSelected ? "Selected" : "Select Plan"}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-6">
            <p className="text-sm text-slate-500">
              Choose a plan to continue.
            </p>

            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>

              {/* <Button
                onClick={onConfirm}
                disabled={!selectedPlan || submitting}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {submitting ? "Updating..." : "Upgrade Now 🚀"}
              </Button> */}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
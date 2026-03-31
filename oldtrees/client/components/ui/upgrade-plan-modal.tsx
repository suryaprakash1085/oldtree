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

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
<div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[32px] border border-slate-200 bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid gap-8 p-8 md:p-10">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-indigo-600">
              Plan upgrade
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-900">
              Upgrade your plan
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              {message ||
                "You have reached a plan limit. Choose a higher plan to continue creating items."}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {plans.length === 0 ? (
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                Loading available plans...
              </div>
            ) : (
              plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => onSelectPlan(plan.name)}
                  className={`group flex flex-col rounded-[28px] border p-6 text-left transition-all duration-200 ${
                    selectedPlan === plan.name
                      ? "border-indigo-500 bg-indigo-50 shadow-lg"
                      : "border-slate-200 bg-white hover:-translate-y-1 hover:shadow-lg"
                  }`}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-100 text-indigo-700 mb-6 text-3xl font-bold">
                    {plan.name?.charAt(0) || "P"}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    Upgrade to {plan.name}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600 min-h-[4.2rem]">
                    {plan.description ||
                      `Unlock more capacity, pages, and features with ${plan.name}.`}
                  </p>
                  <div className="mt-6 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Starting at</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {plan.price != null
                          ? `${plan.currency || "₹"}${Number(plan.price).toLocaleString()} / ${plan.billing_period}`
                          : "Free"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${
                        selectedPlan === plan.name
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {selectedPlan === plan.name ? "Selected" : "Select"}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Choose a plan and click update to continue.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Cancel
              </Button>
              {/* <Button
                onClick={onConfirm}
                disabled={!selectedPlan || submitting}
                className="w-full sm:w-auto"
              >
                {submitting ? "Updating plan..." : "Update plan"}
              </Button> */}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
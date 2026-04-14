import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  ArrowRight,
  Plus,
  X,
  Edit,
  Trash2,
  Pause,
  Play,
  IndianRupee,
  Tag
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  getSuperAdminAnalytics,
  getSuperAdminClients,
  getSuperAdminBilling,
  getSuperAdminThemes,
  getSuperAdminPricing,
  getSuperAdminFeatureCategories,
  createSuperAdminFeatureCategory,
  updateSuperAdminFeatureCategory,
  deleteSuperAdminFeatureCategory,
  getAuthToken,
  clearAuthToken,
  getCurrentUser,
  createSuperAdminClient,
  updateSuperAdminClient,
  suspendSuperAdminClient,
  reactivateSuperAdminClient,
  deleteSuperAdminClient,
  createSuperAdminPricing,
  updateSuperAdminPricing,
  deleteSuperAdminPricing,
} from "@/lib/api";
import { Toaster, toast } from "sonner";

type TabType = "dashboard" | "clients" | "billing" | "analytics" | "themes" | "pricing" | "featuresCategories" | "settings";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTab, setCurrentTab] = useState<TabType>("dashboard");
  const [analytics, setAnalytics] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [billing, setBilling] = useState<any[]>([]);
  const [themes, setThemes] = useState<any[]>([]);
  const [pricing, setPricing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);

  const getDefaultBillingPlan = () => {
    if (pricing && pricing.length > 0) {
      return pricing[0].name || "starter";
    }
    return "starter";
  };

  const [clientForm, setClientForm] = useState({
    companyName: "",
    domain: "",
    contactEmail: "",
    contactPhone: "",
    billingPlan: "starter",
  });
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  const [pricingForm, setPricingForm] = useState({
    name: "",
    description: "",
    price: "",
    currency: "₹",
    billingPeriod: "month",
    features: "",
  });
  const [editingPricingId, setEditingPricingId] = useState<string | null>(null);
  const [selectedFeatureValues, setSelectedFeatureValues] = useState<string[]>([]);

  const [featuresCategories, setFeaturesCategories] = useState<any[]>([]);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [editingFeatureCategoryId, setEditingFeatureCategoryId] = useState<string | null>(null);
  const [featureCategoryForm, setFeatureCategoryForm] = useState({
    name: "",
    categories: "",
  });

  useEffect(() => {
    const token = getAuthToken();
    const user = getCurrentUser();

    if (!token || user?.role !== "super-admin") {
      navigate("/auth/login");
      return;
    }

    loadData();
    // Set browser tab title
    document.title = "Super Admin Panel";
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsData, clientsData, billingData, themesData, pricingData, featureCategoriesData] = await Promise.all([
        getSuperAdminAnalytics(),
        getSuperAdminClients(),
        getSuperAdminBilling(),
        getSuperAdminThemes(),
        getSuperAdminPricing(),
        getSuperAdminFeatureCategories(),
      ]);
      setAnalytics(analyticsData.data);
      setClients(clientsData.data || []);
      setBilling(billingData.data || []);
      setThemes(themesData.data || []);
      setPricing(pricingData.data || []);
      setFeaturesCategories(featureCategoriesData.data || []);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClientId) {
        await updateSuperAdminClient(editingClientId, clientForm);
        toast.success("Client updated successfully");
      } else {
        await createSuperAdminClient(clientForm);
        toast.success("Client created successfully");
      }
      setShowClientModal(false);
      setEditingClientId(null);
      setClientForm({
        companyName: "",
        domain: "",
        contactEmail: "",
        contactPhone: "",
        billingPlan: "starter",
      });
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : editingClientId ? "Failed to update client" : "Failed to create client");
    }
  };

  const handleStartEditClient = (client: any) => {
    setEditingClientId(client.id);
    setClientForm({
      companyName: client.company_name,
      domain: client.domain,
      contactEmail: client.contact_email,
      contactPhone: client.contact_phone || "",
      billingPlan: client.billing_plan,
    });
    setShowClientModal(true);
  };

  const handleSuspendClient = async (clientId: string, isSuspended: boolean) => {
    if (!confirm(`Are you sure you want to ${isSuspended ? "reactivate" : "suspend"} this client?`)) {
      return;
    }
    try {
      if (isSuspended) {
        await reactivateSuperAdminClient(clientId);
        toast.success("Client reactivated");
      } else {
        await suspendSuperAdminClient(clientId);
        toast.success("Client suspended");
      }
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update client");
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm("Are you sure you want to delete this client? This action cannot be undone and will delete all associated data.")) {
      return;
    }
    try {
      await deleteSuperAdminClient(clientId);
      toast.success("Client deleted successfully");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete client");
    }
  };

  const normalize = (str: string) => str.trim().toLowerCase();

const getCategoryKey = (feature: string) => {
  const words = feature.trim().toLowerCase().split(" ");
  return words[words.length - 1]; // last word → orders, categories, etc.
};

const cleanFeatures = (features: string[]) => {
  const map = new Map<string, string>();

  features.forEach((feature) => {
    const key = getCategoryKey(feature);
    map.set(key, feature); // ✅ last value overrides previous
  });

  return Array.from(map.values());
};

const uniqueByCategory = (features: string[]) => {
  const map = new Map<string, string>();

  features.forEach((f) => {
    const key = getCategoryKey(f);
    map.set(key, f); // last one wins ✅
  });

  return Array.from(map.values());
};


const getLatestUniqueFeatures = (features: string[]) => {
  const map = new Map<string, string>();

  const getCategoryKey = (feature: string) => {
    const words = feature.trim().toLowerCase().split(" ");
    return words[words.length - 1];
  };

  features.forEach((feature) => {
    const key = getCategoryKey(feature);
    map.set(key, feature); // last value overrides
  });

  return Array.from(map.values());
};


  const handleCreatePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const features = featuresCategories.length > 0
        ? uniqueByCategory(
            selectedFeatureValues
              .map((f) => f.trim())
              .filter(Boolean)
          )
        : pricingForm.features
            .split("\n")
            .map((f) => f.trim())
            .filter(Boolean);

      const payload = {
        name: pricingForm.name,
        description: pricingForm.description,
        price: pricingForm.price ? parseFloat(pricingForm.price) : null,
        currency: pricingForm.currency,
        billingPeriod: pricingForm.billingPeriod,
        features,
      };

      if (editingPricingId) {
        await updateSuperAdminPricing(editingPricingId, payload);
        toast.success("Pricing plan updated successfully");
      } else {
        await createSuperAdminPricing(payload);
        toast.success("Pricing plan created successfully");
      }

      setShowPricingModal(false);
      setEditingPricingId(null);
      setPricingForm({
        name: "",
        description: "",
        price: "",
        currency: "₹",
        billingPeriod: "month",
        features: "",
      });
      loadData();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : editingPricingId
            ? "Failed to update pricing plan"
            : "Failed to create pricing plan"
      );
    }
  };

  const handleStartEditPricing = (plan: any) => {
    setEditingPricingId(plan.id);
    setPricingForm({
      name: plan.name,
      description: plan.description || "",
      price: plan.price ? plan.price.toString() : "",
      currency: plan.currency || "₹",
      billingPeriod: plan.billing_period,
      features: Array.isArray(plan.features)
        ? plan.features.map((feature: string) => feature.trim()).join("\n")
        : "",
    });
    setSelectedFeatureValues(
      Array.isArray(plan.features)
        ? plan.features.map((feature: string) => feature.trim())
        : []
    );
    setShowPricingModal(true);
  };

  const handleDeletePricing = async (pricingId: string) => {
    if (!confirm("Are you sure you want to delete this pricing plan?")) {
      return;
    }
    try {
      await deleteSuperAdminPricing(pricingId);
      toast.success("Pricing plan deleted successfully");
      loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete pricing plan"
      );
    }
  };

  const handleSaveFeatureCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!featureCategoryForm.name.trim()) {
      toast.error("Name is required");
      return;
    }

    const categories = featureCategoryForm.categories
      .split("\n")
      .map((category) => category.trim())
      .filter((category) => category.length > 0);

    try {
      const payload = {
        name: featureCategoryForm.name.trim(),
        categories,
      };

      if (editingFeatureCategoryId) {
        await updateSuperAdminFeatureCategory(editingFeatureCategoryId, payload);
        toast.success("Feature category updated");
      } else {
        await createSuperAdminFeatureCategory(payload);
        toast.success("Feature category created");
      }

      setShowFeaturesModal(false);
      setEditingFeatureCategoryId(null);
      setFeatureCategoryForm({ name: "", categories: "" });
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save feature category");
    }
  };

  const handleStartEditFeatureCategory = (item: any) => {
    setEditingFeatureCategoryId(item.id);
    setFeatureCategoryForm({
      name: item.name,
      categories: Array.isArray(item.categories) ? item.categories.join("\n") : "",
    });
    setShowFeaturesModal(true);
  };

  const handleDeleteFeatureCategory = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this feature category?")) {
      return;
    }
    try {
      await deleteSuperAdminFeatureCategory(itemId);
      toast.success("Feature category deleted");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete feature category");
    }
  };

  const handleOpenNewFeatureCategory = () => {
    setEditingFeatureCategoryId(null);
    setFeatureCategoryForm({ name: "", categories: "" });
    setShowFeaturesModal(true);
  };

  const handleLogout = () => {
    clearAuthToken();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: "dashboard", icon: BarChart3, label: "Dashboard" },
    { id: "clients", icon: Users, label: "Clients" },
    { id: "billing", icon: DollarSign, label: "Billing" },
    { id: "analytics", icon: TrendingUp, label: "Analytics" },
    { id: "pricing", icon: Tag, label: "Pricing" },
    { id: "featuresCategories", icon: ArrowRight, label: "Features Categories" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <Toaster position="top-right" />

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-200 transition-all duration-300 z-40 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">π</span>
              </div>
              <span className="font-bold text-slate-900">Platform</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        <nav className="mt-8 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id as TabType)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentTab === item.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-slate-100 text-slate-700 hover:text-slate-900"
              }`}
            >
              {typeof item.icon === "string" ? (
                <span className="text-xl flex-shrink-0">{item.icon}</span>
              ) : (
                <item.icon className="w-5 h-5 flex-shrink-0" />
              )}
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-slate-700"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-20"}`}>
        {/* Top Bar */}
        <div className="bg-white border-b border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {navItems.find((i) => i.id === currentTab)?.label} Management
              </h1>
              <p className="text-slate-600 mt-1">
                Manage your platform's {currentTab}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-600">Logged in as</div>
              <div className="font-semibold text-slate-900">
                {getCurrentUser()?.email || "Platform Admin"}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Dashboard Tab */}
          {currentTab === "dashboard" && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                  {
                    label: "Total Clients",
                    value: analytics?.totalClients || 0,
                    icon: Users,
                    color: "from-blue-500",
                  },
                  {
                    label: "Active Stores",
                    value: analytics?.activeStores || 0,
                    icon: TrendingUp,
                    color: "from-emerald-500",
                  },
                  {
                    label: "Total Revenue",
                    value: `₹${(analytics?.totalRevenue || 0).toLocaleString()}`,
                    icon: DollarSign,
                    color: "from-amber-500",
                  },
                  {
                    label: "Pending Orders",
                    value: analytics?.pendingOrders || 0,
                    icon: BarChart3,
                    color: "from-purple-500",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white rounded-lg p-6 border border-slate-200 hover:shadow-lg transition-shadow"
                  >
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${stat.color} to-purple-600 rounded-lg flex items-center justify-center mb-4`}
                    >
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-slate-600">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg border border-slate-200 p-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">
                    Top Performing Clients
                  </h2>
                  {analytics?.topClients && analytics.topClients.length > 0 ? (
                    <div className="space-y-4">
                      {analytics.topClients.map((client: any) => (
                        <div
                          key={client.id}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                        >
                          <div>
                            <p className="font-semibold text-slate-900">
                              {client.company_name}
                            </p>
                            <p className="text-sm text-slate-600">
                              {client.orderCount || 0} orders
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-900">
                              ₹{(client.revenue || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-600 text-center py-8">No client data yet</p>
                  )}
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">
                    Quick Stats
                  </h2>
                  <div className="space-y-4">
                    {[
                      { label: "Total Orders", value: analytics?.totalOrders || 0 },
                      {
                        label: "Average Client Revenue",
                        value: analytics?.totalClients
                          ? `₹${Math.round((analytics.totalRevenue || 0) / analytics.totalClients).toLocaleString()}`
                          : "₹0",
                      },
                      {
                        label: "Pending Orders",
                        value: analytics?.pendingOrders || 0,
                      },
                      { label: "Active Themes", value: themes.length },
                    ].map((stat) => (
                      <div key={stat.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <span className="text-slate-700 font-medium">
                          {stat.label}
                        </span>
                        <span className="text-xl font-bold text-slate-900">
                          {stat.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Clients Tab */}
          {currentTab === "clients" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  Clients ({clients.length})
                </h2>
                <Button
                  onClick={() => {
                    setShowClientModal(true);
                    setEditingClientId(null);
                    setClientForm({
                      companyName: "",
                      domain: "",
                      contactEmail: "",
                      contactPhone: "",
                      billingPlan: getDefaultBillingPlan(),
                    });
                  }}
                  className="group"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Client
                </Button>
              </div>

              {showClientModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between p-6 border-b border-slate-200">
                      <h3 className="text-xl font-bold text-slate-900">
                        {editingClientId ? "Edit Client" : "Add New Client"}
                      </h3>
                      <button
                        onClick={() => {
                          setShowClientModal(false);
                          setEditingClientId(null);
                          setClientForm({
                            companyName: "",
                            domain: "",
                            contactEmail: "",
                            contactPhone: "",
                            billingPlan: getDefaultBillingPlan(),
                          });
                        }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <form
                      onSubmit={handleCreateClient}
                      className="p-6 space-y-4"
                    >
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-1">
                            Company Name *
                          </label>
                          <Input
                            value={clientForm.companyName}
                            onChange={(e) =>
                              setClientForm({
                                ...clientForm,
                                companyName: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-1">
                            Domain
                          </label>
                          <Input
                            value={clientForm.domain}
                            onChange={(e) =>
                              setClientForm({
                                ...clientForm,
                                domain: e.target.value,
                              })
                            }
                            placeholder="store.example.com"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-1">
                            Contact Email *
                          </label>
                          <Input
                            type="email"
                            value={clientForm.contactEmail}
                            onChange={(e) =>
                              setClientForm({
                                ...clientForm,
                                contactEmail: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-1">
                            Contact Phone
                          </label>
                          <Input
                            value={clientForm.contactPhone}
                            onChange={(e) =>
                              setClientForm({
                                ...clientForm,
                                contactPhone: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-1">
                          Billing Plan
                        </label>
                        <select
                          value={clientForm.billingPlan}
                          onChange={(e) =>
                            setClientForm({
                              ...clientForm,
                              billingPlan: e.target.value,
                            })
                          }
                          className="w-full border border-slate-300 rounded-lg p-2"
                        >
                          {pricing && pricing.length > 0 ? (
                            <>
                              {!pricing.some((plan) => plan.name === clientForm.billingPlan) && clientForm.billingPlan && (
                                <option value={clientForm.billingPlan}>
                                  {clientForm.billingPlan} (current)
                                </option>
                              )}
                              {pricing.map((plan) => (
                                <option key={plan.id} value={plan.name}>
                                  {plan.name}{" "}
                                  {plan.price != null
                                    ? `(${plan.currency || "₹"}${Number(plan.price).toLocaleString()} / ${plan.billing_period})`
                                    : "(Custom)"}
                                </option>
                              ))}
                            </>
                          ) : (
                            <>
                              <option value="starter">Starter (₹1,200/mo)</option>
                              <option value="growth">Growth (₹5,000/mo)</option>
                              <option value="enterprise">Enterprise (Custom)</option>
                            </>
                          )}
                        </select>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1">
                          {editingClientId ? "Update Client" : "Create Client"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowClientModal(false);
                            setEditingClientId(null);
                            setClientForm({
                              companyName: "",
                              domain: "",
                              contactEmail: "",
                              contactPhone: "",
                              billingPlan: getDefaultBillingPlan(),
                            });
                          }}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                {clients.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Company
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Plan
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Orders
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Revenue
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Status
                        </th>
                        <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((client: any) => (
                        <tr
                          key={client.id}
                          className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-slate-900 font-medium">
                            {client.company_name}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {client.contact_email}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                              {client.billing_plan}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-900">
                            {client.totalOrders || 0}
                          </td>
                          <td className="px-6 py-4 text-slate-900 font-medium">
                            ₹{(client.totalRevenue || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                client.is_suspended
                                  ? "bg-red-100 text-red-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {client.is_suspended ? "Suspended" : "Active"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleStartEditClient(client)}
                                className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4 text-blue-600" />
                              </button>
                              <button
                                onClick={() => handleSuspendClient(client.id, client.is_suspended)}
                                className="p-2 hover:bg-yellow-50 rounded-lg transition-colors"
                              >
                                {client.is_suspended ? (
                                  <Play className="w-4 h-4 text-yellow-600" />
                                ) : (
                                  <Pause className="w-4 h-4 text-yellow-600" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteClient(client.id)}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 mb-4">No clients yet</p>
                    <Button onClick={() => setShowClientModal(true)}>
                      Create Your First Client
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {currentTab === "billing" && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Billing Information
              </h2>
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                {billing.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Company
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Plan
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Subscription Date
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Renewal Date
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Total Orders
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Revenue
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {billing.map((item: any) => (
                        <tr
                          key={item.id}
                          className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-slate-900 font-medium">
                            {item.company_name}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                              {item.billing_plan}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {new Date(item.subscription_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {item.renewal_date
                              ? new Date(item.renewal_date).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="px-6 py-4 text-slate-900">
                            {item.totalOrders || 0}
                          </td>
                          <td className="px-6 py-4 text-slate-900 font-medium">
                            ₹{(item.totalRevenue || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center">
                    <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No billing data</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {currentTab === "analytics" && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Platform Analytics
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-slate-200 p-8">
                  <h3 className="text-lg font-semibold text-slate-900 mb-6">
                    Growth Metrics
                  </h3>
                  <div className="space-y-4">
                    {[
                      { label: "Total Clients (All Time)", value: analytics?.totalClients || 0 },
                      {
                        label: "Month-over-Month Growth",
                        value: "12%",
                      },
                      {
                        label: "Average Revenue Per Client",
                        value: analytics?.totalClients
                          ? `₹${Math.round((analytics.totalRevenue || 0) / analytics.totalClients).toLocaleString()}`
                          : "₹0",
                      },
                      {
                        label: "Churn Rate",
                        value: "2.5%",
                      },
                    ].map((metric) => (
                      <div
                        key={metric.label}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <span className="text-slate-700">{metric.label}</span>
                        <span className="font-semibold text-slate-900">
                          {metric.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-8">
                  <h3 className="text-lg font-semibold text-slate-900 mb-6">
                    Revenue Analytics
                  </h3>
                  <div className="space-y-4">
                    {[
                      {
                        label: "Total Revenue (All Time)",
                        value: `₹${(analytics?.totalRevenue || 0).toLocaleString()}`,
                      },
                      {
                        label: "Starter Plan Revenue",
                        value: "₹" + ((analytics?.totalRevenue || 0) * 0.4).toLocaleString(),
                      },
                      {
                        label: "Growth Plan Revenue",
                        value: "₹" + ((analytics?.totalRevenue || 0) * 0.45).toLocaleString(),
                      },
                      {
                        label: "Enterprise Plan Revenue",
                        value: "₹" + ((analytics?.totalRevenue || 0) * 0.15).toLocaleString(),
                      },
                    ].map((metric) => (
                      <div
                        key={metric.label}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <span className="text-slate-700">{metric.label}</span>
                        <span className="font-semibold text-slate-900">
                          {metric.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Tab */}
          {currentTab === "pricing" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  Pricing Plans
                </h2>
                <Button
                  onClick={() => {
                    setEditingPricingId(null);
                    setPricingForm({
                      name: "",
                      description: "",
                      price: "",
                      currency: "₹",
                      billingPeriod: "month",
                      features: "",
                    });
                    setSelectedFeatureValues([]);
                    setShowPricingModal(true);
                  }}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Pricing Plan
                </Button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pricing && pricing.length > 0 ? (
                  pricing.map((plan: any) => (
                    <div
                      key={plan.id}
                      className="bg-white rounded-lg border border-slate-200 p-8 hover:shadow-lg transition-shadow relative"
                    >
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button
                          onClick={() => handleStartEditPricing(plan)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-slate-600" />
                        </button>
                        <button
                          onClick={() => handleDeletePricing(plan.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>

                      <div className="mb-6">
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">
                          {plan.name}
                        </h3>
                        <p className="text-slate-600 text-sm mb-4">
                          {plan.description}
                        </p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold text-slate-900">
                            {plan.price ? (
                              <>
                                {plan.currency}
                                {plan.price.toLocaleString()}
                              </>
                            ) : (
                              "Custom"
                            )}
                          </span>
                          {plan.billing_period && plan.billing_period !== "custom" && (
                            <span className="text-slate-600">/{plan.billing_period}</span>
                          )}
                        </div>
                      </div>

                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wide">
                          Features
                        </h4>
                        <ul className="space-y-3">
                          {plan.features && plan.features.map((feature: string, idx: number) => (
                            <li key={idx} className="flex items-center gap-2 text-slate-700">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0"></div>
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 p-12 text-center">
                    <Tag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No pricing plans available</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Features Categories Tab */}
          {currentTab === "featuresCategories" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Feature Categories
                  </h2>
                  <p className="text-slate-600 mt-1">
                    Manage feature category groups and their associated category values.
                  </p>
                </div>
                <Button onClick={handleOpenNewFeatureCategory} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Feature Category
                </Button>
              </div>

              {featuresCategories.length > 0 ? (
                <div className="overflow-hidden bg-white rounded-lg border border-slate-200 shadow-sm">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Categories
                        </th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {featuresCategories.map((item: any) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-slate-900 font-medium">
                            {item.name}
                          </td>
                          <td className="px-6 py-4 text-slate-700">
                            {item.categories && item.categories.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {item.categories.map((category: string, index: number) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                                  >
                                    {category}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400">No categories</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
                              <button
                                onClick={() => handleStartEditFeatureCategory(item)}
                                className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                              >
                               <Edit className="w-4 h-4" /> 
                              </button>
                              <button
                                onClick={() => handleDeleteFeatureCategory(item.id)}
                                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                               <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-dashed border-slate-300 p-12 text-center">
                  <p className="text-slate-600 mb-4">No feature categories yet.</p>
                  <Button onClick={handleOpenNewFeatureCategory}>Create first feature category</Button>
                </div>
              )}

              {showFeaturesModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between p-6 border-b border-slate-200">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">
                          {editingFeatureCategoryId ? "Edit Feature Category" : "Add Feature Category"}
                        </h3>
                        <p className="text-slate-600 text-sm mt-1">
                          Enter the name and category values for this feature category group.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowFeaturesModal(false);
                          setEditingFeatureCategoryId(null);
                          setFeatureCategoryForm({ name: "", categories: "" });
                        }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveFeatureCategory} className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-1">
                          Feature Category Name *
                        </label>
                        <Input
                          value={featureCategoryForm.name}
                          onChange={(e) =>
                            setFeatureCategoryForm({
                              ...featureCategoryForm,
                              name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-1">
                          Categories (one per line)
                        </label>
                        <textarea
                          value={featureCategoryForm.categories}
                          onChange={(e) =>
                            setFeatureCategoryForm({
                              ...featureCategoryForm,
                              categories: e.target.value,
                            })
                          }
                          rows={6}
                          placeholder="Category 1\nCategory 2\nCategory 3"
                          className="w-full border border-slate-300 rounded-lg p-2 font-mono text-sm"
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1">
                          {editingFeatureCategoryId ? "Update" : "Create"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowFeaturesModal(false);
                            setEditingFeatureCategoryId(null);
                            setFeatureCategoryForm({ name: "", categories: "" });
                          }}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {currentTab === "settings" && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Platform Settings
              </h2>
              <div className="space-y-4">
                {[
                  {
                    title: "Email Configuration",
                    description: "Configure email service for notifications",
                  },
                  {
                    title: "Payment Gateways",
                    description: "Manage payment processor integrations",
                  },
                  {
                    title: "API Configuration",
                    description: "Configure API keys and webhooks",
                  },
                  {
                    title: "Security Settings",
                    description: "Manage security policies and 2FA",
                  },
                  {
                    title: "Backup & Recovery",
                    description: "Configure automated backups",
                  },
                  {
                    title: "System Logs",
                    description: "View system logs and audit trails",
                  },
                ].map((setting) => (
                  <div
                    key={setting.title}
                    className="bg-white rounded-lg border border-slate-200 p-6 flex items-center justify-between hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {setting.title}
                      </h3>
                      <p className="text-slate-600 text-sm">
                        {setting.description}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pricing Modal - Global Level */}
      {showPricingModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      {/* Modal Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200">
        <h3 className="text-xl font-bold text-slate-900">
          {editingPricingId ? "Edit Pricing Plan" : "Add New Pricing Plan"}
        </h3>
        <button
          onClick={() => {
            setShowPricingModal(false);
            setEditingPricingId(null);
            setSelectedFeatureValues([]);
            setPricingForm({
              name: "",
              description: "",
              price: "",
              currency: "₹",
              billingPeriod: "month",
              features: "",
            });
          }}
          className="text-slate-400 hover:text-slate-600"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Modal Form */}
      <form
        onSubmit={handleCreatePricing}
        className="p-6 space-y-4"
        autoComplete="off"
      >
        {/* Plan Name */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">
            Plan Name *
          </label>
          <Input
            value={pricingForm.name}
            onChange={(e) =>
              setPricingForm({ ...pricingForm, name: e.target.value })
            }
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">
            Description
          </label>
          <Input
            value={pricingForm.description}
            onChange={(e) =>
              setPricingForm({ ...pricingForm, description: e.target.value })
            }
          />
        </div>

        {/* Price & Currency */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              Price
            </label>
            <Input
              type="number"
              step="0.01"
              value={pricingForm.price}
              onChange={(e) =>
                setPricingForm({ ...pricingForm, price: e.target.value })
              }
              placeholder="e.g., 1200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              Currency
            </label>
            <Input
              value={pricingForm.currency}
              onChange={(e) =>
                setPricingForm({ ...pricingForm, currency: e.target.value })
              }
            />
          </div>
        </div>

        {/* Billing Period */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">
            Billing Period *
          </label>
          <select
            value={pricingForm.billingPeriod}
            onChange={(e) =>
              setPricingForm({ ...pricingForm, billingPeriod: e.target.value })
            }
            className="w-full border border-slate-300 rounded-lg p-2"
            required
          >
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {/* Features */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">
            Features
          </label>

          {featuresCategories.length > 0 ? (
            <div className="border border-slate-300 rounded-lg p-2 max-h-40 overflow-y-auto bg-white">
              {Array.from(
                new Set(
                  featuresCategories.flatMap((item: any) =>
                    Array.isArray(item.categories)
                      ? item.categories
                          .map((cat: any) =>
                            typeof cat === "string" ? cat : cat?.name || ""
                          )
                          .filter(Boolean)
                      : []
                  )
                )
              ).map((category: string, index: number) => {
                const normalizedCategory = category.trim();
                if (!normalizedCategory) return null;

                const normalizeValue = (value: string) =>
                  value.trim().toLowerCase();

                const selectedFeatures = selectedFeatureValues
                  .map((f) => f.trim())
                  .filter(Boolean);

                const containsNormalized = (list: string[], value: string) =>
                  list.some(
                    (item) =>
                      item.trim().toLowerCase() === value.trim().toLowerCase()
                  );

                return (
                  <label
                    key={normalizedCategory + index}
                    className="flex items-center gap-2 px-2 py-1 hover:bg-slate-100 rounded cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={containsNormalized(
                        selectedFeatures,
                        normalizedCategory
                      )}
                      onChange={(e) => {
                        setSelectedFeatureValues((prev) => {
                          const normalizedPrev = prev
                            .map((f) => f.trim())
                            .filter(Boolean);

                          if (e.target.checked) {
                            if (
                              containsNormalized(
                                normalizedPrev,
                                normalizedCategory
                              )
                            ) {
                              return normalizedPrev;
                            }
                            return [...normalizedPrev, normalizedCategory];
                          }

                          return normalizedPrev.filter(
                            (f) =>
                              normalizeValue(f) !==
                              normalizeValue(normalizedCategory)
                          );
                        });
                      }}
                      className="accent-blue-600"
                    />
                    {normalizedCategory}
                  </label>
                );
              })}
            </div>
          ) : (
            <textarea
              name="pricing-features"
              autoComplete="off"
              spellCheck={false}
              inputMode="text"
              value={pricingForm.features}
              onChange={(e) =>
                setPricingForm({ ...pricingForm, features: e.target.value })
              }
              rows={5}
              placeholder={`Up to 100 products
Basic analytics
Email support`}
              className="w-full border border-slate-300 rounded-lg p-2 font-mono text-sm"
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" className="flex-1">
            {editingPricingId ? "Update Plan" : "Create Plan"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowPricingModal(false);
              setEditingPricingId(null);
              setSelectedFeatureValues([]);
              setPricingForm({
                name: "",
                description: "",
                price: "",
                currency: "₹",
                billingPeriod: "month",
                features: "",
              });
            }}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  </div>
)}
      </div>
    </div>
  );
}

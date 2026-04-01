import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ShoppingCart,
  TrendingUp,
  Users,
  Settings,
  LogOut,
  Menu,
  Package,
  DollarSign,
  Palette,
  ArrowRight,
  Plus,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  X,
  Check,
  Tag,
  Globe,
  FileText,
  BookOpen,
  Printer,
  Phone,
  CreditCard,
  Mail,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import {
  getClientAdminDashboard,
  getAuthToken,
  clearAuthToken,
  getCurrentUser,
  getClientProducts,
  createClientProduct,
  updateClientProduct,
  deleteClientProduct,
  getClientOrders,
  getClientCategories,
  createClientCategory,
  updateClientCategory,
  deleteClientCategory,
  updateOrderStatus,
  getClientCustomers,
  getClientDiscounts,
  createClientDiscount,
  getSuperAdminPricing,
  updateClientBillingPlan,
  getBusinessDetails,
  updateBusinessDetails,
  getSEOSettings,
  updateSEOSettings,
  getStaffMembers,
  createStaffMember,
  deleteStaffMember,
  getAllThemes,
  getTenantByDomain,
  uploadProductImage,
  getHeroSliders,
  createHeroSlider,
  updateHeroSlider,
  deleteHeroSlider,
  getTenantThemeCustomization,
  updateThemeCustomization,
  getAvailableTemplates,
  getTenantTemplate,
  setTenantTemplate,
  getPagesAdmin,
  createPageAdmin,
  updatePageAdmin,
  deletePageAdmin,
  getBlogPostsAdmin,
  createBlogPostAdmin,
  updateBlogPostAdmin,
  deleteBlogPostAdmin,
  getFooterSections,
  updateFooterSection,
  getAnnouncementSettings,
  updateAnnouncementSettings,
  getAssetUrl,
  getContactUs,
  updateContactUs,
  getPaymentInfo,
  updatePaymentInfo,

  updateClientCustomer,
  deleteClientCustomer,
  updateClientDiscount,
  deleteClientDiscount,
} from "@/lib/api";
import UpgradePlanModal from "@/components/ui/upgrade-plan-modal";
import { Toaster, toast } from "sonner";
import { useTenant } from "@/hooks/use-tenant";

type TabType =
  | "dashboard"
  | "products"
  | "orders"
  | "customers"
  | "discounts"
  | "appearance"
  | "settings"
  | "categories"
  | "seo"
  | "pages"
  | "blog"
  | "contact-us"
  | "payment-info";

export default function ClientAdminDashboard() {
  const navigate = useNavigate();
  const { logout, handleTokenError } = useAuth();
  const {
    tenantId,
    domain,
    loading: tenantLoading,
    error: tenantError,
  } = useTenant();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTab, setCurrentTab] = useState<TabType>(() => {
    const saved = localStorage.getItem("clientAdminCurrentTab");
    return (saved as TabType) || "dashboard";
  });
  const [dashboardData, setDashboardData] = useState<any>(null);
    const [editingDiscountId, setEditingDiscountId] = useState<string | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [productsPage, setProductsPage] = useState(1);
  const [productsPages, setProductsPages] = useState(1);
  const [categories, setCategories] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [themes, setThemes] = useState<any[]>([]);
  const [businessDetails, setBusinessDetails] = useState<any>(null);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    description: "",
  });
  const [generatedSKU, setGeneratedSKU] = useState<string>("");

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    sku: "",
    price: "",
    costPrice: "",
    category: "",
    stockQuantity: "",
    imageUrl: "",
    imageFile: null as File | null,
  });

  const [discountForm, setDiscountForm] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    minOrderAmount: "",
    maxUses: "",
    validFrom: "",
    validUntil: "",
  });


   const [customerForm, setCustomerForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    city: "",
    country: "",
  });

  const [staffForm, setStaffForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "editor",
    password: "",
  });

  const [businessForm, setBusinessForm] = useState({
    companyName: "",
    contactEmail: "",
    contactPhone: "",
    isMaintenanceMode: false,
    youtubeUrl: "",
    instagramUrl: "",
    facebookUrl: "",
    logo: "",
    logoFile: null as File | null,
  });

  const [seoSettings, setSeoSettings] = useState<any>({
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    gtagId: "",
    searchConsoleMeta: "",
    minOrderAmount: 0,
    faviconUrl: "",
    faviconFile: null as File | null,
    faviconFileName: "",
  });
  const [savingSEO, setSavingSEO] = useState(false);

  const [selectedThemeId, setSelectedThemeId] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentThemeData, setCurrentThemeData] = useState<any>(null);
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<string>("product-grid");
  const [announcementMessage, setAnnouncementMessage] = useState<string>("");
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [billingPlans, setBillingPlans] = useState<any[]>([]);
  const [selectedBillingPlan, setSelectedBillingPlan] = useState<string>("");
  const [showUpgradePlanModal, setShowUpgradePlanModal] = useState(false);
  const [upgradePromptMessage, setUpgradePromptMessage] = useState<string>("");
  const [upgradingBillingPlan, setUpgradingBillingPlan] = useState(false);

  // Pages & Blog
  const [pages, setPages] = useState<any[]>([]);
  const [pagesPage, setPagesPage] = useState(1);
  const [pagesPages, setPagesPages] = useState(1);
  const [showPageModal, setShowPageModal] = useState(false);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [pageForm, setPageForm] = useState({
    title: "",
    slug: "",
    description: "",
    content: "",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    featuredImageUrl: "",
    isPublished: false,
  });

  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [blogPage, setBlogPage] = useState(1);
  const [blogPages, setBlogPages] = useState(1);
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [postForm, setPostForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    featuredImageUrl: "",
    category: "",
    tags: "",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    isPublished: false,
  });

  // Footer Sections
  const [footerSections, setFooterSections] = useState<any[]>([]);
  const [editingFooterSection, setEditingFooterSection] = useState<
    string | null
  >(null);
  const [footerForm, setFooterForm] = useState({
    sectionName: "",
    isEnabled: true,
    sortOrder: 0,
    sectionData: "",
  });

  // Hero sliders (theme banners)
  const [heroSliders, setHeroSliders] = useState<any[]>([]);
  const [showSliderModal, setShowSliderModal] = useState(false);
  const [editingSliderId, setEditingSliderId] = useState<string | null>(null);
  const [sliderForm, setSliderForm] = useState({
    imageUrl: "",
    title: "",
    subtitle: "",
    ctaText: "",
    ctaUrl: "",
    sortOrder: 0,
    isActive: true,
  });

  // Contact Us
  const [contactUsData, setContactUsData] = useState<any>(null);
  const [contactUsForm, setContactUsForm] = useState({
    email: "",
    phone: "",
    address: "",
    map_code: "",
    working_hours: { monday_friday: "", saturday: "", sunday: "" },
  });

  // Payment Info
  const [paymentInfoData, setPaymentInfoData] = useState<any>(null);
  const [paymentInfoForm, setPaymentInfoForm] = useState({
    bank_account_name: "",
    bank_account_number: "",
    bank_name: "",
    ifsc_code: "",
    branch: "",
    gpay_name: "",
    gpay_number: "",
    upi_name: "",
    upi_id: "",
    upi_image_url: "",
    images: [] as Array<{ image_url: string; image_type?: string }>,
  });

  // Email Settings
  const [emailSettingsForm, setEmailSettingsForm] = useState({
    smtp_host: "",
    smtp_port: "",
    smtp_username: "",
    smtp_password: "",
    sender_email: "",
    target_email: "",
    email_notify_enabled: false,
  });

  const [tabLoading, setTabLoading] = useState(false);

  const loadBillingPlans = async () => {
    try {
      const pricingData = await getSuperAdminPricing();
      const plans = pricingData.data || [];
      setBillingPlans(plans);
      if (plans.length && !selectedBillingPlan) {
        setSelectedBillingPlan(plans[0].name);
      }
    } catch (error) {
      console.error("Failed to load billing plans:", error);
    }
  };

  const openUpgradePlanModal = (message: string) => {
    setUpgradePromptMessage(message);
    setShowUpgradePlanModal(true);
    if (!billingPlans.length) {
      loadBillingPlans();
    }
  };

  const updatePlanForTenant = async () => {
    if (!tenantId || !selectedBillingPlan) {
      toast.error("Please select a billing plan to continue.");
      return;
    }

    setUpgradingBillingPlan(true);
    try {
      await updateClientBillingPlan(selectedBillingPlan, tenantId);
      toast.success("Billing plan updated successfully");
      setShowUpgradePlanModal(false);
      await fetchTabData("products", true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update billing plan",
      );
    } finally {
      setUpgradingBillingPlan(false);
    }
  };

  const handlePlanLimitError = (error: any): string | null => {
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    if (message.toLowerCase().includes("please upgrade your plan")) {
      openUpgradePlanModal(message);
      return null;
    }
    return message;
  };
  const [loadedSections, setLoadedSections] = useState<{
    [key: string]: boolean;
  }>({});

  const markLoaded = (...keys: string[]) => {
    setLoadedSections((prev) => {
      const next = { ...prev };
      keys.forEach((k) => {
        next[k] = true;
      });
      return next;
    });
  };

  const initialLoad = useCallback(async () => {
    try {
      setLoading(true);
      setTokenError(null);
      const dashData = await getClientAdminDashboard(tenantId || undefined);
      setDashboardData(dashData.data);
    } catch (error) {
      console.error("Failed to load data:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load dashboard data";
      if (
        errorMessage.toLowerCase().includes("token") ||
        errorMessage.toLowerCase().includes("unauthorized") ||
        (error as any).status === 401
      ) {
        setTokenError("Your session has expired. Please log in again.");
        handleTokenError();
        toast.error("Session expired. Redirecting to login...");
        setTimeout(() => navigate("/auth/login"), 2000);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
      markLoaded("dashboard");
    }
  }, [tenantId, handleTokenError, navigate]);

  const fetchTabData = useCallback(
    async (tab: TabType, forceReload: boolean = false) => {
      if (loadedSections[tab] && !forceReload) return;
      setTabLoading(true);
      try {
        switch (tab) {
          case "products": {
            try {
              const prodsData = await getClientProducts({
                page: productsPage,
                limit: 10,
                tenantId: tenantId || undefined,
              });
              setProducts(prodsData.data || []);
              setProductsPages(prodsData.pagination?.pages || 1);
            } catch (err) {
              console.error("Failed to load products:", err);
              setProducts([]);
            }
            try {
              const categoriesData = await getClientCategories(
                tenantId || undefined,
              );
              setCategories(categoriesData.data || []);
            } catch (err) {
              console.error("Failed to load categories:", err);
              setCategories([]);
            }
            markLoaded("products", "categories");
            break;
          }
          case "categories": {
            try {
              const categoriesData = await getClientCategories(
                tenantId || undefined,
              );
              setCategories(categoriesData.data || []);
            } catch (err) {
              console.error("Failed to load categories:", err);
              setCategories([]);
            }
            markLoaded("categories");
            break;
          }
          case "orders": {
            try {
              const ordersData = await getClientOrders(tenantId || undefined);
              setOrders(ordersData.data || []);
            } catch (err) {
              console.error("Failed to load orders:", err);
              setOrders([]);
            }
            markLoaded("orders");
            break;
          }
          case "customers": {
            try {
              const customersData = await getClientCustomers(
                tenantId || undefined,
              );
              setCustomers(customersData.data || []);
            } catch (err) {
              console.error("Failed to load customers:", err);
              setCustomers([]);
            }
            markLoaded("customers");
            break;
          }
          case "discounts": {
            try {
              const discountsData = await getClientDiscounts(
                tenantId || undefined,
              );
              setDiscounts(discountsData.data || []);
            } catch (err) {
              console.error("Failed to load discounts:", err);
              setDiscounts([]);
            }
            markLoaded("discounts");
            break;
          }
          case "pages": {
            try {
              const pagesRes = await getPagesAdmin({
                page: pagesPage,
                limit: 10,
                tenantId: tenantId || undefined,
              });
              setPages(pagesRes.data || []);
              setPagesPages(pagesRes.pagination?.pages || 1);
            } catch (err) {
              console.error("Failed to load pages:", err);
              setPages([]);
            }
            markLoaded("pages");
            break;
          }
          case "blog": {
            try {
              const postsRes = await getBlogPostsAdmin({
                page: blogPage,
                limit: 10,
                tenantId: tenantId || undefined,
              });
              setBlogPosts(postsRes.data || []);
              setBlogPages(postsRes.pagination?.pages || 1);
            } catch (err) {
              console.error("Failed to load blog posts:", err);
              setBlogPosts([]);
            }
            markLoaded("blog");
            break;
          }
          case "contact-us": {
            try {
              const contactData = await getContactUs(tenantId || undefined);
              setContactUsData(contactData.data);
              if (contactData.data) {
                setContactUsForm({
                  email: contactData.data.email || "",
                  phone: contactData.data.phone || "",
                  address: contactData.data.address || "",
                  map_code: contactData.data.map_code || "",
                  working_hours: contactData.data.working_hours || {
                    monday_friday: "",
                    saturday: "",
                    sunday: "",
                  },
                });
              }
            } catch (err) {
              console.error("Failed to load contact us:", err);
            }
            markLoaded("contact-us");
            break;
          }
          case "payment-info": {
            try {
              const paymentData = await getPaymentInfo(tenantId || undefined);
              setPaymentInfoData(paymentData.data);
              if (paymentData.data) {
                setPaymentInfoForm({
                  bank_account_name: paymentData.data.bank_account_name || "",
                  bank_account_number:
                    paymentData.data.bank_account_number || "",
                  bank_name: paymentData.data.bank_name || "",
                  ifsc_code: paymentData.data.ifsc_code || "",
                  branch: paymentData.data.branch || "",
                  gpay_name: paymentData.data.gpay_name || "",
                  gpay_number: paymentData.data.gpay_number || "",
                  upi_name: paymentData.data.upi_name || "",
                  upi_id: paymentData.data.upi_id || "",
                  upi_image_url: paymentData.data.upi_image_url || "",
                  images: Array.isArray(paymentData.data.images)
                    ? paymentData.data.images
                    : [],
                });
              }
            } catch (err) {
              console.error("Failed to load payment info:", err);
            }
            markLoaded("payment-info");
            break;
          }
          case "email-settings": {
            try {
              const { getEmailSettings } = await import("@/lib/api");
              const emailData = await getEmailSettings(tenantId || undefined);
              if (emailData.data) {
                setEmailSettingsForm({
                  smtp_host: emailData.data.smtp_host || "",
                  smtp_port: emailData.data.smtp_port || "",
                  smtp_username: emailData.data.smtp_username || "",
                  smtp_password: emailData.data.smtp_password || "",
                  sender_email: emailData.data.sender_email || "",
                  target_email: emailData.data.target_email || "",
                  email_notify_enabled:
                    emailData.data.email_notify_enabled || false,
                });
              }
            } catch (err) {
              console.error("Failed to load email settings:", err);
            }
            markLoaded("email-settings");
            break;
          }
          case "appearance": {
            try {
              const bizDetails = await getBusinessDetails(
                tenantId || undefined,
              );
              setBusinessDetails(bizDetails.data);
              if (bizDetails.data) {
                setBusinessForm({
                  companyName: bizDetails.data.company_name,
                  contactEmail: bizDetails.data.contact_email,
                  contactPhone: bizDetails.data.contact_phone,
                  isMaintenanceMode: bizDetails.data.is_maintenance_mode,
                  youtubeUrl: bizDetails.data.youtube_url || "",
                  instagramUrl: bizDetails.data.instagram_url || "",
                  facebookUrl: bizDetails.data.facebook_url || "",
                  logo: bizDetails.data.logo_url || "",
                  logoFile: null,
                });
              }
            } catch (err) {
              console.error("Failed to load business details:", err);
            }
            try {
              const themesData = await getAllThemes();
              setThemes(themesData.data || []);
            } catch (err) {
              console.error("Failed to load themes:", err);
              setThemes([]);
            }
            try {
              const tenantTemplateData = await getTenantTemplate(
                tenantId || undefined,
              );
              setSelectedTemplate(
                tenantTemplateData.data?.template || "theme-b",
              );
            } catch (err) {
              console.error("Failed to load tenant template:", err);
            }
            try {
              const templatesData = await getAvailableTemplates(
                tenantId || undefined,
              );
              setAvailableTemplates(templatesData.data || []);
            } catch (err) {
              console.error("Failed to load available templates:", err);
              setAvailableTemplates([]);
            }
            try {
              const slidersData = await getHeroSliders(tenantId || undefined);
              setHeroSliders(slidersData?.data || []);
            } catch (err) {
              console.error("Failed to load hero sliders:", err);
              setHeroSliders([]);
            }
            try {
              const themeData = await getTenantThemeCustomization(
                tenantId || undefined,
              );
              setCurrentThemeData(themeData?.data || null);
            } catch (err) {
              console.error("Failed to load theme customization:", err);
            }
            try {
              const announcementData = await getAnnouncementSettings(
                tenantId || undefined,
              );
              setAnnouncementMessage(
                announcementData.data?.announcement_message || "",
              );
            } catch (err) {
              console.error("Failed to load announcement settings:", err);
            }
            markLoaded("appearance");
            break;
          }
          case "seo": {
            try {
              const seoData = await getSEOSettings(tenantId || undefined);
              setSeoSettings({
                seoTitle: seoData.data?.seo_title || "",
                seoDescription: seoData.data?.seo_description || "",
                seoKeywords: seoData.data?.seo_keywords || "",
                gtagId: seoData.data?.gtag_id || "",
                searchConsoleMeta: seoData.data?.search_console_meta || "",
                minOrderAmount: seoData.data?.min_order_amount || 0,
                faviconUrl: seoData.data?.favicon_url || "",
                faviconFile: null,
                faviconFileName: "",
              });
            } catch (err) {
              console.error("Failed to load SEO settings:", err);
            }
            markLoaded("seo");
            break;
          }
          case "settings": {
            try {
              const bizDetails = await getBusinessDetails(
                tenantId || undefined,
              );
              setBusinessDetails(bizDetails.data);
              if (bizDetails.data) {
                setBusinessForm({
                  companyName: bizDetails.data.company_name,
                  contactEmail: bizDetails.data.contact_email,
                  contactPhone: bizDetails.data.contact_phone,
                  isMaintenanceMode: bizDetails.data.is_maintenance_mode,
                  youtubeUrl: bizDetails.data.youtube_url || "",
                  instagramUrl: bizDetails.data.instagram_url || "",
                  facebookUrl: bizDetails.data.facebook_url || "",
                  logo: bizDetails.data.logo_url || "",
                  logoFile: null,
                });
              }
            } catch (err) {
              console.error("Failed to load business details:", err);
            }
            try {
              const staffData = await getStaffMembers(tenantId || undefined);
              setStaffMembers(staffData.data || []);
            } catch (err) {
              console.error("Failed to load staff members:", err);
              setStaffMembers([]);
            }
            try {
              const footerData = await getFooterSections();
              setFooterSections(footerData.data || []);
            } catch (err) {
              console.error("Failed to load footer sections:", err);
              setFooterSections([]);
            }
            markLoaded("settings");
            break;
          }
          default:
            break;
        }
      } finally {
        setTabLoading(false);
      }
    },
    [loadedSections, tenantId, productsPage, pagesPage, blogPage],
  );

  // Save current tab to localStorage
  useEffect(() => {
    localStorage.setItem("clientAdminCurrentTab", currentTab);
  }, [currentTab]);

  useEffect(() => {
    if (tenantLoading) return;
    if (!tenantId) return;
    fetchTabData(currentTab);
  }, [currentTab, tenantId, tenantLoading, fetchTabData]);

  const isSectionLoading = (key: TabType) =>
    currentTab === key && (!loadedSections[key] || tabLoading);

  const Preloader: React.FC<{ message: string }> = ({ message }) => (
    <div className="text-center py-12">
      <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-slate-600">{message}</p>
    </div>
  );

  useEffect(() => {
    if (tenantLoading) return;
    if (tenantError) {
      toast.error(`Tenant Error: ${tenantError}`);
      return;
    }
    if (!tenantId) {
      toast.error("Tenant ID not found");
      return;
    }

    initialLoad();
  }, [tenantId, tenantLoading, tenantError, initialLoad]);

  useEffect(() => {
    loadBillingPlans();
  }, []);

  // Update browser tab title
  useEffect(() => {
    if (businessDetails?.company_name) {
      document.title = `${businessDetails.company_name} - Admin`;
    } else {
      document.title = "Store Admin Panel";
    }
  }, [businessDetails?.company_name]);

  const loadData = async () => {
    try {
      setLoading(true);
      setTokenError(null);
      // Load core data that's always needed on page load
      const dashData = await getClientAdminDashboard();
      setDashboardData(dashData.data);

      // Load other data in parallel, but allow them to fail gracefully
      try {
        const prodsData = await getClientProducts({ page: 1, limit: 10 });
        setProducts(prodsData.data || []);
        setProductsPages(prodsData.pagination?.pages || 1);
        setProductsPage(1);
      } catch (err) {
        console.error("Failed to load products:", err);
        setProducts([]);
      }

      try {
        const ordersData = await getClientOrders();
        setOrders(ordersData.data || []);
      } catch (err) {
        console.error("Failed to load orders:", err);
        setOrders([]);
      }

      try {
        const categoriesData = await getClientCategories();
        setCategories(categoriesData.data || []);
      } catch (err) {
        console.error("Failed to load categories:", err);
        setCategories([]);
      }

      try {
        const discountsData = await getClientDiscounts();
        setDiscounts(discountsData.data || []);
      } catch (err) {
        console.error("Failed to load discounts:", err);
        setDiscounts([]);
      }

      try {
        const bizDetails = await getBusinessDetails();
        setBusinessDetails(bizDetails.data);
      } catch (err) {
        console.error("Failed to load business details:", err);
      }

      // Load theme and template data
      try {
        const themesData = await getAllThemes();
        setThemes(themesData.data || []);
      } catch (err) {
        console.error("Failed to load themes:", err);
        setThemes([]);
      }

      try {
        const tenantTemplateData = await getTenantTemplate();
        setSelectedTemplate(tenantTemplateData.data?.template || "theme-b");
      } catch (err) {
        console.error("Failed to load tenant template:", err);
        setSelectedTemplate("theme-b");
      }

      try {
        const templatesData = await getAvailableTemplates();
        setAvailableTemplates(templatesData.data || []);
      } catch (err) {
        console.error("Failed to load available templates:", err);
        setAvailableTemplates([]);
      }

      // Load SEO settings
      try {
        const seoData = await getSEOSettings();
        setSeoSettings({
          seoTitle: seoData.data?.seo_title || "",
          seoDescription: seoData.data?.seo_description || "",
          seoKeywords: seoData.data?.seo_keywords || "",
          gtagId: seoData.data?.gtag_id || "",
          searchConsoleMeta: seoData.data?.search_console_meta || "",
          minOrderAmount: seoData.data?.min_order_amount || 0,
          faviconUrl: seoData.data?.favicon_url || "",
          faviconFile: null,
          faviconFileName: "",
        });
      } catch (err) {
        console.error("Failed to load SEO settings:", err);
      }

      // Load hero sliders
      try {
        const slidersData = await getHeroSliders();
        setHeroSliders(slidersData?.data || []);
      } catch (err) {
        console.error("Failed to load hero sliders:", err);
        setHeroSliders([]);
      }

      // Lazy load: only load these on demand
      try {
        const staffData = await getStaffMembers();
        setStaffMembers(staffData.data || []);
      } catch (err) {
        console.error("Failed to load staff members:", err);
        setStaffMembers([]);
      }

      try {
        const customersData = await getClientCustomers();
        setCustomers(customersData.data || []);
      } catch (err) {
        console.error("Failed to load customers:", err);
        setCustomers([]);
      }

      try {
        const pagesRes = await getPagesAdmin({ page: 1, limit: 10 });
        setPages(pagesRes.data || []);
        setPagesPages(pagesRes.pagination?.pages || 1);
        setPagesPage(1);
      } catch (err) {
        console.error("Failed to load pages:", err);
        setPages([]);
      }

      try {
        const postsRes = await getBlogPostsAdmin({ page: 1, limit: 10 });
        setBlogPosts(postsRes.data || []);
        setBlogPages(postsRes.pagination?.pages || 1);
        setBlogPage(1);
      } catch (err) {
        console.error("Failed to load blog posts:", err);
        setBlogPosts([]);
      }

      if (bizDetails.data) {
        setBusinessForm({
          companyName: bizDetails.data.company_name,
          contactEmail: bizDetails.data.contact_email,
          contactPhone: bizDetails.data.contact_phone,
          isMaintenanceMode: bizDetails.data.is_maintenance_mode,
          youtubeUrl: bizDetails.data.youtube_url || "",
          instagramUrl: bizDetails.data.instagram_url || "",
          facebookUrl: bizDetails.data.facebook_url || "",
        });
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load dashboard data";

      // Check if it's a token error
      if (
        errorMessage.toLowerCase().includes("token") ||
        errorMessage.toLowerCase().includes("unauthorized") ||
        (error as any).status === 401
      ) {
        setTokenError("Your session has expired. Please log in again.");
        handleTokenError();
        toast.error("Session expired. Redirecting to login...");
        // Redirect after a short delay so the error message is visible
        setTimeout(() => navigate("/auth/login"), 2000);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      const result = await uploadProductImage(file);
      setProductForm({
        ...productForm,
        imageUrl: result.data.imageUrl,
        imageFile: file,
      });
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload image");
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!productForm.name || !productForm.name.trim()) {
        return toast.error("Product name is required");
      }
      if (!productForm.price || parseFloat(productForm.price) <= 0) {
        return toast.error("Valid product price is required");
      }

      let categoryValue = productForm.category;
      if (categoryValue === "__new") {
        const newCat = prompt("Enter new category name:");
        if (!newCat) return toast.error("Category required");
        categoryValue = newCat;
      }

      if (editingProductId) {
        await updateClientProduct(
          editingProductId,
          {
            name: productForm.name.trim(),
            description: productForm.description,
            sku: productForm.sku,
            price: parseFloat(productForm.price),
            costPrice: productForm.costPrice
              ? parseFloat(productForm.costPrice)
              : undefined,
            category: categoryValue,
            stockQuantity: productForm.stockQuantity
              ? parseInt(productForm.stockQuantity)
              : 0,
            imageUrl: productForm.imageUrl,
          },
          tenantId || undefined,
        );
        toast.success("Product updated successfully");
      } else {
        await createClientProduct(
          {
            name: productForm.name.trim(),
            description: productForm.description,
            sku: productForm.sku,
            price: parseFloat(productForm.price),
            costPrice: productForm.costPrice
              ? parseFloat(productForm.costPrice)
              : undefined,
            category: categoryValue,
            stockQuantity: productForm.stockQuantity
              ? parseInt(productForm.stockQuantity)
              : 0,
            imageUrl: productForm.imageUrl,
          },
          tenantId || undefined,
        );
        toast.success("Product created successfully");
      }

      setProductForm({
        name: "",
        description: "",
        sku: "",
        price: "",
        costPrice: "",
        category: "",
        stockQuantity: "",
        imageUrl: "",
        imageFile: null,
      });
      setImagePreview(null);
      setGeneratedSKU("");
      setShowProductModal(false);
      setEditingProductId(null);
      await fetchTabData("products", true);
      try {
        const dash = await getClientAdminDashboard();
        setDashboardData(dash.data);
      } catch (e) {}
    } catch (error) {
      const message = handlePlanLimitError(error);
      if (message) {
        toast.error(
          editingProductId
            ? "Failed to update product"
            : message,
        );
      }
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!categoryForm.name || !categoryForm.name.trim()) {
        return toast.error("Category name is required");
      }
      if (!categoryForm.slug || !categoryForm.slug.trim()) {
        return toast.error("Category slug is required");
      }

      const categoryData = {
        name: categoryForm.name.trim(),
        slug: categoryForm.slug.trim(),
        description: categoryForm.description,
      };

      if (editingCategoryId) {
        await updateClientCategory(
          editingCategoryId,
          categoryData,
          tenantId || undefined,
        );
        toast.success("Category updated");
      } else {
        await createClientCategory(categoryData, tenantId || undefined);
        toast.success("Category created");
      }
      setCategoryForm({ name: "", slug: "", description: "" });
      setEditingCategoryId(null);
      setShowCategoryModal(false);
      await fetchTabData("categories", true);
    } catch (err) {
      const message = handlePlanLimitError(err);
      if (message) {
        toast.error(
          editingCategoryId
            ? "Failed to update category"
            : message,
        );
      }
    }
  };

  const handleStartEditCategory = (category: any) => {
    setEditingCategoryId(category.id || null);
    setCategoryForm({
      name: category.name || category,
      slug:
        category.slug ||
        (category.name || category).toLowerCase().replace(/\s+/g, "-"),
      description: category.description || "",
    });
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteClientCategory(categoryId, tenantId || undefined);
      toast.success("Category deleted");
      await fetchTabData("categories", true);
    } catch (err) {
      toast.error("Failed to delete category");
    }
  };

  const handleDeleteProduct = async (
    productId: string,
    productName: string,
  ) => {
    if (
      !confirm(`Delete product "${productName}"? This action cannot be undone.`)
    )
      return;
    try {
      await deleteClientProduct(productId, tenantId || undefined);
      toast.success("Product deleted successfully");
      await fetchTabData("products", true);
    } catch (err) {
      toast.error("Failed to delete product");
    }
  };

  const handleSaveSEO = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSEO(true);
    try {
      let faviconUrl = seoSettings.faviconUrl || null;
      if (seoSettings.faviconFile) {
        try {
          const res = await uploadProductImage(seoSettings.faviconFile as File);
          if (res.success && res.data?.imageUrl) {
            faviconUrl = res.data.imageUrl;
            toast.success("Favicon uploaded successfully");
          } else {
            toast.error("Failed to upload favicon: Invalid response");
            setSavingSEO(false);
            return;
          }
        } catch (uploadErr: any) {
          const errorMsg =
            uploadErr instanceof Error
              ? uploadErr.message
              : "Failed to upload favicon";
          toast.error(errorMsg);
          console.error("Favicon upload error:", uploadErr);
          setSavingSEO(false);
          return;
        }
      }

      await updateSEOSettings(
        {
          seoTitle: seoSettings.seoTitle || null,
          seoDescription: seoSettings.seoDescription || null,
          seoKeywords: seoSettings.seoKeywords || null,
          gtagId: seoSettings.gtagId || null,
          searchConsoleMeta: seoSettings.searchConsoleMeta || null,
          minOrderAmount: seoSettings.minOrderAmount || 0,
          faviconUrl: faviconUrl,
        },
        tenantId || undefined,
      );
      toast.success("SEO settings saved successfully");
      setSeoSettings({
        ...seoSettings,
        faviconFile: null,
        faviconFileName: "",
        faviconUrl,
      });
      await fetchTabData("seo", true);
      await fetchTabData("appearance", true);
    } catch (err: any) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to save SEO settings";
      console.error("save seo error", err);
      toast.error(errorMsg);
    } finally {
      setSavingSEO(false);
    }
  };

  const handleUpdateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let logoUrl = businessForm.logo;
      if (businessForm.logoFile) {
        const resp = await uploadProductImage(businessForm.logoFile);
        logoUrl = resp.data?.imageUrl || businessForm.logo;
      }
      await updateBusinessDetails(
        {
          ...businessForm,
          logo: logoUrl,
        },
        tenantId || undefined,
      );
      toast.success("Business details updated");
      await fetchTabData("appearance", true);
      await fetchTabData("settings", true);
    } catch (error) {
      toast.error("Failed to update business details");
    }
  };

  const handleSaveContactUs = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log("Saving contact us with data:", contactUsForm);
      await updateContactUs(contactUsForm, tenantId || undefined);
      toast.success("Contact Us information saved");
      await fetchTabData("contact-us", true);
    } catch (error) {
      console.error("Failed to save contact us:", error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Failed to save contact us information";
      toast.error(errorMsg);
    }
  };

  const handleSavePaymentInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log("Saving payment info with data:", paymentInfoForm);
      console.log("UPI Image URL being saved:", paymentInfoForm.upi_image_url);
      const result = await updatePaymentInfo(
        paymentInfoForm,
        tenantId || undefined,
      );
      console.log("Save result:", result);
      toast.success("Payment information saved");
      await fetchTabData("payment-info", true);
    } catch (error) {
      console.error("Failed to save payment info:", error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Failed to save payment information";
      toast.error(errorMsg);
    }
  };

  const handleSaveEmailSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { updateEmailSettings } = await import("@/lib/api");
      const result = await updateEmailSettings(
        emailSettingsForm,
        tenantId || undefined,
      );
      toast.success("Email settings saved");
      await fetchTabData("email-settings", true);
    } catch (error) {
      console.error("Failed to save email settings:", error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Failed to save email settings";
      toast.error(errorMsg);
    }
  };

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!discountForm.code || !discountForm.code.trim()) {
        return toast.error("Discount code is required");
      }
      if (!discountForm.discountType || !discountForm.discountType.trim()) {
        return toast.error("Discount type is required (percentage or fixed)");
      }
      if (
        !discountForm.discountValue ||
        parseFloat(discountForm.discountValue) <= 0
      ) {
        return toast.error("Valid discount value is required");
      }

      const discountData = {
        code: discountForm.code.trim().toUpperCase(),
        description: discountForm.description || "",
        discountType: discountForm.discountType,
        discountValue: parseFloat(discountForm.discountValue),
        minOrderAmount: discountForm.minOrderAmount
          ? parseFloat(discountForm.minOrderAmount)
          : null,
        maxUses: discountForm.maxUses ? parseInt(discountForm.maxUses) : null,
        validFrom: discountForm.validFrom || null,
        validUntil: discountForm.validUntil || null,
      };

     
 // Check if we're editing or creating
      if (editingDiscountId) {
        await updateClientDiscount(editingDiscountId, discountData, tenantId || undefined);
        toast.success("Discount updated successfully");
        setEditingDiscountId(null);
      } else {
        await createClientDiscount(discountData, tenantId || undefined);
        toast.success("Discount created successfully");
      }

      setDiscountForm({
        code: "",
        description: "",
        discountType: "percentage",
        discountValue: "",
        minOrderAmount: "",
        maxUses: "",
        validFrom: "",
        validUntil: "",
      });
      setShowDiscountModal(false);
      await fetchTabData("discounts", true);
    } catch (error) {
      const errorMsg = handlePlanLimitError(error);
      if (errorMsg) {
        toast.error(errorMsg);
      }
      console.error("Discount creation error:", error);
    }
  };



  
  const handleEditCustomer = (customer: any) => {
    setCustomerForm({
      first_name: customer.first_name || "",
      last_name: customer.last_name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      city: customer.city || "",
      country: customer.country || "",
    });
    setEditingCustomerId(customer.id);
    setShowCustomerModal(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!customerForm.email || !customerForm.email.trim()) {
        return toast.error("Email is required");
      }

      await updateClientCustomer(editingCustomerId!, customerForm, tenantId || undefined);
      toast.success("Customer updated successfully");
      setShowCustomerModal(false);
      setEditingCustomerId(null);
      setCustomerForm({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        city: "",
        country: "",
      });
      await fetchTabData("customers", true);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to update customer";
      toast.error(errorMsg);
      console.error("Customer update error:", error);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) {
      return;
    }

    try {
      await deleteClientCustomer(customerId, tenantId || undefined);
      toast.success("Customer deleted successfully");
      await fetchTabData("customers", true);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to delete customer";
      toast.error(errorMsg);
      console.error("Customer deletion error:", error);
    }
  };

  const handleEditDiscount = (discount: any) => {
    setDiscountForm({
      code: discount.code || "",
      description: discount.description || "",
      discountType: discount.discount_type || "percentage",
      discountValue: discount.discount_value?.toString() || "",
      minOrderAmount: discount.min_order_amount?.toString() || "",
      maxUses: discount.max_uses?.toString() || "",
      validFrom: discount.valid_from || "",
      validUntil: discount.valid_until || "",
    });
    setEditingDiscountId(discount.id);
    setShowDiscountModal(true);
  };

  const handleDeleteDiscount = async (discountId: string) => {
    if (!window.confirm("Are you sure you want to delete this discount?")) {
      return;
    }

    try {
      await deleteClientDiscount(discountId, tenantId || undefined);
      toast.success("Discount deleted successfully");
      await fetchTabData("discounts", true);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to delete discount";
      toast.error(errorMsg);
      console.error("Discount deletion error:", error);
    }
  };

  const handleCreateStaffMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!staffForm.email || !staffForm.email.trim()) {
        return toast.error("Email is required");
      }
      if (!staffForm.role || !staffForm.role.trim()) {
        return toast.error("Role is required");
      }
      if (!staffForm.password || !staffForm.password.trim()) {
        return toast.error("Password is required");
      }
      if (staffForm.password.length < 6) {
        return toast.error("Password must be at least 6 characters");
      }

      const staffData = {
        email: staffForm.email.trim().toLowerCase(),
        firstName: staffForm.firstName || "",
        lastName: staffForm.lastName || "",
        role: staffForm.role,
        password: staffForm.password,
      };

      await createStaffMember(staffData, tenantId || undefined);
      toast.success("Staff member added successfully!");
      setStaffForm({
        email: "",
        firstName: "",
        lastName: "",
        role: "editor",
        password: "",
      });
      setShowStaffModal(false);
      await fetchTabData("settings", true);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to add staff member";
      toast.error(errorMsg);
      console.error("Staff creation error:", error);
    }
  };

  const handleDeleteStaffMember = async (memberId: string) => {
    if (confirm("Are you sure?")) {
      try {
        await deleteStaffMember(memberId, tenantId || undefined);
        toast.success("Staff member deleted");
        await fetchTabData("settings", true);
      } catch (error) {
        toast.error("Failed to delete staff member");
      }
    }
  };

  const handleSaveFooterSection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!footerForm.sectionName || !footerForm.sectionName.trim()) {
        return toast.error("Section name is required");
      }
      const sectionData = footerForm.sectionData
        ? JSON.parse(footerForm.sectionData)
        : {};
      await updateFooterSection(
        footerForm.sectionName,
        {
          isEnabled: footerForm.isEnabled,
          sortOrder: footerForm.sortOrder,
          sectionData,
        },
        tenantId || undefined,
      );
      toast.success("Footer section updated");
      setFooterForm({
        sectionName: "",
        isEnabled: true,
        sortOrder: 0,
        sectionData: "",
      });
      setEditingFooterSection(null);
      await fetchTabData("settings", true);
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Failed to save footer section";
      toast.error(errorMsg);
      console.error("Footer section save error:", error);
    }
  };

  const handleEditFooterSection = (section: any) => {
    setEditingFooterSection(section.section_name);
    setFooterForm({
      sectionName: section.section_name,
      isEnabled: section.is_enabled,
      sortOrder: section.sort_order || 0,
      sectionData:
        typeof section.section_data === "string"
          ? section.section_data
          : JSON.stringify(section.section_data || {}),
    });
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateOrderStatus(orderId, status);
      toast.success("Order status updated");
      await fetchTabData("orders", true);
      try {
        const dash = await getClientAdminDashboard();
        setDashboardData(dash.data);
      } catch (e) {}
    } catch (error) {
      toast.error("Failed to update order status");
    }
  };

  const handleUpdatePaymentStatus = async (
    orderId: string,
    paymentStatus: string,
  ) => {
    try {
      await updateOrderStatus(orderId, undefined, paymentStatus);
      setSelectedOrder({ ...selectedOrder, payment_status: paymentStatus });
      toast.success("Payment status updated");
      await fetchTabData("orders", true);
      try {
        const dash = await getClientAdminDashboard();
        setDashboardData(dash.data);
      } catch (e) {}
    } catch (error) {
      toast.error("Failed to update payment status");
    }
  };

  const handlePrintOrder = () => {
    if (!selectedOrder) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order #${selectedOrder.order_number}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: bold; font-size: 14px; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background-color: #f0f0f0; padding: 8px; text-align: left; border: 1px solid #ddd; }
          td { padding: 8px; border: 1px solid #ddd; }
          .total-row { font-weight: bold; background-color: #f0f0f0; }
          .text-right { text-align: right; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Order Invoice</h2>
          <p><strong>Order Number:</strong> ${selectedOrder.order_number}</p>
          <p><strong>Order Date:</strong> ${new Date(selectedOrder.created_at).toLocaleDateString()}</p>
        </div>

        <div class="section">
          <div class="section-title">Customer Information</div>
          <p><strong>Name:</strong> ${selectedOrder.customer_name}</p>
          <p><strong>Email:</strong> ${selectedOrder.customer_email}</p>
          <p><strong>Phone:</strong> ${selectedOrder.customer_phone || "N/A"}</p>
        </div>

        ${
          selectedOrder.shipping_address
            ? `
        <div class="section">
          <div class="section-title">Shipping Address</div>
          <p>${typeof selectedOrder.shipping_address === "string" ? selectedOrder.shipping_address : JSON.stringify(selectedOrder.shipping_address, null, 2)}</p>
        </div>
        `
            : ""
        }

        <div class="section">
          <div class="section-title">Order Items</div>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${(Array.isArray(selectedOrder.items) ? selectedOrder.items : [])
                .map(
                  (item: any) => `
                <tr>
                  <td>${item.product_name || `Product (${item.product_id})`}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">₹${parseInt(item.unit_price || 0).toLocaleString()}</td>
                  <td class="text-right">₹${parseInt(item.total_price || 0).toLocaleString()}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Order Summary</div>
          <table>
            <tr>
              <td><strong>Subtotal</strong></td>
              <td class="text-right">₹${((selectedOrder.total_amount || 0) + (selectedOrder.discount_amount || 0)).toLocaleString()}</td>
            </tr>
            ${
              selectedOrder.discount_amount > 0
                ? `
            <tr>
              <td><strong>Discount</strong></td>
              <td class="text-right">-₹${selectedOrder.discount_amount.toLocaleString()}</td>
            </tr>
            `
                : ""
            }
            <tr class="total-row">
              <td><strong>Total</strong></td>
              <td class="text-right"><strong>₹${selectedOrder.total_amount.toLocaleString()}</strong></td>
            </tr>
          </table>
        </div>

        <div class="section">
          <p><strong>Order Status:</strong> ${selectedOrder.status}</p>
          <p><strong>Payment Status:</strong> ${selectedOrder.payment_status || "pending"}</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "", "height=800,width=1000");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSaveTemplate = async () => {
    try {
      await setTenantTemplate(selectedTemplate, tenantId);
      toast.success(
        "Store template updated successfully! Changes will appear in the storefront.",
      );
      await fetchTabData("appearance", true);
    } catch (error) {
      console.error("Failed to save template:", error);
      toast.error("Failed to update store template");
    }
  };

  const handleSaveAnnouncement = async () => {
    try {
      if (!tenantId) {
        toast.error("Tenant ID is missing. Please refresh and try again.");
        return;
      }
      const result = await updateAnnouncementSettings(
        announcementMessage,
        tenantId,
      );
      console.log("Update result:", result);
      if (result?.success) {
        toast.success(
          "Announcement message updated successfully! Changes will appear in the storefront.",
        );
        setShowAnnouncementModal(false);
        await fetchTabData("appearance", true);
      } else {
        const errorMsg =
          result?.error || "Failed to update announcement message";
        console.error("Update failed:", errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error("Failed to save announcement:", error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Failed to update announcement message";
      toast.error(errorMsg);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!pageForm.title || !pageForm.title.trim()) {
        return toast.error("Page title is required");
      }
      if (!pageForm.slug || !pageForm.slug.trim()) {
        return toast.error("Page slug is required");
      }

      const pageData = {
        title: pageForm.title.trim(),
        slug: pageForm.slug.trim(),
        description: pageForm.description,
        content: pageForm.content,
        seoTitle: pageForm.seoTitle,
        seoDescription: pageForm.seoDescription,
        seoKeywords: pageForm.seoKeywords,
        featuredImageUrl: pageForm.featuredImageUrl,
        isPublished: pageForm.isPublished,
      };

      if (editingPageId) {
        await updatePageAdmin(editingPageId, pageData, tenantId || undefined);
        toast.success("Page updated successfully");
      } else {
        await createPageAdmin(pageData, tenantId || undefined);
        toast.success("Page created successfully");
      }
      setPageForm({
        title: "",
        slug: "",
        description: "",
        content: "",
        seoTitle: "",
        seoDescription: "",
        seoKeywords: "",
        featuredImageUrl: "",
        isPublished: false,
      });
      setEditingPageId(null);
      setShowPageModal(false);
      await fetchTabData("pages", true);
    } catch (error) {
      const errorMsg = handlePlanLimitError(error);
      if (errorMsg) {
        toast.error(errorMsg);
      }
      console.error("Page save error:", error);
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm("Are you sure you want to delete this page?")) return;
    try {
      await deletePageAdmin(pageId, tenantId || undefined);
      toast.success("Page deleted successfully");
      await fetchTabData("pages", true);
    } catch (error) {
      toast.error("Failed to delete page");
    }
  };

  const handleSaveBlogPost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!postForm.title || !postForm.title.trim()) {
        return toast.error("Blog post title is required");
      }
      if (!postForm.slug || !postForm.slug.trim()) {
        return toast.error("Blog post slug is required");
      }

      const postData = {
        title: postForm.title.trim(),
        slug: postForm.slug.trim(),
        excerpt: postForm.excerpt,
        content: postForm.content,
        featuredImageUrl: postForm.featuredImageUrl,
        category: postForm.category,
        tags: postForm.tags,
        seoTitle: postForm.seoTitle,
        seoDescription: postForm.seoDescription,
        seoKeywords: postForm.seoKeywords,
        isPublished: postForm.isPublished,
      };

      if (editingPostId) {
        await updateBlogPostAdmin(
          editingPostId,
          postData,
          tenantId || undefined,
        );
        toast.success("Blog post updated successfully");
      } else {
        await createBlogPostAdmin(postData, tenantId || undefined);
        toast.success("Blog post created successfully");
      }
      setPostForm({
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        featuredImageUrl: "",
        category: "",
        tags: "",
        seoTitle: "",
        seoDescription: "",
        seoKeywords: "",
        isPublished: false,
      });
      setEditingPostId(null);
      setShowPostModal(false);
      await fetchTabData("blog", true);
    } catch (error) {
      const errorMsg = handlePlanLimitError(error);
      if (errorMsg) {
        toast.error(errorMsg);
      }
      console.error("Blog post save error:", error);
    }
  };

  const handleDeleteBlogPost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;
    try {
      await deleteBlogPostAdmin(postId, tenantId || undefined);
      toast.success("Blog post deleted successfully");
      await fetchTabData("blog", true);
    } catch (error) {
      toast.error("Failed to delete blog post");
    }
  };

  if (tenantLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">
            {tenantLoading ? "Loading store..." : "Loading dashboard..."}
          </p>
        </div>
      </div>
    );
  }

  if (tenantError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Store Not Found
          </h2>
          <p className="text-slate-600 mb-6">
            Cannot find store associated with this domain. {tenantError}
          </p>
          <Button onClick={() => navigate("/")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: "dashboard", icon: TrendingUp, label: "Dashboard" },
    { id: "products", icon: Package, label: "Products" },
    { id: "categories", icon: Tag, label: "Categories" },
    { id: "orders", icon: ShoppingCart, label: "Orders" },
    { id: "customers", icon: Users, label: "Customers" },
    { id: "discounts", icon: DollarSign, label: "Discounts" },
    { id: "pages", icon: FileText, label: "Pages" },
    { id: "blog", icon: BookOpen, label: "Blog" },
    { id: "contact-us", icon: Phone, label: "Contact Us" },
    { id: "payment-info", icon: CreditCard, label: "Payment Info" },
    { id: "email-settings", icon: Mail, label: "Email Settings" },
    { id: "appearance", icon: Palette, label: "Appearance" },
    { id: "seo", icon: Globe, label: "SEO" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <Toaster position="top-right" />
      <UpgradePlanModal
        open={showUpgradePlanModal}
        message={upgradePromptMessage}
        plans={billingPlans}
        selectedPlan={selectedBillingPlan}
        onSelectPlan={setSelectedBillingPlan}
        onClose={() => setShowUpgradePlanModal(false)}
        onConfirm={updatePlanForTenant}
        submitting={upgradingBillingPlan}
      />

      {/* Token Error Alert */}
      {tokenError && (
        <div className="fixed top-4 right-4 z-50 w-96 max-w-[calc(100%-2rem)]">
          <Alert className="border-destructive bg-destructive/5">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive ml-2">
              {tokenError}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-200 transition-all duration-300 z-40 flex flex-col ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">✦</span>
              </div>
              <div>
                <span className="font-bold text-slate-900 block">MyStore</span>
                <span className="text-xs text-slate-500">{domain}</span>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        <nav className="mt-8 px-4 space-y-2 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={async () => {
                setCurrentTab(item.id as TabType);
                await fetchTabData(item.id as TabType);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentTab === item.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-slate-100 text-slate-700 hover:text-slate-900"
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4">
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
      <div
        className={`transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-20"}`}
      >
        {/* Top Bar */}
        <div className="bg-white border-b border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {businessDetails?.company_name ||
                  navItems.find((i) => i.id === currentTab)?.label}
              </h1>
              <p className="text-slate-600 mt-1">
                {businessDetails?.company_name
                  ? `${navItems.find((i) => i.id === currentTab)?.label} - Manage your store's ${currentTab}`
                  : `Manage your store's ${currentTab}`}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-600">Store Domain</div>
              <div className="font-semibold text-slate-900">{domain}</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSectionLoading(currentTab as TabType) && (
            <div className="text-center py-6">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-slate-600">
                Loading{" "}
                {navItems.find((i) => i.id === currentTab)?.label || "Content"}
                ...
              </p>
            </div>
          )}
          {/* Dashboard Tab */}
          {currentTab === "dashboard" && loadedSections["dashboard"] && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                  {
                    label: "Total Sales",
                    value: `₹${(dashboardData?.totalSales || 0).toLocaleString()}`,
                    icon: DollarSign,
                    color: "from-emerald-500",
                  },
                  {
                    label: "Pending Orders",
                    value: dashboardData?.pendingOrders || 0,
                    icon: ShoppingCart,
                    color: "from-blue-500",
                  },
                  {
                    label: "Customers",
                    value: dashboardData?.customers || 0,
                    icon: Users,
                    color: "from-purple-500",
                  },
                  {
                    label: "Products",
                    value: dashboardData?.products || 0,
                    icon: Package,
                    color: "from-amber-500",
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

              <div className="bg-white rounded-lg border border-slate-200 p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  Recent Orders
                </h2>
                {dashboardData?.recentOrders &&
                dashboardData.recentOrders.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.recentOrders
                      .slice(0, 5)
                      .map((order: any) => (
                        <div
                          key={order.id}
                          className="p-4 bg-slate-50 rounded-lg flex items-center justify-between"
                        >
                          <div>
                            <p className="font-semibold text-slate-900">
                              {order.order_number}
                            </p>
                            <p className="text-sm text-slate-600">
                              {order.customer_name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-900">
                              ₹{order.total_amount?.toLocaleString() || 0}
                            </p>
                            <span
                              className={`text-xs px-2 py-1 rounded inline-block ${
                                order.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : order.status === "processing"
                                    ? "bg-blue-100 text-blue-800"
                                    : order.status === "shipped"
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-slate-600 text-center py-8">
                    No orders yet
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Products Tab */}
          {currentTab === "products" && loadedSections["products"] && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  Products ({products.length})
                </h2>
                <Button
                  onClick={() => {
                    setShowProductModal(true);
                  }}
                  className="group"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </div>

              {showProductModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between p-6 border-b border-slate-200">
                      <h3 className="text-xl font-bold text-slate-900">
                        Add New Product
                      </h3>
                      <button
                        onClick={() => {
                          setShowProductModal(false);
                          setEditingProductId(null);
                        }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <form
                      onSubmit={handleCreateProduct}
                      className="p-6 space-y-4"
                    >
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-1">
                            Product Name *
                          </label>
                          <Input
                            value={productForm.name}
                            onChange={(e) =>
                              setProductForm({
                                ...productForm,
                                name: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-1">
                            SKU {generatedSKU && `(auto: ${generatedSKU})`}
                          </label>
                          <Input
                            value={productForm.sku}
                            onChange={(e) =>
                              setProductForm({
                                ...productForm,
                                sku: e.target.value,
                              })
                            }
                            placeholder="Leave empty to auto-generate"
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Leave empty and we'll auto-generate a unique SKU
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-1">
                          Description
                        </label>
                        <textarea
                          value={productForm.description}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              description: e.target.value,
                            })
                          }
                          rows={3}
                          className="w-full border border-slate-300 rounded-lg p-2"
                        />
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-1">
                            Price *
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            value={productForm.price}
                            onChange={(e) =>
                              setProductForm({
                                ...productForm,
                                price: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-1">
                            Cost Price
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            value={productForm.costPrice}
                            onChange={(e) =>
                              setProductForm({
                                ...productForm,
                                costPrice: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-1">
                            Stock Quantity
                          </label>
                          <Input
                            type="number"
                            value={productForm.stockQuantity}
                            onChange={(e) =>
                              setProductForm({
                                ...productForm,
                                stockQuantity: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-1">
                            Category
                          </label>
                          {categories.length > 0 ? (
                            <select
                              value={productForm.category}
                              onChange={(e) =>
                                setProductForm({
                                  ...productForm,
                                  category: e.target.value,
                                })
                              }
                              className="w-full border border-slate-300 rounded-lg p-2"
                            >
                              <option value="">Select category</option>
                              {categories.map((c: any) => (
                                <option key={c.id || c} value={c.name || c}>
                                  {c.name || c}
                                </option>
                              ))}
                              <option value="__new">
                                -- Add new category --
                              </option>
                            </select>
                          ) : (
                            <Input
                              value={productForm.category}
                              onChange={(e) =>
                                setProductForm({
                                  ...productForm,
                                  category: e.target.value,
                                })
                              }
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-1">
                            Image URL
                          </label>
                          <Input
                            value={productForm.imageUrl}
                            onChange={(e) =>
                              setProductForm({
                                ...productForm,
                                imageUrl: e.target.value,
                              })
                            }
                            placeholder="https://..."
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-1">
                          Or Upload Image File
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          disabled={uploadingImage}
                          className="w-full border border-slate-300 rounded-lg p-2 disabled:opacity-50"
                        />
                        {uploadingImage && (
                          <p className="text-sm text-slate-500 mt-2">
                            Uploading...
                          </p>
                        )}
                        {imagePreview && (
                          <div className="mt-3">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-32 object-cover rounded-lg border border-slate-300"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1">
                          Create Product
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowProductModal(false);
                            setEditingProductId(null);
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
                {products.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          SKU
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Stock
                        </th>
                        <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product: any) => (
                        <tr
                          key={product.id}
                          className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-slate-900 font-medium">
                            {product.name}
                          </td>
                          <td className="px-6 py-4 text-slate-600 text-sm">
                            {product.sku}
                          </td>
                          <td className="px-6 py-4 text-slate-900 font-medium">
                            ₹{product.price?.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-sm ${
                                product.stock_quantity > 10
                                  ? "bg-emerald-100 text-emerald-800"
                                  : product.stock_quantity > 0
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {product.stock_quantity}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingProductId(product.id || null);
                                  setGeneratedSKU(product.sku || "");
                                  setProductForm({
                                    name: product.name || "",
                                    description: product.description || "",
                                    sku: product.sku || "",
                                    price: product.price?.toString?.() || "",
                                    costPrice:
                                      product.cost_price != null
                                        ? product.cost_price.toString()
                                        : product.costPrice != null
                                          ? product.costPrice.toString()
                                          : "",
                                    category: product.category || "",
                                    stockQuantity:
                                      product.stock_quantity != null
                                        ? product.stock_quantity.toString()
                                        : "",
                                    imageUrl:
                                      product.image_url ||
                                      product.imageUrl ||
                                      "",
                                    imageFile: null,
                                  });
                                  setImagePreview(
                                    product.image_url ||
                                      product.imageUrl ||
                                      null,
                                  );
                                  setShowProductModal(true);
                                }}
                                className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4 text-blue-600" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteProduct(product.id, product.name)
                                }
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
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 mb-4">No products yet</p>
                    <Button onClick={() => setShowProductModal(true)}>
                      Create Your First Product
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {productsPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-slate-600">
                Page {productsPage} of {productsPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={productsPage <= 1}
                  onClick={async () => {
                    const next = Math.max(1, productsPage - 1);
                    setProductsPage(next);
                    const res = await getClientProducts({
                      page: next,
                      limit: 10,
                    });
                    setProducts(res.data || []);
                    setProductsPages(res.pagination?.pages || 1);
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={productsPage >= productsPages}
                  onClick={async () => {
                    const next = Math.min(productsPages, productsPage + 1);
                    setProductsPage(next);
                    const res = await getClientProducts({
                      page: next,
                      limit: 10,
                    });
                    setProducts(res.data || []);
                    setProductsPages(res.pagination?.pages || 1);
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {currentTab === "categories" && loadedSections["categories"] && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  Categories ({categories.length})
                </h2>
                <Button
                  onClick={() => {
                    setEditingCategoryId(null);
                    setCategoryForm({ name: "", slug: "", description: "" });
                    setShowCategoryModal(true);
                  }}
                  className="group"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                {categories.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Slug
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Description
                        </th>
                        <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((cat: any) => (
                        <tr
                          key={cat.id || cat}
                          className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-slate-900 font-medium">
                            {cat.name || cat}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {cat.slug ||
                              (cat.name || cat)
                                .toLowerCase()
                                .replace(/\s+/g, "-")}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {cat.description || "₹"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleStartEditCategory(cat)}
                                className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4 text-blue-600" />
                              </button>
                              {cat.id && (
                                <button
                                  onClick={() => handleDeleteCategory(cat.id)}
                                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 mb-4">No categories yet</p>
                    <Button
                      onClick={() => {
                        setEditingCategoryId(null);
                        setCategoryForm({
                          name: "",
                          slug: "",
                          description: "",
                        });
                        setShowCategoryModal(true);
                      }}
                    >
                      Create Your First Category
                    </Button>
                  </div>
                )}
              </div>

              {showCategoryModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between p-6 border-b border-slate-200">
                      <h3 className="text-xl font-bold text-slate-900">
                        {editingCategoryId ? "Edit Category" : "Add Category"}
                      </h3>
                      <button
                        onClick={() => setShowCategoryModal(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <form
                      onSubmit={handleCreateCategory}
                      className="p-6 space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-1">
                          Name *
                        </label>
                        <Input
                          value={categoryForm.name}
                          onChange={(e) =>
                            setCategoryForm({
                              ...categoryForm,
                              name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-1">
                          Slug *
                        </label>
                        <Input
                          value={categoryForm.slug}
                          onChange={(e) =>
                            setCategoryForm({
                              ...categoryForm,
                              slug: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-1">
                          Description
                        </label>
                        <textarea
                          value={categoryForm.description}
                          onChange={(e) =>
                            setCategoryForm({
                              ...categoryForm,
                              description: e.target.value,
                            })
                          }
                          rows={3}
                          className="w-full border border-slate-300 rounded-lg p-2"
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1">
                          Save Category
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowCategoryModal(false)}
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

          {/* Orders Tab */}
          {currentTab === "orders" && loadedSections["orders"] && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Orders ({orders.length})
              </h2>
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                {orders.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Order #
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Amount
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
                      {orders.map((order: any) => (
                        <tr
                          key={order.id}
                          className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-slate-900 font-medium">
                            {order.order_number}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            <div>
                              <p className="font-medium">
                                {order.customer_name}
                              </p>
                              <p className="text-sm text-slate-500">
                                {order.customer_email}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-900 font-medium">
                            ₹{order.total_amount?.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleUpdateOrderStatus(
                                  order.id,
                                  e.target.value,
                                )
                              }
                              className={`px-3 py-1 rounded-full text-sm font-medium border-0 cursor-pointer ${
                                order.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : order.status === "processing"
                                    ? "bg-blue-100 text-blue-800"
                                    : order.status === "shipped"
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowOrderModal(true);
                              }}
                              className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4 text-blue-600" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center">
                    <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No orders yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Details Modal */}
          {showOrderModal && selectedOrder && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 p-6 border-b border-slate-200 bg-white flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900">
                    Order #{selectedOrder.order_number}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrintOrder}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
                      title="Print Invoice"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setShowOrderModal(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Customer Information */}
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">
                      Customer Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                      <div>
                        <p className="text-sm text-slate-600">Name</p>
                        <p className="font-medium text-slate-900">
                          {selectedOrder.customer_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Email</p>
                        <p className="font-medium text-slate-900">
                          {selectedOrder.customer_email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Phone</p>
                        <p className="font-medium text-slate-900">
                          {selectedOrder.customer_phone || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Order Date</p>
                        <p className="font-medium text-slate-900">
                          {new Date(
                            selectedOrder.created_at,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  {selectedOrder.shipping_address && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3">
                        Shipping Address
                      </h4>
                      <div className="bg-slate-50 p-4 rounded-lg">
                        <p className="text-slate-900">
                          {(() => {
                            try {
                              const addr =
                                typeof selectedOrder.shipping_address ===
                                "string"
                                  ? JSON.parse(selectedOrder.shipping_address)
                                  : selectedOrder.shipping_address;

                              return addr.address;
                            } catch (e) {
                              return selectedOrder.shipping_address;
                            }
                          })()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Order Items */}
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">
                      Order Items
                    </h4>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-2 text-left text-slate-900 font-medium">
                              Product
                            </th>
                            <th className="px-4 py-2 text-center text-slate-900 font-medium">
                              Qty
                            </th>
                            <th className="px-4 py-2 text-right text-slate-900 font-medium">
                              Price
                            </th>
                            <th className="px-4 py-2 text-right text-slate-900 font-medium">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            try {
                              const itemsData = Array.isArray(
                                selectedOrder.items,
                              )
                                ? selectedOrder.items
                                : [];

                              if (itemsData.length === 0) {
                                return (
                                  <tr>
                                    <td
                                      colSpan={4}
                                      className="px-4 py-3 text-center text-slate-500"
                                    >
                                      No items in this order
                                    </td>
                                  </tr>
                                );
                              }

                              return itemsData.map((item: any, idx: number) => (
                                <tr
                                  key={idx}
                                  className="border-b border-slate-200 last:border-b-0"
                                >
                                  <td className="px-4 py-3 text-slate-900">
                                    {item.product_name ||
                                      `Product (${item.product_id})`}
                                  </td>
                                  <td className="px-4 py-3 text-center text-slate-600">
                                    {item.quantity}
                                  </td>
                                  <td className="px-4 py-3 text-right text-slate-600">
                                    ₹
                                    {parseInt(
                                      item.unit_price || 0,
                                    ).toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3 text-right font-medium text-slate-900">
                                    ₹
                                    {parseInt(
                                      item.total_price || 0,
                                    ).toLocaleString()}
                                  </td>
                                </tr>
                              ));
                            } catch (err) {
                              console.error("Error parsing order items:", err);
                              return (
                                <tr>
                                  <td
                                    colSpan={4}
                                    className="px-4 py-3 text-center text-red-500"
                                  >
                                    Error loading items
                                  </td>
                                </tr>
                              );
                            }
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">
                      Order Summary
                    </h4>
                    <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal</span>
                        <span>
                          ₹
                          {(
                            (selectedOrder.total_amount || 0) +
                            (selectedOrder.discount_amount || 0)
                          ).toLocaleString()}
                        </span>
                      </div>
                      {selectedOrder.discount_amount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-medium">
                          <span>Discount</span>
                          <span>
                            -₹{selectedOrder.discount_amount.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2 text-lg">
                        <span>Total</span>
                        <span>
                          ₹{selectedOrder.total_amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Status */}
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">
                      Order Status
                    </h4>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) =>
                        handleUpdateOrderStatus(
                          selectedOrder.id,
                          e.target.value,
                        ).then(() => {
                          setSelectedOrder({
                            ...selectedOrder,
                            status: e.target.value,
                          });
                        })
                      }
                      className={`w-full px-4 py-2 rounded-lg border font-medium cursor-pointer ${
                        selectedOrder.status === "pending"
                          ? "border-yellow-200 bg-yellow-50 text-yellow-800"
                          : selectedOrder.status === "processing"
                            ? "border-blue-200 bg-blue-50 text-blue-800"
                            : selectedOrder.status === "shipped"
                              ? "border-purple-200 bg-purple-50 text-purple-800"
                              : "border-emerald-200 bg-emerald-50 text-emerald-800"
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>

                  {/* Payment Status */}
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">
                      Payment Status
                    </h4>
                    <select
                      value={selectedOrder.payment_status || "pending"}
                      onChange={(e) =>
                        handleUpdatePaymentStatus(
                          selectedOrder.id,
                          e.target.value,
                        )
                      }
                      className={`w-full px-4 py-2 rounded-lg border font-medium cursor-pointer ${
                        (selectedOrder.payment_status || "pending") ===
                        "pending"
                          ? "border-yellow-200 bg-yellow-50 text-yellow-800"
                          : (selectedOrder.payment_status || "pending") ===
                              "processing"
                            ? "border-blue-200 bg-blue-50 text-blue-800"
                            : "border-emerald-200 bg-emerald-50 text-emerald-800"
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="w-full px-4 py-2 border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Customers Tab */}
          {currentTab === "customers" && loadedSections["customers"] && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Customers ({customers.length})
              </h2>
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                {customers.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Phone
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Orders
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Total Spent
                        </th>
                        <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">
                          Actions 
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((customer: any) => (
                        <tr
                          key={customer.id}
                          className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-slate-900 font-medium">
                            {customer.first_name} {customer.last_name}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {customer.email}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {customer.phone || "—"}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {customer.total_orders || 0}
                          </td>
                          <td className="px-6 py-4 text-slate-900 font-medium">
                            ₹{customer.total_spent?.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-slate-900 font-medium">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditCustomer(customer)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteCustomer(customer.id)}
                              className="ml-2"
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No customers yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Discounts Tab */}
          {currentTab === "discounts" && loadedSections["discounts"] && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  Discounts ({discounts.length})
                </h2>
                <Button
                  onClick={() => setShowDiscountModal(true)}
                  className="group"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Discount
                </Button>
              </div>

              {showDiscountModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between p-6 border-b border-slate-200">
                      <h3 className="text-xl font-bold text-slate-900">
                        Create Discount Code
                      </h3>
                             <button
                        onClick={() => {
                          setShowDiscountModal(false);
                          setEditingDiscountId(null);
                          setDiscountForm({
                            code: "",
                            description: "",
                            discountType: "percentage",
                            discountValue: "",
                            minOrderAmount: "",
                            maxUses: "",
                            validFrom: "",
                            validUntil: "",
                          });
                        }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <form
                      onSubmit={handleCreateDiscount}
                      className="p-6 space-y-4"
                    >
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-1">
                            Discount Code *
                          </label>
                          <Input
                            value={discountForm.code}
                            onChange={(e) =>
                              setDiscountForm({
                                ...discountForm,
                                code: e.target.value.toUpperCase(),
                              })
                            }
                            placeholder="SAVE10"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-1">
                            Type *
                          </label>
                          <select
                            value={discountForm.discountType}
                            onChange={(e) =>
                              setDiscountForm({
                                ...discountForm,
                                discountType: e.target.value,
                              })
                            }
                            className="w-full border border-slate-300 rounded-lg p-2"
                          >
                            <option value="percentage">Percentage</option>
                            <option value="fixed">Fixed Amount</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-1">
                          Description
                        </label>
                        <Input
                          value={discountForm.description}
                          onChange={(e) =>
                            setDiscountForm({
                              ...discountForm,
                              description: e.target.value,
                            })
                          }
                          placeholder="e.g., 10% off on first purchase"
                        />
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-1">
                            Discount Value *
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            value={discountForm.discountValue}
                            onChange={(e) =>
                              setDiscountForm({
                                ...discountForm,
                                discountValue: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-1">
                            Min Order Amount
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            value={discountForm.minOrderAmount}
                            onChange={(e) =>
                              setDiscountForm({
                                ...discountForm,
                                minOrderAmount: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-1">
                            Max Uses
                          </label>
                          <Input
                            type="number"
                            value={discountForm.maxUses}
                            onChange={(e) =>
                              setDiscountForm({
                                ...discountForm,
                                maxUses: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-1">
                            Valid From
                          </label>
                          <Input
                            type="date"
                            value={discountForm.validFrom}
                            onChange={(e) =>
                              setDiscountForm({
                                ...discountForm,
                                validFrom: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-1">
                            Valid Until
                          </label>
                          <Input
                            type="date"
                            value={discountForm.validUntil}
                            onChange={(e) =>
                              setDiscountForm({
                                ...discountForm,
                                validUntil: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1">
                               {editingDiscountId ? "Update Discount" : "Create Discount"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowDiscountModal(false);
                            setEditingDiscountId(null);
                            setDiscountForm({
                              code: "",
                              description: "",
                              discountType: "percentage",
                              discountValue: "",
                              minOrderAmount: "",
                              maxUses: "",
                              validFrom: "",
                              validUntil: "",
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
                {discounts.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Code
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Value
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                          Usage
                        </th>
                        <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {discounts.map((discount: any) => (
                        <tr
                          key={discount.id}
                          className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-slate-900 font-medium">
                            {discount.code}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {discount.description || "—"}
                          </td>
                          <td className="px-6 py-4 text-slate-900 font-medium">
                            {discount.discount_type === "percentage"
                              ? `${discount.discount_value}%`
                              : `₹${discount.discount_value}`}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                discount.is_active
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-100 text-slate-800"
                              }`}
                            >
                              {discount.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {discount.used_count || 0} /{" "}
                            {discount.max_uses || "∞"}
                          </td>
                                              <td className="px-6 py-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditDiscount(discount)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm" 
                              onClick={() => handleDeleteDiscount(discount.id)}
                              className="ml-2"
                            >
                                Delete
                                </Button>
                          </td>
                          
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center">
                    <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 mb-4">No discount codes yet</p>
                    <Button onClick={() => setShowDiscountModal(true)}>
                      Create Your First Discount
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {currentTab === "appearance" && loadedSections["appearance"] && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Store Templates
              </h2>
              <div className="bg-white rounded-lg border border-slate-200 p-8">
                <div>
                  <p className="text-slate-600 mb-8">
                    Select a complete store design template. Each template
                    includes unique styling, layout, features, and color scheme.
                    Your changes will appear in the storefront immediately.
                  </p>

                  {availableTemplates.length > 0 ? (
                    <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6">
                      {availableTemplates.map((template: any) => (
                        <div
                          key={template.id}
                          onClick={() => setSelectedTemplate(template.id)}
                          className={`border-2 rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-xl ${
                            selectedTemplate === template.id
                              ? "border-primary bg-primary/5 shadow-lg"
                              : "border-slate-300 hover:border-slate-400"
                          }`}
                        >
                          {/* Template Preview Header */}
                          <div
                            className="h-48 border-b-4"
                            style={{
                              background: `linear-gradient(135deg, ${template.colors.primary} 0%, ${template.colors.secondary} 50%, ${template.colors.accent} 100%)`,
                            }}
                          >
                            <div className="h-full flex items-center justify-center">
                              <div className="text-center text-white">
                                <div className="text-4xl font-black mb-2">
                                  {template.id === "theme-a" && "₹�"}
                                  {template.id === "theme-b" && "🎆"}
                                </div>
                                <p className="text-sm font-semibold opacity-90">
                                  {template.name}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Template Info */}
                          <div className="p-6">
                            <h4 className="text-lg font-bold text-slate-900 mb-2">
                              {template.name}
                            </h4>
                            <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                              {template.description}
                            </p>

                            {/* Layout Preview Text */}
                            <div className="bg-slate-100 rounded-lg p-3 mb-4 text-xs text-slate-700 font-medium">
                              {template.preview}
                            </div>

                            {/* Color Indicators */}
                            <div className="mb-4">
                              <p className="text-xs font-semibold text-slate-600 mb-2">
                                Theme Colors:
                              </p>
                              <div className="flex gap-2">
                                <div
                                  className="flex-1 h-8 rounded-lg border border-slate-300"
                                  style={{
                                    backgroundColor: template.colors.primary,
                                  }}
                                  title="Primary"
                                ></div>
                                <div
                                  className="flex-1 h-8 rounded-lg border border-slate-300"
                                  style={{
                                    backgroundColor: template.colors.secondary,
                                  }}
                                  title="Secondary"
                                ></div>
                                <div
                                  className="flex-1 h-8 rounded-lg border border-slate-300"
                                  style={{
                                    backgroundColor: template.colors.accent,
                                  }}
                                  title="Accent"
                                ></div>
                              </div>
                            </div>

                            {/* Selection Badge */}
                            {selectedTemplate === template.id && (
                              <div className="flex items-center justify-center gap-2 bg-primary/10 text-primary font-bold py-2 rounded-lg border border-primary">
                                <Check className="w-4 h-4" />
                                Currently Selected
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-slate-600 text-lg mb-4">
                        Loading templates...
                      </p>
                      <div className="w-8 h-8 border-4 border-slate-300 border-t-primary rounded-full animate-spin mx-auto"></div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="mt-8 flex gap-3 border-t border-slate-200 pt-6">
                    <Button
                      onClick={handleSaveTemplate}
                      className="flex-1 py-6"
                      size="lg"
                    >
                      Apply Selected Template
                    </Button>
                  </div>

                  {/* Theme Settings - Hero Slider Management */}
                  <div className="mt-10 bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Theme Settings
                      </h3>
                      <Button
                        onClick={() => {
                          setEditingSliderId(null);
                          setSliderForm({
                            imageUrl: "",
                            title: "",
                            subtitle: "",
                            ctaText: "",
                            ctaUrl: "",
                            sortOrder: 0,
                            isActive: true,
                          });
                          setShowSliderModal(true);
                        }}
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Slide
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {heroSliders.length === 0 ? (
                        <div className="p-8 text-center text-slate-600">
                          No slides added yet
                        </div>
                      ) : (
                        <div className="grid gap-3">
                          {heroSliders.map((s: any) => (
                            <div
                              key={s.id}
                              className="flex items-center gap-4 p-3 border rounded-lg"
                            >
                              <img
                                src={s.image_url}
                                alt={s.title || "slide"}
                                className="w-36 h-20 object-cover rounded-md"
                              />
                              <div className="flex-1">
                                <div className="font-semibold text-slate-900">
                                  {s.title || "—"}
                                </div>
                                <div className="text-sm text-slate-600">
                                  {s.subtitle || "—"}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    setEditingSliderId(s.id);
                                    setSliderForm({
                                      imageUrl: s.image_url,
                                      title: s.title || "",
                                      subtitle: s.subtitle || "",
                                      ctaText: s.cta_text || "",
                                      ctaUrl: s.cta_url || "",
                                      sortOrder: s.sort_order || 0,
                                      isActive: s.is_active,
                                    });
                                    setShowSliderModal(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={async () => {
                                    if (!confirm("Delete slide?")) return;
                                    await deleteHeroSlider(
                                      s.id,
                                      tenantId || undefined,
                                    );
                                    toast.success("Deleted");
                                    await fetchTabData("appearance");
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {showSliderModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-bold">
                            {editingSliderId ? "Edit Slide" : "Add Slide"}
                          </h4>
                          <button
                            onClick={() => setShowSliderModal(false)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            try {
                              let imageUrl = sliderForm.imageUrl;
                              if ((sliderForm as any).imageFile) {
                                const resp = await uploadProductImage(
                                  (sliderForm as any).imageFile,
                                );
                                imageUrl = resp.data?.imageUrl || imageUrl;
                              }
                              if (editingSliderId) {
                                await updateHeroSlider(
                                  editingSliderId,
                                  {
                                    imageUrl,
                                    title: sliderForm.title,
                                    subtitle: sliderForm.subtitle,
                                    ctaText: sliderForm.ctaText,
                                    ctaUrl: sliderForm.ctaUrl,
                                    sortOrder: sliderForm.sortOrder,
                                    isActive: sliderForm.isActive,
                                  },
                                  tenantId || undefined,
                                );
                                toast.success("Slide updated");
                              } else {
                                await createHeroSlider(
                                  {
                                    imageUrl,
                                    title: sliderForm.title,
                                    subtitle: sliderForm.subtitle,
                                    ctaText: sliderForm.ctaText,
                                    ctaUrl: sliderForm.ctaUrl,
                                    sortOrder: sliderForm.sortOrder,
                                  },
                                  tenantId || undefined,
                                );
                                toast.success("Slide created");
                              }
                              setShowSliderModal(false);
                              await fetchTabData("appearance");
                            } catch (err) {
                              console.error(err);
                              toast.error("Failed");
                            }
                          }}
                          className="space-y-3"
                        >
                          <div>
                            <label className="block text-sm font-medium text-slate-900 mb-1">
                              Image
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const f = e.target.files
                                  ? e.target.files[0]
                                  : null;
                                setSliderForm({
                                  ...sliderForm,
                                  imageUrl: sliderForm.imageUrl,
                                  imageFile: f,
                                });
                              }}
                            />
                            {sliderForm.imageUrl && (
                              <img
                                src={sliderForm.imageUrl}
                                className="w-40 h-24 object-cover mt-2 rounded-md"
                              />
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-900 mb-1">
                              Title
                            </label>
                            <Input
                              value={sliderForm.title}
                              onChange={(e) =>
                                setSliderForm({
                                  ...sliderForm,
                                  title: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-900 mb-1">
                              Subtitle
                            </label>
                            <Input
                              value={sliderForm.subtitle}
                              onChange={(e) =>
                                setSliderForm({
                                  ...sliderForm,
                                  subtitle: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="grid md:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-sm font-medium text-slate-900 mb-1">
                                CTA Text
                              </label>
                              <Input
                                value={sliderForm.ctaText}
                                onChange={(e) =>
                                  setSliderForm({
                                    ...sliderForm,
                                    ctaText: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-900 mb-1">
                                CTA URL
                              </label>
                              <Input
                                value={sliderForm.ctaUrl}
                                onChange={(e) =>
                                  setSliderForm({
                                    ...sliderForm,
                                    ctaUrl: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                          <div className="grid md:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-sm font-medium text-slate-900 mb-1">
                                Sort Order
                              </label>
                              <Input
                                type="number"
                                value={sliderForm.sortOrder}
                                onChange={(e) =>
                                  setSliderForm({
                                    ...sliderForm,
                                    sortOrder: parseInt(e.target.value || "0"),
                                  })
                                }
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={sliderForm.isActive}
                                onChange={(e) =>
                                  setSliderForm({
                                    ...sliderForm,
                                    isActive: e.target.checked,
                                  })
                                }
                              />
                              <span className="text-sm text-slate-600">
                                Active
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-3">
                            <Button type="submit" className="flex-1">
                              Save
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowSliderModal(false)}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Announcement Settings */}
                  <div className="mt-10 bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Announcement Message
                      </h3>
                      <Button
                        onClick={() => setShowAnnouncementModal(true)}
                        size="sm"
                        variant="outline"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Message
                      </Button>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      {announcementMessage ? (
                        <div className="text-slate-700 whitespace-pre-wrap break-words">
                          {announcementMessage}
                        </div>
                      ) : (
                        <div className="text-slate-500 italic">
                          No announcement message set. Click "Edit Message" to
                          add one.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Announcement Modal */}
                  {showAnnouncementModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-bold">
                            Edit Announcement Message
                          </h4>
                          <button
                            onClick={() => setShowAnnouncementModal(false)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>

                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSaveAnnouncement();
                          }}
                          className="space-y-4"
                        >
                          <div>
                            <label className="block text-sm font-medium text-slate-900 mb-2">
                              Announcement Message
                            </label>
                            <textarea
                              value={announcementMessage}
                              onChange={(e) =>
                                setAnnouncementMessage(e.target.value)
                              }
                              placeholder="Enter your announcement message here. This will be displayed on your storefront."
                              rows={6}
                              className="w-full border border-slate-300 rounded-lg p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                            <p className="text-xs text-slate-500 mt-2">
                              Leave empty to clear the announcement message
                            </p>
                          </div>

                          <div className="flex gap-3 pt-4">
                            <Button type="submit" className="flex-1">
                              Save Message
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowAnnouncementModal(false)}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Social Media Links Settings */}
                  <div className="mt-10 bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Social Media Links
                      </h3>
                    </div>

                    <p className="text-slate-600 text-sm mb-6">
                      Add your social media links here. They will appear in the
                      footer of your storefront.
                    </p>

                    <form onSubmit={handleUpdateBusiness} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-1">
                          YouTube URL
                        </label>
                        <Input
                          type="url"
                          value={businessForm.youtubeUrl}
                          onChange={(e) =>
                            setBusinessForm({
                              ...businessForm,
                              youtubeUrl: e.target.value,
                            })
                          }
                          placeholder="https://www.youtube.com/@yourhandle"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-1">
                          Instagram URL
                        </label>
                        <Input
                          type="url"
                          value={businessForm.instagramUrl}
                          onChange={(e) =>
                            setBusinessForm({
                              ...businessForm,
                              instagramUrl: e.target.value,
                            })
                          }
                          placeholder="https://www.instagram.com/yourhandle"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-1">
                          Facebook URL
                        </label>
                        <Input
                          type="url"
                          value={businessForm.facebookUrl}
                          onChange={(e) =>
                            setBusinessForm({
                              ...businessForm,
                              facebookUrl: e.target.value,
                            })
                          }
                          placeholder="https://www.facebook.com/yourpage"
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1">
                          Save Social Media Links
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showCustomerModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
      
      {/* Close Button */}
      <button
        onClick={() => setShowCustomerModal(false)}
        className="absolute top-3 right-3 text-slate-400 hover:text-black"
      >
        ✕
      </button>

      <h2 className="text-lg font-semibold mb-4">
        {editingCustomerId ? "Edit Customer" : "Add Customer"}
      </h2>

      {/* Form */}
      <form
        onSubmit={handleSaveCustomer}
        className="space-y-4"
      >
        <input
          type="text"
          placeholder="First Name"
          value={customerForm.first_name}
          onChange={(e) =>
            setCustomerForm({ ...customerForm, first_name: e.target.value })
          }
          className="w-full border p-2 rounded"
        />

        <input
          type="text"
          placeholder="Last Name"
          value={customerForm.last_name}
          onChange={(e) =>
            setCustomerForm({ ...customerForm, last_name: e.target.value })
          }
          className="w-full border p-2 rounded"
        />

        <input
          type="email"
          placeholder="Email"
          value={customerForm.email}
          onChange={(e) =>
            setCustomerForm({ ...customerForm, email: e.target.value })
          }
          className="w-full border p-2 rounded"
        />

        <input
          type="text"
          placeholder="Phone"
          value={customerForm.phone}
          onChange={(e) =>
            setCustomerForm({ ...customerForm, phone: e.target.value })
          }
          className="w-full border p-2 rounded"
        />

        <input
          type="text"
          placeholder="City"
          value={customerForm.city}
          onChange={(e) =>
            setCustomerForm({ ...customerForm, city: e.target.value })
          }
          className="w-full border p-2 rounded"
        />

        <input
          type="text"
          placeholder="Country"
          value={customerForm.country}
          onChange={(e) =>
            setCustomerForm({ ...customerForm, country: e.target.value })
          }
          className="w-full border p-2 rounded"
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowCustomerModal(false)}
          >
            Cancel
          </Button>

          <Button type="submit">
            {editingCustomerId ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </div>
  </div>
)}

          {/* Pages Tab */}
          {currentTab === "pages" && loadedSections["pages"] && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  Pages ({pages.length})
                </h2>
                <Button
                  onClick={() => {
                    setEditingPageId(null);
                    setPageForm({
                      title: "",
                      slug: "",
                      description: "",
                      content: "",
                      seoTitle: "",
                      seoDescription: "",
                      seoKeywords: "",
                      featuredImageUrl: "",
                      isPublished: false,
                    });
                    setShowPageModal(true);
                  }}
                  className="group"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Page
                </Button>
              </div>

              {showPageModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
                      <h3 className="text-xl font-bold text-slate-900">
                        {editingPageId ? "Edit Page" : "Add New Page"}
                      </h3>
                      <button
                        onClick={() => {
                          setShowPageModal(false);
                          setEditingPageId(null);
                        }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <form onSubmit={handleSavePage} className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-slate-900">
                          Page Title *
                        </label>
                        <Input
                          value={pageForm.title}
                          onChange={(e) =>
                            setPageForm({ ...pageForm, title: e.target.value })
                          }
                          placeholder="About Us"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1 text-slate-900">
                          Slug *
                        </label>
                        <Input
                          value={pageForm.slug}
                          onChange={(e) =>
                            setPageForm({ ...pageForm, slug: e.target.value })
                          }
                          placeholder="about-us"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1 text-slate-900">
                          Description
                        </label>
                        <textarea
                          value={pageForm.description}
                          onChange={(e) =>
                            setPageForm({
                              ...pageForm,
                              description: e.target.value,
                            })
                          }
                          placeholder="Short description"
                          rows={2}
                          className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1 text-slate-900">
                          Content
                        </label>
                        <textarea
                          value={pageForm.content}
                          onChange={(e) =>
                            setPageForm({
                              ...pageForm,
                              content: e.target.value,
                            })
                          }
                          placeholder="Page content"
                          rows={4}
                          className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1 text-slate-900">
                          Featured Image URL
                        </label>
                        <Input
                          value={pageForm.featuredImageUrl}
                          onChange={(e) =>
                            setPageForm({
                              ...pageForm,
                              featuredImageUrl: e.target.value,
                            })
                          }
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-semibold text-slate-900 mb-3">
                          SEO Settings
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium mb-1 text-slate-900">
                              SEO Title
                            </label>
                            <Input
                              value={pageForm.seoTitle}
                              onChange={(e) =>
                                setPageForm({
                                  ...pageForm,
                                  seoTitle: e.target.value,
                                })
                              }
                              placeholder="About Us - Our Story"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1 text-slate-900">
                              SEO Description
                            </label>
                            <textarea
                              value={pageForm.seoDescription}
                              onChange={(e) =>
                                setPageForm({
                                  ...pageForm,
                                  seoDescription: e.target.value,
                                })
                              }
                              placeholder="Meta description for search engines"
                              rows={2}
                              className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1 text-slate-900">
                              SEO Keywords
                            </label>
                            <Input
                              value={pageForm.seoKeywords}
                              onChange={(e) =>
                                setPageForm({
                                  ...pageForm,
                                  seoKeywords: e.target.value,
                                })
                              }
                              placeholder="keyword1, keyword2, keyword3"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          id="publish-page"
                          checked={pageForm.isPublished}
                          onChange={(e) =>
                            setPageForm({
                              ...pageForm,
                              isPublished: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded"
                        />
                        <label
                          htmlFor="publish-page"
                          className="text-sm font-medium text-slate-900"
                        >
                          Publish this page
                        </label>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1">
                          {editingPageId ? "Update Page" : "Create Page"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowPageModal(false);
                            setEditingPageId(null);
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

              <div className="space-y-3">
                {pages.length > 0 ? (
                  pages.map((page: any) => (
                    <div
                      key={page.id}
                      className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {page.title}
                            </p>
                            <p className="text-sm text-slate-600">
                              /{page.slug}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              {page.is_published && (
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-emerald-100 text-emerald-800 rounded">
                                  <Check className="w-3 h-3" />
                                  Published
                                </span>
                              )}
                              {!page.is_published && (
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-slate-100 text-slate-800 rounded">
                                  Draft
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingPageId(page.id);
                            setPageForm({
                              title: page.title,
                              slug: page.slug,
                              description: page.description || "",
                              content: page.content || "",
                              seoTitle: page.seo_title || "",
                              seoDescription: page.seo_description || "",
                              seoKeywords: page.seo_keywords || "",
                              featuredImageUrl: page.featured_image_url || "",
                              isPublished: page.is_published,
                            });
                            setShowPageModal(true);
                          }}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4 text-slate-600" />
                        </button>
                        <button
                          onClick={() => handleDeletePage(page.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                    <p className="text-slate-600">
                      No pages yet. Create your first page!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {pagesPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-slate-600">
                Page {pagesPage} of {pagesPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={pagesPage <= 1}
                  onClick={async () => {
                    const next = Math.max(1, pagesPage - 1);
                    setPagesPage(next);
                    const res = await getPagesAdmin({ page: next, limit: 10 });
                    setPages(res.data || []);
                    setPagesPages(res.pagination?.pages || 1);
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={pagesPage >= pagesPages}
                  onClick={async () => {
                    const next = Math.min(pagesPages, pagesPage + 1);
                    setPagesPage(next);
                    const res = await getPagesAdmin({ page: next, limit: 10 });
                    setPages(res.data || []);
                    setPagesPages(res.pagination?.pages || 1);
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Blog Tab */}
          {currentTab === "blog" && loadedSections["blog"] && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  Blog Posts ({blogPosts.length})
                </h2>
                <Button
                  onClick={() => {
                    setEditingPostId(null);
                    setPostForm({
                      title: "",
                      slug: "",
                      excerpt: "",
                      content: "",
                      featuredImageUrl: "",
                      category: "",
                      tags: "",
                      seoTitle: "",
                      seoDescription: "",
                      seoKeywords: "",
                      isPublished: false,
                    });
                    setShowPostModal(true);
                  }}
                  className="group"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Blog Post
                </Button>
              </div>

              {showPostModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
                      <h3 className="text-xl font-bold text-slate-900">
                        {editingPostId ? "Edit Blog Post" : "Add New Blog Post"}
                      </h3>
                      <button
                        onClick={() => {
                          setShowPostModal(false);
                          setEditingPostId(null);
                        }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <form
                      onSubmit={handleSaveBlogPost}
                      className="p-6 space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium mb-1 text-slate-900">
                          Blog Title *
                        </label>
                        <Input
                          value={postForm.title}
                          onChange={(e) =>
                            setPostForm({ ...postForm, title: e.target.value })
                          }
                          placeholder="Blog Post Title"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1 text-slate-900">
                          Slug *
                        </label>
                        <Input
                          value={postForm.slug}
                          onChange={(e) =>
                            setPostForm({ ...postForm, slug: e.target.value })
                          }
                          placeholder="blog-post-slug"
                          required
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1 text-slate-900">
                            Category
                          </label>
                          <Input
                            value={postForm.category}
                            onChange={(e) =>
                              setPostForm({
                                ...postForm,
                                category: e.target.value,
                              })
                            }
                            placeholder="e.g., Technology, News"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-slate-900">
                            Tags (comma separated)
                          </label>
                          <Input
                            value={postForm.tags}
                            onChange={(e) =>
                              setPostForm({ ...postForm, tags: e.target.value })
                            }
                            placeholder="tag1, tag2, tag3"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1 text-slate-900">
                          Excerpt
                        </label>
                        <textarea
                          value={postForm.excerpt}
                          onChange={(e) =>
                            setPostForm({
                              ...postForm,
                              excerpt: e.target.value,
                            })
                          }
                          placeholder="Short excerpt for listing pages"
                          rows={2}
                          className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1 text-slate-900">
                          Content
                        </label>
                        <textarea
                          value={postForm.content}
                          onChange={(e) =>
                            setPostForm({
                              ...postForm,
                              content: e.target.value,
                            })
                          }
                          placeholder="Blog post content"
                          rows={6}
                          className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1 text-slate-900">
                          Featured Image URL
                        </label>
                        <Input
                          value={postForm.featuredImageUrl}
                          onChange={(e) =>
                            setPostForm({
                              ...postForm,
                              featuredImageUrl: e.target.value,
                            })
                          }
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-semibold text-slate-900 mb-3">
                          SEO Settings
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium mb-1 text-slate-900">
                              SEO Title
                            </label>
                            <Input
                              value={postForm.seoTitle}
                              onChange={(e) =>
                                setPostForm({
                                  ...postForm,
                                  seoTitle: e.target.value,
                                })
                              }
                              placeholder="Blog Post Title - Your Brand"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1 text-slate-900">
                              SEO Description
                            </label>
                            <textarea
                              value={postForm.seoDescription}
                              onChange={(e) =>
                                setPostForm({
                                  ...postForm,
                                  seoDescription: e.target.value,
                                })
                              }
                              placeholder="Meta description for search engines"
                              rows={2}
                              className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1 text-slate-900">
                              SEO Keywords
                            </label>
                            <Input
                              value={postForm.seoKeywords}
                              onChange={(e) =>
                                setPostForm({
                                  ...postForm,
                                  seoKeywords: e.target.value,
                                })
                              }
                              placeholder="keyword1, keyword2, keyword3"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          id="publish-post"
                          checked={postForm.isPublished}
                          onChange={(e) =>
                            setPostForm({
                              ...postForm,
                              isPublished: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded"
                        />
                        <label
                          htmlFor="publish-post"
                          className="text-sm font-medium text-slate-900"
                        >
                          Publish this blog post
                        </label>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1">
                          {editingPostId ? "Update Post" : "Create Post"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowPostModal(false);
                            setEditingPostId(null);
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

              <div className="space-y-3">
                {blogPosts.length > 0 ? (
                  blogPosts.map((post: any) => (
                    <div
                      key={post.id}
                      className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">
                          {post.title}
                        </p>
                        <p className="text-sm text-slate-600">/{post.slug}</p>
                        <div className="flex items-center gap-3 mt-2">
                          {post.category && (
                            <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded">
                              {post.category}
                            </span>
                          )}
                          {post.is_published && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-emerald-100 text-emerald-800 rounded">
                              <Check className="w-3 h-3" />
                              Published
                            </span>
                          )}
                          {!post.is_published && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-slate-100 text-slate-800 rounded">
                              Draft
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingPostId(post.id);
                            setPostForm({
                              title: post.title,
                              slug: post.slug,
                              excerpt: post.excerpt || "",
                              content: post.content || "",
                              featuredImageUrl: post.featured_image_url || "",
                              category: post.category || "",
                              tags: post.tags
                                ? Array.isArray(post.tags)
                                  ? post.tags.join(", ")
                                  : post.tags
                                : "",
                              seoTitle: post.seo_title || "",
                              seoDescription: post.seo_description || "",
                              seoKeywords: post.seo_keywords || "",
                              isPublished: post.is_published,
                            });
                            setShowPostModal(true);
                          }}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4 text-slate-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteBlogPost(post.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                    <p className="text-slate-600">
                      No blog posts yet. Create your first post!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {blogPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-slate-600">
                Page {blogPage} of {blogPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={blogPage <= 1}
                  onClick={async () => {
                    const next = Math.max(1, blogPage - 1);
                    setBlogPage(next);
                    const res = await getBlogPostsAdmin({
                      page: next,
                      limit: 10,
                    });
                    setBlogPosts(res.data || []);
                    setBlogPages(res.pagination?.pages || 1);
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={blogPage >= blogPages}
                  onClick={async () => {
                    const next = Math.min(blogPages, blogPage + 1);
                    setBlogPage(next);
                    const res = await getBlogPostsAdmin({
                      page: next,
                      limit: 10,
                    });
                    setBlogPosts(res.data || []);
                    setBlogPages(res.pagination?.pages || 1);
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Contact Us Tab */}
          {currentTab === "contact-us" && loadedSections["contact-us"] && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  Contact Us Information
                </h2>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <form onSubmit={handleSaveContactUs} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      value={contactUsForm.email}
                      onChange={(e) =>
                        setContactUsForm({
                          ...contactUsForm,
                          email: e.target.value,
                        })
                      }
                      placeholder="contact@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Phone Number
                    </label>
                    <Input
                      type="tel"
                      value={contactUsForm.phone}
                      onChange={(e) =>
                        setContactUsForm({
                          ...contactUsForm,
                          phone: e.target.value,
                        })
                      }
                      placeholder="+91-9876543210"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Address
                    </label>
                    <textarea
                      value={contactUsForm.address}
                      onChange={(e) =>
                        setContactUsForm({
                          ...contactUsForm,
                          address: e.target.value,
                        })
                      }
                      placeholder="Enter your complete address"
                      rows={4}
                      className="w-full border border-slate-300 rounded-lg p-3 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Map Embed Code
                    </label>
                    <textarea
                      value={contactUsForm.map_code}
                      onChange={(e) =>
                        setContactUsForm({
                          ...contactUsForm,
                          map_code: e.target.value,
                        })
                      }
                      placeholder="Paste your Google Maps embed code or any map iframe code here"
                      rows={6}
                      className="w-full border border-slate-300 rounded-lg p-3 text-sm font-mono text-xs"
                    />
                    <p className="text-xs text-slate-600 mt-2">
                      You can get an embed code from Google Maps by clicking
                      "Share" then "Embed a map" on the map detail page
                    </p>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-semibold text-slate-900 mb-4">
                      Working Hours
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                          Monday to Friday
                        </label>
                        <Input
                          value={contactUsForm.working_hours.monday_friday}
                          onChange={(e) =>
                            setContactUsForm({
                              ...contactUsForm,
                              working_hours: {
                                ...contactUsForm.working_hours,
                                monday_friday: e.target.value,
                              },
                            })
                          }
                          placeholder="9:00 AM - 6:00 PM"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                          Saturday
                        </label>
                        <Input
                          value={contactUsForm.working_hours.saturday}
                          onChange={(e) =>
                            setContactUsForm({
                              ...contactUsForm,
                              working_hours: {
                                ...contactUsForm.working_hours,
                                saturday: e.target.value,
                              },
                            })
                          }
                          placeholder="9:00 AM - 1:00 PM"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                          Sunday
                        </label>
                        <Input
                          value={contactUsForm.working_hours.sunday}
                          onChange={(e) =>
                            setContactUsForm({
                              ...contactUsForm,
                              working_hours: {
                                ...contactUsForm.working_hours,
                                sunday: e.target.value,
                              },
                            })
                          }
                          placeholder="Closed"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="flex-1">
                      Save Contact Information
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Payment Info Tab */}
          {currentTab === "payment-info" && loadedSections["payment-info"] && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  Payment Information
                </h2>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <form onSubmit={handleSavePaymentInfo} className="space-y-6">
                  <div className="border-b pb-6">
                    <h3 className="font-semibold text-slate-900 mb-4">
                      Bank Account Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                          Account Name
                        </label>
                        <Input
                          value={paymentInfoForm.bank_account_name}
                          onChange={(e) =>
                            setPaymentInfoForm({
                              ...paymentInfoForm,
                              bank_account_name: e.target.value,
                            })
                          }
                          placeholder="COBRA TRADERS"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                          Account Number
                        </label>
                        <Input
                          value={paymentInfoForm.bank_account_number}
                          onChange={(e) =>
                            setPaymentInfoForm({
                              ...paymentInfoForm,
                              bank_account_number: e.target.value,
                            })
                          }
                          placeholder="41813993341"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                          Bank Name
                        </label>
                        <Input
                          value={paymentInfoForm.bank_name}
                          onChange={(e) =>
                            setPaymentInfoForm({
                              ...paymentInfoForm,
                              bank_name: e.target.value,
                            })
                          }
                          placeholder="State Bank of India"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                          IFSC Code
                        </label>
                        <Input
                          value={paymentInfoForm.ifsc_code}
                          onChange={(e) =>
                            setPaymentInfoForm({
                              ...paymentInfoForm,
                              ifsc_code: e.target.value,
                            })
                          }
                          placeholder="SBIN0000975"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                          Branch
                        </label>
                        <Input
                          value={paymentInfoForm.branch}
                          onChange={(e) =>
                            setPaymentInfoForm({
                              ...paymentInfoForm,
                              branch: e.target.value,
                            })
                          }
                          placeholder="Sivakasi"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-b pb-6">
                    <h3 className="font-semibold text-slate-900 mb-4">
                      GPay Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                          Name
                        </label>
                        <Input
                          value={paymentInfoForm.gpay_name}
                          onChange={(e) =>
                            setPaymentInfoForm({
                              ...paymentInfoForm,
                              gpay_name: e.target.value,
                            })
                          }
                          placeholder="Soundharya"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                          Phone Number
                        </label>
                        <Input
                          value={paymentInfoForm.gpay_number}
                          onChange={(e) =>
                            setPaymentInfoForm({
                              ...paymentInfoForm,
                              gpay_number: e.target.value,
                            })
                          }
                          placeholder="9344746164"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 mb-4">
                      UPI Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                          Name
                        </label>
                        <Input
                          value={paymentInfoForm.upi_name}
                          onChange={(e) =>
                            setPaymentInfoForm({
                              ...paymentInfoForm,
                              upi_name: e.target.value,
                            })
                          }
                          placeholder="Harisudhan"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                          UPI ID
                        </label>
                        <Input
                          value={paymentInfoForm.upi_id}
                          onChange={(e) =>
                            setPaymentInfoForm({
                              ...paymentInfoForm,
                              upi_id: e.target.value,
                            })
                          }
                          placeholder="9677833373@gopherrc"
                        />
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <label className="block text-sm font-medium text-slate-900 mb-3">
                        Payment Method Images (Optional)
                      </label>
                      <p className="text-xs text-slate-600 mb-3">
                        Upload multiple images for payment methods (QR codes,
                        screenshots, etc.). These will be displayed on the
                        payment info page.
                      </p>

                      {/* Display existing images */}
                      {paymentInfoForm.images.length > 0 && (
                        <div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                          {paymentInfoForm.images.map((img, idx) => (
                            <div
                              key={idx}
                              className="relative p-2 bg-white rounded border border-slate-200"
                            >
                              <img
                                src={img.image_url}
                                alt={`Payment method ${idx + 1}`}
                                className="w-full h-32 object-cover rounded"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setPaymentInfoForm({
                                    ...paymentInfoForm,
                                    images: paymentInfoForm.images.filter(
                                      (_, i) => i !== idx,
                                    ),
                                  });
                                }}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Also keep legacy upi_image_url field for backward compatibility */}
                      {paymentInfoForm.upi_image_url && (
                        <div className="mb-4 p-3 bg-white rounded border border-slate-200">
                          <p className="text-xs font-medium text-slate-600 mb-2">
                            Legacy UPI Image:
                          </p>
                          <img
                            src={paymentInfoForm.upi_image_url}
                            alt="UPI QR Code"
                            className="max-w-xs max-h-64 rounded"
                          />
                        </div>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length > 0) {
                            try {
                              for (const file of files) {
                                const result = await uploadProductImage(
                                  file,
                                  tenantId || undefined,
                                );
                                if (result.success && result.data?.imageUrl) {
                                  setPaymentInfoForm((prev) => ({
                                    ...prev,
                                    images: [
                                      ...prev.images,
                                      { image_url: result.data.imageUrl },
                                    ],
                                  }));
                                } else {
                                  toast.error(`Failed to upload ${file.name}`);
                                }
                              }
                              toast.success(
                                `${files.length} image(s) uploaded successfully`,
                              );
                            } catch (error) {
                              console.error("Image upload failed:", error);
                              toast.error("Failed to upload images");
                            }
                          }
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="flex-1">
                      Save Payment Information
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Email Settings Tab */}
          {currentTab === "email-settings" &&
            loadedSections["email-settings"] && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Email Settings
                  </h2>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <form
                    onSubmit={handleSaveEmailSettings}
                    className="space-y-6"
                  >
                    <div className="border-b pb-6">
                      <h3 className="font-semibold text-slate-900 mb-4">
                        SMTP Configuration
                      </h3>
                      <p className="text-sm text-slate-600 mb-4">
                        Configure your SMTP server to enable email notifications
                        for orders.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-2">
                            SMTP Host
                          </label>
                          <Input
                            value={emailSettingsForm.smtp_host}
                            onChange={(e) =>
                              setEmailSettingsForm({
                                ...emailSettingsForm,
                                smtp_host: e.target.value,
                              })
                            }
                            placeholder="smtp.gmail.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-2">
                            SMTP Port
                          </label>
                          <Input
                            type="number"
                            value={emailSettingsForm.smtp_port}
                            onChange={(e) =>
                              setEmailSettingsForm({
                                ...emailSettingsForm,
                                smtp_port: e.target.value,
                              })
                            }
                            placeholder="587"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-2">
                            SMTP Username
                          </label>
                          <Input
                            value={emailSettingsForm.smtp_username}
                            onChange={(e) =>
                              setEmailSettingsForm({
                                ...emailSettingsForm,
                                smtp_username: e.target.value,
                              })
                            }
                            placeholder="your-email@gmail.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-2">
                            SMTP Password
                          </label>
                          <Input
                            type="password"
                            value={emailSettingsForm.smtp_password}
                            onChange={(e) =>
                              setEmailSettingsForm({
                                ...emailSettingsForm,
                                smtp_password: e.target.value,
                              })
                            }
                            placeholder="Your SMTP password"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-900 mb-2">
                            Sender Email Address
                          </label>
                          <Input
                            type="email"
                            value={emailSettingsForm.sender_email}
                            onChange={(e) =>
                              setEmailSettingsForm({
                                ...emailSettingsForm,
                                sender_email: e.target.value,
                              })
                            }
                            placeholder="noreply@yourcompany.com"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-b pb-6">
                      <h3 className="font-semibold text-slate-900 mb-4">
                        Email Notification Settings
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-2">
                            Target Email Address
                          </label>
                          <Input
                            type="email"
                            value={emailSettingsForm.target_email}
                            onChange={(e) =>
                              setEmailSettingsForm({
                                ...emailSettingsForm,
                                target_email: e.target.value,
                              })
                            }
                            placeholder="admin@yourcompany.com"
                          />
                          <p className="text-xs text-slate-600 mt-1">
                            Where order notifications will be sent
                          </p>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <input
                            type="checkbox"
                            id="emailNotifyToggle"
                            checked={emailSettingsForm.email_notify_enabled}
                            onChange={(e) =>
                              setEmailSettingsForm({
                                ...emailSettingsForm,
                                email_notify_enabled: e.target.checked,
                              })
                            }
                            className="w-5 h-5 rounded border-slate-300"
                          />
                          <div className="flex-1">
                            <label
                              htmlFor="emailNotifyToggle"
                              className="block text-sm font-medium text-slate-900 cursor-pointer"
                            >
                              Enable Email Notifications
                            </label>
                            <p className="text-xs text-slate-600 mt-0.5">
                              Send email notifications when new orders are
                              placed
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="submit" className="flex-1">
                        Save Email Settings
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          {/* SEO Tab */}
          {currentTab === "seo" && loadedSections["seo"] && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-slate-200 p-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-6">
                  Storefront SEO Settings
                </h3>
                <form onSubmit={handleSaveSEO} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">
                      Site Title
                    </label>
                    <Input
                      value={seoSettings.seoTitle || ""}
                      onChange={(e) =>
                        setSeoSettings({
                          ...seoSettings,
                          seoTitle: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">
                      Meta Description
                    </label>
                    <textarea
                      value={seoSettings.seoDescription || ""}
                      onChange={(e) =>
                        setSeoSettings({
                          ...seoSettings,
                          seoDescription: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">
                      Meta Keywords (comma separated)
                    </label>
                    <Input
                      value={seoSettings.seoKeywords || ""}
                      onChange={(e) =>
                        setSeoSettings({
                          ...seoSettings,
                          seoKeywords: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">
                      Google Analytics - gtag ID
                    </label>
                    <Input
                      value={seoSettings.gtagId || ""}
                      onChange={(e) =>
                        setSeoSettings({
                          ...seoSettings,
                          gtagId: e.target.value,
                        })
                      }
                      placeholder="G-XXXXXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">
                      Search Console Meta Tag
                    </label>
                    <Input
                      value={seoSettings.searchConsoleMeta || ""}
                      onChange={(e) =>
                        setSeoSettings({
                          ...seoSettings,
                          searchConsoleMeta: e.target.value,
                        })
                      }
                      placeholder="google-site-verification=..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">
                      Favicon (ico/png/svg)
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            setSeoSettings({
                              ...seoSettings,
                              faviconFile: file || null,
                              faviconFileName: file?.name || "",
                            });
                          }}
                          className="flex-1"
                        />
                      </div>
                      {seoSettings.faviconFileName && (
                        <p className="text-sm text-slate-600">
                          Selected: {seoSettings.faviconFileName}
                        </p>
                      )}
                      {seoSettings.faviconUrl && !seoSettings.faviconFile && (
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded">
                          <img
                            src={getAssetUrl(seoSettings.faviconUrl) || ""}
                            alt="favicon preview"
                            className="w-8 h-8"
                            onError={(e) => {
                              console.error(
                                "Failed to load favicon:",
                                seoSettings.faviconUrl,
                              );
                            }}
                          />
                          <span className="text-sm text-slate-700">
                            Current favicon is set
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">
                      Minimum Order Amount (₹)
                    </label>
                    <Input
                      type="number"
                      value={seoSettings.minOrderAmount || 0}
                      onChange={(e) =>
                        setSeoSettings({
                          ...seoSettings,
                          minOrderAmount: parseFloat(e.target.value || "0"),
                        })
                      }
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={savingSEO}
                      className="flex-1"
                    >
                      {savingSEO ? "Saving..." : "Save SEO Settings"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => loadData()}
                      className="flex-1"
                      disabled={savingSEO}
                    >
                      Reset
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {currentTab === "settings" && loadedSections["settings"] && (
            <div className="space-y-6">
              {/* Business Details Section */}
              <div className="bg-white rounded-lg border border-slate-200 p-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-6">
                  Business Details
                </h3>
                <form onSubmit={handleUpdateBusiness} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">
                      Store Domain (Read-only)
                    </label>
                    <Input
                      value={domain || ""}
                      disabled
                      className="bg-slate-50"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Your store is accessed via this domain. Contact support to
                      change.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">
                      Company Name
                    </label>
                    <Input
                      value={businessForm.companyName}
                      onChange={(e) =>
                        setBusinessForm({
                          ...businessForm,
                          companyName: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Store Logo
                    </label>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-4">
                      {businessForm.logo && (
                        <div className="mb-4 flex items-center gap-4">
                          <img
                            src={businessForm.logo}
                            alt="Store logo"
                            className="h-20 w-20 object-contain rounded border border-slate-200"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setBusinessForm({
                                ...businessForm,
                                logo: "",
                                logoFile: null,
                              })
                            }
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            Remove Logo
                          </button>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setBusinessForm({
                                ...businessForm,
                                logo: event.target?.result as string,
                                logoFile: file,
                              });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full"
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        PNG, JPG, or SVG (Max 2MB). Recommended size: 200x100px
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-1">
                        Contact Email
                      </label>
                      <Input
                        type="email"
                        value={businessForm.contactEmail}
                        onChange={(e) =>
                          setBusinessForm({
                            ...businessForm,
                            contactEmail: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-1">
                        Contact Phone
                      </label>
                      <Input
                        value={businessForm.contactPhone}
                        onChange={(e) =>
                          setBusinessForm({
                            ...businessForm,
                            contactPhone: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="maintenance"
                      checked={businessForm.isMaintenanceMode}
                      onChange={(e) =>
                        setBusinessForm({
                          ...businessForm,
                          isMaintenanceMode: e.target.checked,
                        })
                      }
                      className="w-4 h-4 cursor-pointer"
                    />
                    <label
                      htmlFor="maintenance"
                      className="flex-1 cursor-pointer"
                    >
                      <span className="font-medium text-slate-900 block">
                        Maintenance Mode
                      </span>
                      <span className="text-sm text-slate-600">
                        Enable this to temporarily close your store
                      </span>
                    </label>
                  </div>

                  <Button type="submit" className="w-full">
                    Save Changes
                  </Button>
                </form>
              </div>

              {/* Staff Members Section */}
              <div className="bg-white rounded-lg border border-slate-200 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Team Members ({staffMembers.length})
                  </h3>
                  <Button
                    onClick={() => setShowStaffModal(true)}
                    size="sm"
                    className="group"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Staff
                  </Button>
                </div>

                {showStaffModal && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full">
                      <div className="flex items-center justify-between p-6 border-b border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900">
                          Add Team Member
                        </h3>
                        <button
                          onClick={() => setShowStaffModal(false)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>

                      <form
                        onSubmit={handleCreateStaffMember}
                        className="p-6 space-y-4"
                      >
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-1">
                            Email *
                          </label>
                          <Input
                            type="email"
                            value={staffForm.email}
                            onChange={(e) =>
                              setStaffForm({
                                ...staffForm,
                                email: e.target.value,
                              })
                            }
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-1">
                            Password *
                          </label>
                          <Input
                            type="password"
                            value={staffForm.password}
                            onChange={(e) =>
                              setStaffForm({
                                ...staffForm,
                                password: e.target.value,
                              })
                            }
                            placeholder="Set a strong password"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-900 mb-1">
                              First Name
                            </label>
                            <Input
                              value={staffForm.firstName}
                              onChange={(e) =>
                                setStaffForm({
                                  ...staffForm,
                                  firstName: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-900 mb-1">
                              Last Name
                            </label>
                            <Input
                              value={staffForm.lastName}
                              onChange={(e) =>
                                setStaffForm({
                                  ...staffForm,
                                  lastName: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-1">
                            Role *
                          </label>
                          <select
                            value={staffForm.role}
                            onChange={(e) =>
                              setStaffForm({
                                ...staffForm,
                                role: e.target.value,
                              })
                            }
                            className="w-full border border-slate-300 rounded-lg p-2"
                          >
                            <option value="admin">Admin (Full Access)</option>
                            <option value="editor">
                              Editor (Products & Orders)
                            </option>
                            <option value="viewer">Viewer (Read Only)</option>
                          </select>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <Button type="submit" className="flex-1">
                            Add Member
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowStaffModal(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {staffMembers.length > 0 ? (
                    staffMembers.map((staff: any) => (
                      <div
                        key={staff.id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {staff.first_name} {staff.last_name}
                          </p>
                          <p className="text-sm text-slate-600">
                            {staff.email}
                          </p>
                          <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded mt-1 inline-block">
                            {staff.role}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteStaffMember(staff.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-600 text-center py-8">
                      No team members yet
                    </p>
                  )}
                </div>
              </div>

              {/* Footer Configuration Section */}
              <div className="bg-white rounded-lg border border-slate-200 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Footer Configuration ({footerSections.length})
                  </h3>
                  <Button
                    onClick={() => {
                      setEditingFooterSection(null);
                      setFooterForm({
                        sectionName: "",
                        isEnabled: true,
                        sortOrder: 0,
                        sectionData: "",
                      });
                    }}
                    size="sm"
                    className="group"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Section
                  </Button>
                </div>

                <form
                  onSubmit={handleSaveFooterSection}
                  className="mb-6 p-4 bg-slate-50 rounded-lg space-y-4"
                >
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-1">
                        Section Name *
                      </label>
                      <Input
                        value={footerForm.sectionName}
                        onChange={(e) =>
                          setFooterForm({
                            ...footerForm,
                            sectionName: e.target.value,
                          })
                        }
                        placeholder="e.g., Company, Support, Legal"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-1">
                        Sort Order
                      </label>
                      <Input
                        type="number"
                        value={footerForm.sortOrder}
                        onChange={(e) =>
                          setFooterForm({
                            ...footerForm,
                            sortOrder: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">
                      Section Data (JSON)
                    </label>
                    <textarea
                      value={footerForm.sectionData}
                      onChange={(e) =>
                        setFooterForm({
                          ...footerForm,
                          sectionData: e.target.value,
                        })
                      }
                      placeholder={
                        'Example: {"links": [{"label": "About", "url": "/about"}]}'
                      }
                      rows={3}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Enter JSON data for this footer section
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      id="footer-enabled"
                      checked={footerForm.isEnabled}
                      onChange={(e) =>
                        setFooterForm({
                          ...footerForm,
                          isEnabled: e.target.checked,
                        })
                      }
                      className="w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="footer-enabled" className="cursor-pointer">
                      <span className="font-medium text-slate-900">
                        Enable this section
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      {editingFooterSection ? "Update Section" : "Add Section"}
                    </Button>
                    {editingFooterSection && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingFooterSection(null);
                          setFooterForm({
                            sectionName: "",
                            isEnabled: true,
                            sortOrder: 0,
                            sectionData: "",
                          });
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>

                {footerSections.length > 0 ? (
                  <div className="space-y-2">
                    {footerSections.map((section: any) => (
                      <div
                        key={section.id}
                        className="p-4 border border-slate-200 rounded-lg flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">
                            {section.section_name}
                          </p>
                          <p className="text-sm text-slate-600">
                            {section.is_enabled ? "✓ Enabled" : "✗ Disabled"} •
                            Order: {section.sort_order}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditFooterSection(section)}
                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4 text-blue-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600 text-center py-8">
                    No footer sections yet
                  </p>
                )}
              </div>

              {/* Additional Settings */}
              {/* <div className="bg-white rounded-lg border border-slate-200 p-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-6">
                  Other Settings
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      title: "API Keys",
                      description: "Manage API keys for integrations",
                    },
                    {
                      title: "Shipping Settings",
                      description: "Configure shipping rates and methods",
                    },
                    {
                      title: "Payment Gateway",
                      description: "Connect Stripe, Razorpay, etc.",
                    },
                    {
                      title: "Tax Configuration",
                      description: "Set tax rates by region",
                    },
                  ].map((item) => (
                    <button
                      key={item.title}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left"
                    >
                      <div>
                        <p className="font-medium text-slate-900">
                          {item.title}
                        </p>
                        <p className="text-sm text-slate-600">
                          {item.description}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div> */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

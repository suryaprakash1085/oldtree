const API_BASE = "/api";

// Helper function to construct proper asset URLs
export function getAssetUrl(assetPath: string | null | undefined): string | null {
  if (!assetPath) return null;
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
    return assetPath; // Already absolute URL
  }
  if (assetPath.startsWith('/')) {
    return assetPath; // Already relative path
  }
  return `/${assetPath}`; // Add leading slash
}

// Global token error handler callback
let tokenErrorCallback: (() => void) | null = null;

export function setTokenErrorCallback(callback: () => void) {
  tokenErrorCallback = callback;
}

export function clearTokenErrorCallback() {
  tokenErrorCallback = null;
}

// API error handler for 401/Invalid token responses
async function handleApiResponse(response: Response) {
  if (response.status === 401) {
    const data = await response.json();
    if (data?.error?.includes('Invalid token') || data?.error?.includes('No token provided')) {
      // Call the error callback if registered
      if (tokenErrorCallback) {
        tokenErrorCallback();
      }
      throw new Error('Invalid or expired token. Please log in again.');
    }
  }
  return response;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    tenantId: string;
    companyName?: string;
    role?: string;
    firstName?: string;
  };
}

// Storage helpers
export function setAuthToken(token: string) {
  localStorage.setItem("auth_token", token);
}

export function getAuthToken() {
  return localStorage.getItem("auth_token");
}

export function clearAuthToken() {
  localStorage.removeItem("auth_token");
}

export function setCurrentUser(user: any) {
  localStorage.setItem("current_user", JSON.stringify(user));
}

export function getCurrentUser() {
  const user = localStorage.getItem("current_user");
  return user ? JSON.parse(user) : null;
}

export async function logout() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
  } catch (error) {
    console.error("Logout API call failed:", error);
  }
  // Always clear local auth even if API call fails
  clearAuthToken();
  setCurrentUser(null);
}

// Auth API
export async function signup(data: {
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error("Signup failed");
  return response.json();
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) throw new Error("Login failed");
  return response.json();
}

export async function superAdminLogin(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/super-admin-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) throw new Error("Login failed");
  return response.json();
}

export async function verifyToken(token: string) {
  const response = await fetch(`${API_BASE}/auth/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error("Token verification failed");
  return response.json();
}

// Helper to add auth header
function getAuthHeaders() {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// Custom fetch wrapper that handles token errors
async function apiFetch(url: string, options: RequestInit = {}) {
  const response = await fetch(url, options);

  // Handle 401 Unauthorized responses
  if (response.status === 401) {
    const contentType = response.headers.get('content-type');
    let errorMessage = 'Unauthorized';

    try {
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        errorMessage = data?.error || errorMessage;
      }
    } catch {
      // If response is not JSON, use the status message
    }

    // Check if it's a token-related error
    if (errorMessage.toLowerCase().includes('token') ||
        errorMessage.toLowerCase().includes('unauthorized')) {
      // Call the token error callback
      if (tokenErrorCallback) {
        tokenErrorCallback();
      }
    }

    const error = new Error(errorMessage);
    (error as any).status = 401;
    throw error;
  }

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    let details = '';
    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        errorMessage = data?.error || errorMessage;
        // Include details if available (e.g., database errors)
        if (data?.details) {
          details = data.details;
        }
      }
    } catch {
      // Use default error message
    }

    // Combine error and details for more information
    const fullMessage = details ? `${errorMessage}: ${details}` : errorMessage;
    const error = new Error(fullMessage);
    (error as any).status = response.status;
    throw error;
  }

  return response;
}

// Super Admin APIs
export async function getSuperAdminClients() {
  const response = await apiFetch(`${API_BASE}/super-admin/clients`, {
    headers: getAuthHeaders(),
  });
  return response.json();
}

export async function getSuperAdminAnalytics() {
  const response = await fetch(`${API_BASE}/super-admin/analytics`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch analytics");
  return response.json();
}

export async function getSuperAdminThemes() {
  const response = await fetch(`${API_BASE}/super-admin/themes`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch themes");
  return response.json();
}

export async function getSuperAdminBilling() {
  const response = await fetch(`${API_BASE}/super-admin/billing`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch billing");
  return response.json();
}

// Helper to build client-admin URL with optional tenantId
function buildClientAdminUrl(path: string, tenantId?: string): string {
  if (tenantId) {
    return `${API_BASE}/client-admin/${tenantId}${path}`;
  }
  return `${API_BASE}/client-admin${path}`;
}

// Client Admin APIs
export async function getClientAdminDashboard(tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl("/dashboard", tenantId), {
    headers: getAuthHeaders(),
  });
  return response.json();
}

export async function getClientProducts(opts?: { page?: number; limit?: number; tenantId?: string }) {
  const params: string[] = [];
  if (opts?.page) params.push(`page=${opts.page}`);
  if (opts?.limit) params.push(`limit=${opts.limit}`);
  const url = buildClientAdminUrl(`/products${params.length ? `?${params.join("&")}` : ""}`, opts?.tenantId);
  const response = await apiFetch(url, { headers: getAuthHeaders() });
  return response.json();
}

export async function getClientCategories(tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl("/categories", tenantId), {
    headers: getAuthHeaders(),
  });
  return response.json();
}

export async function createClientCategory(category: { name: string; slug: string; description?: string }, tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl("/categories", tenantId), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(category),
  });
  return response.json();
}

export async function updateClientCategory(categoryId: string, category: { name: string; slug: string; description?: string }, tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl(`/categories/${categoryId}`, tenantId), {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(category),
  });
  return response.json();
}

export async function deleteClientCategory(categoryId: string, tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl(`/categories/${categoryId}`, tenantId), {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return response.json();
}

export async function createClientProduct(product: any, tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl("/products", tenantId), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(product),
  });
  return response.json();
}

export async function updateClientProduct(productId: string, product: any, tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl(`/products/${productId}`, tenantId), {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(product),
  });
  return response.json();
}

export async function deleteClientProduct(productId: string, tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl(`/products/${productId}`, tenantId), {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return response.json();
}

export async function getClientOrders(tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl("/orders", tenantId), {
    headers: getAuthHeaders(),
  });
  return response.json();
}

export async function updateOrderStatus(orderId: string, status?: string, paymentStatus?: string, tenantId?: string) {
  const body: any = {};
  if (status) body.status = status;
  if (paymentStatus) body.payment_status = paymentStatus;

  const response = await apiFetch(
    buildClientAdminUrl(`/orders/${orderId}/status`, tenantId),
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    },
  );
  return response.json();
}

export async function getClientCustomers(tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl("/customers", tenantId), {
    headers: getAuthHeaders(),
  });
  return response.json();
}

export async function getClientDiscounts(tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl("/discounts", tenantId), {
    headers: getAuthHeaders(),
  });
  return response.json();
}

export async function createClientDiscount(discount: any, tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl("/discounts", tenantId), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(discount),
  });
  return response.json();
}

// Storefront APIs
export async function getStorefrontProducts(tenantId: string) {
  const response = await fetch(`${API_BASE}/store/${tenantId}/products`);
  if (!response.ok) throw new Error("Failed to fetch products");
  return response.json();
}

export async function getStorefrontProduct(
  tenantId: string,
  productId: string,
) {
  const response = await fetch(
    `${API_BASE}/store/${tenantId}/products/${productId}`,
  );
  if (!response.ok) throw new Error("Failed to fetch product");
  return response.json();
}

export async function createStorefrontOrder(
  tenantId: string,
  order: {
    customerEmail: string;
    customerName: string;
    customerPhone: string;
    items: any[];
    shippingAddress: any;
    discountCode?: string;
  },
) {
  const response = await fetch(`${API_BASE}/store/${tenantId}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData?.error || "Failed to create order";
    throw new Error(errorMessage);
  }
  return response.json();
}

export async function getStorefrontOrder(tenantId: string, orderId: string) {
  const response = await fetch(
    `${API_BASE}/store/${tenantId}/orders/${orderId}`,
  );
  if (!response.ok) throw new Error("Failed to fetch order");
  return response.json();
}

export async function trackStorefrontOrder(
  tenantId: string,
  orderNumber: string,
) {
  const response = await fetch(
    `${API_BASE}/store/${tenantId}/track/${orderNumber}`,
  );
  if (!response.ok) throw new Error("Failed to track order");
  return response.json();
}

export async function validateDiscount(
  tenantId: string,
  code: string,
  orderAmount: number,
) {
  const response = await fetch(
    `${API_BASE}/store/${tenantId}/validate-discount`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, orderAmount }),
    },
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData?.error || "Invalid discount code";
    throw new Error(errorMessage);
  }
  return response.json();
}

export async function getStorefrontConfig(tenantId: string) {
  const response = await fetch(`${API_BASE}/store/${tenantId}/config`);
  if (!response.ok) throw new Error("Failed to fetch storefront config");
  return response.json();
}

// Settings APIs
export async function getBusinessDetails(tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl("/settings", tenantId), {
    headers: getAuthHeaders(),
  });
  return response.json();
}

export async function updateBusinessDetails(details: { companyName?: string; contactEmail?: string; contactPhone?: string; isMaintenanceMode?: boolean; youtubeUrl?: string; instagramUrl?: string; facebookUrl?: string; logo?: string }, tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl("/settings", tenantId), {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(details),
  });
  return response.json();
}

export async function getSEOSettings(tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl("/seo", tenantId), {
    headers: getAuthHeaders(),
  });
  return response.json();
}

export async function updateSEOSettings(settings: { seoTitle?: string; seoDescription?: string; seoKeywords?: string; gtagId?: string; searchConsoleMeta?: string; minOrderAmount?: number; faviconUrl?: string }, tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl("/seo", tenantId), {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(settings),
  });
  return response.json();
}

// Staff Members APIs
export async function getStaffMembers(tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl("/staff", tenantId), {
    headers: getAuthHeaders(),
  });
  return response.json();
}

export async function createStaffMember(staff: { email: string; firstName?: string; lastName?: string; role: string; password: string }, tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl("/staff", tenantId), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(staff),
  });
  return response.json();
}

export async function updateStaffMember(memberId: string, staff: any, tenantId?: string) {
  const response = await apiFetch(
    buildClientAdminUrl(`/staff/${memberId}`, tenantId),
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(staff),
    },
  );
  return response.json();
}

export async function deleteStaffMember(memberId: string, tenantId?: string) {
  const response = await apiFetch(
    buildClientAdminUrl(`/staff/${memberId}`, tenantId),
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );
  return response.json();
}

// Footer Sections Management
export async function getFooterSections(tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl("/footer-sections", tenantId), {
    headers: getAuthHeaders(),
  });
  return response.json();
}

export async function updateFooterSection(sectionName: string, data: { isEnabled?: boolean; sectionData?: any; sortOrder?: number }, tenantId?: string) {
  const response = await apiFetch(
    buildClientAdminUrl(`/footer-sections/${encodeURIComponent(sectionName)}`, tenantId),
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    },
  );
  return response.json();
}

// Contact Us Management
export async function getContactUs(tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl("/contact-us", tenantId), {
    headers: getAuthHeaders(),
  });
  return response.json();
}

export async function updateContactUs(data: { email?: string; phone?: string; address?: string; working_hours?: any; map_code?: string }, tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl("/contact-us", tenantId), {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return response.json();
}

// Payment Info Management
export async function getPaymentInfo(tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl("/payment-info", tenantId), {
    headers: getAuthHeaders(),
  });
  return response.json();
}

export async function updatePaymentInfo(data: {
  bank_account_name?: string;
  bank_account_number?: string;
  bank_name?: string;
  ifsc_code?: string;
  branch?: string;
  gpay_name?: string;
  gpay_number?: string;
  upi_name?: string;
  upi_id?: string;
  upi_image_url?: string;
  images?: Array<{ image_url: string; image_type?: string }>;
}, tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl("/payment-info", tenantId), {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return response.json();
}

// Email Settings Management
export async function getEmailSettings(tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl("/email-settings", tenantId), {
    headers: getAuthHeaders(),
  });
  return response.json();
}

export async function updateEmailSettings(data: {
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  sender_email?: string;
  target_email?: string;
  email_notify_enabled?: boolean;
}, tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl("/email-settings", tenantId), {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return response.json();
}

// Domain validation
export async function getTenantByDomain(domain: string) {
  const response = await fetch(`${API_BASE}/domain/${domain}`);
  if (!response.ok) throw new Error("Domain not found");
  return response.json();
}

// Get all themes (for theme selection)
export async function getAllThemes() {
  const response = await apiFetch(`${API_BASE}/super-admin/themes`, {
    headers: getAuthHeaders(),
  });
  return response.json();
}

export async function initializeDatabase() {
  const response = await fetch(`${API_BASE}/init-db`, {
    method: "POST",
  });
  return response.json();
}

// Image Upload
export async function uploadProductImage(file: File, tenantId?: string) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await apiFetch(buildClientAdminUrl("/upload-image", tenantId), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: formData,
  });
  return response.json();
}

// Theme Customization
export async function getTenantThemeCustomization(tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl("/theme-customization", tenantId), {
    headers: getAuthHeaders(),
  });
  return response.json();
}

export async function updateThemeCustomization(themeData: {
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
}, tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl("/theme-customization", tenantId), {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(themeData),
  });
  return response.json();
}

// Hero Sliders
export async function getHeroSliders(tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl("/hero-sliders", tenantId), { headers: getAuthHeaders() });
  return response.json();
}

export async function createHeroSlider(slider: { imageUrl: string; title?: string; subtitle?: string; ctaText?: string; ctaUrl?: string; sortOrder?: number }, tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl("/hero-sliders", tenantId), { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(slider) });
  return response.json();
}

export async function updateHeroSlider(sliderId: string, slider: { imageUrl?: string; title?: string; subtitle?: string; ctaText?: string; ctaUrl?: string; sortOrder?: number; isActive?: boolean }, tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl(`/hero-sliders/${sliderId}`, tenantId), { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(slider) });
  return response.json();
}

export async function deleteHeroSlider(sliderId: string, tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl(`/hero-sliders/${sliderId}`, tenantId), { method: 'DELETE', headers: getAuthHeaders() });
  return response.json();
}

// Super Admin - Create Client
export async function createSuperAdminClient(client: {
  companyName: string;
  domain: string;
  contactEmail: string;
  contactPhone?: string;
  billingPlan: string;
}) {
  const response = await apiFetch(`${API_BASE}/super-admin/clients`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(client),
  });
  return response.json();
}

export async function updateSuperAdminClient(
  clientId: string,
  client: {
    companyName: string;
    domain: string;
    contactEmail: string;
    contactPhone?: string;
    billingPlan: string;
  }
) {
  const response = await apiFetch(`${API_BASE}/super-admin/clients/${clientId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(client),
  });
  return response.json();
}

export async function suspendSuperAdminClient(clientId: string) {
  const response = await apiFetch(
    `${API_BASE}/super-admin/clients/${clientId}/suspend`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    }
  );
  return response.json();
}

export async function reactivateSuperAdminClient(clientId: string) {
  const response = await apiFetch(
    `${API_BASE}/super-admin/clients/${clientId}/reactivate`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    }
  );
  return response.json();
}

export async function deleteSuperAdminClient(clientId: string) {
  const response = await apiFetch(
    `${API_BASE}/super-admin/clients/${clientId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );
  return response.json();
}

export async function createSuperAdminTheme(theme: {
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  layoutType: string;
}) {
  const response = await apiFetch(`${API_BASE}/super-admin/themes`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(theme),
  });
  return response.json();
}

export async function assignThemeToClient(clientId: string, themeId: string) {
  const response = await apiFetch(
    `${API_BASE}/super-admin/themes/${themeId}/assign/${clientId}`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    }
  );
  return response.json();
}

// Pages Admin
export async function getPagesAdmin(opts?: { page?: number; limit?: number; tenantId?: string }) {
  const params: string[] = [];
  if (opts?.page) params.push(`page=${opts.page}`);
  if (opts?.limit) params.push(`limit=${opts.limit}`);
  const url = buildClientAdminUrl(`/pages${params.length ? `?${params.join("&")}` : ""}`, opts?.tenantId);
  const response = await apiFetch(url, { headers: getAuthHeaders() });
  return response.json();
}

export async function createPageAdmin(page: any, tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl("/pages", tenantId), { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(page) });
  return response.json();
}

export async function updatePageAdmin(pageId: string, page: any, tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl(`/pages/${pageId}`, tenantId), { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(page) });
  return response.json();
}

export async function deletePageAdmin(pageId: string, tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl(`/pages/${pageId}`, tenantId), { method: 'DELETE', headers: getAuthHeaders() });
  return response.json();
}

// Blog Admin
export async function getBlogPostsAdmin(opts?: { page?: number; limit?: number; tenantId?: string }) {
  const params: string[] = [];
  if (opts?.page) params.push(`page=${opts.page}`);
  if (opts?.limit) params.push(`limit=${opts.limit}`);
  const url = buildClientAdminUrl(`/blog-posts${params.length ? `?${params.join("&")}` : ""}`, opts?.tenantId);
  const response = await apiFetch(url, { headers: getAuthHeaders() });
  return response.json();
}

export async function createBlogPostAdmin(post: any, tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl("/blog-posts", tenantId), { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(post) });
  return response.json();
}

export async function updateBlogPostAdmin(postId: string, post: any, tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl(`/blog-posts/${postId}`, tenantId), { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(post) });
  return response.json();
}

export async function deleteBlogPostAdmin(postId: string, tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl(`/blog-posts/${postId}`, tenantId), { method: 'DELETE', headers: getAuthHeaders() });
  return response.json();
}

// Template Management
export async function getAvailableTemplates(tenantId?: string) {
  const response = await apiFetch(buildClientAdminUrl("/templates", tenantId), {
    headers: getAuthHeaders(),
  });
  return response.json();
}

export async function getTenantTemplate(tenantId?: string) {
  try {
    const response = await apiFetch(buildClientAdminUrl("/template", tenantId), {
      headers: getAuthHeaders(),
    });
    return response.json();
  } catch (error) {
    console.error("getTenantTemplate error:", error);
    return { data: { template: "theme-b" } };
  }
}

export async function setTenantTemplate(template: string, tenantId?: string) {
  try {
    const response = await apiFetch(buildClientAdminUrl("/template", tenantId), {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ template }),
    });
    return response.json();
  } catch (error) {
    console.error("setTenantTemplate error:", error);
    throw error;
  }
}

// Announcement Settings
export async function getAnnouncementSettings(tenantId?: string) {
  try {
    const url = buildClientAdminUrl("/announcement", tenantId);
    console.log('Fetching announcement from:', url);
    const response = await apiFetch(url, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    console.log('Announcement response:', data);
    return data;
  } catch (error) {
    console.error('Error fetching announcement:', error);
    throw error;
  }
}

export async function updateAnnouncementSettings(announcementMessage: string, tenantId?: string) {
  try {
    const url = buildClientAdminUrl("/announcement", tenantId);
    const body = { announcementMessage };
    console.log('Updating announcement at:', url, 'with:', body);
    const response = await apiFetch(url, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    const data = await response.json();
    console.log('Update response:', data);
    return data;
  } catch (error) {
    console.error('Error updating announcement:', error);
    throw error;
  }
}

// Storefront Blog (Public)
export async function getStorefrontBlog(tenantId: string, limit?: number) {
  const url = new URL(`${window.location.origin}${API_BASE}/store/${tenantId}/blog`);
  if (limit) url.searchParams.append('limit', limit.toString());
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch blog posts');
  return response.json();
}

export async function getStorefrontBlogPost(tenantId: string, slug: string) {
  const response = await fetch(`${API_BASE}/store/${tenantId}/blog/${slug}`);
  if (!response.ok) throw new Error('Failed to fetch blog post');
  return response.json();
}

// Storefront Pages (Public)
export async function getStorefrontPages(tenantId: string) {
  const response = await fetch(`${API_BASE}/store/${tenantId}/pages`);
  if (!response.ok) throw new Error('Failed to fetch pages');
  return response.json();
}

export async function getStorefrontPage(tenantId: string, slug: string) {
  const response = await fetch(`${API_BASE}/store/${tenantId}/pages/${slug}`);
  if (!response.ok) throw new Error('Failed to fetch page');
  return response.json();
}



export async function getSuperAdminPricing() {
  const response = await fetch(`${API_BASE}/super-admin/pricing`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch pricing");
  return response.json();
}

export async function createSuperAdminPricing(data: {
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  billingPeriod: string;
  features?: string[];
}) {
  const response = await fetch(`${API_BASE}/super-admin/pricing`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create pricing plan");
  return response.json();
}

export async function updateSuperAdminPricing(
  pricingId: string,
  data: {
    name: string;
    description?: string;
    price?: number;
    currency?: string;
    billingPeriod: string;
    features?: string[];
  }
) {
  const response = await fetch(`${API_BASE}/super-admin/pricing/${pricingId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update pricing plan");
  return response.json();
}

export async function deleteSuperAdminPricing(pricingId: string) {
  const response = await fetch(`${API_BASE}/super-admin/pricing/${pricingId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to delete pricing plan");
  return response.json();
}



export async function getSuperAdminFeatureCategories() {
  const response = await fetch(`${API_BASE}/super-admin/feature-categories`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch feature categories");
  return response.json();
}

export async function createSuperAdminFeatureCategory(data: {
  name: string;
  categories?: string[];
}) {
  const response = await apiFetch(`${API_BASE}/super-admin/feature-categories`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updateSuperAdminFeatureCategory(
  featureCategoryId: string,
  data: {
    name: string;
    categories?: string[];
  }
) {
  const response = await apiFetch(`${API_BASE}/super-admin/feature-categories/${featureCategoryId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deleteSuperAdminFeatureCategory(featureCategoryId: string) {
  const response = await apiFetch(`${API_BASE}/super-admin/feature-categories/${featureCategoryId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return response.json();
}
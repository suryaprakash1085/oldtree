let API_BASE = (import.meta.env.VITE_BACKEND_URL as string) || "http://localhost:8080";
API_BASE = API_BASE.replace(/\/+$/g, "");
// normalize trailing whitespace
API_BASE = API_BASE.replace(/\s+$/g, "");
if (!API_BASE.endsWith("/api")) API_BASE = API_BASE + "/api";
const API_HOST = API_BASE.replace(/\/api$/, "");
console.log("[API] Initialized with API_BASE:", API_BASE, "API_HOST:", API_HOST);

function toAbsoluteUrl(u?: string | null): string | undefined {
  if (!u) return undefined;
  if (/^https?:\/\//i.test(u)) return u;
  return `${API_HOST}${u.startsWith("/") ? "" : "/"}${u}`;
}

async function parseJsonOrThrow(response: Response, url: string) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const preview = await response.text().catch(() => "");
    const errorMsg = `Expected JSON from ${url}, got non-JSON (likely HTML). Response starts with: ${preview.slice(0, 150)}`;
    console.error("[API Error]", errorMsg);
    throw new Error(errorMsg);
  }
  return response.json();
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  stock_quantity: number;
  category: string;
}

export interface Order {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingAddress: any;
  discountCode?: string;
}

export async function getStorefrontProducts(tenantId: string, opts?: { search?: string; category?: string; page?: number; limit?: number }): Promise<Product[]> {
  let url = `${API_BASE}/store/${tenantId}/products`;
  const params: string[] = [];
  if (opts?.category) params.push(`category=${encodeURIComponent(opts.category)}`);
  if (opts?.search) params.push(`q=${encodeURIComponent(opts.search)}`);
  if (opts?.page) params.push(`page=${opts.page}`);
  if (opts?.limit) params.push(`limit=${opts.limit}`);
  if (params.length) url = `${url}?${params.join("&")}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch products");
  const data = await parseJsonOrThrow(response, url);
  const rows = Array.isArray(data.data) ? data.data : [];
  return rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    description: r.description || "",
    price: Number(r.price) || 0,
    imageUrl: toAbsoluteUrl(r.imageUrl || r.image_url || r.image),
    stock_quantity: Number(r.stock_quantity ?? r.stockQuantity ?? 0) || 0,
    category: r.category || "",
  }));
}

export async function getStorefrontProductsWithPagination(tenantId: string, opts?: { search?: string; category?: string; page?: number; limit?: number }): Promise<{ data: Product[]; pagination: { total: number; page: number; limit: number; pages: number } }> {
  let url = `${API_BASE}/store/${tenantId}/products`;
  const params: string[] = [];
  if (opts?.category) params.push(`category=${encodeURIComponent(opts.category)}`);
  if (opts?.search) params.push(`q=${encodeURIComponent(opts.search)}`);
  if (opts?.page) params.push(`page=${opts.page}`);
  if (opts?.limit) params.push(`limit=${opts.limit}`);
  if (params.length) url = `${url}?${params.join("&")}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch products");
  const data = await parseJsonOrThrow(response, url);
  const rows = Array.isArray(data.data) ? data.data : [];
  const mapped = rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    description: r.description || "",
    price: Number(r.price) || 0,
    imageUrl: toAbsoluteUrl(r.imageUrl || r.image_url || r.image),
    stock_quantity: Number(r.stock_quantity ?? r.stockQuantity ?? 0) || 0,
    category: r.category || "",
  }));
  return { data: mapped, pagination: data.pagination || { total: 0, page: 1, limit: 10, pages: 0 } };
}

export async function getStorefrontProduct(
  tenantId: string,
  productId: string
): Promise<Product> {
  const url = `${API_BASE}/store/${tenantId}/products/${productId}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch product");
  const data = await parseJsonOrThrow(response, url);
  const r = data.data || {};
  return {
    id: r.id,
    name: r.name,
    description: r.description || "",
    price: Number(r.price) || 0,
    imageUrl: toAbsoluteUrl(r.imageUrl || r.image_url || r.image),
    stock_quantity: Number(r.stock_quantity ?? r.stockQuantity ?? 0) || 0,
    category: r.category || "",
  };
}

export async function getStorefrontConfig(tenantId: string): Promise<{ template: string; theme?: { primaryColor?: string; secondaryColor?: string; fontFamily?: string; companyName?: string }; announcementMessage?: string; heroSliders?: any[] }> {
  const url = `${API_BASE}/store/${tenantId}/config`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[Config] HTTP ${response.status} from ${url}`);
      // Return sensible defaults on any error (403, 404, 500, etc.)
      return { template: "theme-b" };
    }
    const data = await parseJsonOrThrow(response, url);
    return data.data || { template: "theme-b" };
  } catch (error) {
    console.error("[Config] Error fetching config:", error);
    // Return default config instead of throwing
    return { template: "theme-b" };
  }
}

export async function createOrder(
  tenantId: string,
  order: Order
): Promise<any> {
  const url = `${API_BASE}/store/${tenantId}/orders`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });
  if (!response.ok) throw new Error("Failed to create order");
  return parseJsonOrThrow(response, url);
}

export async function getOrder(
  tenantId: string,
  orderId: string
): Promise<any> {
  const url = `${API_BASE}/store/${tenantId}/orders/${orderId}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch order");
  const data = await parseJsonOrThrow(response, url);
  return data.data;
}

export async function trackOrder(
  tenantId: string,
  orderNumber: string
): Promise<any> {
  const url = `${API_BASE}/store/${tenantId}/track/${orderNumber}`;
  console.log("[trackOrder] Requesting:", url);

  try {
    const response = await fetch(url);
    console.log("[trackOrder] Response status:", response.status);

    if (!response.ok) {
      const contentType = response.headers.get("content-type") || "";
      let errorData: any = null;

      try {
        if (contentType.includes("application/json")) {
          errorData = await response.json();
        } else {
          const text = await response.text();
          console.error("[trackOrder] Non-JSON response:", text.slice(0, 200));
        }
      } catch (e) {
        console.error("[trackOrder] Failed to parse error response:", e);
      }

      const errorMessage = errorData?.error || `HTTP ${response.status}`;
      console.error("[trackOrder] Error:", errorMessage);
      throw new Error(errorMessage);
    }

    const data = await parseJsonOrThrow(response, url);
    console.log("[trackOrder] Success:", data);
    return data.data;
  } catch (error) {
    console.error("[trackOrder] Exception:", error);
    throw error;
  }
}

export async function validateDiscount(
  tenantId: string,
  code: string,
  orderAmount: number
): Promise<any> {
  const url = `${API_BASE}/store/${tenantId}/validate-discount`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, orderAmount }),
  });
  if (!response.ok) throw new Error("Invalid discount");
  const data = await parseJsonOrThrow(response, url);
  return data.data;
}

export async function getPublishedPages(tenantId: string, opts?: { page?: number; limit?: number }): Promise<any[]> {
  let url = `${API_BASE}/store/${tenantId}/pages`;
  const params: string[] = [];
  if (opts?.page) params.push(`page=${opts.page}`);
  if (opts?.limit) params.push(`limit=${opts.limit}`);
  if (params.length) url = `${url}?${params.join("&")}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch pages');
  const data = await parseJsonOrThrow(res, url);
  return data.data || [];
}

export async function getPublishedPagesWithPagination(tenantId: string, opts?: { page?: number; limit?: number }): Promise<{ data: any[]; pagination: { total: number; page: number; limit: number; pages: number } }> {
  let url = `${API_BASE}/store/${tenantId}/pages`;
  const params: string[] = [];
  if (opts?.page) params.push(`page=${opts.page}`);
  if (opts?.limit) params.push(`limit=${opts.limit}`);
  if (params.length) url = `${url}?${params.join("&")}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch pages');
  const data = await parseJsonOrThrow(res, url);
  return { data: data.data || [], pagination: data.pagination || { total: 0, page: 1, limit: 10, pages: 0 } };
}

export async function getPageBySlug(tenantId: string, slug: string): Promise<any> {
  const url = `${API_BASE}/store/${tenantId}/pages/${encodeURIComponent(slug)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch page');
  const data = await parseJsonOrThrow(res, url);
  return data.data;
}

export async function getBlogPosts(tenantId: string, opts?: { limit?: number; page?: number }): Promise<any[]> {
  let url = `${API_BASE}/store/${tenantId}/blog`;
  const params: string[] = [];
  if (opts?.limit) params.push(`limit=${opts.limit}`);
  if (opts?.page) params.push(`page=${opts.page}`);
  if (params.length) url = `${url}?${params.join("&")}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch blog posts');
  const data = await parseJsonOrThrow(res, url);
  return data.data || [];
}

export async function getBlogPostsWithPagination(tenantId: string, opts?: { limit?: number; page?: number }): Promise<{ data: any[]; pagination: { total: number; page: number; limit: number; pages: number } }> {
  let url = `${API_BASE}/store/${tenantId}/blog`;
  const params: string[] = [];
  if (opts?.limit) params.push(`limit=${opts.limit}`);
  if (opts?.page) params.push(`page=${opts.page}`);
  if (params.length) url = `${url}?${params.join("&")}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch blog posts');
  const data = await parseJsonOrThrow(res, url);
  return { data: data.data || [], pagination: data.pagination || { total: 0, page: 1, limit: 10, pages: 0 } };
}

export async function getBlogPostBySlug(tenantId: string, slug: string): Promise<any> {
  const url = `${API_BASE}/store/${tenantId}/blog/${encodeURIComponent(slug)}`;
  const res = await fetch(url);
  const data = await parseJsonOrThrow(res, url);
  if (!data.success || !data.data) {
    throw new Error(data.error || 'Post not found');
  }
  return data.data;
}

export async function getHeroSliders(tenantId: string): Promise<any[]> {
  try {
    const config = await getStorefrontConfig(tenantId);
    return (config as any).heroSliders || [];
  } catch (err) {
    console.warn('Failed to fetch hero sliders:', err);
    return [];
  }
}

export async function getContactUs(tenantId: string): Promise<any> {
  const url = `${API_BASE}/store/${tenantId}/contact-us`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch contact us');
  const data = await parseJsonOrThrow(res, url);
  return data.data;
}

export async function getPaymentInfo(tenantId: string): Promise<any> {
  const url = `${API_BASE}/store/${tenantId}/payment-info`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch payment info');
  const data = await parseJsonOrThrow(res, url);
  return data.data;
}

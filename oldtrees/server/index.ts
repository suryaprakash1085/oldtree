import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import compression from "compression";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";
import { handleDemo } from "./routes/demo";
import { initializeDatabase, query } from "./db";
import { verifyToken, TokenPayload } from "./auth";
import * as authRoutes from "./routes/auth";
import * as superAdminRoutes from "./routes/super-admin";
import * as clientAdminRoutes from "./routes/client-admin";
import * as storefrontRoutes from "./routes/storefront";
import * as setupRoutes from "./routes/setup";
import * as debugRoutes from "./routes/debug";

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      userId?: string;
      role?: string;
      user?: TokenPayload;
    }
  }
}

// Middleware to verify domain-based access for storefront endpoints
const domainValidationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const tenantId = req.params.tenantId;
  if (!tenantId) {
    next();
    return;
  }

  // Get the request host (domain + port)
  const requestHost = req.get('host') || req.hostname;

  // Allow localhost, 127.0.0.1, and development environments without domain validation
  if (requestHost.includes('localhost') || requestHost.includes('127.0.0.1') || requestHost.includes('0.0.0.0')) {
    req.tenantId = tenantId;
    next();
    return;
  }

  // For production, validate the domain
  query("SELECT domain FROM tenants WHERE id = ?", [tenantId])
    .then((results: any) => {
      if (!Array.isArray(results) || results.length === 0) {
        res.status(404).json({
          error: "Tenant not found",
          code: "TENANT_NOT_FOUND"
        });
        return;
      }

      const tenant = results[0];
      const registeredDomain = tenant.domain;

      // Extract just the domain part (remove port if present)
      const requestDomain = requestHost.split(':')[0];
      const tenantDomain = registeredDomain.split(':')[0];

      // Check if the request domain matches the tenant's registered domain or if domain ends with tenant domain (subdomain support)
      if (requestDomain !== tenantDomain && !requestDomain.endsWith(`.${tenantDomain}`)) {
        res.status(403).json({
          error: "Unauthorized: This domain is not registered for this tenant",
          code: "DOMAIN_MISMATCH"
        });
        return;
      }

      req.tenantId = tenantId;
      next();
    })
    .catch((error) => {
      console.error("Domain validation error:", error);
      res.status(500).json({
        error: "Failed to validate domain",
        code: "DOMAIN_VALIDATION_ERROR"
      });
    });
};

// Middleware to verify tenant isolation and authorization
const tenantMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const tenantId = req.params.tenantId;
  if (tenantId) {
    // Ensure user can only access their own tenant (unless they're super admin)
    const authTenantId = req.tenantId;
    if (authTenantId && authTenantId !== "super-admin" && authTenantId !== tenantId) {
      res.status(403).json({
        error: "Unauthorized: Cannot access other tenant's data",
        code: "TENANT_MISMATCH"
      });
      return;
    }
    req.tenantId = tenantId;
  }
  next();
};

// Middleware to verify JWT token
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      error: "No token provided",
      code: "NO_TOKEN"
    });
    return;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    res.status(401).json({
      error: "Invalid authorization header format",
      code: "INVALID_FORMAT"
    });
    return;
  }

  const token = parts[1];
  if (!token.trim()) {
    res.status(401).json({
      error: "Invalid token",
      code: "EMPTY_TOKEN"
    });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({
      error: "Invalid token. Please log in again.",
      code: "INVALID_TOKEN"
    });
    return;
  }

  req.user = payload;
  req.userId = payload.userId;
  req.tenantId = payload.tenantId;
  req.role = payload.role;
  next();
};

// Configure multer for file uploads
// Use public/uploads for dev and dist/spa/uploads for production
const isProduction = process.env.NODE_ENV === 'production';
const uploadsDir = path.join(process.cwd(), isProduction ? "dist/spa/uploads" : "public/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

export function createServer() {
  const app = express();

  // Middleware - Performance optimizations for high-concurrency
  app.use(compression());
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Set timeout to handle slow clients
  app.use((req, res, next) => {
    req.setTimeout(60000);
    res.setTimeout(60000);
    next();
  });

  app.use("/uploads", express.static(uploadsDir, { maxAge: "1d" }));

  // Initialize database on startup
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.path === "/api/init-db") {
        next();
        return;
      }

      if (!global.dbInitialized) {
        try {
          await initializeDatabase();
          (global as any).dbInitialized = true;
        } catch (error) {
          console.log("Database already initialized or error:", error);
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "pong";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  app.post("/api/init-db", async (_req, res) => {
    try {
      await initializeDatabase();
      res.json({ success: true, message: "Database initialized" });
    } catch (error) {
      console.error("Init DB error:", error);
      res.status(500).json({ error: "Failed to initialize database" });
    }
  });

  app.post("/api/setup-demo", setupRoutes.setupDemo);

  // Debug endpoints
  app.get("/api/debug/status", debugRoutes.debugStatus);
  app.post("/api/debug/seed-demo", debugRoutes.seedDemoData);

  // Domain validation - get tenant by domain
  app.get("/api/domain/:domain", async (req, res) => {
    try {
      const { domain } = req.params;
      const tenants = await query(
        "SELECT id, company_name, domain FROM tenants WHERE domain = ?",
        [domain]
      );

      if (!Array.isArray(tenants) || tenants.length === 0) {
        res.status(404).json({ error: "Domain not found" });
        return;
      }

      const tenant = tenants[0];

      res.json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      console.error("Domain validation error:", error);
      res.status(500).json({ error: "Failed to validate domain" });
    }
  });

  // Authentication Routes
  app.post("/api/auth/signup", authRoutes.handleSignup);
  app.post("/api/auth/login", authRoutes.handleLogin);
  app.post("/api/auth/super-admin-login", authRoutes.handleSuperAdminLogin);
  app.post("/api/auth/verify", authRoutes.handleVerifyToken);
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    // Client-side session clearing - server can track logout if needed in future
    res.json({ success: true, message: "Logged out successfully" });
  });

  // Super Admin Routes
  app.get(
    "/api/super-admin/clients",
    authMiddleware,
    superAdminRoutes.getClients,
  );
  app.post(
    "/api/super-admin/clients",
    authMiddleware,
    superAdminRoutes.createClient,
  );
  app.put(
    "/api/super-admin/clients/:clientId",
    authMiddleware,
    superAdminRoutes.updateClient,
  );
  app.post(
    "/api/super-admin/clients/:clientId/suspend",
    authMiddleware,
    superAdminRoutes.suspendClient,
  );
  app.post(
    "/api/super-admin/clients/:clientId/reactivate",
    authMiddleware,
    superAdminRoutes.reactivateClient,
  );
  app.delete(
    "/api/super-admin/clients/:clientId",
    authMiddleware,
    superAdminRoutes.deleteClient,
  );
  app.get(
    "/api/super-admin/analytics",
    authMiddleware,
    superAdminRoutes.getAnalytics,
  );
  app.get(
    "/api/super-admin/themes",
    authMiddleware,
    superAdminRoutes.getThemes,
  );
  app.post(
    "/api/super-admin/themes",
    authMiddleware,
    superAdminRoutes.createTheme,
  );
  app.post(
    "/api/super-admin/themes/:themeId/assign/:clientId",
    authMiddleware,
    superAdminRoutes.assignThemeToClient,
  );
  app.get(
    "/api/super-admin/billing",
    authMiddleware,
    superAdminRoutes.getBilling,
  );



   app.get(
    "/api/super-admin/billing",
    authMiddleware,
    superAdminRoutes.getBilling,
  );
  app.get(
    "/api/super-admin/pricing",
    authMiddleware,
    superAdminRoutes.getPricing,
  );
  app.post(
    "/api/super-admin/pricing",
    authMiddleware,
    superAdminRoutes.createPricing,
  );
  app.put(
    "/api/super-admin/pricing/:pricingId",
    authMiddleware,
    superAdminRoutes.updatePricing,
  );
  app.delete(
    "/api/super-admin/pricing/:pricingId",
    authMiddleware,
    superAdminRoutes.deletePricing,
  );

  // Client Admin Routes - support both with and without tenantId in URL
  app.get(
    "/api/client-admin/dashboard",
    authMiddleware,
    clientAdminRoutes.getDashboard,
  );
  app.get(
    "/api/client-admin/:tenantId/dashboard",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.getDashboard,
  );

  app.get(
    "/api/client-admin/products",
    authMiddleware,
    clientAdminRoutes.getProducts,
  );
  app.get(
    "/api/client-admin/:tenantId/products",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.getProducts,
  );

  app.get(
    "/api/client-admin/categories",
    authMiddleware,
    clientAdminRoutes.getCategories,
  );
  app.get(
    "/api/client-admin/:tenantId/categories",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.getCategories,
  );

  app.post(
    "/api/client-admin/categories",
    authMiddleware,
    clientAdminRoutes.createCategory,
  );
  app.post(
    "/api/client-admin/:tenantId/categories",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.createCategory,
  );

  app.put(
    "/api/client-admin/categories/:categoryId",
    authMiddleware,
    clientAdminRoutes.updateCategory,
  );
  app.put(
    "/api/client-admin/:tenantId/categories/:categoryId",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.updateCategory,
  );

  app.delete(
    "/api/client-admin/categories/:categoryId",
    authMiddleware,
    clientAdminRoutes.deleteCategory,
  );
  app.delete(
    "/api/client-admin/:tenantId/categories/:categoryId",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.deleteCategory,
  );

  // SEO settings for storefront
  app.get(
    "/api/client-admin/seo",
    authMiddleware,
    clientAdminRoutes.getSEOSettings,
  );
  app.get(
    "/api/client-admin/:tenantId/seo",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.getSEOSettings,
  );

  app.put(
    "/api/client-admin/seo",
    authMiddleware,
    clientAdminRoutes.updateSEOSettings,
  );
  app.put(
    "/api/client-admin/:tenantId/seo",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.updateSEOSettings,
  );

  // Announcement settings
  app.get(
    "/api/client-admin/announcement",
    authMiddleware,
    clientAdminRoutes.getAnnouncementSettings,
  );
  app.get(
    "/api/client-admin/:tenantId/announcement",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.getAnnouncementSettings,
  );

  app.put(
    "/api/client-admin/announcement",
    authMiddleware,
    clientAdminRoutes.updateAnnouncementSettings,
  );
  app.put(
    "/api/client-admin/:tenantId/announcement",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.updateAnnouncementSettings,
  );

  app.post(
    "/api/client-admin/products",
    authMiddleware,
    clientAdminRoutes.createProduct,
  );
  app.post(
    "/api/client-admin/:tenantId/products",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.createProduct,
  );

  app.put(
    "/api/client-admin/products/:productId",
    authMiddleware,
    clientAdminRoutes.updateProduct,
  );
  app.put(
    "/api/client-admin/:tenantId/products/:productId",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.updateProduct,
  );

  app.delete(
    "/api/client-admin/products/:productId",
    authMiddleware,
    clientAdminRoutes.deleteProduct,
  );
  app.delete(
    "/api/client-admin/:tenantId/products/:productId",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.deleteProduct,
  );

  app.get(
    "/api/client-admin/orders",
    authMiddleware,
    clientAdminRoutes.getOrders,
  );
  app.get(
    "/api/client-admin/:tenantId/orders",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.getOrders,
  );

  app.put(
    "/api/client-admin/orders/:orderId/status",
    authMiddleware,
    clientAdminRoutes.updateOrderStatus,
  );
  app.put(
    "/api/client-admin/:tenantId/orders/:orderId/status",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.updateOrderStatus,
  );

  app.get(
    "/api/client-admin/customers",
    authMiddleware,
    clientAdminRoutes.getCustomers,
  );
  app.get(
    "/api/client-admin/:tenantId/customers",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.getCustomers,
  );

  app.get(
    "/api/client-admin/discounts",
    authMiddleware,
    clientAdminRoutes.getDiscounts,
  );
  app.get(
    "/api/client-admin/:tenantId/discounts",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.getDiscounts,
  );

  app.post(
    "/api/client-admin/discounts",
    authMiddleware,
    clientAdminRoutes.createDiscount,
  );
  app.post(
    "/api/client-admin/:tenantId/discounts",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.createDiscount,
  );

  app.get(
    "/api/client-admin/themes",
    authMiddleware,
    clientAdminRoutes.getTenantThemes,
  );
  app.get(
    "/api/client-admin/:tenantId/themes",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.getTenantThemes,
  );

  // Hero slider (theme banners)
  app.get(
    "/api/client-admin/hero-sliders",
    authMiddleware,
    clientAdminRoutes.getHeroSliders,
  );
  app.get(
    "/api/client-admin/:tenantId/hero-sliders",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.getHeroSliders,
  );

  app.post(
    "/api/client-admin/hero-sliders",
    authMiddleware,
    clientAdminRoutes.createHeroSlider,
  );
  app.post(
    "/api/client-admin/:tenantId/hero-sliders",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.createHeroSlider,
  );

  app.put(
    "/api/client-admin/hero-sliders/:sliderId",
    authMiddleware,
    clientAdminRoutes.updateHeroSlider,
  );
  app.put(
    "/api/client-admin/:tenantId/hero-sliders/:sliderId",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.updateHeroSlider,
  );

  app.delete(
    "/api/client-admin/hero-sliders/:sliderId",
    authMiddleware,
    clientAdminRoutes.deleteHeroSlider,
  );
  app.delete(
    "/api/client-admin/:tenantId/hero-sliders/:sliderId",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.deleteHeroSlider,
  );

  app.get(
    "/api/client-admin/theme-customization",
    authMiddleware,
    clientAdminRoutes.getTenantThemeCustomization,
  );
  app.get(
    "/api/client-admin/:tenantId/theme-customization",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.getTenantThemeCustomization,
  );

  app.put(
    "/api/client-admin/theme-customization",
    authMiddleware,
    clientAdminRoutes.updateThemeCustomization,
  );
  app.put(
    "/api/client-admin/:tenantId/theme-customization",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.updateThemeCustomization,
  );

  app.get(
    "/api/client-admin/templates",
    authMiddleware,
    clientAdminRoutes.getAvailableTemplates,
  );
  app.get(
    "/api/client-admin/:tenantId/templates",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.getAvailableTemplates,
  );

  app.get(
    "/api/client-admin/template",
    authMiddleware,
    clientAdminRoutes.getTenantTemplate,
  );
  app.get(
    "/api/client-admin/:tenantId/template",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.getTenantTemplate,
  );

  app.post(
    "/api/client-admin/template",
    authMiddleware,
    clientAdminRoutes.setTenantTemplate,
  );
  app.post(
    "/api/client-admin/:tenantId/template",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.setTenantTemplate,
  );

  app.get(
    "/api/client-admin/settings",
    authMiddleware,
    clientAdminRoutes.getBusinessDetails,
  );
  app.get(
    "/api/client-admin/:tenantId/settings",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.getBusinessDetails,
  );

  app.put(
    "/api/client-admin/settings",
    authMiddleware,
    clientAdminRoutes.updateBusinessDetails,
  );
  app.put(
    "/api/client-admin/:tenantId/settings",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.updateBusinessDetails,
  );

  app.post(
    "/api/client-admin/upload-image",
    authMiddleware,
    upload.single("image"),
    clientAdminRoutes.uploadProductImage,
  );
  app.post(
    "/api/client-admin/:tenantId/upload-image",
    authMiddleware,
    tenantMiddleware,
    upload.single("image"),
    clientAdminRoutes.uploadProductImage,
  );

  app.get(
    "/api/client-admin/staff",
    authMiddleware,
    clientAdminRoutes.getStaffMembers,
  );
  app.get(
    "/api/client-admin/:tenantId/staff",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.getStaffMembers,
  );

  app.post(
    "/api/client-admin/staff",
    authMiddleware,
    clientAdminRoutes.createStaffMember,
  );
  app.post(
    "/api/client-admin/:tenantId/staff",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.createStaffMember,
  );

  app.put(
    "/api/client-admin/staff/:memberId",
    authMiddleware,
    clientAdminRoutes.updateStaffMember,
  );
  app.put(
    "/api/client-admin/:tenantId/staff/:memberId",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.updateStaffMember,
  );

  app.delete(
    "/api/client-admin/staff/:memberId",
    authMiddleware,
    clientAdminRoutes.deleteStaffMember,
  );
  app.delete(
    "/api/client-admin/:tenantId/staff/:memberId",
    authMiddleware,
    tenantMiddleware,
    clientAdminRoutes.deleteStaffMember,
  );

  // Client Admin: Pages
  app.get("/api/client-admin/pages", authMiddleware, clientAdminRoutes.getPages);
  app.get("/api/client-admin/:tenantId/pages", authMiddleware, tenantMiddleware, clientAdminRoutes.getPages);

  app.post("/api/client-admin/pages", authMiddleware, clientAdminRoutes.createPage);
  app.post("/api/client-admin/:tenantId/pages", authMiddleware, tenantMiddleware, clientAdminRoutes.createPage);

  app.put("/api/client-admin/pages/:pageId", authMiddleware, clientAdminRoutes.updatePage);
  app.put("/api/client-admin/:tenantId/pages/:pageId", authMiddleware, tenantMiddleware, clientAdminRoutes.updatePage);

  app.delete("/api/client-admin/pages/:pageId", authMiddleware, clientAdminRoutes.deletePage);
  app.delete("/api/client-admin/:tenantId/pages/:pageId", authMiddleware, tenantMiddleware, clientAdminRoutes.deletePage);

  // Client Admin: Blog Posts
  app.get("/api/client-admin/blog-posts", authMiddleware, clientAdminRoutes.getBlogPostsAdmin);
  app.get("/api/client-admin/:tenantId/blog-posts", authMiddleware, tenantMiddleware, clientAdminRoutes.getBlogPostsAdmin);

  app.post("/api/client-admin/blog-posts", authMiddleware, clientAdminRoutes.createBlogPost);
  app.post("/api/client-admin/:tenantId/blog-posts", authMiddleware, tenantMiddleware, clientAdminRoutes.createBlogPost);

  app.put("/api/client-admin/blog-posts/:postId", authMiddleware, clientAdminRoutes.updateBlogPost);
  app.put("/api/client-admin/:tenantId/blog-posts/:postId", authMiddleware, tenantMiddleware, clientAdminRoutes.updateBlogPost);

  app.delete("/api/client-admin/blog-posts/:postId", authMiddleware, clientAdminRoutes.deleteBlogPost);
  app.delete("/api/client-admin/:tenantId/blog-posts/:postId", authMiddleware, tenantMiddleware, clientAdminRoutes.deleteBlogPost);

  // Client Admin: Footer Sections
  app.get("/api/client-admin/footer-sections", authMiddleware, clientAdminRoutes.getFooterSections);
  app.get("/api/client-admin/:tenantId/footer-sections", authMiddleware, tenantMiddleware, clientAdminRoutes.getFooterSections);

  app.put("/api/client-admin/footer-sections/:sectionName", authMiddleware, clientAdminRoutes.updateFooterSection);
  app.put("/api/client-admin/:tenantId/footer-sections/:sectionName", authMiddleware, tenantMiddleware, clientAdminRoutes.updateFooterSection);

  // Client Admin: Contact Us
  app.get("/api/client-admin/contact-us", authMiddleware, clientAdminRoutes.getContactUs);
  app.get("/api/client-admin/:tenantId/contact-us", authMiddleware, tenantMiddleware, clientAdminRoutes.getContactUs);

  app.put("/api/client-admin/contact-us", authMiddleware, clientAdminRoutes.updateContactUs);
  app.put("/api/client-admin/:tenantId/contact-us", authMiddleware, tenantMiddleware, clientAdminRoutes.updateContactUs);

  // Client Admin: Payment Info
  app.get("/api/client-admin/payment-info", authMiddleware, clientAdminRoutes.getPaymentInfo);
  app.get("/api/client-admin/:tenantId/payment-info", authMiddleware, tenantMiddleware, clientAdminRoutes.getPaymentInfo);

  app.put("/api/client-admin/payment-info", authMiddleware, clientAdminRoutes.updatePaymentInfo);
  app.put("/api/client-admin/:tenantId/payment-info", authMiddleware, tenantMiddleware, clientAdminRoutes.updatePaymentInfo);

  // Client Admin: Email Settings
  app.get("/api/client-admin/email-settings", authMiddleware, clientAdminRoutes.getEmailSettings);
  app.get("/api/client-admin/:tenantId/email-settings", authMiddleware, tenantMiddleware, clientAdminRoutes.getEmailSettings);

  app.put("/api/client-admin/email-settings", authMiddleware, clientAdminRoutes.updateEmailSettings);
  app.put("/api/client-admin/:tenantId/email-settings", authMiddleware, tenantMiddleware, clientAdminRoutes.updateEmailSettings);

  // Storefront Routes (public - with domain validation)
  app.get(
    "/api/store/:tenantId/products",
    domainValidationMiddleware,
    storefrontRoutes.getStorefrontProducts,
  );
  app.get(
    "/api/store/:tenantId/products/:productId",
    domainValidationMiddleware,
    storefrontRoutes.getStorefrontProduct,
  );
  app.post(
    "/api/store/:tenantId/orders",
    domainValidationMiddleware,
    storefrontRoutes.createOrder,
  );
  app.get(
    "/api/store/:tenantId/orders/:orderId",
    domainValidationMiddleware,
    storefrontRoutes.getOrder,
  );
  app.get(
    "/api/store/:tenantId/track/:orderNumber",
    domainValidationMiddleware,
    storefrontRoutes.trackOrder,
  );
  app.post(
    "/api/store/:tenantId/validate-discount",
    domainValidationMiddleware,
    storefrontRoutes.validateDiscount,
  );
  app.get(
    "/api/store/:tenantId/config",
    domainValidationMiddleware,
    storefrontRoutes.getStorefrontConfig,
  );

  app.get(
    "/api/store/:tenantId/sitemap.xml",
    domainValidationMiddleware,
    storefrontRoutes.getSitemap,
  );
  app.get(
    "/api/store/:tenantId/robots.txt",
    domainValidationMiddleware,
    storefrontRoutes.getRobots,
  );

  // Public content: pages and blog
  app.get("/api/store/:tenantId/pages", domainValidationMiddleware, storefrontRoutes.getPagesPublic);
  app.get("/api/store/:tenantId/pages/:slug", domainValidationMiddleware, storefrontRoutes.getPageBySlug);
  app.get("/api/store/:tenantId/blog", domainValidationMiddleware, storefrontRoutes.getBlogPublic);
  app.get("/api/store/:tenantId/blog/:slug", domainValidationMiddleware, storefrontRoutes.getBlogBySlug);

  // Public content: contact us and payment info
  app.get("/api/store/:tenantId/contact-us", domainValidationMiddleware, storefrontRoutes.getContactUsPublic);
  app.get("/api/store/:tenantId/payment-info", domainValidationMiddleware, storefrontRoutes.getPaymentInfoPublic);

  // Global error handler middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("Unhandled error:", err);

    // Handle JWT-related errors
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      res.status(401).json({
        error: "Invalid token. Please log in again.",
        code: "INVALID_TOKEN",
      });
      return;
    }

    // Handle multer file upload errors
    if (err.name === "MulterError") {
      const statusCode = err.code === "FILE_TOO_LARGE" ? 413 : 400;
      res.status(statusCode).json({
        error: err.message || "File upload error",
      });
      return;
    }

    // Handle validation errors
    if (err.message && err.message.includes("validation")) {
      res.status(400).json({
        error: err.message,
      });
      return;
    }

    // Default error response
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      error: err.message || "Internal server error",
    });
  });

  return app;
}

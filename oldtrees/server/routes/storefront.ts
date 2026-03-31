import { RequestHandler } from "express";
import { query } from "../db";
import {
  generateOrderId,
  generateOrderNumber,
  generateCustomerId,
  generateTransactionId,
} from "../auth";
import { v4 as uuidv4 } from "uuid";
export const getStorefrontProducts: RequestHandler = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { category, q, page = "1", limit = "10" } = req.query;

    const currentPage = Math.max(1, parseInt(page as string, 10) || 1);
    const pageLimit = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10));
    const offset = (currentPage - 1) * pageLimit;

    let baseSql = "SELECT * FROM products WHERE tenant_id = ? AND is_active = TRUE";
    let countSql = "SELECT COUNT(*) as total FROM products WHERE tenant_id = ? AND is_active = TRUE";
    const params: any[] = [tenantId];
    const countParams: any[] = [tenantId];

    if (category) {
      baseSql += " AND category = ?";
      countSql += " AND category = ?";
      params.push(category);
      countParams.push(category);
    }

    if (q) {
      baseSql += " AND (name LIKE ? OR description LIKE ? OR sku LIKE ?)";
      countSql += " AND (name LIKE ? OR description LIKE ? OR sku LIKE ?)";
      const like = `%${q}%`;
      params.push(like, like, like);
      countParams.push(like, like, like);
    }

    baseSql += ` ORDER BY created_at DESC LIMIT ${pageLimit} OFFSET ${offset}`;

    try {
      const products = await query(baseSql, params);
      const countResult = await query(countSql, countParams);
      const total = Array.isArray(countResult) && countResult.length > 0 ? (countResult[0] as any).total : 0;

      res.json({
        success: true,
        data: Array.isArray(products) ? products : [],
        pagination: {
          total,
          page: currentPage,
          limit: pageLimit,
          pages: Math.ceil(total / pageLimit)
        }
      });
      return;
    } catch (err: any) {
      console.warn('Products query failed, attempting fallback query...', err?.code || err?.message);
      let fallbackSql = "SELECT * FROM products WHERE tenant_id = ?";
      let countFallbackSql = "SELECT COUNT(*) as total FROM products WHERE tenant_id = ?";
      const fbParams: any[] = [tenantId];
      const fbCountParams: any[] = [tenantId];

      if (category) {
        fallbackSql += " AND category = ?";
        countFallbackSql += " AND category = ?";
        fbParams.push(category);
        fbCountParams.push(category);
      }
      if (q) {
        fallbackSql += " AND (name LIKE ? OR description LIKE ?)";
        countFallbackSql += " AND (name LIKE ? OR description LIKE ?)";
        const like = `%${q}%`;
        fbParams.push(like, like);
        fbCountParams.push(like, like);
      }
      fallbackSql += ` ORDER BY created_at DESC LIMIT ${pageLimit} OFFSET ${offset}`;

      const products = await query(fallbackSql, fbParams);
      const countResult = await query(countFallbackSql, fbCountParams);
      const total = Array.isArray(countResult) && countResult.length > 0 ? (countResult[0] as any).total : 0;

      res.json({
        success: true,
        data: Array.isArray(products) ? products : [],
        pagination: {
          total,
          page: currentPage,
          limit: pageLimit,
          pages: Math.ceil(total / pageLimit)
        }
      });
      return;
    }
  } catch (error) {
    console.error("Get storefront products error:", error);
    res.json({ success: true, data: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } });
  }
};

export const createOrder: RequestHandler = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const {
      customerEmail,
      customerName,
      customerPhone,
      items,
      shippingAddress,
      discountCode,
      sendEmail = true,
    } = req.body;

    if (!customerEmail || !items || items.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // =========================================================
    // 🔥 PLAN VALIDATION START (Orders)
    // =========================================================
    const tenantResult: any = await query(
      "SELECT billing_plan FROM tenants WHERE id = ?",
      [tenantId]
    );
    const billingPlan = tenantResult?.[0]?.billing_plan;

    if (!billingPlan) {
      return res.status(400).json({ error: "No billing plan assigned" });
    }

    const pricingResult: any = await query(
      "SELECT * FROM pricing WHERE name = ? AND is_active = 1",
      [billingPlan]
    );

    const plan = pricingResult?.[0];

    if (!plan) {
      return res.status(400).json({ error: "Invalid billing plan" });
    }

    let features: string[] = [];
    try {
      features =
        typeof plan.features === "string" ? JSON.parse(plan.features) : plan.features;
    } catch (err) {
      console.error("Feature parse error:", err);
      features = [];
    }

    let orderLimit = Infinity;
    const orderFeature = features.find((f: string) =>
      f.toLowerCase().includes("order")
    );

    if (orderFeature) {
      if (orderFeature.toLowerCase().includes("unlimited")) {
        orderLimit = Infinity;
      } else {
        const match = orderFeature.match(/\d+/);
        if (match) {
          orderLimit = parseInt(match[0], 10);
        }
      }
    }

    const countResult: any = await query(
      "SELECT COUNT(*) as count FROM orders WHERE tenant_id = ?",
      [tenantId]
    );

    const currentCount = countResult?.[0]?.count || 0;
    if (currentCount >= orderLimit) {
      return res.status(400).json({
        error: `Order limit reached (${orderLimit}). Please upgrade your plan.`,
      });
    }
    // =========================================================
    // 🔥 PLAN VALIDATION END
    // =========================================================

    // Fetch tenant minimum order amount if set
    let minOrder = 0;
    try {
      const tenants = await query(
        "SELECT min_order_amount FROM tenants WHERE id = ?",
        [tenantId]
      );
      if (Array.isArray(tenants) && tenants.length > 0) {
        minOrder = (tenants[0] as any).min_order_amount || 0;
      }
    } catch (err) {
      // ignore if column not present
    }

    const orderId = generateOrderId();
    const orderNumber = generateOrderNumber();
    const customerId = generateCustomerId();

    let totalAmount = 0;
    let discountAmount = 0;

    // Fetch all products for order
    const productIds = items.map(item => item.productId);
    const products = await query(
      `SELECT id, price, name, stock_quantity FROM products 
       WHERE id IN (${productIds.map(() => '?').join(',')}) AND tenant_id = ?`,
      [...productIds, tenantId]
    );

    const productMap = new Map<string, any>();
    if (Array.isArray(products)) {
      (products as any[]).forEach(p => productMap.set(p.id, p));
    }

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return res.status(400).json({ error: `Product ${item.productId} not found` });
      }
      totalAmount += product.price * item.quantity;
    }

    // Apply discount
    if (discountCode) {
      const discounts = await query(
        `SELECT discount_value, discount_type, min_order_amount FROM discounts
         WHERE code = ? AND tenant_id = ? AND is_active = TRUE
         AND (valid_from IS NULL OR valid_from <= NOW())
         AND (valid_until IS NULL OR valid_until >= NOW())
         AND (max_uses IS NULL OR used_count < max_uses)`,
        [discountCode, tenantId]
      );

      if (Array.isArray(discounts) && discounts.length > 0) {
        const discount = discounts[0] as any;
        if (discount.min_order_amount && totalAmount < discount.min_order_amount) {
          return res.status(400).json({
            error: `This discount requires a minimum order of ₹${discount.min_order_amount}`,
          });
        }
        discountAmount =
          discount.discount_type === "percentage"
            ? (totalAmount * discount.discount_value) / 100
            : discount.discount_value;
      } else {
        return res.status(400).json({ error: "Invalid or expired discount code" });
      }
    }

    const finalAmount = totalAmount - discountAmount;
    if (minOrder && finalAmount < minOrder) {
      return res.status(400).json({
        error: `Minimum order amount is ₹${minOrder}. Add more items to continue.`,
      });
    }

    // Create or update customer
    let customerId_existing = null;
    const existingCustomers = await query(
      "SELECT id FROM customers WHERE tenant_id = ? AND email = ?",
      [tenantId, customerEmail]
    );

    if (Array.isArray(existingCustomers) && existingCustomers.length > 0) {
      customerId_existing = (existingCustomers[0] as any).id;
      await query(
        "UPDATE customers SET total_orders = total_orders + 1, total_spent = total_spent + ? WHERE id = ?",
        [finalAmount, customerId_existing]
      );
    } else {
      await query(
        `INSERT INTO customers (id, tenant_id, email, first_name, total_orders, total_spent)
         VALUES (?, ?, ?, ?, 1, ?)`,
        [customerId, tenantId, customerEmail, customerName, finalAmount]
      );
      customerId_existing = customerId;
    }

    // Insert order
    await query(
      `INSERT INTO orders (id, tenant_id, order_number, customer_email, customer_name, customer_phone, total_amount, discount_amount, shipping_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        tenantId,
        orderNumber,
        customerEmail,
        customerName,
        customerPhone,
        finalAmount,
        discountAmount,
        JSON.stringify(shippingAddress),
      ]
    );

    // Insert order items & update stock
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (product) {
        const itemId = uuidv4();
        const itemTotal = product.price * item.quantity;

        await query(
          `INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price, total_price)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [itemId, orderId, item.productId, product.name, item.quantity, product.price, itemTotal]
        );

        // Update stock
        const newStock = Math.max(0, (product.stock_quantity || 0) - item.quantity);
        await query("UPDATE products SET stock_quantity = ? WHERE id = ?", [newStock, item.productId]);
      }
    }

    // Fetch order & items
    const newOrder = await query("SELECT * FROM orders WHERE id = ?", [orderId]);
    const orderItems = await query("SELECT * FROM order_items WHERE order_id = ?", [orderId]);

    // Send email if opted
    try {
      if (sendEmail) {
        const emailSettings = await query("SELECT * FROM email_settings WHERE tenant_id = ?", [tenantId]);
        if (Array.isArray(emailSettings) && emailSettings.length > 0) {
          const settings = emailSettings[0] as any;
          const { sendOrderNotificationEmail } = await import("../utils/email");

          const orderForEmail = Array.isArray(newOrder) && newOrder.length > 0 ? newOrder[0] : null;
          if (orderForEmail) {
            await sendOrderNotificationEmail(settings, {
              orderId: orderForEmail.id,
              orderNumber: orderForEmail.order_number,
              customerName: orderForEmail.customer_name,
              customerEmail: orderForEmail.customer_email,
              customerPhone: orderForEmail.customer_phone,
              items: Array.isArray(orderItems) ? orderItems.map((item: any) => ({
                product_name: item.product_name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price,
              })) : [],
              subtotal: totalAmount,
              discount: discountAmount,
              tax: 0,
              total: finalAmount,
              status: orderForEmail.status || "pending",
              paymentStatus: orderForEmail.payment_status || "pending",
              paymentMethod: orderForEmail.payment_method,
              shippingAddress: orderForEmail.shipping_address,
            });
          }
        }
      }
    } catch (emailError) {
      console.error("Error sending order notification email:", emailError);
    }

    // ✅ Return response
    res.json({
      success: true,
      data: {
        ...(Array.isArray(newOrder) && newOrder.length > 0 ? newOrder[0] : null),
        orderNumber,
        items: Array.isArray(orderItems) ? orderItems : [],
      },
      emailSent: sendEmail,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
};

export const getStorefrontProduct: RequestHandler = async (req, res) => {
  try {
    const { tenantId, productId } = req.params;

    const products = await query(
      "SELECT * FROM products WHERE id = ? AND tenant_id = ? AND is_active = TRUE",
      [productId, tenantId],
    );

    if (!Array.isArray(products) || products.length === 0) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.json({
      success: true,
      data: products[0],
    });
  } catch (error) {
    console.error("Get storefront product error:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
};



export const getOrder: RequestHandler = async (req, res) => {
  try {
    const { tenantId, orderId } = req.params;

    const orders = await query(
      "SELECT * FROM orders WHERE id = ? AND tenant_id = ?",
      [orderId, tenantId],
    );

    if (!Array.isArray(orders) || orders.length === 0) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const order = orders[0] as any;

    const items = await query("SELECT * FROM order_items WHERE order_id = ?", [
      orderId,
    ]);

    res.json({
      success: true,
      data: {
        ...order,
        items: Array.isArray(items) ? items : [],
      },
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
};

export const trackOrder: RequestHandler = async (req, res) => {
  try {
    const { tenantId, orderNumber } = req.params;

    const orders = await query(
      "SELECT * FROM orders WHERE order_number = ? AND tenant_id = ?",
      [orderNumber, tenantId],
    );

    if (!Array.isArray(orders) || orders.length === 0) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const order = orders[0] as any;

    const items = await query("SELECT * FROM order_items WHERE order_id = ?", [
      order.id,
    ]);

    res.json({
      success: true,
      data: {
        ...order,
        items: Array.isArray(items) ? items : [],
      },
    });
  } catch (error) {
    console.error("Track order error:", error);
    res.status(500).json({ error: "Failed to track order" });
  }
};

export const validateDiscount: RequestHandler = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { code, orderAmount } = req.body;

    if (!code) {
      res.status(400).json({ error: "Discount code required" });
      return;
    }

    const discounts = await query(
      `SELECT * FROM discounts
       WHERE code = ? AND tenant_id = ? AND is_active = TRUE
       AND (valid_from IS NULL OR valid_from <= NOW())
       AND (valid_until IS NULL OR valid_until >= NOW())
       AND (max_uses IS NULL OR used_count < max_uses)`,
      [code, tenantId],
    );

    if (!Array.isArray(discounts) || discounts.length === 0) {
      res.status(404).json({ error: "Invalid or expired discount code" });
      return;
    }

    const discount = discounts[0] as any;

    if (discount.min_order_amount && orderAmount < discount.min_order_amount) {
      res.status(400).json({
        error: `Minimum order amount of ₹${discount.min_order_amount} required`,
      });
      return;
    }

    let discountAmount = 0;
    if (discount.discount_type === "percentage") {
      discountAmount = (orderAmount * discount.discount_value) / 100;
    } else {
      discountAmount = discount.discount_value;
    }

    res.json({
      success: true,
      data: {
        code,
        discountAmount,
        discountValue: discount.discount_value,
        discountType: discount.discount_type,
      },
    });
  } catch (error) {
    console.error("Validate discount error:", error);
    res.status(500).json({ error: "Failed to validate discount" });
  }
};

export const getStorefrontConfig: RequestHandler = async (req, res) => {
  try {
    const { tenantId } = req.params;

    try {
      // Optimized: Fetch tenant config and theme in parallel with better structure
      const [tenantResults, themeResults, heroResults] = await Promise.all([
        query(
          `SELECT current_theme_id, company_name, logo_url, seo_title, seo_description,
                  seo_keywords, gtag_id, search_console_meta, min_order_amount, favicon_url,
                  announcement_message, youtube_url, instagram_url, facebook_url FROM tenants WHERE id = ?`,
          [tenantId]
        ),
        query(
          `SELECT t.id, t.name, t.primary_color, t.secondary_color, t.font_family
           FROM themes t
           JOIN tenant_themes tt ON t.id = tt.theme_id
           WHERE tt.tenant_id = ? AND tt.is_active = TRUE
           LIMIT 1`,
          [tenantId]
        ),
        query(
          `SELECT id, image_url, title, subtitle, cta_text, cta_url, sort_order
           FROM hero_sliders WHERE tenant_id = ? AND is_active = TRUE
           ORDER BY sort_order`,
          [tenantId]
        ),
      ]);

      const tenantData = Array.isArray(tenantResults) && tenantResults.length > 0 ? (tenantResults[0] as any) : null;
      const themeData = Array.isArray(themeResults) && themeResults.length > 0 ? (themeResults[0] as any) : null;
      const heroSliders = Array.isArray(heroResults) ? heroResults : [];

      if (!tenantData) {
        res.json({
          success: true,
          data: { template: "theme-b" },
        });
        return;
      }

      // Build theme object
      const theme: any = {
        companyName: tenantData.company_name || undefined,
        logo: tenantData.logo_url || undefined,
      };

      if (themeData) {
        theme.themeId = themeData.id;
        theme.themeName = themeData.name;
        theme.primaryColor = themeData.primary_color;
        theme.secondaryColor = themeData.secondary_color;
        theme.fontFamily = themeData.font_family;
      }

      // Build SEO object
      const seo = {
        title: tenantData.seo_title || undefined,
        description: tenantData.seo_description || undefined,
        keywords: tenantData.seo_keywords || undefined,
        gtagId: tenantData.gtag_id || undefined,
        searchConsoleMeta: tenantData.search_console_meta || undefined,
        faviconUrl: tenantData.favicon_url || undefined,
        minOrderAmount: tenantData.min_order_amount != null ? tenantData.min_order_amount : 0,
      };

      const business = {
        youtubeUrl: tenantData.youtube_url || undefined,
        instagramUrl: tenantData.instagram_url || undefined,
        facebookUrl: tenantData.facebook_url || undefined,
      };

      res.json({
        success: true,
        data: {
          template: tenantData.current_theme_id || "theme-b",
          theme,
          seo,
          heroSliders,
          announcementMessage: tenantData.announcement_message || undefined,
          business,
        },
      });
    } catch (err: any) {
      if (err.code === "ER_BAD_FIELD_ERROR") {
        res.json({
          success: true,
          data: { template: "theme-b" },
        });
        return;
      }
      throw err;
    }
  } catch (error) {
    console.error("Get storefront config error:", error);
    res.json({
      success: true,
      data: { template: "theme-b" },
    });
  }
};

// Sitemap for tenant - returns XML
export const getSitemap: RequestHandler = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const products = await query("SELECT id, updated_at FROM products WHERE tenant_id = ? AND is_active = TRUE", [tenantId]);

    const baseUrl = (req.protocol || 'https') + '://' + (req.get('host') || '');
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Homepage
    xml += `  <url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;

    if (Array.isArray(products)) {
      for (const p of products as any[]) {
        const loc = `${baseUrl}/product/${p.id}`;
        const lastmod = p.updated_at ? new Date(p.updated_at).toISOString() : new Date().toISOString();
        xml += `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
      }
    }

    // Include categories if available
    try {
      const cats = await query("SELECT slug FROM categories WHERE tenant_id = ?", [tenantId]);
      if (Array.isArray(cats)) {
        for (const c of cats as any[]) {
          if (c.slug) {
            const loc = `${baseUrl}/category/${c.slug}`;
            xml += `  <url><loc>${loc}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>\n`;
          }
        }
      }
    } catch (err) {
      // ignore
    }

    xml += '</urlset>';
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    console.error('Sitemap error:', err);
    res.status(500).send('Failed to generate sitemap');
  }
};

export const getRobots: RequestHandler = async (req, res) => {
  try {
    const host = (req.protocol || 'https') + '://' + (req.get('host') || '');
    const sitemapUrl = `${host}/api/store/${req.params.tenantId}/sitemap.xml`;
    const txt = `User-agent: *\nAllow: /\nSitemap: ${sitemapUrl}\n`;
    res.header('Content-Type', 'text/plain');
    res.send(txt);
  } catch (err) {
    console.error('Robots error:', err);
    res.status(500).send('Failed to generate robots');
  }
};

// Public Pages & Blog
export const getPagesPublic: RequestHandler = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { page = "1", limit = "10" } = req.query;

    const currentPage = Math.max(1, parseInt(page as string, 10) || 1);
    const pageLimit = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10));
    const offset = (currentPage - 1) * pageLimit;

    try {
      const rows = await query(
        `SELECT id, title, slug, description, featured_image_url, publish_date FROM pages WHERE tenant_id = ? AND is_published = TRUE ORDER BY publish_date DESC, created_at DESC LIMIT ${pageLimit} OFFSET ${offset}`,
        [tenantId]
      );
      const countResult = await query(
        "SELECT COUNT(*) as total FROM pages WHERE tenant_id = ? AND is_published = TRUE",
        [tenantId]
      );
      const total = Array.isArray(countResult) && countResult.length > 0 ? (countResult[0] as any).total : 0;

      res.json({
        success: true,
        data: Array.isArray(rows) ? rows : [],
        pagination: {
          total,
          page: currentPage,
          limit: pageLimit,
          pages: Math.ceil(total / pageLimit)
        }
      });
      return;
    } catch (err: any) {
      console.warn('Pages query failed, attempting fallback query...', err?.code || err?.message);
      const rows = await query(
        `SELECT id, title, slug, description, featured_image_url, created_at as publish_date FROM pages WHERE tenant_id = ? AND is_published = TRUE ORDER BY created_at DESC LIMIT ${pageLimit} OFFSET ${offset}`,
        [tenantId]
      );
      const countResult = await query(
        "SELECT COUNT(*) as total FROM pages WHERE tenant_id = ? AND is_published = TRUE",
        [tenantId]
      );
      const total = Array.isArray(countResult) && countResult.length > 0 ? (countResult[0] as any).total : 0;

      res.json({
        success: true,
        data: Array.isArray(rows) ? rows : [],
        pagination: {
          total,
          page: currentPage,
          limit: pageLimit,
          pages: Math.ceil(total / pageLimit)
        }
      });
      return;
    }
  } catch (err) {
    console.error('Get pages public error:', err);
    res.json({ success: true, data: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } });
  }
};

export const getPageBySlug: RequestHandler = async (req, res) => {
  try {
    const { tenantId, slug } = req.params;
    try {
      const rows = await query("SELECT * FROM pages WHERE tenant_id = ? AND slug = ? AND is_published = TRUE LIMIT 1", [tenantId, slug]);
      if (!Array.isArray(rows) || rows.length === 0) { res.status(404).json({ error: 'Page not found' }); return; }
      res.json({ success: true, data: rows[0] });
      return;
    } catch (err: any) {
      console.warn('Page-by-slug query failed, attempting fallback...', err?.code || err?.message);
      const rows = await query("SELECT * FROM pages WHERE tenant_id = ? AND slug = ? LIMIT 1", [tenantId, slug]);
      if (!Array.isArray(rows) || rows.length === 0) { res.status(404).json({ error: 'Page not found' }); return; }
      res.json({ success: true, data: rows[0] });
      return;
    }
  } catch (err) {
    console.error('Get page by slug error:', err);
    res.status(404).json({ error: 'Page not found' });
  }
};

export const getBlogPublic: RequestHandler = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { page = "1", limit = "10" } = req.query;

    const currentPage = Math.max(1, parseInt(page as string, 10) || 1);
    const pageLimit = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10));
    const offset = (currentPage - 1) * pageLimit;

    let rows;
    let countResult;

    try {
      rows = await query(
        `SELECT id, title, slug, excerpt, featured_image_url, category, tags, publish_date FROM blog_posts WHERE tenant_id = ? AND is_published = TRUE ORDER BY publish_date DESC, created_at DESC LIMIT ${pageLimit} OFFSET ${offset}`,
        [tenantId]
      );
      countResult = await query(
        "SELECT COUNT(*) as total FROM blog_posts WHERE tenant_id = ? AND is_published = TRUE",
        [tenantId]
      );
    } catch (err: any) {
      console.warn('Published blog query failed, attempting fallback query...', err?.code || err?.message);
      rows = await query(
        `SELECT id, title, slug, excerpt, featured_image_url, category, tags, COALESCE(publish_date, created_at) as publish_date FROM blog_posts WHERE tenant_id = ? AND is_published = TRUE ORDER BY COALESCE(publish_date, created_at) DESC LIMIT ${pageLimit} OFFSET ${offset}`,
        [tenantId]
      );
      countResult = await query(
        "SELECT COUNT(*) as total FROM blog_posts WHERE tenant_id = ? AND is_published = TRUE",
        [tenantId]
      );
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      rows = await query(
        `SELECT id, title, slug, excerpt, featured_image_url, category, tags, COALESCE(publish_date, created_at) as publish_date FROM blog_posts WHERE tenant_id = ? ORDER BY COALESCE(publish_date, created_at) DESC LIMIT ${pageLimit} OFFSET ${offset}`,
        [tenantId]
      );
      if (!countResult) {
        countResult = await query(
          "SELECT COUNT(*) as total FROM blog_posts WHERE tenant_id = ?",
          [tenantId]
        );
      }
    }

    const total = Array.isArray(countResult) && countResult.length > 0 ? (countResult[0] as any).total : 0;

    res.json({
      success: true,
      data: Array.isArray(rows) ? rows : [],
      pagination: {
        total,
        page: currentPage,
        limit: pageLimit,
        pages: Math.ceil(total / pageLimit)
      }
    });
  } catch (err) {
    console.error('Get blog public error:', err);
    res.json({ success: true, data: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } });
  }
};

export const getBlogBySlug: RequestHandler = async (req, res) => {
  try {
    const { tenantId, slug } = req.params;
    if (!slug) {
      res.json({ success: false, data: null, error: 'Slug is required' });
      return;
    }

    try {
      const rows = await query("SELECT * FROM blog_posts WHERE tenant_id = ? AND slug = ? AND is_published = TRUE LIMIT 1", [tenantId, slug]);
      if (Array.isArray(rows) && rows.length > 0) {
        try { await query("UPDATE blog_posts SET views_count = views_count + 1 WHERE id = ?", [(rows[0] as any).id]); } catch {}
        res.json({ success: true, data: rows[0] });
        return;
      }

      // Try fallback without is_published filter
      const fallbackRows = await query("SELECT * FROM blog_posts WHERE tenant_id = ? AND slug = ? LIMIT 1", [tenantId, slug]);
      if (Array.isArray(fallbackRows) && fallbackRows.length > 0) {
        try { await query("UPDATE blog_posts SET views_count = views_count + 1 WHERE id = ?", [(fallbackRows[0] as any).id]); } catch {}
        res.json({ success: true, data: fallbackRows[0] });
        return;
      }

      res.json({ success: false, data: null, error: 'Post not found' });
      return;
    } catch (err: any) {
      console.warn('Blog-by-slug query failed:', err?.code || err?.message);
      res.json({ success: false, data: null, error: 'Failed to fetch blog post' });
      return;
    }
  } catch (err) {
    console.error('Get blog by slug error:', err);
    res.json({ success: false, data: null, error: 'Internal server error' });
  }
};

// Public endpoints for Contact Us and Payment Info
export const getContactUsPublic: RequestHandler = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const result = await query(
      "SELECT email, phone, address, working_hours, map_code FROM contact_us WHERE tenant_id = ?",
      [tenantId]
    );

    const data = Array.isArray(result) && result.length > 0 ? result[0] : null;
    if (data && data.working_hours) {
      try {
        data.working_hours = JSON.parse(data.working_hours);
      } catch (e) {}
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error("Get contact us public error:", error);
    res.json({ success: true, data: null });
  }
};

export const getPaymentInfoPublic: RequestHandler = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const result = await query(
      "SELECT id, bank_account_name, bank_account_number, bank_name, ifsc_code, branch, gpay_name, gpay_number, upi_name, upi_id, upi_image_url FROM payment_info WHERE tenant_id = ?",
      [tenantId]
    );

    let data = Array.isArray(result) && result.length > 0 ? result[0] : null;

    // Fetch multiple images if payment info exists
    if (data) {
      const images = await query(
        "SELECT id, image_url, image_type, display_order FROM payment_images WHERE payment_info_id = ? ORDER BY display_order ASC",
        [(data as any).id]
      );
      (data as any).images = Array.isArray(images) ? images : [];
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error("Get payment info public error:", error);
    res.json({ success: true, data: null });
  }
};

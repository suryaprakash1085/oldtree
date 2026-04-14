import { RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import { query } from "../db";
import {
  generateProductId,
  generateDiscountId,
  generateCustomerId,
  generateSKU,
} from "../auth";

// Products
export const getProducts: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      res.status(401).json({ error: "Unauthorized: No tenant ID found in token" });
      return;
    }

    const { page = "1", limit = "10" } = req.query as any;
    const currentPage = Math.max(1, parseInt(page as string, 10) || 1);
    const pageLimit = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10));
    const offset = (currentPage - 1) * pageLimit;

    const items = await query(
      `SELECT * FROM products WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ${pageLimit} OFFSET ${offset}`,
      [tenantId],
    );
    const countRows = await query(
      "SELECT COUNT(*) as total FROM products WHERE tenant_id = ?",
      [tenantId]
    );
    const total = Array.isArray(countRows) && countRows.length > 0 ? (countRows[0] as any).total : 0;

    res.json({
      success: true,
      data: Array.isArray(items) ? items : [],
      pagination: { total, page: currentPage, limit: pageLimit, pages: Math.ceil(total / pageLimit) }
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

// Categories - support dedicated categories table with fallback to product categories
export const getCategories: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      res.status(401).json({ error: "Unauthorized: No tenant ID found in token" });
      return;
    }

    // Try to read from categories table if present
    try {
      const rows: any = await query("SELECT id, name, slug, description FROM categories WHERE tenant_id = ? ORDER BY name", [tenantId]);
      if (Array.isArray(rows) && rows.length > 0) {
        res.json({ success: true, data: rows });
        return;
      }
    } catch (e) {
      // ignore - fallback to product categories
    }

    // Fallback: distinct category strings from products
    const categories = await query(
      "SELECT DISTINCT IFNULL(category, '') AS category FROM products WHERE tenant_id = ? ORDER BY category",
      [tenantId]
    );

    const list = Array.isArray(categories) ? (categories as any[]).map((r) => r.category).filter(Boolean).map((c) => ({ id: c, name: c, slug: c.toLowerCase().replace(/\s+/g,'-') })) : [];

    res.json({ success: true, data: list });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

export const createCategory: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    let { name, slug, description } = req.body;

    // =========================================================
    // ✅ 1. Validate & sanitize input
    // =========================================================
    if (!name || !slug) {
      return res.status(400).json({
        error: "Name and slug are required",
      });
    }

    const cleanName = String(name).trim();
    const cleanSlug = String(slug).trim().toLowerCase();
    const cleanDescription = description
      ? String(description).trim()
      : null;

    if (!cleanName || !cleanSlug) {
      return res.status(400).json({
        error: "Invalid name or slug",
      });
    }

    // =========================================================
    // 🔥 PLAN VALIDATION START (Categories)
    // =========================================================

    // 2. Get tenant plan
    const tenantResult: any = await query(
      "SELECT billing_plan FROM tenants WHERE id = ?",
      [tenantId]
    );

    const billingPlan = tenantResult?.[0]?.billing_plan;

    if (!billingPlan) {
      return res.status(400).json({
        error: "No billing plan assigned",
      });
    }

    // 3. Get pricing plan
    const pricingResult: any = await query(
      "SELECT * FROM pricing WHERE name = ? AND is_active = 1",
      [billingPlan]
    );

    const plan = pricingResult?.[0];

    if (!plan) {
      return res.status(400).json({
        error: "Invalid or inactive billing plan",
      });
    }

    // 4. Parse features safely
    let features: string[] = [];

    try {
      features =
        typeof plan.features === "string"
          ? JSON.parse(plan.features)
          : plan.features;
    } catch (err) {
      console.error("Feature parse error:", err);
      features = [];
    }

    // 5. Find category feature (STRICT)
    const categoryFeature = features.find((f: string) =>
      /\bcategories?\b/i.test(f)
    );

    // ❌ If NO category feature → BLOCK
    if (!categoryFeature) {
      return res.status(403).json({
        error:
          "Your current plan does not support categories. Please upgrade your plan.",
      });
    }

    // 6. Extract category limit
    let categoryLimit = Infinity;

    if (categoryFeature.toLowerCase().includes("unlimited")) {
      categoryLimit = Infinity;
    } else {
      const match = categoryFeature.match(/\d+/);

      if (match) {
        categoryLimit = parseInt(match[0], 10);
      } else {
        categoryLimit = 0; // safest fallback
      }
    }

    // 7. Count existing categories
    const countResult: any = await query(
      "SELECT COUNT(*) as count FROM categories WHERE tenant_id = ?",
      [tenantId]
    );

    const currentCount = countResult?.[0]?.count || 0;

    // 8. Check limit
    if (currentCount >= categoryLimit) {
      return res.status(400).json({
        error: `You can only create up to ${categoryLimit} categories on your current plan`,
      });
    }

    // =========================================================
    // 🔥 PLAN VALIDATION END
    // =========================================================

    // =========================================================
    // 🔒 9. Check slug uniqueness
    // =========================================================
    const existingSlug: any = await query(
      "SELECT id FROM categories WHERE tenant_id = ? AND slug = ?",
      [tenantId, cleanSlug]
    );

    if (existingSlug.length > 0) {
      return res.status(400).json({
        error: "Category slug already exists",
      });
    }

    // =========================================================
    // ✅ 10. Create category
    // =========================================================
    const id = uuidv4();

    await query(
      `INSERT INTO categories 
      (id, tenant_id, name, slug, description)
      VALUES (?, ?, ?, ?, ?)`,
      [id, tenantId, cleanName, cleanSlug, cleanDescription]
    );

    // =========================================================
    // ✅ 11. Fetch created category
    // =========================================================
    const newRow: any = await query(
      "SELECT id, name, slug, description FROM categories WHERE id = ?",
      [id]
    );

    return res.json({
      success: true,
      data: Array.isArray(newRow) ? newRow[0] : null,
    });
  } catch (error) {
    console.error("Create category error:", error);
    return res.status(500).json({
      error: "Failed to create category",
    });
  }
};

export const updateCategory: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { categoryId } = req.params;
    const { name, slug, description } = req.body;

    await query(
      `UPDATE categories SET name = ?, slug = ?, description = ? WHERE id = ? AND tenant_id = ?`,
      [name, slug, description || null, categoryId, tenantId]
    );

    const updated = await query("SELECT id, name, slug, description FROM categories WHERE id = ?", [categoryId]);
    res.json({ success: true, data: Array.isArray(updated) ? updated[0] : null });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

export const deleteCategory: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { categoryId } = req.params;

    await query("DELETE FROM categories WHERE id = ? AND tenant_id = ?", [categoryId, tenantId]);
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};

export const createProduct: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;

    const {
      name,
      description,
      sku,
      price,
      costPrice,
      category,
      stockQuantity,
      imageUrl,
    } = req.body;

    // ✅ 1. Validate name
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Product name is required" });
    }

    // ✅ 2. Validate price
    const numPrice =
      typeof price === "string" ? parseFloat(price) : price;

    if (
      numPrice === undefined ||
      numPrice === null ||
      isNaN(numPrice) ||
      numPrice < 0
    ) {
      return res.status(400).json({
        error: "Valid product price is required",
      });
    }

    // =========================================================
    // 🔥 PLAN VALIDATION START
    // =========================================================

    // 3. Get tenant billing plan
    const tenantResult: any = await query(
      "SELECT billing_plan FROM tenants WHERE id = ?",
      [tenantId]
    );

    const billingPlan = tenantResult?.[0]?.billing_plan;

    if (!billingPlan) {
      return res.status(400).json({
        error: "No billing plan assigned to tenant",
      });
    }

    // 4. Get pricing details
    const pricingResult: any = await query(
      "SELECT * FROM pricing WHERE name = ? AND is_active = 1",
      [billingPlan]
    );

    const plan = pricingResult?.[0];

    if (!plan) {
      return res.status(400).json({
        error: "Invalid or inactive billing plan",
      });
    }

    // 5. Parse features safely
    let features: string[] = [];

    try {
      features =
        typeof plan.features === "string"
          ? JSON.parse(plan.features)
          : plan.features;
    } catch (err) {
      console.error("Feature parse error:", err);
      features = [];
    }

    // 6. Find product feature
    const productFeature = features.find((f: string) =>
      /\bproduct(s)?\b/i.test(f) // ✅ strict match
    );

    // ❌ If NO product feature → BLOCK
    if (!productFeature) {
      return res.status(403).json({
        error:
          "Your current plan does not support products. Please upgrade your plan.",
      });
    }

    // 7. Extract product limit
    let productLimit = Infinity;

    if (productFeature.toLowerCase().includes("unlimited")) {
      productLimit = Infinity;
    } else {
      const match = productFeature.match(/\d+/);

      if (match) {
        productLimit = parseInt(match[0], 10);
      } else {
        // ⚠️ Invalid format → safest fallback
        productLimit = 0;
      }
    }

    // 8. Count current products
    const countResult: any = await query(
      "SELECT COUNT(*) as count FROM products WHERE tenant_id = ?",
      [tenantId]
    );

    const currentCount = countResult?.[0]?.count || 0;

    // 9. Check limit
    if (currentCount >= productLimit) {
      return res.status(400).json({
        error: `Product limit reached (${productLimit}). Please upgrade your plan.`,
      });
    }

    // =========================================================
    // 🔥 PLAN VALIDATION END
    // =========================================================

    // ✅ 10. Create product
    const id = generateProductId();
    const finalSku = sku || generateSKU();

    const numStockQuantity =
      stockQuantity !== undefined && stockQuantity !== null
        ? parseInt(String(stockQuantity), 10) || 0
        : 0;

    const numCostPrice =
      costPrice !== undefined && costPrice !== null
        ? parseFloat(String(costPrice))
        : null;

    await query(
      `INSERT INTO products 
      (id, tenant_id, name, description, sku, price, cost_price, category, stock_quantity, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        tenantId,
        name.trim(),
        description || null,
        finalSku,
        numPrice,
        numCostPrice,
        category || null,
        numStockQuantity,
        imageUrl || null,
      ]
    );

    // ✅ 11. Fetch created product
    const newProduct: any = await query(
      "SELECT * FROM products WHERE id = ?",
      [id]
    );

    return res.json({
      success: true,
      data: Array.isArray(newProduct) ? newProduct[0] : null,
    });
  } catch (error) {
    console.error("Create product error:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const updateProduct: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { productId } = req.params;

    if (!tenantId) {
      res.status(401).json({ error: "Unauthorized: No tenant ID found" });
      return;
    }

    if (!productId) {
      res.status(400).json({ error: "Product ID is required" });
      return;
    }

    const {
      name,
      description,
      sku,
      price,
      costPrice,
      category,
      stockQuantity,
      imageUrl,
    } = req.body;

    // Validate required fields
    if (!name || name.trim() === "") {
      res.status(400).json({ error: "Product name is required" });
      return;
    }

    // Validate price
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    if (numPrice === undefined || numPrice === null || isNaN(numPrice) || numPrice < 0) {
      res.status(400).json({ error: "Valid product price is required and must be a positive number" });
      return;
    }

    // Verify product belongs to this tenant before updating
    const productExists = await query(
      "SELECT id FROM products WHERE id = ? AND tenant_id = ?",
      [productId, tenantId]
    );

    if (!Array.isArray(productExists) || productExists.length === 0) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    // Parse numeric values properly
    const numStockQuantity = stockQuantity !== undefined && stockQuantity !== null ? parseInt(String(stockQuantity), 10) || 0 : 0;
    const numCostPrice = costPrice !== undefined && costPrice !== null ? parseFloat(String(costPrice)) : null;

    await query(
      `UPDATE products SET
        name = ?, description = ?, sku = ?, price = ?, cost_price = ?,
        category = ?, stock_quantity = ?, image_url = ?, updated_at = NOW()
       WHERE id = ? AND tenant_id = ?`,
      [
        name.trim(),
        description || null,
        sku || null,
        numPrice,
        numCostPrice,
        category || null,
        numStockQuantity,
        imageUrl || null,
        productId,
        tenantId,
      ],
    );

    const updated = await query(
      "SELECT * FROM products WHERE id = ? AND tenant_id = ?",
      [productId, tenantId],
    );

    res.json({
      success: true,
      data: Array.isArray(updated) ? updated[0] : null,
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
};

export const deleteProduct: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { productId } = req.params;

    if (!tenantId) {
      res.status(401).json({ error: "Unauthorized: No tenant ID found" });
      return;
    }

    if (!productId) {
      res.status(400).json({ error: "Product ID is required" });
      return;
    }

    // Verify product belongs to this tenant before deleting
    const productExists = await query(
      "SELECT id FROM products WHERE id = ? AND tenant_id = ?",
      [productId, tenantId]
    );

    if (!Array.isArray(productExists) || productExists.length === 0) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    // Delete related order items first (in case database doesn't have CASCADE delete)
    try {
      await query("DELETE FROM order_items WHERE product_id = ?", [productId]);
    } catch (err) {
      // Ignore if order_items deletion fails - product may not have any items
    }

    await query("DELETE FROM products WHERE id = ? AND tenant_id = ?", [
      productId,
      tenantId,
    ]);

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
};

// Orders - Optimized to fetch all order items in a single query
export const getOrders: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { page = "1", limit = "20" } = req.query as any;
    const currentPage = Math.max(1, parseInt(page as string, 10) || 1);
    const pageLimit = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const offset = (currentPage - 1) * pageLimit;

    const orders = await query(
      `SELECT * FROM orders WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ${pageLimit} OFFSET ${offset}`,
      [tenantId],
    );

    if (!Array.isArray(orders) || orders.length === 0) {
      const countRows = await query(
        "SELECT COUNT(*) as total FROM orders WHERE tenant_id = ?",
        [tenantId]
      );
      const total = Array.isArray(countRows) && countRows.length > 0 ? (countRows[0] as any).total : 0;

      res.json({
        success: true,
        data: [],
        pagination: { total, page: currentPage, limit: pageLimit, pages: Math.ceil(total / pageLimit) }
      });
      return;
    }

    const orderIds = (orders as any[]).map(o => o.id);

    // Fetch ALL order items in a single query - no N+1!
    const items = await query(
      `SELECT * FROM order_items WHERE order_id IN (${orderIds.map(() => '?').join(',')})`,
      orderIds,
    );

    // Map items back to orders
    const itemsByOrderId = new Map<string, any[]>();
    if (Array.isArray(items)) {
      (items as any[]).forEach(item => {
        if (!itemsByOrderId.has(item.order_id)) {
          itemsByOrderId.set(item.order_id, []);
        }
        itemsByOrderId.get(item.order_id)!.push(item);
      });
    }

    const ordersWithItems = (orders as any[]).map(order => ({
      ...order,
      items: itemsByOrderId.get(order.id) || [],
    }));

    const countRows = await query(
      "SELECT COUNT(*) as total FROM orders WHERE tenant_id = ?",
      [tenantId]
    );
    const total = Array.isArray(countRows) && countRows.length > 0 ? (countRows[0] as any).total : 0;

    res.json({
      success: true,
      data: ordersWithItems,
      pagination: { total, page: currentPage, limit: pageLimit, pages: Math.ceil(total / pageLimit) }
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

export const updateOrderStatus: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { orderId } = req.params;
    const { status, payment_status } = req.body;

    let updateQuery = "UPDATE orders SET ";
    const updateValues: any[] = [];
    const updateFields: string[] = [];

    if (status) {
      updateFields.push("status = ?");
      updateValues.push(status);

      if (status === "shipped") {
        updateFields.push("shipped_at = NOW()");
      } else if (status === "delivered") {
        updateFields.push("delivered_at = NOW()");
      }
    }

    if (payment_status) {
      updateFields.push("payment_status = ?");
      updateValues.push(payment_status);
    }

    if (updateFields.length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    updateQuery += updateFields.join(", ");
    updateQuery += " WHERE id = ? AND tenant_id = ?";
    updateValues.push(orderId, tenantId);

    await query(updateQuery, updateValues);

    const updated = await query(
      "SELECT * FROM orders WHERE id = ? AND tenant_id = ?",
      [orderId, tenantId],
    );

    res.json({
      success: true,
      data: Array.isArray(updated) ? updated[0] : null,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
};

export const getDashboard: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      res.status(401).json({ error: "Unauthorized: No tenant ID found in token" });
      return;
    }

    // Optimized: All aggregations in one query
    const stats = await query(
      `SELECT
        COALESCE(SUM(total_amount), 0) as totalSales,
        SUM(CASE WHEN status IN ('pending', 'processing') THEN 1 ELSE 0 END) as pendingOrders
       FROM orders
       WHERE tenant_id = ?`,
      [tenantId],
    );

    const customerCount = await query(
      "SELECT COUNT(*) as count FROM customers WHERE tenant_id = ?",
      [tenantId],
    );

    const productCount = await query(
      "SELECT COUNT(*) as count FROM products WHERE tenant_id = ? AND is_active = TRUE",
      [tenantId],
    );

    const recentOrders = await query(
      `SELECT * FROM orders WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 10`,
      [tenantId],
    );

    const statsData = Array.isArray(stats) && stats.length > 0 ? stats[0] as any : {};
    const customerData = Array.isArray(customerCount) && customerCount.length > 0 ? customerCount[0] as any : {};
    const productData = Array.isArray(productCount) && productCount.length > 0 ? productCount[0] as any : {};

    res.json({
      success: true,
      data: {
        totalSales: statsData.totalSales || 0,
        pendingOrders: statsData.pendingOrders || 0,
        customers: customerData.count || 0,
        products: productData.count || 0,
        recentOrders: Array.isArray(recentOrders) ? recentOrders : [],
      },
    });
  } catch (error) {
    console.error("Get dashboard error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
};

// Customers - Optimized with pagination
export const getCustomers: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      res.status(401).json({ error: "Unauthorized: No tenant ID found in token" });
      return;
    }

    const { page = "1", limit = "20", sortBy = "created_at" } = req.query as any;
    const currentPage = Math.max(1, parseInt(page as string, 10) || 1);
    const pageLimit = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const offset = (currentPage - 1) * pageLimit;

    // Validate sortBy to prevent SQL injection
    const validSortColumns = ['created_at', 'total_spent', 'total_orders', 'email'];
    const safeSort = validSortColumns.includes(sortBy as string) ? sortBy : 'created_at';

    const customers = await query(
      `SELECT id, email, first_name, last_name, phone, city, country, total_spent, total_orders, created_at
       FROM customers WHERE tenant_id = ?
       ORDER BY ${safeSort} DESC
       LIMIT ${pageLimit} OFFSET ${offset}`,
      [tenantId],
    );

    const countRows = await query(
      "SELECT COUNT(*) as total FROM customers WHERE tenant_id = ?",
      [tenantId]
    );
    const total = Array.isArray(countRows) && countRows.length > 0 ? (countRows[0] as any).total : 0;

    res.json({
      success: true,
      data: Array.isArray(customers) ? customers : [],
      pagination: { total, page: currentPage, limit: pageLimit, pages: Math.ceil(total / pageLimit) }
    });
  } catch (error) {
    console.error("Get customers error:", error);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
};

// Discounts - Optimized with pagination
export const getDiscounts: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      res.status(401).json({ error: "Unauthorized: No tenant ID found in token" });
      return;
    }

    const { page = "1", limit = "20" } = req.query as any;
    const currentPage = Math.max(1, parseInt(page as string, 10) || 1);
    const pageLimit = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const offset = (currentPage - 1) * pageLimit;

    const discounts = await query(
      `SELECT id, code, description, discount_type, discount_value, min_order_amount,
              max_uses, used_count, valid_from, valid_until, is_active, created_at
       FROM discounts WHERE tenant_id = ?
       ORDER BY created_at DESC
       LIMIT ${pageLimit} OFFSET ${offset}`,
      [tenantId],
    );

    const countRows = await query(
      "SELECT COUNT(*) as total FROM discounts WHERE tenant_id = ?",
      [tenantId]
    );
    const total = Array.isArray(countRows) && countRows.length > 0 ? (countRows[0] as any).total : 0;

    res.json({
      success: true,
      data: Array.isArray(discounts) ? discounts : [],
      pagination: { total, page: currentPage, limit: pageLimit, pages: Math.ceil(total / pageLimit) }
    });
  } catch (error) {
    console.error("Get discounts error:", error);
    res.status(500).json({ error: "Failed to fetch discounts" });
  }
};

export const createDiscount: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;

    let {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxUses,
      validFrom,
      validUntil,
    } = req.body;

    // =========================================================
    // ✅ 1. Validate & sanitize input
    // =========================================================
    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({
        error: "Code, discount type, and value are required",
      });
    }

    const cleanCode = String(code).trim().toUpperCase();
    const cleanDescription = description
      ? String(description).trim()
      : null;

    const numDiscountValue = Number(discountValue);

    if (!Number.isFinite(numDiscountValue) || numDiscountValue <= 0) {
      return res.status(400).json({
        error: "Valid discount value is required",
      });
    }

    // =========================================================
    // 🔥 PLAN VALIDATION START (Discounts)
    // =========================================================

    const tenantResult: any = await query(
      "SELECT billing_plan FROM tenants WHERE id = ?",
      [tenantId]
    );

    const billingPlan = tenantResult?.[0]?.billing_plan;

    if (!billingPlan) {
      return res.status(400).json({
        error: "No billing plan assigned",
      });
    }

    const pricingResult: any = await query(
      "SELECT * FROM pricing WHERE name = ? AND is_active = 1",
      [billingPlan]
    );

    const plan = pricingResult?.[0];

    if (!plan) {
      return res.status(400).json({
        error: "Invalid or inactive billing plan",
      });
    }

    // Parse features
    let features: string[] = [];

    try {
      features =
        typeof plan.features === "string"
          ? JSON.parse(plan.features)
          : plan.features;
    } catch (err) {
      console.error("Feature parse error:", err);
      features = [];
    }

    // 🔥 STRICT discount feature check
    const discountFeature = features.find((f: string) =>
      /\bdiscounts?\b/i.test(f)
    );

    // ❌ If NOT موجود → BLOCK
    if (!discountFeature) {
      return res.status(403).json({
        error:
          "Your current plan does not support discounts. Please upgrade your plan.",
      });
    }

    // Extract limit
    let discountLimit = Infinity;

    if (discountFeature.toLowerCase().includes("unlimited")) {
      discountLimit = Infinity;
    } else {
      const match = discountFeature.match(/\d+/);

      if (match) {
        discountLimit = parseInt(match[0], 10);
      } else {
        discountLimit = 0;
      }
    }

    // Count existing
    const countResult: any = await query(
      "SELECT COUNT(*) as count FROM discounts WHERE tenant_id = ?",
      [tenantId]
    );

    const currentCount = countResult?.[0]?.count || 0;

    if (currentCount >= discountLimit) {
      return res.status(400).json({
        error: `You can only create up to ${discountLimit} discounts on your current plan`,
      });
    }

    // =========================================================
    // 🔥 PLAN VALIDATION END
    // =========================================================

    // =========================================================
    // 🔒 2. Check code uniqueness
    // =========================================================
    const existingCode: any = await query(
      "SELECT id FROM discounts WHERE tenant_id = ? AND code = ?",
      [tenantId, cleanCode]
    );

    if (existingCode.length > 0) {
      return res.status(400).json({
        error: "Discount code already exists",
      });
    }

    // =========================================================
    // ✅ 3. Create discount
    // =========================================================
    const id = generateDiscountId();

    await query(
      `INSERT INTO discounts 
      (id, tenant_id, code, description, discount_type, discount_value, min_order_amount, max_uses, valid_from, valid_until)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        tenantId,
        cleanCode,
        cleanDescription,
        discountType,
        numDiscountValue,
        minOrderAmount ? Number(minOrderAmount) : null,
        maxUses ? Number(maxUses) : null,
        validFrom || null,
        validUntil || null,
      ]
    );

    // Fetch created discount
    const newDiscount: any = await query(
      "SELECT * FROM discounts WHERE id = ?",
      [id]
    );

    return res.json({
      success: true,
      data: Array.isArray(newDiscount) ? newDiscount[0] : null,
    });
  } catch (error) {
    console.error("Create discount error:", error);
    return res.status(500).json({
      error: "Failed to create discount",
    });
  }
};

// Update Customer
export const updateCustomer: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone,
      city,
      country,
    } = req.body;

    if (!id || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify customer belongs to tenant
    const customerResult = await query(
      "SELECT id FROM customers WHERE id = ? AND tenant_id = ?",
      [id, tenantId]
    );

    if (!Array.isArray(customerResult) || customerResult.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    await query(
      `UPDATE customers
       SET first_name = ?, last_name = ?, email = ?, phone = ?, city = ?, country = ?
       WHERE id = ? AND tenant_id = ?`,
      [first_name || null, last_name || null, email, phone || null, city || null, country || null, id, tenantId]
    );

    const updated = await query("SELECT * FROM customers WHERE id = ?", [id]);

    res.json({
      success: true,
      data: Array.isArray(updated) ? updated[0] : null,
    });
  } catch (error) {
    console.error("Update customer error:", error);
    res.status(500).json({ error: "Failed to update customer" });
  }
};

// Delete Customer
export const deleteCustomer: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Missing customer ID" });
    }

    // Verify customer belongs to tenant
    const customerResult = await query(
      "SELECT id FROM customers WHERE id = ? AND tenant_id = ?",
      [id, tenantId]
    );

    if (!Array.isArray(customerResult) || customerResult.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    await query("DELETE FROM customers WHERE id = ? AND tenant_id = ?", [id, tenantId]);

    res.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Delete customer error:", error);
    res.status(500).json({ error: "Failed to delete customer" });
  }
};

// Update Discount
export const updateDiscount: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxUses,
      validFrom,
      validUntil,
      isActive,
    } = req.body;

    if (!id || !code || !discountType || !discountValue) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify discount belongs to tenant
    const discountResult = await query(
      "SELECT id FROM discounts WHERE id = ? AND tenant_id = ?",
      [id, tenantId]
    );

    if (!Array.isArray(discountResult) || discountResult.length === 0) {
      return res.status(404).json({ error: "Discount not found" });
    }

    await query(
      `UPDATE discounts
       SET code = ?, description = ?, discount_type = ?, discount_value = ?,
           min_order_amount = ?, max_uses = ?, valid_from = ?, valid_until = ?, is_active = ?
       WHERE id = ? AND tenant_id = ?`,
      [
        code,
        description || null,
        discountType,
        discountValue,
        minOrderAmount || null,
        maxUses || null,
        validFrom || null,
        validUntil || null,
        isActive !== undefined ? isActive : 1,
        id,
        tenantId,
      ]
    );

    const updated = await query("SELECT * FROM discounts WHERE id = ?", [id]);

    res.json({
      success: true,
      data: Array.isArray(updated) ? updated[0] : null,
    });
  } catch (error) {
    console.error("Update discount error:", error);
    res.status(500).json({ error: "Failed to update discount" });
  }
};

// Delete Discount
export const deleteDiscount: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Missing discount ID" });
    }

    // Verify discount belongs to tenant
    const discountResult = await query(
      "SELECT id FROM discounts WHERE id = ? AND tenant_id = ?",
      [id, tenantId]
    );

    if (!Array.isArray(discountResult) || discountResult.length === 0) {
      return res.status(404).json({ error: "Discount not found" });
    }

    await query("DELETE FROM discounts WHERE id = ? AND tenant_id = ?", [id, tenantId]);

    res.json({
      success: true,
      message: "Discount deleted successfully",
    });
  } catch (error) {
    console.error("Delete discount error:", error);
    res.status(500).json({ error: "Failed to delete discount" });
  }
};

export const getTenantThemes: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      res.status(401).json({ error: "Unauthorized: No tenant ID found in token" });
      return;
    }
    const themes = await query(
      `SELECT t.* FROM themes t
       JOIN tenant_themes tt ON t.id = tt.theme_id
       WHERE tt.tenant_id = ?`,
      [tenantId],
    );

    res.json({
      success: true,
      data: Array.isArray(themes) ? themes : [],
    });
  } catch (error) {
    console.error("Get tenant themes error:", error);
    res.status(500).json({ error: "Failed to fetch themes" });
  }
};

// Settings - Business Details
export const getBusinessDetails: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      res.status(401).json({ error: "Unauthorized: No tenant ID found in token" });
      return;
    }

    const tenants = await query(
      "SELECT id, company_name, domain, contact_email, contact_phone, logo_url, youtube_url, instagram_url, facebook_url, billing_plan FROM tenants WHERE id = ?",
      [tenantId],
    );

    res.json({
      success: true,
      data: Array.isArray(tenants) ? tenants[0] : null,
    });
  } catch (error) {
    console.error("Get business details error:", error);
    res.status(500).json({ error: "Failed to fetch business details" });
  }
};

export const updateBusinessDetails: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { companyName, contactEmail, contactPhone, isMaintenanceMode, youtubeUrl, instagramUrl, facebookUrl, logo } = req.body;

    if (!tenantId) {
      res.status(400).json({ error: 'Tenant ID is required' });
      return;
    }

    const updateFields = [];
    const updateValues: any[] = [];

    if (companyName !== undefined && companyName !== null) {
      updateFields.push('company_name = ?');
      updateValues.push(companyName);
    }
    if (contactEmail !== undefined && contactEmail !== null) {
      updateFields.push('contact_email = ?');
      updateValues.push(contactEmail);
    }
    if (contactPhone !== undefined && contactPhone !== null) {
      updateFields.push('contact_phone = ?');
      updateValues.push(contactPhone);
    }
    if (isMaintenanceMode !== undefined) {
      updateFields.push('is_maintenance_mode = ?');
      updateValues.push(isMaintenanceMode ? 1 : 0);
    }
    if (youtubeUrl !== undefined) {
      updateFields.push('youtube_url = ?');
      updateValues.push(youtubeUrl || null);
    }
    if (instagramUrl !== undefined) {
      updateFields.push('instagram_url = ?');
      updateValues.push(instagramUrl || null);
    }
    if (facebookUrl !== undefined) {
      updateFields.push('facebook_url = ?');
      updateValues.push(facebookUrl || null);
    }
    if (logo !== undefined) {
      updateFields.push('logo_url = ?');
      updateValues.push(logo || null);
    }

    if (updateFields.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    updateValues.push(tenantId);
    const updateQuery = `UPDATE tenants SET ${updateFields.join(', ')} WHERE id = ?`;

    const result = await query(updateQuery, updateValues);
    console.log('Update result:', result);

    const updated = await query(
      "SELECT id, company_name, domain, contact_email, contact_phone, logo_url, youtube_url, instagram_url, facebook_url FROM tenants WHERE id = ?",
      [tenantId],
    );

    if (!Array.isArray(updated) || updated.length === 0) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    res.json({
      success: true,
      data: updated[0],
    });
  } catch (error) {
    console.error("Update business details error:", error);
    res.status(500).json({ error: "Failed to update business details", details: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// SEO Settings - get and update tenant SEO fields
export const getSEOSettings: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      res.status(401).json({ error: "Unauthorized: No tenant ID found in token" });
      return;
    }

    const tenants = await query(
      "SELECT seo_title, seo_description, seo_keywords, gtag_id, search_console_meta, min_order_amount, favicon_url FROM tenants WHERE id = ?",
      [tenantId]
    );

    res.json({ success: true, data: Array.isArray(tenants) ? tenants[0] : null });
  } catch (error) {
    console.error('Get SEO settings error:', error);
    res.status(500).json({ error: 'Failed to fetch SEO settings' });
  }
};

export const updateSEOSettings: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { seoTitle, seoDescription, seoKeywords, gtagId, searchConsoleMeta, minOrderAmount, faviconUrl } = req.body;

    await query(
      `UPDATE tenants SET seo_title = ?, seo_description = ?, seo_keywords = ?, gtag_id = ?, search_console_meta = ?, min_order_amount = ?, favicon_url = ? WHERE id = ?`,
      [seoTitle || null, seoDescription || null, seoKeywords || null, gtagId || null, searchConsoleMeta || null, minOrderAmount != null ? minOrderAmount : 0, faviconUrl || null, tenantId]
    );

    const updated = await query(
      "SELECT seo_title, seo_description, seo_keywords, gtag_id, search_console_meta, min_order_amount, favicon_url FROM tenants WHERE id = ?",
      [tenantId]
    );

    res.json({ success: true, data: Array.isArray(updated) ? updated[0] : null });
  } catch (error) {
    console.error('Update SEO settings error:', error);
    res.status(500).json({ error: 'Failed to update SEO settings' });
  }
};

export const updateBillingPlan: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { billingPlan } = req.body;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized: No tenant ID found in token' });
    }

    if (!billingPlan || typeof billingPlan !== 'string') {
      return res.status(400).json({ error: 'Billing plan is required' });
    }

    const pricingResult: any = await query(
      'SELECT id FROM pricing WHERE name = ? AND is_active = 1',
      [billingPlan.trim()]
    );

    if (!Array.isArray(pricingResult) || pricingResult.length === 0) {
      return res.status(400).json({ error: 'Selected billing plan is not available' });
    }

    await query(
      'UPDATE tenants SET billing_plan = ?, updated_at = NOW() WHERE id = ?',
      [billingPlan.trim(), tenantId]
    );

    res.json({ success: true, data: { billingPlan: billingPlan.trim() } });
  } catch (error) {
    console.error('Update billing plan error:', error);
    res.status(500).json({ error: 'Failed to update billing plan' });
  }
};

// Announcement Settings
export const getAnnouncementSettings: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const tenants = await query(
      "SELECT announcement_message FROM tenants WHERE id = ?",
      [tenantId]
    );

    res.json({ success: true, data: Array.isArray(tenants) ? tenants[0] : null });
  } catch (error) {
    console.error('Get announcement settings error:', error);
    res.status(500).json({ error: 'Failed to fetch announcement settings' });
  }
};

export const updateAnnouncementSettings: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { announcementMessage } = req.body;
    if (announcementMessage === undefined) {
      return res.status(400).json({ error: 'Announcement message is required in request body' });
    }

    // Ensure the announcement_message column exists
    try {
      const cols = await query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tenants' AND COLUMN_NAME = 'announcement_message'"
      );
      if (!Array.isArray(cols) || cols.length === 0) {
        console.log('Column announcement_message does not exist, creating it...');
        await query("ALTER TABLE tenants ADD COLUMN announcement_message LONGTEXT");
        console.log('Successfully created announcement_message column');
      }
    } catch (colErr) {
      console.warn('Could not verify announcement_message column:', colErr);
      // Try to add the column anyway in case of error
      try {
        await query("ALTER TABLE tenants ADD COLUMN announcement_message LONGTEXT");
      } catch (addErr) {
        console.warn('Could not add announcement_message column:', addErr);
        // Continue anyway - column might already exist
      }
    }

    const result = await query(
      `UPDATE tenants SET announcement_message = ? WHERE id = ?`,
      [announcementMessage || null, tenantId]
    );

    if (!result) {
      return res.status(400).json({ error: 'Failed to update tenant' });
    }

    const updated = await query(
      "SELECT announcement_message FROM tenants WHERE id = ?",
      [tenantId]
    );

    res.json({ success: true, data: Array.isArray(updated) ? updated[0] : null });
  } catch (error) {
    console.error('Update announcement settings error:', error);
    res.status(500).json({ error: 'Failed to update announcement settings', details: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Staff Members Management - Optimized with pagination
export const getStaffMembers: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { page = "1", limit = "20" } = req.query as any;
    const currentPage = Math.max(1, parseInt(page as string, 10) || 1);
    const pageLimit = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const offset = (currentPage - 1) * pageLimit;

    const staff = await query(
      `SELECT id, email, first_name, last_name, role, is_active, created_at
       FROM staff_members WHERE tenant_id = ?
       ORDER BY created_at DESC
       LIMIT ${pageLimit} OFFSET ${offset}`,
      [tenantId],
    );

    const countRows = await query(
      "SELECT COUNT(*) as total FROM staff_members WHERE tenant_id = ?",
      [tenantId]
    );
    const total = Array.isArray(countRows) && countRows.length > 0 ? (countRows[0] as any).total : 0;

    res.json({
      success: true,
      data: Array.isArray(staff) ? staff : [],
      pagination: { total, page: currentPage, limit: pageLimit, pages: Math.ceil(total / pageLimit) }
    });
  } catch (error) {
    console.error("Get staff members error:", error);
    res.status(500).json({ error: "Failed to fetch staff members" });
  }
};

export const createStaffMember: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { email, firstName, lastName, role, password } = req.body;

    if (!email || !role || !password) {
      res.status(400).json({ error: "Email, role, and password required" });
      return;
    }

    if (!tenantId) {
      res.status(400).json({ error: "Tenant ID is required" });
      return;
    }

    const id = uuidv4();
    const permissions = JSON.stringify(getDefaultPermissions(role));
    const { hashPassword } = await import("../auth");
    const passwordHash = await hashPassword(password);

    // Check if staff member with this email already exists for this tenant
    const existingStaff = await query(
      "SELECT id FROM staff_members WHERE tenant_id = ? AND email = ?",
      [tenantId, email.toLowerCase()]
    );

    if (Array.isArray(existingStaff) && existingStaff.length > 0) {
      res.status(400).json({ error: "Staff member with this email already exists" });
      return;
    }

    await query(
      `INSERT INTO staff_members (id, tenant_id, email, password_hash, first_name, last_name, role, permissions, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [id, tenantId, email.toLowerCase(), passwordHash, firstName || "", lastName || "", role, permissions],
    );

    const newStaff = await query("SELECT id, email, first_name, last_name, role, is_active, created_at FROM staff_members WHERE id = ?", [
      id,
    ]);

    res.json({
      success: true,
      data: Array.isArray(newStaff) ? newStaff[0] : null,
    });
  } catch (error) {
    console.error("Create staff member error:", error);
    const errorMsg = error instanceof Error ? error.message : "Failed to create staff member";
    res.status(500).json({ error: errorMsg, details: errorMsg });
  }
};

export const updateStaffMember: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { memberId } = req.params;
    const { firstName, lastName, role, isActive } = req.body;

    const permissions = JSON.stringify(getDefaultPermissions(role));

    await query(
      `UPDATE staff_members SET first_name = ?, last_name = ?, role = ?, permissions = ?, is_active = ? WHERE id = ? AND tenant_id = ?`,
      [firstName, lastName, role, permissions, isActive, memberId, tenantId],
    );

    const updated = await query(
      "SELECT * FROM staff_members WHERE id = ? AND tenant_id = ?",
      [memberId, tenantId],
    );

    res.json({
      success: true,
      data: Array.isArray(updated) ? updated[0] : null,
    });
  } catch (error) {
    console.error("Update staff member error:", error);
    res.status(500).json({ error: "Failed to update staff member" });
  }
};

export const deleteStaffMember: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { memberId } = req.params;

    await query(
      "DELETE FROM staff_members WHERE id = ? AND tenant_id = ?",
      [memberId, tenantId],
    );

    res.json({
      success: true,
      message: "Staff member deleted",
    });
  } catch (error) {
    console.error("Delete staff member error:", error);
    res.status(500).json({ error: "Failed to delete staff member" });
  }
};

// Theme Customization - Optimized with single query + fallback
export const getTenantThemeCustomization: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      res.status(401).json({ error: "Unauthorized: No tenant ID found in token" });
      return;
    }

    // Single optimized query with priority ordering
    const theme = await query(
      `SELECT t.* FROM themes t
       LEFT JOIN tenant_themes tt ON t.id = tt.theme_id
       WHERE (tt.tenant_id = ? AND tt.is_active = TRUE) OR (tt.tenant_id = ?) OR t.is_system_theme = TRUE
       ORDER BY
         CASE
           WHEN tt.tenant_id = ? AND tt.is_active = TRUE THEN 1
           WHEN tt.tenant_id = ? THEN 2
           ELSE 3
         END,
         t.created_at ASC
       LIMIT 1`,
      [tenantId, tenantId, tenantId, tenantId],
    );

    if (Array.isArray(theme) && theme.length > 0) {
      res.json({
        success: true,
        data: theme[0],
      });
    } else {
      res.status(404).json({ error: "No theme found" });
    }
  } catch (error) {
    console.error("Get theme customization error:", error);
    res.status(500).json({ error: "Failed to fetch theme" });
  }
};

export const updateThemeCustomization: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { primaryColor, secondaryColor, fontFamily } = req.body;

    const themes = await query(
      `SELECT t.id FROM themes t
       JOIN tenant_themes tt ON t.id = tt.theme_id
       WHERE tt.tenant_id = ? AND tt.is_active = TRUE`,
      [tenantId],
    );

    if (!Array.isArray(themes) || themes.length === 0) {
      res.status(404).json({ error: "No active theme found" });
      return;
    }

    const themeId = (themes[0] as any).id;

    await query(
      `UPDATE themes SET primary_color = ?, secondary_color = ?, font_family = ? WHERE id = ?`,
      [primaryColor || null, secondaryColor || null, fontFamily || null, themeId],
    );

    const updated = await query("SELECT * FROM themes WHERE id = ?", [themeId]);

    res.json({
      success: true,
      data: Array.isArray(updated) ? updated[0] : null,
    });
  } catch (error) {
    console.error("Update theme customization error:", error);
    res.status(500).json({ error: "Failed to update theme" });
  }
};

// Image Upload
export const uploadProductImage: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;

    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const filename = req.file.filename;
    const imageUrl = `/uploads/${filename}`;

    res.json({
      success: true,
      data: {
        imageUrl,
        filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error("Upload image error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
};

// Upload Hero Slider Image
export const uploadHeroSliderImage: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;

    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const filename = req.file.filename;
    const imageUrl = `/uploads/${filename}`;

    res.json({
      success: true,
      data: {
        imageUrl,
        filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error("Upload hero slider image error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
};

// Hero Sliders management
export const getHeroSliders: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      res.status(401).json({ error: "Unauthorized: No tenant ID found in token" });
      return;
    }
    const rows = await query("SELECT * FROM hero_sliders WHERE tenant_id = ? ORDER BY sort_order, created_at", [tenantId]);
    res.json({ success: true, data: Array.isArray(rows) ? rows : [] });
  } catch (err) {
    console.error('Get hero sliders error:', err);
    res.status(500).json({ error: 'Failed to fetch hero sliders' });
  }
};

export const createHeroSlider: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { imageUrl, title, subtitle, ctaText, ctaUrl, sortOrder } = req.body;
    // Allow empty imageUrl for now - user can upload later
    const id = uuidv4();
    await query(`INSERT INTO hero_sliders (id, tenant_id, image_url, title, subtitle, cta_text, cta_url, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)` , [id, tenantId, imageUrl || null, title || null, subtitle || null, ctaText || null, ctaUrl || null, sortOrder || 0]);
    const newRow = await query('SELECT * FROM hero_sliders WHERE id = ?', [id]);
    res.json({ success: true, data: Array.isArray(newRow) ? newRow[0] : null });
  } catch (err) {
    console.error('Create hero slider error:', err);
    res.status(500).json({ error: 'Failed to create hero slider' });
  }
};

export const updateHeroSlider: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { sliderId } = req.params;
    const { imageUrl, title, subtitle, ctaText, ctaUrl, sortOrder, isActive } = req.body;
    await query(`UPDATE hero_sliders SET image_url = ?, title = ?, subtitle = ?, cta_text = ?, cta_url = ?, sort_order = ?, is_active = ? WHERE id = ? AND tenant_id = ?`, [imageUrl || null, title || null, subtitle || null, ctaText || null, ctaUrl || null, sortOrder || 0, isActive ? 1 : 0, sliderId, tenantId]);
    const updated = await query('SELECT * FROM hero_sliders WHERE id = ?', [sliderId]);
    res.json({ success: true, data: Array.isArray(updated) ? updated[0] : null });
  } catch (err) {
    console.error('Update hero slider error:', err);
    res.status(500).json({ error: 'Failed to update hero slider' });
  }
};

export const deleteHeroSlider: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { sliderId } = req.params;
    await query('DELETE FROM hero_sliders WHERE id = ? AND tenant_id = ?', [sliderId, tenantId]);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    console.error('Delete hero slider error:', err);
    res.status(500).json({ error: 'Failed to delete hero slider' });
  }
};

// Pages Management
export const getPages: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      res.status(401).json({ error: "Unauthorized: No tenant ID found in token" });
      return;
    }
    const { page = "1", limit = "10" } = req.query as any;
    const currentPage = Math.max(1, parseInt(page as string, 10) || 1);
    const pageLimit = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10));
    const offset = (currentPage - 1) * pageLimit;
    const rows = await query(`SELECT * FROM pages WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ${pageLimit} OFFSET ${offset}`, [tenantId]);
    const countRows = await query("SELECT COUNT(*) as total FROM pages WHERE tenant_id = ?", [tenantId]);
    const total = Array.isArray(countRows) && countRows.length > 0 ? (countRows[0] as any).total : 0;
    res.json({ success: true, data: Array.isArray(rows) ? rows : [], pagination: { total, page: currentPage, limit: pageLimit, pages: Math.ceil(total / pageLimit) } });
  } catch (err) {
    console.error('Get pages error:', err);
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
};

export const createPage: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;

    let {
      title,
      slug,
      description,
      content,
      seoTitle,
      seoDescription,
      seoKeywords,
      featuredImageUrl,
      isPublished,
    } = req.body;

    // =========================================================
    // ✅ 1. Validate & sanitize input
    // =========================================================
    if (!title || !slug) {
      return res.status(400).json({
        error: "Title and slug are required",
      });
    }

    if (!tenantId) {
      return res.status(400).json({
        error: "Tenant ID is required",
      });
    }

    const cleanTitle = String(title).trim();
    const cleanSlug = String(slug).trim().toLowerCase();

    const cleanDescription = description ? String(description).trim() : null;
    const cleanContent = content ? String(content).trim() : null;

    if (!cleanTitle || !cleanSlug) {
      return res.status(400).json({
        error: "Invalid title or slug",
      });
    }

    // =========================================================
    // 🔥 PLAN VALIDATION START (Pages)
    // =========================================================

    const tenantResult: any = await query(
      "SELECT billing_plan FROM tenants WHERE id = ?",
      [tenantId]
    );

    const billingPlan = tenantResult?.[0]?.billing_plan;

    if (!billingPlan) {
      return res.status(400).json({
        error: "No billing plan assigned",
      });
    }

    const pricingResult: any = await query(
      "SELECT * FROM pricing WHERE name = ? AND is_active = 1",
      [billingPlan]
    );

    const plan = pricingResult?.[0];

    if (!plan) {
      return res.status(400).json({
        error: "Invalid or inactive billing plan",
      });
    }

    // Parse features safely
    let features: string[] = [];

    try {
      features =
        typeof plan.features === "string"
          ? JSON.parse(plan.features)
          : plan.features;
    } catch (err) {
      console.error("Feature parse error:", err);
      features = [];
    }

    // 🔥 STRICT page feature check
    const pageFeature = features.find((f: string) =>
      /\bpages?\b/i.test(f)
    );

    // ❌ If NO page feature → BLOCK
    if (!pageFeature) {
      return res.status(403).json({
        error:
          "Your current plan does not support pages. Please upgrade your plan.",
      });
    }

    // Extract limit
    let pageLimit = Infinity;

    if (pageFeature.toLowerCase().includes("unlimited")) {
      pageLimit = Infinity;
    } else {
      const match = pageFeature.match(/\d+/);

      if (match) {
        pageLimit = parseInt(match[0], 10);
      } else {
        pageLimit = 0;
      }
    }

    // Count existing pages
    const countResult: any = await query(
      "SELECT COUNT(*) as count FROM pages WHERE tenant_id = ?",
      [tenantId]
    );

    const currentCount = countResult?.[0]?.count || 0;

    if (currentCount >= pageLimit) {
      return res.status(400).json({
        error: `You can only create up to ${pageLimit} pages on your current plan`,
      });
    }

    // =========================================================
    // 🔥 PLAN VALIDATION END
    // =========================================================

    // =========================================================
    // 🔒 2. Slug uniqueness check
    // =========================================================
    const existingSlug: any = await query(
      "SELECT id FROM pages WHERE tenant_id = ? AND slug = ?",
      [tenantId, cleanSlug]
    );

    if (existingSlug.length > 0) {
      return res.status(400).json({
        error: "Page slug already exists",
      });
    }

    // =========================================================
    // ✅ 3. Create page
    // =========================================================
    const id = uuidv4();

    await query(
      `INSERT INTO pages 
      (id, tenant_id, title, slug, description, content, seo_title, seo_description, seo_keywords, featured_image_url, is_published, publish_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        tenantId,
        cleanTitle,
        cleanSlug,
        cleanDescription,
        cleanContent,
        seoTitle || null,
        seoDescription || null,
        seoKeywords || null,
        featuredImageUrl || null,
        !!isPublished,
        isPublished ? new Date() : null,
      ]
    );

    // Fetch created page
    const row: any = await query(
      "SELECT * FROM pages WHERE id = ?",
      [id]
    );

    return res.json({
      success: true,
      data: Array.isArray(row) ? row[0] : null,
    });
  } catch (err) {
    console.error("Create page error:", err);
    const errorMsg =
      err instanceof Error ? err.message : "Failed to create page";

    return res.status(500).json({
      error: "Failed to create page",
      details: errorMsg,
    });
  }
};

export const updatePage: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { pageId } = req.params;
    const { title, slug, description, content, seoTitle, seoDescription, seoKeywords, featuredImageUrl, isPublished } = req.body;
    await query(`UPDATE pages SET title = ?, slug = ?, description = ?, content = ?, seo_title = ?, seo_description = ?, seo_keywords = ?, featured_image_url = ?, is_published = ?, publish_date = CASE WHEN ? THEN IFNULL(publish_date, NOW()) ELSE publish_date END WHERE id = ? AND tenant_id = ?`,
      [title || null, slug || null, description || null, content || null, seoTitle || null, seoDescription || null, seoKeywords || null, featuredImageUrl || null, !!isPublished, !!isPublished, pageId, tenantId]);
    const row = await query('SELECT * FROM pages WHERE id = ?', [pageId]);
    res.json({ success: true, data: Array.isArray(row) ? row[0] : null });
  } catch (err) {
    console.error('Update page error:', err);
    res.status(500).json({ error: 'Failed to update page' });
  }
};

export const deletePage: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { pageId } = req.params;
    await query('DELETE FROM pages WHERE id = ? AND tenant_id = ?', [pageId, tenantId]);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    console.error('Delete page error:', err);
    res.status(500).json({ error: 'Failed to delete page' });
  }
};

// Blog Posts Management
export const getBlogPostsAdmin: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      res.status(401).json({ error: "Unauthorized: No tenant ID found in token" });
      return;
    }

    const { page = "1", limit = "10" } = req.query as any;
    const currentPage = Math.max(1, parseInt(page as string, 10) || 1);
    const pageLimit = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10));
    const offset = (currentPage - 1) * pageLimit;
    const rows = await query(`SELECT * FROM blog_posts WHERE tenant_id = ? ORDER BY publish_date DESC, created_at DESC LIMIT ${pageLimit} OFFSET ${offset}`, [tenantId]);
    const countRows = await query("SELECT COUNT(*) as total FROM blog_posts WHERE tenant_id = ?", [tenantId]);
    const total = Array.isArray(countRows) && countRows.length > 0 ? (countRows[0] as any).total : 0;
    res.json({ success: true, data: Array.isArray(rows) ? rows : [], pagination: { total, page: currentPage, limit: pageLimit, pages: Math.ceil(total / pageLimit) } });
  } catch (err) {
    console.error('Get blog posts error:', err);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
};

export const createBlogPost: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;

    let {
      title,
      slug,
      excerpt,
      content,
      featuredImageUrl,
      category,
      tags,
      seoTitle,
      seoDescription,
      seoKeywords,
      isPublished,
    } = req.body;

    // =========================================================
    // ✅ 1. Validate & sanitize
    // =========================================================
    if (!tenantId) {
      return res.status(400).json({
        error: "Tenant ID is required",
      });
    }

    if (!title || !slug) {
      return res.status(400).json({
        error: "Title and slug are required",
      });
    }

    const cleanTitle = String(title).trim();
    const cleanSlug = String(slug).trim().toLowerCase();

    if (!cleanTitle || !cleanSlug) {
      return res.status(400).json({
        error: "Invalid title or slug",
      });
    }

    const cleanExcerpt = excerpt ? String(excerpt).trim() : null;
    const cleanContent = content ? String(content).trim() : null;

    // =========================================================
    // 🔥 2. PLAN VALIDATION (optimized)
    // =========================================================

    const planResult: any = await query(
      `SELECT p.features 
       FROM tenants t
       JOIN pricing p ON t.billing_plan = p.name
       WHERE t.id = ? AND p.is_active = 1`,
      [tenantId]
    );

    const featuresRaw = planResult?.[0]?.features;

    if (!featuresRaw) {
      return res.status(400).json({
        error: "Invalid or inactive billing plan",
      });
    }

    let features: string[] = [];

    try {
      features =
        typeof featuresRaw === "string"
          ? JSON.parse(featuresRaw)
          : Array.isArray(featuresRaw)
          ? featuresRaw
          : [];
    } catch (err) {
      console.error("Feature parse error:", err);
      features = [];
    }

    // 🔥 STRICT blog feature check
    const blogFeature = features.find((f: string) =>
      /\b(blog|blog posts?)\b/i.test(f)
    );

    if (!blogFeature) {
      return res.status(403).json({
        error: "Your current plan does not support blog posts",
      });
    }

    // Extract limit
    let blogLimit = Infinity;

    if (!/unlimited/i.test(blogFeature)) {
      const match = blogFeature.match(/\d+/);
      blogLimit = match ? parseInt(match[0], 10) : 0;
    }

    // Count existing
    const [{ count: currentCount } = { count: 0 }]: any = await query(
      "SELECT COUNT(*) as count FROM blog_posts WHERE tenant_id = ?",
      [tenantId]
    );

    if (currentCount >= blogLimit) {
      return res.status(400).json({
        error: `Blog post limit reached (${blogLimit})`,
      });
    }

    // =========================================================
    // 🔒 3. Slug uniqueness
    // =========================================================
    const existingSlug: any = await query(
      "SELECT 1 FROM blog_posts WHERE tenant_id = ? AND slug = ? LIMIT 1",
      [tenantId, cleanSlug]
    );

    if (existingSlug.length) {
      return res.status(400).json({
        error: "Blog slug already exists",
      });
    }

    // =========================================================
    // ✅ 4. Create blog post
    // =========================================================
    const id = uuidv4();

    await query(
      `INSERT INTO blog_posts
      (id, tenant_id, title, slug, excerpt, content, featured_image_url, category, tags, seo_title, seo_description, seo_keywords, is_published, publish_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        tenantId,
        cleanTitle,
        cleanSlug,
        cleanExcerpt,
        cleanContent,
        featuredImageUrl || null,
        category || null,
        Array.isArray(tags) ? tags.join(",") : tags || null,
        seoTitle || null,
        seoDescription || null,
        seoKeywords || null,
        !!isPublished,
        isPublished ? new Date() : null,
      ]
    );

    // =========================================================
    // ✅ 5. Fetch result
    // =========================================================
    const [row]: any = await query(
      "SELECT * FROM blog_posts WHERE id = ?",
      [id]
    );

    return res.json({
      success: true,
      data: row || null,
    });
  } catch (err) {
    console.error("Create blog post error:", err);

    return res.status(500).json({
      error: "Failed to create blog post",
      details: err instanceof Error ? err.message : undefined,
    });
  }
};

export const updateBlogPost: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { postId } = req.params;
    const { title, slug, excerpt, content, featuredImageUrl, category, tags, seoTitle, seoDescription, seoKeywords, isPublished } = req.body;
    await query(`UPDATE blog_posts SET title = ?, slug = ?, excerpt = ?, content = ?, featured_image_url = ?, category = ?, tags = ?, seo_title = ?, seo_description = ?, seo_keywords = ?, is_published = ?, publish_date = CASE WHEN ? THEN IFNULL(publish_date, NOW()) ELSE publish_date END WHERE id = ? AND tenant_id = ?`,
      [title || null, slug || null, excerpt || null, content || null, featuredImageUrl || null, category || null, Array.isArray(tags) ? tags.join(',') : (tags || null), seoTitle || null, seoDescription || null, seoKeywords || null, !!isPublished, !!isPublished, postId, tenantId]);
    const row = await query('SELECT * FROM blog_posts WHERE id = ?', [postId]);
    res.json({ success: true, data: Array.isArray(row) ? row[0] : null });
  } catch (err) {
    console.error('Update blog post error:', err);
    res.status(500).json({ error: 'Failed to update blog post' });
  }
};

export const deleteBlogPost: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { postId } = req.params;
    await query('DELETE FROM blog_posts WHERE id = ? AND tenant_id = ?', [postId, tenantId]);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    console.error('Delete blog post error:', err);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
};

// Template Management
export const getAvailableTemplates: RequestHandler = async (req, res) => {
  try {
    const templates = [
      {
        id: "theme-a",
        name: "Theme A - Professional Booking",
        description: "Professional data-table layout with vintage aesthetic. Features detailed product information in organized table format with purple dividers and warm beige styling. Perfect for detailed product catalogs and bulk ordering.",
        preview: "Dark header, beige product table with purple separators, detailed row information",
        colors: {
          primary: "#8b5a3c",
          secondary: "#a855f7",
          accent: "#f5f5dc",
        },
      },
      {
        id: "theme-b",
        name: "Theme B - Vibrant Showcase",
        description: "Modern vibrant design with colorful product cards, orange banner, and dynamic layouts. Features product grids with promotional badges, lifestyle imagery sections, and engaging call-to-action buttons. Perfect for festival and celebration-focused stores.",
        preview: "Orange promotional banner, white product grid with yellow CTAs, red sale badges, lifestyle sections",
        colors: {
          primary: "#f97316",
          secondary: "#ea580c",
          accent: "#facc15",
        },
      },
      {
        id: "theme-c",
        name: "Theme C - Blue Professional Grid",
        description: "Professional blue-themed e-commerce design with category-focused grid layout. Features blue headers, organized product grid with category buttons, and clean professional styling. Perfect for wholesale and B2B stores with category-driven navigation.",
        preview: "Blue header with professional branding, category-focused product grid, clean organized layout",
        colors: {
          primary: "#1a73e8",
          secondary: "#0d47a1",
          accent: "#2196f3",
        },
      },
      {
        id: "theme-d",
        name: "Theme D - Purple Professional Catalog",
        description: "Premium purple-themed professional catalog design. Features detailed product table layout with purple styling, purple headers, and comprehensive product information display. Ideal for wholesale catalogs and B2B product listings.",
        preview: "Purple header with professional branding, detailed product table with specifications, premium layout",
        colors: {
          primary: "#7c3aed",
          secondary: "#6d28d9",
          accent: "#c084fc",
        },
      },
      {
        id: "theme-e",
        name: "Theme E - Modern Showcase",
        description: "Contemporary modern showcase design layout for retail stores. Includes clean card-based product galleries, bold gradient header, category hero and advanced quick actions for 2026 sales events.",
        preview: "Bright gradient hero, white product card grid, modern commerce interface",
        colors: {
          primary: "#7c3aed",
          secondary: "#6d28d9",
          accent: "#c084fc",
        },
      },
    ];

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error("Get available templates error:", error);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
};

export const getTenantTemplate: RequestHandler = async (req, res) => {
  try {
    const urlTenantId = req.params?.tenantId;
    const jwtTenantId = (req as any).tenantId;
    const tenantId = urlTenantId || jwtTenantId;

    if (!tenantId) {
      res.status(401).json({ error: "Unauthorized: No tenant ID found in token" });
      return;
    }

    try {
      const tenants = await query(
        "SELECT current_theme_id FROM tenants WHERE id = ?",
        [tenantId]
      );

      if (!Array.isArray(tenants) || tenants.length === 0) {
        res.json({
          success: true,
          data: { template: "theme-b" },
        });
        return;
      }

      const currentTemplate = (tenants[0] as any).current_theme_id || "theme-b";

      // Ensure this tenant has themes assigned
      try {
        const existingThemes = await query(
          "SELECT COUNT(*) as count FROM tenant_themes WHERE tenant_id = ?",
          [tenantId]
        );

        const count = Array.isArray(existingThemes) && existingThemes.length > 0
          ? (existingThemes[0] as any).count
          : 0;

        if (count === 0) {
          // Assign all system themes to this tenant
          const { v4: uuidv4 } = await import("uuid");
          const themes = await query("SELECT id FROM themes WHERE is_system_theme = TRUE ORDER BY created_at");
          if (Array.isArray(themes)) {
            for (let i = 0; i < themes.length; i++) {
              const theme = themes[i] as any;
              const isActive = i === 0; // Make first theme active
              try {
                await query(
                  `INSERT INTO tenant_themes (id, tenant_id, theme_id, is_active)
                   VALUES (?, ?, ?, ?)`,
                  [uuidv4(), tenantId, theme.id, isActive]
                );
              } catch (err: any) {
                if (err.code !== "ER_DUP_ENTRY") {
                  throw err;
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn("Failed to ensure themes for tenant:", err);
      }

      res.json({
        success: true,
        data: { template: currentTemplate },
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
    console.error("Get tenant template error:", error);
    res.json({
      success: true,
      data: { template: "theme-b" },
    });
  }
};

export const setTenantTemplate: RequestHandler = async (req, res) => {
  try {
    // Use tenantId from URL params if available (set by tenantMiddleware), otherwise from JWT
    const urlTenantId = req.params?.tenantId;
    const jwtTenantId = (req as any).tenantId;
    const tenantId = urlTenantId || jwtTenantId;

    const { template } = req.body;

    if (!tenantId) {
      res.status(400).json({ error: "Tenant ID required" });
      return;
    }

    if (!template) {
      res.status(400).json({ error: "Template ID required" });
      return;
    }

    const validTemplates = ["theme-a", "theme-b", "theme-c", "theme-d", "theme-e"];
    if (!validTemplates.includes(template)) {
      res.status(400).json({ error: "Invalid template" });
      return;
    }

    try {
      await query(
        "UPDATE tenants SET current_theme_id = ? WHERE id = ?",
        [template, tenantId]
      );
    } catch (err: any) {
      if (err.code !== "ER_BAD_FIELD_ERROR") {
        throw err;
      }
    }

    res.json({
      success: true,
      data: { template },
    });
  } catch (error) {
    console.error("Set tenant template error:", error);
    res.status(500).json({ error: "Failed to update template" });
  }
};

// Footer sections management
export const getFooterSections: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      res.status(401).json({ error: "Unauthorized: No tenant ID found in token" });
      return;
    }

    const sections = await query(
      "SELECT id, section_name, is_enabled, section_data, sort_order FROM footer_sections WHERE tenant_id = ? ORDER BY sort_order",
      [tenantId]
    );

    res.json({
      success: true,
      data: Array.isArray(sections) ? sections : [],
    });
  } catch (error) {
    console.error("Get footer sections error:", error);
    res.status(500).json({ error: "Failed to fetch footer sections" });
  }
};

export const updateFooterSection: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { sectionName } = req.params;
    const { isEnabled, sectionData, sortOrder } = req.body;

    if (!sectionName) {
      res.status(400).json({ error: "Section name is required" });
      return;
    }

    // Check if section exists
    const existing = await query(
      "SELECT id FROM footer_sections WHERE tenant_id = ? AND section_name = ?",
      [tenantId, sectionName]
    );

    if (!Array.isArray(existing) || existing.length === 0) {
      // Create new section
      const id = uuidv4();
      await query(
        `INSERT INTO footer_sections (id, tenant_id, section_name, is_enabled, section_data, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, tenantId, sectionName, isEnabled !== false, sectionData ? JSON.stringify(sectionData) : null, sortOrder || 0]
      );
    } else {
      // Update existing section
      await query(
        `UPDATE footer_sections SET is_enabled = ?, section_data = ?, sort_order = ?, updated_at = NOW()
         WHERE tenant_id = ? AND section_name = ?`,
        [isEnabled !== false, sectionData ? JSON.stringify(sectionData) : null, sortOrder || 0, tenantId, sectionName]
      );
    }

    const updated = await query(
      "SELECT id, section_name, is_enabled, section_data, sort_order FROM footer_sections WHERE tenant_id = ? AND section_name = ?",
      [tenantId, sectionName]
    );

    res.json({
      success: true,
      data: Array.isArray(updated) ? updated[0] : null,
    });
  } catch (error) {
    console.error("Update footer section error:", error);
    res.status(500).json({ error: "Failed to update footer section" });
  }
};

// Contact Us Management
export const getContactUs: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      res.status(401).json({ error: "Unauthorized: No tenant ID found in token" });
      return;
    }

    const result = await query(
      "SELECT id, email, phone, address, working_hours, map_code FROM contact_us WHERE tenant_id = ?",
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
    console.error("Get contact us error:", error);
    res.status(500).json({ error: "Failed to fetch contact info" });
  }
};

export const updateContactUs: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { email, phone, address, working_hours, map_code } = req.body;

    if (!tenantId) {
      res.status(401).json({ error: "Unauthorized: No tenant ID found in token" });
      return;
    }

    const existing = await query(
      "SELECT id FROM contact_us WHERE tenant_id = ?",
      [tenantId]
    );

    const workingHoursJson = working_hours ? JSON.stringify(working_hours) : null;

    if (!Array.isArray(existing) || existing.length === 0) {
      // Create new
      const id = uuidv4();
      await query(
        "INSERT INTO contact_us (id, tenant_id, email, phone, address, working_hours, map_code) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [id, tenantId, email || null, phone || null, address || null, workingHoursJson, map_code || null]
      );
    } else {
      // Update existing
      await query(
        "UPDATE contact_us SET email = ?, phone = ?, address = ?, working_hours = ?, map_code = ?, updated_at = NOW() WHERE tenant_id = ?",
        [email || null, phone || null, address || null, workingHoursJson, map_code || null, tenantId]
      );
    }

    const updated = await query(
      "SELECT id, email, phone, address, working_hours, map_code FROM contact_us WHERE tenant_id = ?",
      [tenantId]
    );

    const data = Array.isArray(updated) && updated.length > 0 ? updated[0] : null;
    if (data && data.working_hours) {
      try {
        data.working_hours = JSON.parse(data.working_hours);
      } catch (e) {}
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error("Update contact us error:", error);
    res.status(500).json({ error: "Failed to update contact info" });
  }
};

// Payment Info Management
export const getPaymentInfo: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      res.status(401).json({ error: "Unauthorized: No tenant ID found in token" });
      return;
    }

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
    console.error("Get payment info error:", error);
    res.status(500).json({ error: "Failed to fetch payment info" });
  }
};

export const updatePaymentInfo: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const {
      bank_account_name,
      bank_account_number,
      bank_name,
      ifsc_code,
      branch,
      gpay_name,
      gpay_number,
      upi_name,
      upi_id,
      upi_image_url,
      images,
    } = req.body;

    if (!tenantId) {
      res.status(401).json({ error: "Unauthorized: No tenant ID found in token" });
      return;
    }

    const existing = await query(
      "SELECT id FROM payment_info WHERE tenant_id = ?",
      [tenantId]
    );

    let paymentInfoId: string;

    if (!Array.isArray(existing) || existing.length === 0) {
      // Create new
      paymentInfoId = uuidv4();
      await query(
        `INSERT INTO payment_info (id, tenant_id, bank_account_name, bank_account_number, bank_name, ifsc_code, branch, gpay_name, gpay_number, upi_name, upi_id, upi_image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          paymentInfoId,
          tenantId,
          bank_account_name || null,
          bank_account_number || null,
          bank_name || null,
          ifsc_code || null,
          branch || null,
          gpay_name || null,
          gpay_number || null,
          upi_name || null,
          upi_id || null,
          upi_image_url || null,
        ]
      );
    } else {
      // Update existing
      paymentInfoId = (existing[0] as any).id;
      await query(
        `UPDATE payment_info SET bank_account_name = ?, bank_account_number = ?, bank_name = ?, ifsc_code = ?, branch = ?, gpay_name = ?, gpay_number = ?, upi_name = ?, upi_id = ?, upi_image_url = ?, updated_at = NOW()
         WHERE tenant_id = ?`,
        [
          bank_account_name || null,
          bank_account_number || null,
          bank_name || null,
          ifsc_code || null,
          branch || null,
          gpay_name || null,
          gpay_number || null,
          upi_name || null,
          upi_id || null,
          upi_image_url || null,
          tenantId,
        ]
      );
    }

    // Handle multiple images
    if (Array.isArray(images) && images.length > 0) {
      // Delete existing images
      await query(
        "DELETE FROM payment_images WHERE payment_info_id = ?",
        [paymentInfoId]
      );

      // Insert new images
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (img.image_url) {
          await query(
            `INSERT INTO payment_images (id, payment_info_id, tenant_id, image_url, image_type, display_order)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              uuidv4(),
              paymentInfoId,
              tenantId,
              img.image_url,
              img.image_type || null,
              i,
            ]
          );
        }
      }
    }

    const updated = await query(
      "SELECT id, bank_account_name, bank_account_number, bank_name, ifsc_code, branch, gpay_name, gpay_number, upi_name, upi_id, upi_image_url FROM payment_info WHERE tenant_id = ?",
      [tenantId]
    );

    let data = Array.isArray(updated) && updated.length > 0 ? updated[0] : null;

    // Fetch images
    if (data) {
      const fetchedImages = await query(
        "SELECT id, image_url, image_type, display_order FROM payment_images WHERE payment_info_id = ? ORDER BY display_order ASC",
        [(data as any).id]
      );
      (data as any).images = Array.isArray(fetchedImages) ? fetchedImages : [];
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error("Update payment info error:", error);
    res.status(500).json({ error: "Failed to update payment info" });
  }
};

// Email Settings Management
export const getEmailSettings: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      res.status(401).json({ error: "Unauthorized: No tenant ID found in token" });
      return;
    }

    const result = await query(
      `SELECT id, smtp_host, smtp_port, smtp_username, sender_email, target_email, email_notify_enabled
       FROM email_settings WHERE tenant_id = ?`,
      [tenantId]
    );

    const data = Array.isArray(result) && result.length > 0 ? result[0] : null;

    res.json({ success: true, data });
  } catch (error) {
    console.error("Get email settings error:", error);
    res.status(500).json({ error: "Failed to fetch email settings" });
  }
};

export const updateEmailSettings: RequestHandler = async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const {
      smtp_host,
      smtp_port,
      smtp_username,
      smtp_password,
      sender_email,
      target_email,
      email_notify_enabled,
    } = req.body;

    if (!tenantId) {
      res.status(401).json({ error: "Unauthorized: No tenant ID found in token" });
      return;
    }

    const existing = await query(
      "SELECT id FROM email_settings WHERE tenant_id = ?",
      [tenantId]
    );

    if (!Array.isArray(existing) || existing.length === 0) {
      // Create new
      const id = uuidv4();
      await query(
        `INSERT INTO email_settings (id, tenant_id, smtp_host, smtp_port, smtp_username, smtp_password, sender_email, target_email, email_notify_enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          tenantId,
          smtp_host || null,
          smtp_port || null,
          smtp_username || null,
          smtp_password || null,
          sender_email || null,
          target_email || null,
          email_notify_enabled || false,
        ]
      );
    } else {
      // Update existing
      await query(
        `UPDATE email_settings SET smtp_host = ?, smtp_port = ?, smtp_username = ?, smtp_password = ?, sender_email = ?, target_email = ?, email_notify_enabled = ?, updated_at = NOW()
         WHERE tenant_id = ?`,
        [
          smtp_host || null,
          smtp_port || null,
          smtp_username || null,
          smtp_password || null,
          sender_email || null,
          target_email || null,
          email_notify_enabled || false,
          tenantId,
        ]
      );
    }

    const updated = await query(
      `SELECT id, smtp_host, smtp_port, smtp_username, sender_email, target_email, email_notify_enabled
       FROM email_settings WHERE tenant_id = ?`,
      [tenantId]
    );

    const data = Array.isArray(updated) && updated.length > 0 ? updated[0] : null;

    res.json({ success: true, data });
  } catch (error) {
    console.error("Update email settings error:", error);
    res.status(500).json({ error: "Failed to update email settings" });
  }
};

// Helper function to get default permissions by role
function getDefaultPermissions(role: string) {
  const permissions: Record<string, string[]> = {
    admin: [
      "view_all",
      "manage_products",
      "manage_orders",
      "manage_customers",
      "manage_discounts",
      "manage_settings",
      "manage_staff",
    ],
    editor: [
      "view_all",
      "manage_products",
      "manage_orders",
      "manage_discounts",
    ],
    viewer: ["view_all"],
  };

  return permissions[role] || [];
}

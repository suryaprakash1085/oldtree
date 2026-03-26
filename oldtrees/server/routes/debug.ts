import { RequestHandler } from "express";
import { query } from "../db";
import { generateUserId, generateProductId, hashPassword, generateOrderId, generateOrderNumber, generateCustomerId } from "../auth";
import { v4 as uuidv4 } from "uuid";

export const debugStatus: RequestHandler = async (req, res) => {
  try {
    const tenants = await query("SELECT COUNT(*) as count FROM tenants");
    const themes = await query("SELECT COUNT(*) as count FROM themes");
    const products = await query("SELECT COUNT(*) as count FROM products");
    const tenantThemes = await query("SELECT COUNT(*) as count FROM tenant_themes");

    const demoTenant = await query(
      "SELECT id, company_name FROM tenants WHERE id = ?",
      ["demo"]
    );

    res.json({
      success: true,
      data: {
        tenantCount: Array.isArray(tenants) ? tenants[0] : 0,
        themeCount: Array.isArray(themes) ? themes[0] : 0,
        productCount: Array.isArray(products) ? products[0] : 0,
        tenantThemeCount: Array.isArray(tenantThemes) ? tenantThemes[0] : 0,
        demoTenantExists: Array.isArray(demoTenant) && demoTenant.length > 0,
        demoTenant: Array.isArray(demoTenant) && demoTenant.length > 0 ? demoTenant[0] : null,
      },
    });
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ error: "Debug query failed" });
  }
};

export const seedDemoData: RequestHandler = async (req, res) => {
  try {
    const { force } = req.body;

    // Check if demo tenant exists
    const existingTenant = await query(
      "SELECT id FROM tenants WHERE id = ?",
      ["demo"]
    );

    if (Array.isArray(existingTenant) && existingTenant.length > 0 && !force) {
      return res.json({
        success: true,
        message: "Demo tenant already exists",
      });
    }

    // If force, delete existing data
    if (force && Array.isArray(existingTenant) && existingTenant.length > 0) {
      try {
        await query("DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE tenant_id = ?)", ["demo"]);
        await query("DELETE FROM orders WHERE tenant_id = ?", ["demo"]);
        await query("DELETE FROM products WHERE tenant_id = ?", ["demo"]);
        await query("DELETE FROM tenant_themes WHERE tenant_id = ?", ["demo"]);
        await query("DELETE FROM users WHERE tenant_id = ?", ["demo"]);
        await query("DELETE FROM tenants WHERE id = ?", ["demo"]);
      } catch (error) {
        console.log("Cleanup error (ignored):", error);
      }
    }

    // Get all themes
    const allThemes = await query("SELECT id, name FROM themes");
    if (!Array.isArray(allThemes) || allThemes.length === 0) {
      return res.status(400).json({ error: "No themes found in database" });
    }

    const tenantId = "demo";

    // Create demo tenant
    await query(
      `INSERT INTO tenants (id, company_name, domain, contact_email, contact_phone, billing_plan, subscription_status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId,
        "Online Crackers Store",
        "demo.local",
        "akscrackerssample@gmail.com",
        "+91-9876543210",
        "premium",
        "active",
      ]
    );

    // Create admin user
    const adminId = generateUserId();
    const passwordHash = await hashPassword("Podapunda1@#");
    await query(
      `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        adminId,
        tenantId,
        "akscrackerssample@gmail.com",
        passwordHash,
        "Ak",
        "Crackers",
        "admin",
        true,
      ]
    );

    // Add products
    const products = [
      {
        name: "Atom Bomb Crackers",
        description: "High intensity firecrackers with bright colors and loud sound",
        price: 299,
        stock_quantity: 50,
        category: "Crackers",
      },
      {
        name: "Silver Sparklers",
        description: "Beautiful silver sparklers perfect for celebrations",
        price: 99,
        stock_quantity: 100,
        category: "Sparklers",
      },
      {
        name: "Color Bombs",
        description: "Colorful firecrackers that burst in multiple colors",
        price: 399,
        stock_quantity: 30,
        category: "Crackers",
      },
      {
        name: "Festival Lights Set",
        description: "Complete lighting package for festival celebrations",
        price: 799,
        stock_quantity: 20,
        category: "Lights",
      },
      {
        name: "Flower Pots",
        description: "Spinning flower pot firecrackers with colorful effects",
        price: 149,
        stock_quantity: 60,
        category: "Crackers",
      },
      {
        name: "Golden Sparkle Deluxe",
        description: "Premium golden sparklers with long duration",
        price: 199,
        stock_quantity: 80,
        category: "Sparklers",
      },
      {
        name: "Thunder Bomb",
        description: "Extra loud crackers for maximum celebration impact",
        price: 349,
        stock_quantity: 40,
        category: "Crackers",
      },
      {
        name: "Rainbow Wheel",
        description: "Spinning wheel firecracker with rainbow colors",
        price: 249,
        stock_quantity: 45,
        category: "Crackers",
      },
    ];

    const productIds: string[] = [];
    for (const product of products) {
      const productId = generateProductId();
      const sku = `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await query(
        `INSERT INTO products (id, tenant_id, name, description, sku, price, category, stock_quantity, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          productId,
          tenantId,
          product.name,
          product.description,
          sku,
          product.price,
          product.category,
          product.stock_quantity,
          true,
        ]
      );
      productIds.push(productId);
    }

    // Create sample orders with items
    const sampleOrders = [
      {
        customerName: "sample order",
        customerEmail: "sampleorder@ghmail.co",
        customerPhone: "393030392029",
        items: [{ productId: productIds[0], quantity: 1 }],
        status: "pending",
      },
      {
        customerName: "Raj Kumar",
        customerEmail: "raj.kumar@example.com",
        customerPhone: "9876543210",
        items: [
          { productId: productIds[1], quantity: 2 },
          { productId: productIds[2], quantity: 1 },
        ],
        status: "processing",
      },
      {
        customerName: "Priya Singh",
        customerEmail: "priya.singh@example.com",
        customerPhone: "9765432109",
        items: [
          { productId: productIds[3], quantity: 1 },
          { productId: productIds[4], quantity: 2 },
        ],
        status: "shipped",
      },
      {
        customerName: "Amit Patel",
        customerEmail: "amit.patel@example.com",
        customerPhone: "8765432109",
        items: [
          { productId: productIds[5], quantity: 3 },
          { productId: productIds[6], quantity: 1 },
        ],
        status: "delivered",
      },
    ];

    for (const orderData of sampleOrders) {
      const orderId = generateOrderId();
      const orderNumber = generateOrderNumber();
      const customerId = generateCustomerId();

      let totalAmount = 0;
      for (const item of orderData.items) {
        const productResult = await query(
          "SELECT price FROM products WHERE id = ?",
          [item.productId]
        );
        if (Array.isArray(productResult) && productResult.length > 0) {
          totalAmount +=
            (productResult[0] as any).price * item.quantity;
        }
      }

      await query(
        `INSERT INTO customers (id, tenant_id, email, first_name, total_orders, total_spent)
         VALUES (?, ?, ?, ?, 1, ?)`,
        [customerId, tenantId, orderData.customerEmail, orderData.customerName, totalAmount]
      );

      await query(
        `INSERT INTO orders (id, tenant_id, order_number, customer_email, customer_name, customer_phone, total_amount, status, shipping_address, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          orderId,
          tenantId,
          orderNumber,
          orderData.customerEmail,
          orderData.customerName,
          orderData.customerPhone,
          totalAmount,
          orderData.status,
          JSON.stringify({ address: "add here" }),
        ]
      );

      for (const item of orderData.items) {
        const productResult = await query(
          "SELECT price, name FROM products WHERE id = ?",
          [item.productId]
        );
        if (Array.isArray(productResult) && productResult.length > 0) {
          const itemId = uuidv4();
          const price = (productResult[0] as any).price;
          const productName = (productResult[0] as any).name;
          const itemTotal = price * item.quantity;

          await query(
            `INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price, total_price)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [itemId, orderId, item.productId, productName, item.quantity, price, itemTotal]
          );
        }
      }
    }

    // Create sample discount code
    try {
      const discountId = uuidv4();
      await query(
        `INSERT INTO discounts (id, tenant_id, code, discount_type, discount_value, min_order_amount, max_uses, used_count, is_active, valid_from, valid_until)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR))`,
        [discountId, tenantId, "SAVE10", "percentage", 10, 0, null, 0, true]
      );
    } catch (error: any) {
      if (error.code !== "ER_DUP_ENTRY") {
        console.warn("Could not create discount code:", error);
      }
    }

    // Assign themes - make first one active
    for (let i = 0; i < allThemes.length; i++) {
      const theme = allThemes[i] as any;
      const isActive = i === 0;
      await query(
        `INSERT INTO tenant_themes (id, tenant_id, theme_id, is_active)
         VALUES (?, ?, ?, ?)`,
        [uuidv4(), tenantId, theme.id, isActive]
      );
    }

    res.json({
      success: true,
      message: "Demo data seeded successfully",
      data: {
        tenantId,
        adminEmail: "akscrackerssample@gmail.com",
        productsAdded: products.length,
        ordersAdded: sampleOrders.length,
        discountCode: "SAVE10",
        themesAssigned: allThemes.length,
      },
    });
  } catch (error) {
    console.error("Seed demo data error:", error);
    res.status(500).json({ error: "Failed to seed data" });
  }
};

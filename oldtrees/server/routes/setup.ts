import { RequestHandler } from "express";
import { query } from "../db";
import { generateTenantId, generateProductId, generateUserId, hashPassword } from "../auth";
import { v4 as uuidv4 } from "uuid";

export const setupDemo: RequestHandler = async (req, res) => {
  try {
    // Check if demo tenant already exists
    const existingTenant = await query(
      "SELECT id FROM tenants WHERE id = ?",
      ["demo"]
    );

    if (Array.isArray(existingTenant) && existingTenant.length > 0) {
      res.json({ success: true, message: "Demo tenant already exists" });
      return;
    }

    // Create demo tenant
    const tenantId = "demo";
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

    // Create tenant admin user
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

    // Add sample products
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
    }

    // Get all themes and assign them to the demo tenant
    const themes = await query("SELECT id FROM themes");
    if (Array.isArray(themes)) {
      for (let i = 0; i < themes.length; i++) {
        const theme = themes[i] as any;
        const isActive = i === 0; // Make the first theme active by default
        await query(
          `INSERT INTO tenant_themes (id, tenant_id, theme_id, is_active)
           VALUES (?, ?, ?, ?)`,
          [uuidv4(), tenantId, theme.id, isActive]
        );
      }
    }

    res.json({
      success: true,
      message: "Demo tenant, user, products, and themes created successfully",
      data: {
        tenantId,
        email: "akscrackerssample@gmail.com",
        password: "Podapunda1@#",
        products: products.length,
      },
    });
  } catch (error) {
    console.error("Setup demo error:", error);
    res.status(500).json({ error: "Failed to setup demo" });
  }
};

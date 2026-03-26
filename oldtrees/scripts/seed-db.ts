import "dotenv/config";
import mysql from "mysql2/promise";
import { v4 as uuidv4 } from "uuid";
import bcryptjs from "bcryptjs";
import { initializeDatabase } from "../server/db";

const poolConfig: any = {
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || "3306"),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  waitForConnections: true,
  connectionLimit: 100,
  queueLimit: 0,
};

// Only enable SSL if explicitly requested (default is disabled for local/dev databases)
if (process.env.DATABASE_SSL === "true") {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = mysql.createPool(poolConfig);

async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 10);
}

// Sample tenants with different domains
const sampleTenants = [
  {
    id: "demo",
    companyName: "Online Crackers Store",
    domain: "demo.local",
    contactEmail: "admin@crackerstore.local",
    contactPhone: "+91-9876543210",
    billingPlan: "premium",
    adminEmail: "admin@crackerstore.local",
    adminPassword: "Admin@123456",
  },
  {
    id: "flowers",
    companyName: "Flower Shop Online",
    domain: "flowers.local",
    contactEmail: "admin@flowershop.local",
    contactPhone: "+91-9876543211",
    billingPlan: "professional",
    adminEmail: "admin@flowershop.local",
    adminPassword: "Admin@123456",
  },
  {
    id: "electronics",
    companyName: "Electronics Store",
    domain: "electronics.local",
    contactEmail: "admin@electrostore.local",
    contactPhone: "+91-9876543212",
    billingPlan: "enterprise",
    adminEmail: "admin@electrostore.local",
    adminPassword: "Admin@123456",
  },
];

async function seedDatabase() {
  const connection = await pool.getConnection();
  try {
    console.log("🌱 Starting database seed...\n");

    // Initialize database schema (creates tables if they don't exist)
    console.log("📋 Initializing database schema...");
    await initializeDatabase();
    console.log("✅ Database schema ready\n");

    // Create super admin user
    const [superAdminExists] = await connection.execute(
      "SELECT id FROM users WHERE email = ? AND role = ?",
      ["admin@platform.com", "super-admin"]
    );

    if (!Array.isArray(superAdminExists) || superAdminExists.length === 0) {
      const adminId = uuidv4();
      const passwordHash = await hashPassword("admin123");

      await connection.execute(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [adminId, "admin@platform.com", passwordHash, "Super", "Admin", "super-admin", true]
      );
      console.log("✅ Super Admin created");
      console.log("   Email: admin@platform.com");
      console.log("   Password: admin123\n");
    } else {
      console.log("⏭️  Super Admin already exists\n");
    }

    // Create sample tenants
    for (const tenant of sampleTenants) {
      const [tenantExists] = await connection.execute(
        "SELECT id FROM tenants WHERE id = ?",
        [tenant.id]
      );

      if (Array.isArray(tenantExists) && tenantExists.length > 0) {
        console.log(`⏭️  Tenant "${tenant.companyName}" already exists\n`);
        continue;
      }

      // Create tenant
      await connection.execute(
        `INSERT INTO tenants (id, company_name, domain, contact_email, contact_phone, billing_plan, subscription_status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          tenant.id,
          tenant.companyName,
          tenant.domain,
          tenant.contactEmail,
          tenant.contactPhone,
          tenant.billingPlan,
          "active",
        ]
      );
      console.log(`✅ Tenant created: ${tenant.companyName}`);
      console.log(`   Domain: ${tenant.domain}`);
      console.log(`   Billing Plan: ${tenant.billingPlan}`);

      // Create tenant admin user
      const adminId = uuidv4();
      const passwordHash = await hashPassword(tenant.adminPassword);
      await connection.execute(
        `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          adminId,
          tenant.id,
          tenant.adminEmail,
          passwordHash,
          "Tenant",
          "Admin",
          "admin",
          true,
        ]
      );
      console.log(`✅ Admin user created`);
      console.log(`   Email: ${tenant.adminEmail}`);
      console.log(`   Password: ${tenant.adminPassword}\n`);

      // Add sample products based on store type
      let products = [];
      if (tenant.id === "demo") {
        products = [
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
      } else if (tenant.id === "flowers") {
        products = [
          {
            name: "Red Rose Bouquet",
            description: "Beautiful dozen red roses",
            price: 1299,
            stock_quantity: 30,
            category: "Bouquets",
          },
          {
            name: "Sunflower Arrangement",
            description: "Bright sunflower arrangement in a vase",
            price: 899,
            stock_quantity: 25,
            category: "Arrangements",
          },
          {
            name: "Mixed Seasonal Flowers",
            description: "Assorted seasonal flowers",
            price: 1499,
            stock_quantity: 20,
            category: "Arrangements",
          },
          {
            name: "Lily Bouquet",
            description: "Elegant white lilies",
            price: 1099,
            stock_quantity: 35,
            category: "Bouquets",
          },
          {
            name: "Orchid Plant",
            description: "Exotic orchid plant",
            price: 1599,
            stock_quantity: 15,
            category: "Plants",
          },
        ];
      } else if (tenant.id === "electronics") {
        products = [
          {
            name: "Wireless Headphones",
            description: "Premium noise-cancelling wireless headphones",
            price: 4999,
            stock_quantity: 50,
            category: "Audio",
          },
          {
            name: "USB-C Cable",
            description: "Durable 2-meter USB-C charging cable",
            price: 299,
            stock_quantity: 200,
            category: "Cables",
          },
          {
            name: "Phone Stand",
            description: "Adjustable portable phone stand",
            price: 599,
            stock_quantity: 100,
            category: "Accessories",
          },
          {
            name: "Screen Protector",
            description: "Tempered glass screen protector",
            price: 399,
            stock_quantity: 150,
            category: "Protection",
          },
          {
            name: "Power Bank 20000mAh",
            description: "Fast charging power bank with dual ports",
            price: 1999,
            stock_quantity: 60,
            category: "Charging",
          },
        ];
      }

      const productIds: string[] = [];
      for (const product of products) {
        const productId = uuidv4();
        const sku = `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await connection.execute(
          `INSERT INTO products (id, tenant_id, name, description, sku, price, category, stock_quantity, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            productId,
            tenant.id,
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
      console.log(`✅ ${products.length} sample products created`);

      // Create sample orders
      const sampleOrders = [
        {
          customerName: "Sample Customer",
          customerEmail: "customer@example.com",
          customerPhone: "9999999999",
          items: [{ productId: productIds[0], quantity: 1 }],
          status: "pending",
        },
        {
          customerName: "John Doe",
          customerEmail: "john.doe@example.com",
          customerPhone: "9876543210",
          items: [
            { productId: productIds[1], quantity: 2 },
            { productId: productIds[2] || productIds[0], quantity: 1 },
          ],
          status: "processing",
        },
        {
          customerName: "Jane Smith",
          customerEmail: "jane.smith@example.com",
          customerPhone: "9765432109",
          items: [{ productId: productIds[3] || productIds[0], quantity: 1 }],
          status: "shipped",
        },
      ];

      for (const orderData of sampleOrders) {
        const orderId = uuidv4();
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        const customerId = uuidv4();

        let totalAmount = 0;
        for (const item of orderData.items) {
          const [priceResult] = await connection.execute(
            "SELECT price FROM products WHERE id = ?",
            [item.productId]
          );
          if (Array.isArray(priceResult) && priceResult.length > 0) {
            totalAmount += (priceResult[0] as any).price * item.quantity;
          }
        }

        await connection.execute(
          `INSERT INTO customers (id, tenant_id, email, first_name, total_orders, total_spent)
           VALUES (?, ?, ?, ?, 1, ?)`,
          [customerId, tenant.id, orderData.customerEmail, orderData.customerName, totalAmount]
        );

        await connection.execute(
          `INSERT INTO orders (id, tenant_id, order_number, customer_email, customer_name, customer_phone, total_amount, status, shipping_address, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            orderId,
            tenant.id,
            orderNumber,
            orderData.customerEmail,
            orderData.customerName,
            orderData.customerPhone,
            totalAmount,
            orderData.status,
            JSON.stringify({ address: "Sample Address, City" }),
          ]
        );

        for (const item of orderData.items) {
          const [priceResult] = await connection.execute(
            "SELECT price, name FROM products WHERE id = ?",
            [item.productId]
          );
          if (Array.isArray(priceResult) && priceResult.length > 0) {
            const itemId = uuidv4();
            const price = (priceResult[0] as any).price;
            const productName = (priceResult[0] as any).name;
            const itemTotal = price * item.quantity;

            await connection.execute(
              `INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price, total_price)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [itemId, orderId, item.productId, productName, item.quantity, price, itemTotal]
            );
          }
        }
      }
      console.log(`✅ ${sampleOrders.length} sample orders created`);

      // Create sample discount code
      try {
        const discountId = uuidv4();
        await connection.execute(
          `INSERT INTO discounts (id, tenant_id, code, discount_type, discount_value, min_order_amount, max_uses, used_count, is_active, valid_from, valid_until)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR))`,
          [discountId, tenant.id, "WELCOME10", "percentage", 10, 0, null, 0, true]
        );
        console.log("✅ Sample discount code created: WELCOME10 (10% off)\n");
      } catch (error: any) {
        if (error.code !== "ER_DUP_ENTRY") {
          console.warn("⚠️  Could not create discount code:", error.message);
        }
      }

      // Assign themes to tenant
      const [themes] = await connection.execute("SELECT id FROM themes");
      if (Array.isArray(themes) && themes.length > 0) {
        for (let i = 0; i < themes.length; i++) {
          const theme = themes[i] as any;
          const isActive = i === 0;
          try {
            await connection.execute(
              `INSERT INTO tenant_themes (id, tenant_id, theme_id, is_active)
               VALUES (?, ?, ?, ?)`,
              [uuidv4(), tenant.id, theme.id, isActive]
            );
          } catch (error: any) {
            if (error.code !== "ER_DUP_ENTRY") {
              // Theme already assigned
            }
          }
        }
      }
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 Database seed completed successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n📝 Login Credentials:\n");
    console.log("SUPER ADMIN:");
    console.log("  URL: http://localhost:8080/auth/super-admin-login");
    console.log("  Email: admin@platform.com");
    console.log("  Password: admin123\n");
    console.log("TENANT ADMINS:");
    for (const tenant of sampleTenants) {
      console.log(`\n  ${tenant.companyName}:`);
      console.log(`  URL: http://localhost:8080/auth/login`);
      console.log(`  Email: ${tenant.adminEmail}`);
      console.log(`  Password: ${tenant.adminPassword}`);
      console.log(`  Domain: ${tenant.domain}`);
    }
    console.log("\n📝 Domain Configuration:\n");
    console.log("For testing with custom domains on localhost, add these entries to your hosts file:");
    console.log("(On Windows: C:\\Windows\\System32\\drivers\\etc\\hosts, On Mac/Linux: /etc/hosts)\n");
    for (const tenant of sampleTenants) {
      console.log(`  127.0.0.1  ${tenant.domain}`);
    }
    console.log("\n⚙️  Super Admin Features:");
    console.log("  - View all clients and their statistics");
    console.log("  - Create, edit, suspend, and reactivate clients");
    console.log("  - Manage client domains easily");
    console.log("  - View billing and analytics");
    console.log("  - Manage themes and assign to clients\n");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

seedDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

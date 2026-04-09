import mysql from "mysql2/promise";
import "dotenv/config";

const poolConfig: any = {
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || "3306"),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  waitForConnections: true,
  connectionLimit: 100,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 30000,
};

// Only enable SSL if explicitly requested (default is disabled for local/dev databases)
if (process.env.DATABASE_SSL === "true") {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = mysql.createPool(poolConfig);

export async function getConnection() {
  const connection = await pool.getConnection();
  return connection;
}

export async function query(sql: string, values?: any[]) {
  let connection;
  try {
    connection = await getConnection();
    const [results] = await connection.execute(sql, values || []);
    return results;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}




export async function initializeDatabase() {
  const connection = await getConnection();
  try {
    // Create tenants table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tenants (
        id VARCHAR(36) PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        domain VARCHAR(255) UNIQUE NOT NULL,
        contact_email VARCHAR(255) NOT NULL,
        contact_phone VARCHAR(20),
        billing_plan VARCHAR(50) DEFAULT 'starter',
        subscription_status VARCHAR(50) DEFAULT 'active',
        subscription_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        renewal_date DATETIME,
        api_key VARCHAR(255) UNIQUE,
        is_suspended BOOLEAN DEFAULT FALSE,
        is_maintenance_mode BOOLEAN DEFAULT FALSE,
        image_storage_type VARCHAR(50) DEFAULT 'local',
        s3_bucket VARCHAR(255),
        s3_region VARCHAR(50),
        current_theme_id VARCHAR(36),
        seo_title VARCHAR(255),
        seo_description VARCHAR(600),
        seo_keywords VARCHAR(500),
        gtag_id VARCHAR(255),
        search_console_meta VARCHAR(500),
        favicon_url VARCHAR(500),
        min_order_amount DECIMAL(10,2) DEFAULT 0,
        announcement_message LONGTEXT,
        youtube_url VARCHAR(500),
        instagram_url VARCHAR(500),
        facebook_url VARCHAR(500),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_domain (domain),
        INDEX idx_api_key (api_key),
        INDEX idx_status (subscription_status)
      )
    `);

    // Ensure legacy DB has current_theme_id column
    try {
      const [cols] = await connection.execute(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tenants' AND COLUMN_NAME = 'current_theme_id'",
        [poolConfig.database]
      );
      if (!Array.isArray(cols) || (cols as any).length === 0) {
        await connection.execute("ALTER TABLE tenants ADD COLUMN current_theme_id VARCHAR(36)");
        console.log('Added missing column tenants.current_theme_id');
      }
    } catch (err) {
      console.warn('Could not ensure current_theme_id column:', err);
    }

    // Ensure tenants table has min_order_amount and SEO related columns
    try {
      const columnsToAdd = [
        { name: 'min_order_amount', type: 'DECIMAL(10,2) DEFAULT 0' },
        { name: 'is_maintenance_mode', type: 'BOOLEAN DEFAULT FALSE' },
        { name: 'seo_title', type: 'VARCHAR(255)' },
        { name: 'seo_description', type: 'VARCHAR(600)' },
        { name: 'seo_keywords', type: 'VARCHAR(500)' },
        { name: 'gtag_id', type: 'VARCHAR(255)' },
        { name: 'search_console_meta', type: 'VARCHAR(500)' },
        { name: 'favicon_url', type: 'VARCHAR(500)' },
        { name: 'announcement_message', type: 'LONGTEXT' },
        { name: 'youtube_url', type: 'VARCHAR(500)' },
        { name: 'instagram_url', type: 'VARCHAR(500)' },
        { name: 'facebook_url', type: 'VARCHAR(500)' },
        { name: 'logo_url', type: 'VARCHAR(500)' }
      ];

      for (const col of columnsToAdd) {
        try {
          const [cols] = await connection.execute(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tenants' AND COLUMN_NAME = ?",
            [poolConfig.database, col.name]
          );
          if (!Array.isArray(cols) || cols.length === 0) {
            await connection.execute(`ALTER TABLE tenants ADD COLUMN ${col.name} ${col.type}`);
            console.log(`Added missing column tenants.${col.name}`);
          }
        } catch (err) {
          console.warn(`Could not ensure column ${col.name}:`, err);
        }
      }
    } catch (err) {
      console.warn('Could not ensure tenant columns:', err);
    }

    // Create hero_sliders table for theme hero/banner management
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS hero_sliders (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        title VARCHAR(255),
        subtitle VARCHAR(500),
        cta_text VARCHAR(100),
        cta_url VARCHAR(500),
        sort_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tenant (tenant_id),
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      )
    `);


       // Create feature categories table for super-admin management
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS feature_categories (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        categories LONGTEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_feature_category_name (name)
      )
    `);

  // Create pricing plans table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS pricing (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description VARCHAR(500),
        price DECIMAL(10, 2),
        currency VARCHAR(10) DEFAULT '₹',
        billing_period VARCHAR(50) NOT NULL,
        features LONGTEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_is_active (is_active),
        UNIQUE KEY unique_name (name)
      )
    `);


    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tenant (tenant_id),
        INDEX idx_email (email),
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      )
    `);

    // Create staff_members table (team members with different permissions)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS staff_members (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(50) NOT NULL DEFAULT 'editor',
        permissions LONGTEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tenant (tenant_id),
        INDEX idx_email (email),
        UNIQUE KEY unique_tenant_email (tenant_id, email),
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      )
    `);

    // Ensure staff_members table has password_hash column
    try {
      const [cols] = await connection.execute(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'staff_members' AND COLUMN_NAME = 'password_hash'",
        [poolConfig.database]
      );
      if (!Array.isArray(cols) || (cols as any).length === 0) {
        await connection.execute("ALTER TABLE staff_members ADD COLUMN password_hash VARCHAR(255)");
        console.log('Added missing column staff_members.password_hash');
      }
    } catch (err) {
      console.warn('Could not ensure password_hash column on staff_members:', err);
    }

    // Create products table with optimized indexes
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description LONGTEXT,
        sku VARCHAR(100) NOT NULL UNIQUE,
        price DECIMAL(10, 2) NOT NULL,
        cost_price DECIMAL(10, 2),
        category VARCHAR(100),
        stock_quantity INT DEFAULT 0,
        low_stock_alert INT DEFAULT 10,
        image_url VARCHAR(500),
        image_storage_type VARCHAR(50) DEFAULT 'local',
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tenant (tenant_id),
        INDEX idx_sku (sku),
        INDEX idx_category (category),
        INDEX idx_tenant_active (tenant_id, is_active),
        INDEX idx_tenant_created (tenant_id, created_at DESC),
        INDEX idx_tenant_category (tenant_id, category),
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      )
    `);

    // Create categories table to manage product categories per tenant
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        name VARCHAR(150) NOT NULL,
        slug VARCHAR(150) NOT NULL,
        description VARCHAR(500),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tenant (tenant_id),
        UNIQUE KEY unique_tenant_category (tenant_id, slug),
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      )
    `);

    // Create orders table with optimized indexes
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        customer_email VARCHAR(255),
        customer_name VARCHAR(255),
        customer_phone VARCHAR(20),
        status VARCHAR(50) DEFAULT 'pending',
        total_amount DECIMAL(10, 2) NOT NULL,
        discount_amount DECIMAL(10, 2) DEFAULT 0,
        tax_amount DECIMAL(10, 2) DEFAULT 0,
        shipping_address LONGTEXT,
        payment_status VARCHAR(50) DEFAULT 'pending',
        payment_method VARCHAR(50),
        transaction_id VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        shipped_at DATETIME,
        delivered_at DATETIME,
        INDEX idx_tenant (tenant_id),
        INDEX idx_order_number (order_number),
        INDEX idx_status (status),
        INDEX idx_customer_email (customer_email),
        INDEX idx_tenant_status_created (tenant_id, status, created_at DESC),
        INDEX idx_tenant_created (tenant_id, created_at DESC),
        INDEX idx_tenant_customer_email (tenant_id, customer_email),
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      )
    `);

    // Create order_items table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id VARCHAR(36) PRIMARY KEY,
        order_id VARCHAR(36) NOT NULL,
        product_id VARCHAR(36) NOT NULL,
        product_name VARCHAR(255),
        quantity INT NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_order (order_id),
        INDEX idx_product (product_id),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Ensure order_items table has product_name column
    try {
      const [cols] = await connection.execute(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'product_name'",
        [poolConfig.database]
      );
      if (!Array.isArray(cols) || (cols as any).length === 0) {
        await connection.execute("ALTER TABLE order_items ADD COLUMN product_name VARCHAR(255)");
        console.log('Added missing column order_items.product_name');
      }
    } catch (err) {
      console.warn('Could not ensure product_name column on order_items:', err);
    }

    // Create customers table with optimized indexes
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        email VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        address LONGTEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        postal_code VARCHAR(20),
        country VARCHAR(100),
        total_spent DECIMAL(10, 2) DEFAULT 0,
        total_orders INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tenant (tenant_id),
        INDEX idx_email (email),
        INDEX idx_tenant_email (tenant_id, email),
        INDEX idx_tenant_created (tenant_id, created_at DESC),
        INDEX idx_tenant_total_spent (tenant_id, total_spent DESC),
        UNIQUE KEY unique_tenant_email (tenant_id, email),
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      )
    `);

    // Create discounts table with optimized indexes
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS discounts (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        code VARCHAR(100) NOT NULL,
        description VARCHAR(255),
        discount_type VARCHAR(50),
        discount_value DECIMAL(10, 2),
        min_order_amount DECIMAL(10, 2),
        max_uses INT,
        used_count INT DEFAULT 0,
        valid_from DATETIME,
        valid_until DATETIME,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tenant (tenant_id),
        INDEX idx_code (code),
        INDEX idx_tenant_code (tenant_id, code),
        INDEX idx_tenant_active (tenant_id, is_active),
        UNIQUE KEY unique_tenant_code (tenant_id, code),
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      )
    `);

    // Create themes table (pre-built theme designs)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS themes (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description LONGTEXT,
        primary_color VARCHAR(10) DEFAULT '#3b82f6',
        secondary_color VARCHAR(10) DEFAULT '#a855f7',
        font_family VARCHAR(100) DEFAULT 'Inter',
        layout_type VARCHAR(50) NOT NULL,
        template_html LONGTEXT,
        preview_url VARCHAR(500),
        is_system_theme BOOLEAN DEFAULT TRUE,
        is_active BOOLEAN DEFAULT TRUE,
        created_by VARCHAR(36),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_is_active (is_active)
      )
    `);

    // Create tenant_themes table (many-to-many) with optimized indexes
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tenant_themes (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        theme_id VARCHAR(36) NOT NULL,
        is_active BOOLEAN DEFAULT FALSE,
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_tenant (tenant_id),
        INDEX idx_theme (theme_id),
        INDEX idx_tenant_active (tenant_id, is_active),
        UNIQUE KEY unique_tenant_theme (tenant_id, theme_id),
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE
      )
    `);

    // Create transactions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        order_id VARCHAR(36),
        transaction_type VARCHAR(50),
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        payment_gateway VARCHAR(50),
        gateway_transaction_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tenant (tenant_id),
        INDEX idx_order (order_id),
        INDEX idx_status (status),
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id)
      )
    `);

    // Create pages table for storefront pages with optimized indexes
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS pages (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        description LONGTEXT,
        content LONGTEXT,
        seo_title VARCHAR(255),
        seo_description VARCHAR(600),
        seo_keywords VARCHAR(500),
        featured_image_url VARCHAR(500),
        is_published BOOLEAN DEFAULT FALSE,
        publish_date DATETIME,
        created_by VARCHAR(36),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tenant (tenant_id),
        INDEX idx_slug (slug),
        INDEX idx_published (is_published),
        INDEX idx_tenant_published (tenant_id, is_published),
        INDEX idx_tenant_slug (tenant_id, slug),
        UNIQUE KEY unique_tenant_slug (tenant_id, slug),
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      )
    `);

    // Create blog_posts table for blog functionality with optimized indexes
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        excerpt VARCHAR(600),
        content LONGTEXT,
        featured_image_url VARCHAR(500),
        category VARCHAR(100),
        tags VARCHAR(500),
        seo_title VARCHAR(255),
        seo_description VARCHAR(600),
        seo_keywords VARCHAR(500),
        author_id VARCHAR(36),
        is_published BOOLEAN DEFAULT FALSE,
        publish_date DATETIME,
        views_count INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tenant (tenant_id),
        INDEX idx_slug (slug),
        INDEX idx_category (category),
        INDEX idx_published (is_published),
        INDEX idx_publish_date (publish_date),
        INDEX idx_tenant_published_date (tenant_id, is_published, publish_date DESC),
        INDEX idx_tenant_slug (tenant_id, slug),
        INDEX idx_tenant_category (tenant_id, category),
        UNIQUE KEY unique_tenant_slug (tenant_id, slug),
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      )
    `);

    // Create footer_sections table for footer configuration
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS footer_sections (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        section_name VARCHAR(100) NOT NULL,
        is_enabled BOOLEAN DEFAULT TRUE,
        section_data LONGTEXT,
        sort_order INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tenant (tenant_id),
        UNIQUE KEY unique_tenant_section (tenant_id, section_name),
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      )
    `);

    // Create contact_us table for managing contact information
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS contact_us (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL UNIQUE,
        email VARCHAR(255),
        phone VARCHAR(20),
        address LONGTEXT,
        working_hours LONGTEXT,
        map_code LONGTEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tenant (tenant_id),
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      )
    `);

    // Ensure contact_us table has map_code column
    try {
      const [cols] = await connection.execute(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'contact_us' AND COLUMN_NAME = 'map_code'",
        [poolConfig.database]
      );
      if (!Array.isArray(cols) || (cols as any).length === 0) {
        await connection.execute("ALTER TABLE contact_us ADD COLUMN map_code LONGTEXT");
        console.log('Added missing column contact_us.map_code');
      }
    } catch (err) {
      console.warn('Could not ensure map_code column:', err);
    }

    // Create payment_info table for managing payment information
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS payment_info (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL UNIQUE,
        bank_account_name VARCHAR(255),
        bank_account_number VARCHAR(50),
        bank_name VARCHAR(255),
        ifsc_code VARCHAR(20),
        branch VARCHAR(255),
        gpay_name VARCHAR(255),
        gpay_number VARCHAR(20),
        upi_name VARCHAR(255),
        upi_id VARCHAR(255),
        upi_image_url VARCHAR(500),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tenant (tenant_id),
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      )
    `);

    // Ensure payment_info table has upi_image_url column
    try {
      const [cols] = await connection.execute(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'payment_info' AND COLUMN_NAME = 'upi_image_url'",
        [poolConfig.database]
      );
      if (!Array.isArray(cols) || (cols as any).length === 0) {
        await connection.execute("ALTER TABLE payment_info ADD COLUMN upi_image_url VARCHAR(500)");
        console.log('Added missing column payment_info.upi_image_url');
      }
    } catch (err) {
      console.warn('Could not ensure upi_image_url column:', err);
    }

    // Create payment_images table for multiple payment method images
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS payment_images (
        id VARCHAR(36) PRIMARY KEY,
        payment_info_id VARCHAR(36) NOT NULL,
        tenant_id VARCHAR(36) NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        image_type VARCHAR(50),
        display_order INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_payment_info (payment_info_id),
        INDEX idx_tenant (tenant_id),
        FOREIGN KEY (payment_info_id) REFERENCES payment_info(id) ON DELETE CASCADE,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      )
    `);

    // Create email_settings table for SMTP configuration and email notifications
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS email_settings (
        id VARCHAR(36) PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL UNIQUE,
        smtp_host VARCHAR(255),
        smtp_port INT,
        smtp_username VARCHAR(255),
        smtp_password VARCHAR(500),
        sender_email VARCHAR(255),
        target_email VARCHAR(255),
        email_notify_enabled BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tenant (tenant_id),
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      )
    `);

    // Seed super admin if not exists
    const [superAdminExists] = await connection.execute(
      "SELECT id FROM users WHERE email = ? AND role = ?",
      ["admin@platform.com", "super-admin"]
    );

    if (!Array.isArray(superAdminExists) || superAdminExists.length === 0) {
      const { hashPassword, generateUserId } = await import("./auth");
      const adminId = generateUserId();
      const passwordHash = await hashPassword("admin123");

      await connection.execute(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [adminId, "admin@platform.com", passwordHash, "Super", "Admin", "super-admin", true]
      );
      console.log("✅ Super admin created: admin@platform.com / admin123");
    }

    // Add is_system_theme column if it doesn't exist
    try {
      await connection.execute(
        "ALTER TABLE themes ADD COLUMN is_system_theme BOOLEAN DEFAULT TRUE"
      );
    } catch (error: any) {
      // Column might already exist, continue
      if (error.code !== "ER_DUP_FIELDNAME") {
        console.log("is_system_theme column already exists");
      }
    }

    // Seed pre-built themes if not exists
    const [themesExist] = await connection.execute(
      "SELECT id FROM themes LIMIT 1"
    );

    if (!Array.isArray(themesExist) || themesExist.length === 0) {
      const { v4: uuidv4 } = await import("uuid");

      const preBuiltThemes = [
        {
          id: uuidv4(),
          name: "Modern",
          description: "Clean and contemporary design with minimalist approach",
          layout_type: "grid",
          primary_color: "#3b82f6",
          secondary_color: "#a855f7",
          font_family: "Inter",
        },
        {
          id: uuidv4(),
          name: "Festive Red",
          description: "Vibrant red theme perfect for celebrations and festivals",
          layout_type: "grid",
          primary_color: "#dc2626",
          secondary_color: "#fbbf24",
          font_family: "Poppins",
        },
        {
          id: uuidv4(),
          name: "Golden Glow",
          description: "Premium golden theme with elegant dark accents",
          layout_type: "grid",
          primary_color: "#d97706",
          secondary_color: "#1f2937",
          font_family: "Playfair Display",
        },
        {
          id: uuidv4(),
          name: "Celebration Blue",
          description: "Cool blue tones with vibrant accents for modern celebrations",
          layout_type: "grid",
          primary_color: "#0ea5e9",
          secondary_color: "#06b6d4",
          font_family: "Poppins",
        },
        {
          id: uuidv4(),
          name: "Classic",
          description: "Traditional business design with elegant styling",
          layout_type: "list",
          primary_color: "#1e40af",
          secondary_color: "#7c2d12",
          font_family: "Georgia",
        },
        {
          id: uuidv4(),
          name: "Minimal",
          description: "Simple and focused experience with white space",
          layout_type: "grid",
          primary_color: "#000000",
          secondary_color: "#6b7280",
          font_family: "Helvetica",
        },
        {
          id: uuidv4(),
          name: "Bold",
          description: "Vibrant colors and modern typography",
          layout_type: "carousel",
          primary_color: "#9333ea",
          secondary_color: "#ec4899",
          font_family: "Poppins",
        },
        {
          id: uuidv4(),
          name: "Elegant",
          description: "Premium look with sophisticated colors",
          layout_type: "grid",
          primary_color: "#4c1d95",
          secondary_color: "#06b6d4",
          font_family: "Playfair Display",
        },
        {
          id: uuidv4(),
          name: "Night Sky",
          description: "Dark theme with golden accents for premium experience",
          layout_type: "grid",
          primary_color: "#1e293b",
          secondary_color: "#fbbf24",
          font_family: "Inter",
        },
      ];

      for (const theme of preBuiltThemes) {
        await connection.execute(
          `INSERT INTO themes (id, name, description, primary_color, secondary_color, font_family, layout_type, is_system_theme, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, TRUE)`,
          [
            theme.id,
            theme.name,
            theme.description,
            theme.primary_color,
            theme.secondary_color,
            theme.font_family,
            theme.layout_type,
          ]
        );
      }
      console.log("✅ Pre-built themes created (Modern, Festive Red, Golden Glow, Celebration Blue, Classic, Minimal, Bold, Elegant, Night Sky)");
    }

    // Seed demo tenant if not exists
    const [demoTenantExists] = await connection.execute(
      "SELECT id FROM tenants WHERE id = ?",
      ["demo"]
    );

    if (!Array.isArray(demoTenantExists) || demoTenantExists.length === 0) {
      const { hashPassword, generateUserId, generateProductId, generateOrderId, generateOrderNumber, generateCustomerId } = await import("./auth");
      const { v4: uuidv4 } = await import("uuid");

      const tenantId = "demo";

      // Create demo tenant
      await connection.execute(
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
      await connection.execute(
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

      const productIds: string[] = [];
      for (const product of products) {
        const productId = generateProductId();
        const sku = `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await connection.execute(
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
          const result = await connection.execute(
            "SELECT price FROM products WHERE id = ?",
            [item.productId]
          );
          const [rows] = result as any;
          if (Array.isArray(rows) && rows.length > 0) {
            totalAmount += (rows[0] as any).price * item.quantity;
          }
        }

        await connection.execute(
          `INSERT INTO customers (id, tenant_id, email, first_name, total_orders, total_spent)
           VALUES (?, ?, ?, ?, 1, ?)`,
          [customerId, tenantId, orderData.customerEmail, orderData.customerName, totalAmount]
        );

        await connection.execute(
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
          const result = await connection.execute(
            "SELECT price, name FROM products WHERE id = ?",
            [item.productId]
          );
          const [rows] = result as any;
          if (Array.isArray(rows) && rows.length > 0) {
            const itemId = uuidv4();
            const price = (rows[0] as any).price;
            const productName = (rows[0] as any).name;
            const itemTotal = price * item.quantity;

            await connection.execute(
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
        await connection.execute(
          `INSERT INTO discounts (id, tenant_id, code, discount_type, discount_value, min_order_amount, max_uses, used_count, is_active, valid_from, valid_until)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR))`,
          [discountId, tenantId, "SAVE10", "percentage", 10, 0, null, 0, true]
        );
        console.log("✅ Sample discount code SAVE10 created");
      } catch (error: any) {
        if (error.code !== "ER_DUP_ENTRY") {
          console.warn("Could not create discount code:", error);
        }
      }

      // Assign themes to demo tenant
      const [themes] = await connection.execute("SELECT id FROM themes");
      if (Array.isArray(themes)) {
        for (let i = 0; i < themes.length; i++) {
          const theme = themes[i] as any;
          const isActive = i === 0; // Make the first theme (Modern) active by default
          try {
            await connection.execute(
              `INSERT INTO tenant_themes (id, tenant_id, theme_id, is_active)
               VALUES (?, ?, ?, ?)`,
              [uuidv4(), tenantId, theme.id, isActive]
            );
          } catch (error: any) {
            // Theme might already be assigned, continue
            if (error.code !== "ER_DUP_ENTRY") {
              console.error("Error assigning theme:", error);
            }
          }
        }
      }

      // Create sample contact us data
      try {
        const contactId = uuidv4();
        await connection.execute(
          `INSERT INTO contact_us (id, tenant_id, email, phone, address, working_hours)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            contactId,
            tenantId,
            "akscrackerssample@gmail.com",
            "+91-9876543210",
            "4/1434-27, Sattur Main Road, Tharaipuram, Sivakasi",
            JSON.stringify({
              monday_friday: "9:00 AM - 6:00 PM",
              saturday: "9:00 AM - 1:00 PM",
              sunday: "Closed"
            })
          ]
        );
        console.log("✅ Contact Us data created");
      } catch (error: any) {
        if (error.code !== "ER_DUP_ENTRY") {
          console.warn("Could not create Contact Us data:", error);
        }
      }

      // Create sample payment info data
      try {
        const paymentId = uuidv4();
        await connection.execute(
          `INSERT INTO payment_info (id, tenant_id, bank_account_name, bank_account_number, bank_name, ifsc_code, branch, gpay_name, gpay_number, upi_name, upi_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            paymentId,
            tenantId,
            "Crk",
            "4185969993341",
            "State Bank of India",
            "SBIN00000045",
            "Sivakasi",
            "kaviya",
            "99999xxxxx",
            "test",
            "9999999999@gopherrc"
          ]
        );
        console.log("✅ Payment Info data created");
      } catch (error: any) {
        if (error.code !== "ER_DUP_ENTRY") {
          console.warn("Could not create Payment Info data:", error);
        }
      }

      console.log("✅ Demo tenant created with products, discounts, themes, contact info and payment info");
    }

    console.log("Database initialized successfully!");
  } finally {
    connection.release();
  }
}

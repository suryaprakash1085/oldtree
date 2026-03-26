import { RequestHandler } from "express";
import { query } from "../db";
import { generateTenantId, generateApiKey } from "../auth";

export const getClients: RequestHandler = async (req, res) => {
  try {
    // Single optimized query with LEFT JOIN to get client stats - eliminates N+1
    const clients = await query(`
      SELECT
        t.id,
        t.company_name,
        t.contact_email,
        t.billing_plan,
        t.subscription_status,
        t.subscription_date,
        t.renewal_date,
        t.is_suspended,
        t.created_at,
        COALESCE(o.order_count, 0) as totalOrders,
        COALESCE(o.total_revenue, 0) as totalRevenue
      FROM tenants t
      LEFT JOIN (
        SELECT
          tenant_id,
          COUNT(*) as order_count,
          SUM(total_amount) as total_revenue
        FROM orders
        GROUP BY tenant_id
      ) o ON t.id = o.tenant_id
      ORDER BY t.created_at DESC
    `);

    res.json({ success: true, data: Array.isArray(clients) ? clients : [] });
  } catch (error) {
    console.error("Get clients error:", error);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
};

export const createClient: RequestHandler = async (req, res) => {
  try {
    const { companyName, domain, contactEmail, contactPhone, billingPlan } =
      req.body;

    if (!companyName || !contactEmail) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const tenantId = generateTenantId();
    const apiKey = generateApiKey();

    await query(
      `INSERT INTO tenants (id, company_name, domain, contact_email, contact_phone, billing_plan, api_key)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId,
        companyName,
        domain,
        contactEmail,
        contactPhone,
        billingPlan || "starter",
        apiKey,
      ],
    );

    // Assign all available themes to the new tenant
    try {
      const { v4: uuidv4 } = await import("uuid");
      const themes = await query("SELECT id FROM themes WHERE is_system_theme = TRUE ORDER BY created_at");
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
    } catch (err) {
      console.warn("Failed to assign themes to new client:", err);
      // Continue without themes - not critical for client creation
    }

    const newClient = await query("SELECT * FROM tenants WHERE id = ?", [
      tenantId,
    ]);

    res.json({
      success: true,
      data: Array.isArray(newClient) ? newClient[0] : null,
    });
  } catch (error) {
    console.error("Create client error:", error);
    res.status(500).json({ error: "Failed to create client" });
  }
};

export const updateClient: RequestHandler = async (req, res) => {
  try {
    const userRole = (req as any).role;
    const { clientId } = req.params;

    // Verify user is super-admin
    if (userRole !== "super-admin") {
      res.status(403).json({ error: "Unauthorized: Only super admins can update clients" });
      return;
    }

    if (!clientId) {
      res.status(400).json({ error: "Client ID is required" });
      return;
    }

    const { companyName, domain, contactEmail, contactPhone, billingPlan } =
      req.body;

    if (!companyName || !contactEmail) {
      res.status(400).json({ error: "Company name and contact email are required" });
      return;
    }

    // Verify client exists before updating
    const clientExists = await query(
      "SELECT id FROM tenants WHERE id = ?",
      [clientId]
    );

    if (!Array.isArray(clientExists) || clientExists.length === 0) {
      res.status(404).json({ error: "Client not found" });
      return;
    }

    // Check if domain is being changed and if it's already in use
    if (domain) {
      const existingDomain = await query(
        "SELECT id FROM tenants WHERE domain = ? AND id != ?",
        [domain, clientId]
      );

      if (Array.isArray(existingDomain) && existingDomain.length > 0) {
        res.status(409).json({ error: "Domain is already in use by another client" });
        return;
      }
    }

    await query(
      `UPDATE tenants SET
        company_name = ?, domain = ?, contact_email = ?, contact_phone = ?, billing_plan = ?, updated_at = NOW()
       WHERE id = ?`,
      [companyName, domain || null, contactEmail, contactPhone || null, billingPlan || "starter", clientId],
    );

    const updated = await query("SELECT * FROM tenants WHERE id = ?", [
      clientId,
    ]);

    res.json({
      success: true,
      data: Array.isArray(updated) ? updated[0] : null,
    });
  } catch (error) {
    console.error("Update client error:", error);
    res.status(500).json({ error: "Failed to update client" });
  }
};

export const suspendClient: RequestHandler = async (req, res) => {
  try {
    const { clientId } = req.params;

    await query("UPDATE tenants SET is_suspended = TRUE WHERE id = ?", [
      clientId,
    ]);

    res.json({ success: true, message: "Client suspended" });
  } catch (error) {
    console.error("Suspend client error:", error);
    res.status(500).json({ error: "Failed to suspend client" });
  }
};

export const reactivateClient: RequestHandler = async (req, res) => {
  try {
    const { clientId } = req.params;

    await query("UPDATE tenants SET is_suspended = FALSE WHERE id = ?", [
      clientId,
    ]);

    res.json({ success: true, message: "Client reactivated" });
  } catch (error) {
    console.error("Reactivate client error:", error);
    res.status(500).json({ error: "Failed to reactivate client" });
  }
};

export const deleteClient: RequestHandler = async (req, res) => {
  try {
    const userRole = (req as any).role;
    const { clientId } = req.params;

    // Verify user is super-admin
    if (userRole !== "super-admin") {
      res.status(403).json({ error: "Unauthorized: Only super admins can delete clients" });
      return;
    }

    if (!clientId) {
      res.status(400).json({ error: "Client ID is required" });
      return;
    }

    // Verify client exists before deleting
    const clientExists = await query(
      "SELECT id FROM tenants WHERE id = ?",
      [clientId]
    );

    if (!Array.isArray(clientExists) || clientExists.length === 0) {
      res.status(404).json({ error: "Client not found" });
      return;
    }

    // Delete all related data (cascaded delete)
    await query("DELETE FROM tenants WHERE id = ?", [clientId]);

    res.json({ success: true, message: "Client deleted successfully" });
  } catch (error) {
    console.error("Delete client error:", error);
    res.status(500).json({ error: "Failed to delete client" });
  }
};

export const getAnalytics: RequestHandler = async (req, res) => {
  try {
    const totalClients = await query(
      "SELECT COUNT(*) as count FROM tenants WHERE is_suspended = FALSE",
    );

    const totalOrders = await query(
      "SELECT COUNT(*) as count, SUM(total_amount) as totalRevenue FROM orders",
    );

    const activeStores = await query(
      "SELECT COUNT(DISTINCT tenant_id) as count FROM products WHERE is_active = TRUE",
    );

    const pendingOrders = await query(
      "SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'processing')",
    );

    const topClients = await query(`
      SELECT t.id, t.company_name, COUNT(o.id) as orderCount, SUM(o.total_amount) as revenue
      FROM tenants t
      LEFT JOIN orders o ON t.id = o.tenant_id
      GROUP BY t.id
      ORDER BY revenue DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        totalClients: Array.isArray(totalClients)
          ? (totalClients[0] as any).count
          : 0,
        totalOrders: Array.isArray(totalOrders)
          ? (totalOrders[0] as any).count
          : 0,
        totalRevenue: Array.isArray(totalOrders)
          ? (totalOrders[0] as any).totalRevenue
          : 0,
        activeStores: Array.isArray(activeStores)
          ? (activeStores[0] as any).count
          : 0,
        pendingOrders: Array.isArray(pendingOrders)
          ? (pendingOrders[0] as any).count
          : 0,
        topClients: Array.isArray(topClients) ? topClients : [],
      },
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
};

export const getThemes: RequestHandler = async (req, res) => {
  try {
    const themes = await query(
      "SELECT * FROM themes WHERE is_active = TRUE ORDER BY created_at DESC",
    );

    res.json({
      success: true,
      data: Array.isArray(themes) ? themes : [],
    });
  } catch (error) {
    console.error("Get themes error:", error);
    res.status(500).json({ error: "Failed to fetch themes" });
  }
};

export const createTheme: RequestHandler = async (req, res) => {
  try {
    const {
      name,
      description,
      primaryColor,
      secondaryColor,
      fontFamily,
      layoutType,
    } = req.body;

    if (!name) {
      res.status(400).json({ error: "Theme name required" });
      return;
    }

    const id = require("uuid").v4();

    await query(
      `INSERT INTO themes (id, name, description, primary_color, secondary_color, font_family, layout_type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        description,
        primaryColor,
        secondaryColor,
        fontFamily,
        layoutType,
      ],
    );

    const newTheme = await query("SELECT * FROM themes WHERE id = ?", [id]);

    res.json({
      success: true,
      data: Array.isArray(newTheme) ? newTheme[0] : null,
    });
  } catch (error) {
    console.error("Create theme error:", error);
    res.status(500).json({ error: "Failed to create theme" });
  }
};

export const assignThemeToClient: RequestHandler = async (req, res) => {
  try {
    const { clientId, themeId } = req.params;

    const id = require("uuid").v4();

    await query(
      `INSERT INTO tenant_themes (id, tenant_id, theme_id, is_active)
       VALUES (?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE is_active = TRUE`,
      [id, clientId, themeId],
    );

    res.json({ success: true, message: "Theme assigned to client" });
  } catch (error) {
    console.error("Assign theme error:", error);
    res.status(500).json({ error: "Failed to assign theme" });
  }
};

export const getBilling: RequestHandler = async (req, res) => {
  try {
    const billingData = await query(`
      SELECT 
        t.id,
        t.company_name,
        t.billing_plan,
        t.subscription_date,
        t.renewal_date,
        COUNT(o.id) as totalOrders,
        SUM(o.total_amount) as totalRevenue
      FROM tenants t
      LEFT JOIN orders o ON t.id = o.tenant_id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `);

    res.json({
      success: true,
      data: Array.isArray(billingData) ? billingData : [],
    });
  } catch (error) {
    console.error("Get billing error:", error);
    res.status(500).json({ error: "Failed to fetch billing data" });
  }
};

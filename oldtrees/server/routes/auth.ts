import { RequestHandler } from "express";
import { query } from "../db";
import {
  generateToken,
  hashPassword,
  comparePassword,
  generateTenantId,
  generateUserId,
  generateApiKey,
} from "../auth";

export const handleSignup: RequestHandler = async (req, res) => {
  try {
    const { firstName, lastName, companyName, email, password } = req.body;

    if (!email || !password || !companyName) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const existingUser = await query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);

    if (Array.isArray(existingUser) && existingUser.length > 0) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    const tenantId = generateTenantId();
    const userId = generateUserId();
    const apiKey = generateApiKey();
    const passwordHash = await hashPassword(password);
    const domain = companyName.toLowerCase().replace(/\s+/g, "-") + "-" + tenantId.substring(0, 8);

    await query(
      `INSERT INTO tenants (id, company_name, domain, contact_email, api_key, billing_plan, subscription_status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, companyName, domain, email, apiKey, "starter", "active"],
    );

    await query(
      `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, tenantId, email, passwordHash, firstName, lastName, "admin"],
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
      console.warn("Failed to assign themes to new tenant:", err);
      // Continue without themes - not critical for signup
    }

    const token = generateToken({
      userId,
      email,
      tenantId,
      role: "admin",
    });

    res.json({
      success: true,
      token,
      user: {
        id: userId,
        email,
        tenantId,
        companyName,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }

    // Optimized: Single UNION query instead of two separate queries
    const users = await query(
      `SELECT u.id, u.email, u.password_hash, u.tenant_id, u.role, u.first_name, u.last_name, t.company_name, 'user' as user_type
       FROM users u
       JOIN tenants t ON u.tenant_id = t.id
       WHERE u.email = ? AND u.is_active = TRUE
       UNION
       SELECT s.id, s.email, s.password_hash, s.tenant_id, s.role, s.first_name, s.last_name, t.company_name, 'staff' as user_type
       FROM staff_members s
       JOIN tenants t ON s.tenant_id = t.id
       WHERE s.email = ? AND s.is_active = TRUE
       LIMIT 1`,
      [email, email],
    );

    if (Array.isArray(users) && users.length > 0) {
      const user = users[0] as any;
      const passwordMatch = await comparePassword(password, user.password_hash);

      if (!passwordMatch) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        tenantId: user.tenant_id,
        role: user.role,
      });

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          tenantId: user.tenant_id,
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name,
          companyName: user.company_name,
          userType: user.user_type,
        },
      });
      return;
    }

    res.status(401).json({ error: "Invalid email or password" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleSuperAdminLogin: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }

    const users = await query(
      `SELECT u.id, u.email, u.password_hash, u.role
       FROM users u
       WHERE u.email = ? AND u.is_active = TRUE AND u.role IN ('super-admin', 'finance-admin', 'support-admin')`,
      [email],
    );

    if (!Array.isArray(users) || users.length === 0) {
      res
        .status(401)
        .json({ error: "Invalid credentials or insufficient permissions" });
      return;
    }

    const user = users[0] as any;
    const passwordMatch = await comparePassword(password, user.password_hash);

    if (!passwordMatch) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      tenantId: "super-admin",
      role: user.role,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Super admin login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleVerifyToken: RequestHandler = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const decoded = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString(),
    );

    const users = await query(
      "SELECT id, email FROM users WHERE id = ? AND is_active = TRUE",
      [decoded.userId],
    );

    if (!Array.isArray(users) || users.length === 0) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    res.json({
      success: true,
      user: decoded,
    });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
};

import nodemailer from "nodemailer";

export interface EmailSettings {
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  sender_email?: string;
  target_email?: string;
  email_notify_enabled?: boolean;
}

export interface OrderEmailData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  shippingAddress?: any;
}

export async function sendOrderNotificationEmail(
  emailSettings: EmailSettings,
  orderData: OrderEmailData
): Promise<boolean> {
  try {
    // Validate settings
    if (!emailSettings.email_notify_enabled) {
      console.log("Email notifications disabled");
      return false;
    }

    if (
      !emailSettings.smtp_host ||
      !emailSettings.smtp_port ||
      !emailSettings.smtp_username ||
      !emailSettings.smtp_password ||
      !emailSettings.sender_email ||
      !emailSettings.target_email
    ) {
      console.log("Email settings incomplete - missing required SMTP configuration");
      return false;
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: emailSettings.smtp_host,
      port: emailSettings.smtp_port,
      secure: emailSettings.smtp_port === 465, // true for 465, false for other ports
      auth: {
        user: emailSettings.smtp_username,
        pass: emailSettings.smtp_password,
      },
    });

    // Generate email HTML
    const itemsHtml = orderData.items
      .map(
        (item) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px; text-align: left;">${item.product_name}</td>
        <td style="padding: 12px; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; text-align: right;">₹${(item.unit_price || 0).toFixed(2)}</td>
        <td style="padding: 12px; text-align: right;">₹${(item.total_price || 0).toFixed(2)}</td>
      </tr>
    `
      )
      .join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #374151;
            background-color: #f3f4f6;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .header {
            background-color: #1f2937;
            color: #ffffff;
            padding: 24px;
            text-align: center;
          }
          .content {
            padding: 24px;
          }
          .section {
            margin-bottom: 24px;
          }
          .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 12px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #f3f4f6;
          }
          .info-label {
            font-weight: 500;
            color: #6b7280;
          }
          .info-value {
            color: #1f2937;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
          }
          .table th {
            background-color: #f9fafb;
            border-bottom: 2px solid #e5e7eb;
            padding: 12px;
            text-align: left;
            font-weight: 600;
          }
          .total-section {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 2px solid #e5e7eb;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 16px;
          }
          .total-row.final {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            padding: 12px 0;
          }
          .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
          }
          .status-pending {
            background-color: #fef3c7;
            color: #92400e;
          }
          .status-processing {
            background-color: #dbeafe;
            color: #1e3a8a;
          }
          .status-shipped {
            background-color: #dbeafe;
            color: #1e3a8a;
          }
          .status-delivered {
            background-color: #dcfce7;
            color: #166534;
          }
          .footer {
            background-color: #f9fafb;
            padding: 16px 24px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">New Order Received</h1>
            <p style="margin: 8px 0 0 0; font-size: 14px;">Order #${orderData.orderNumber}</p>
          </div>

          <div class="content">
            <div class="section">
              <div class="section-title">Order Details</div>
              <div class="info-row">
                <span class="info-label">Order ID:</span>
                <span class="info-value">${orderData.orderId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Order Number:</span>
                <span class="info-value">${orderData.orderNumber}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Order Status:</span>
                <span class="info-value">
                  <span class="status-badge status-${orderData.status.toLowerCase()}">
                    ${orderData.status.toUpperCase()}
                  </span>
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">Payment Status:</span>
                <span class="info-value">
                  <span class="status-badge status-${orderData.paymentStatus.toLowerCase()}">
                    ${orderData.paymentStatus.toUpperCase()}
                  </span>
                </span>
              </div>
              ${
                orderData.paymentMethod
                  ? `<div class="info-row">
                <span class="info-label">Payment Method:</span>
                <span class="info-value">${orderData.paymentMethod}</span>
              </div>`
                  : ""
              }
            </div>

            <div class="section">
              <div class="section-title">Customer Information</div>
              <div class="info-row">
                <span class="info-label">Name:</span>
                <span class="info-value">${orderData.customerName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${orderData.customerEmail}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Phone:</span>
                <span class="info-value">${orderData.customerPhone}</span>
              </div>
              ${
                orderData.shippingAddress
                  ? `<div class="info-row">
                <span class="info-label">Shipping Address:</span>
                <span class="info-value">${
                  typeof orderData.shippingAddress === "string"
                    ? orderData.shippingAddress
                    : orderData.shippingAddress.address || ""
                }</span>
              </div>`
                  : ""
              }
            </div>

            <div class="section">
              <div class="section-title">Order Items</div>
              <table class="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Price</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <div class="total-section">
                <div class="total-row">
                  <span>Subtotal:</span>
                  <span>₹${(orderData.subtotal || 0).toFixed(2)}</span>
                </div>
                ${
                  orderData.discount
                    ? `<div class="total-row">
                  <span>Discount:</span>
                  <span>-₹${(orderData.discount || 0).toFixed(2)}</span>
                </div>`
                    : ""
                }
                ${
                  orderData.tax
                    ? `<div class="total-row">
                  <span>Tax:</span>
                  <span>₹${(orderData.tax || 0).toFixed(2)}</span>
                </div>`
                    : ""
                }
                <div class="total-row final">
                  <span>Total Amount:</span>
                  <span>₹${(orderData.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    const info = await transporter.sendMail({
      from: emailSettings.sender_email,
      to: emailSettings.target_email,
      subject: `New Order Received - Order #${orderData.orderNumber}`,
      html: emailHtml,
    });

    console.log(`Order email sent successfully. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("Error sending order email:", error);
    return false;
  }
}

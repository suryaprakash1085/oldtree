# MultiTenant SaaS Platform

A production-ready, secure, and scalable multi-tenant SaaS platform built with React, Express, Node.js, and MySQL. This platform enables businesses to manage multiple customer storefronts with complete data isolation, role-based access control, and comprehensive admin dashboards.

##  Overview

The platform consists of three main applications:

1. **Super-Admin Panel** - Platform owner controls all clients, themes, billing, and analytics
2. **Client-Admin Panel** - Individual business owners manage their products, orders, customers, and store
3. **Customer Storefront** - Public e-commerce website for each client's customers

##  System Architecture

### Technology Stack

- **Frontend**: React 18 + React Router 6 + TypeScript + Vite + TailwindCSS 3
- **Backend**: Express.js + Node.js + TypeScript
- **Database**: MySQL with TiDB Cloud (AWS)
- **Authentication**: JWT (JSON Web Tokens) + Bcrypt password hashing
- **Package Manager**: pnpm

### Database Schema

The system uses a comprehensive MySQL schema with the following main tables:

- **tenants** - Client accounts with billing info and API keys
- **users** - Platform and client users with role-based access
- **products** - E-commerce products per tenant
- **orders** - Customer orders with status tracking
- **order_items** - Items within each order
- **customers** - Customer database per tenant
- **discounts** - Promotional codes and discount rules
- **themes** - Theme templates for storefronts
- **tenant_themes** - Many-to-many relationship for theme assignment
- **transactions** - Payment transaction records

##  Getting Started

### Prerequisites

- Node.js 18+ and pnpm 10+
- MySQL 8.0+
- Environment variables set (see below)

### Environment Setup

The following environment variables are required:

```env
DATABASE_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
DATABASE_PORT=4000
DATABASE_USER=262K36kM6FjJ2ee.root
DATABASE_PASSWORD=798dq381dO5pm102
DATABASE_NAME=test
JWT_SECRET=your-secret-key-change-in-production-12345
```

These are already configured in the development environment.

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run tests
pnpm test

# Type checking
pnpm typecheck
```

The dev server runs at `http://localhost:8080` with both frontend and backend hot-reloading.

##  API Documentation

### Authentication Endpoints

#### Sign Up

```bash
POST /api/auth/signup
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "Acme Corp",
  "email": "john@acme.com",
  "password": "securepassword"
}
```

Returns JWT token and user info.

#### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@acme.com",
  "password": "securepassword"
}
```

#### Super Admin Login

```bash
POST /api/auth/super-admin-login
Content-Type: application/json

{
  "email": "admin@platform.com",
  "password": "password"
}
```

All authenticated requests require the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Super-Admin APIs

#### Get All Clients

```bash
GET /api/super-admin/clients
Authorization: Bearer <token>
```

#### Create Client

```bash
POST /api/super-admin/clients
Authorization: Bearer <token>
Content-Type: application/json

{
  "companyName": "New Company",
  "domain": "newcompany.com",
  "contactEmail": "contact@company.com",
  "contactPhone": "+1234567890",
  "billingPlan": "starter"
}
```

#### Get Analytics

```bash
GET /api/super-admin/analytics
Authorization: Bearer <token>
```

Returns:

- Total clients
- Total revenue
- Active stores
- Pending orders
- Top performing clients

#### Suspend/Reactivate Client

```bash
POST /api/super-admin/clients/:clientId/suspend
POST /api/super-admin/clients/:clientId/reactivate
Authorization: Bearer <token>
```

#### Theme Management

```bash
GET /api/super-admin/themes
POST /api/super-admin/themes
POST /api/super-admin/themes/:themeId/assign/:clientId
Authorization: Bearer <token>
```

#### Billing

```bash
GET /api/super-admin/billing
Authorization: Bearer <token>
```

### Client-Admin APIs

All requests require authorization and will be filtered by tenant ID.

#### Dashboard Stats

```bash
GET /api/client-admin/dashboard
Authorization: Bearer <token>
```

Returns KPIs like total sales, pending orders, customer count, product count.

#### Product Management

```bash
GET /api/client-admin/products
POST /api/client-admin/products
PUT /api/client-admin/products/:productId
DELETE /api/client-admin/products/:productId
Authorization: Bearer <token>
```

Product payload:

```json
{
  "name": "Product Name",
  "description": "Product description",
  "sku": "SKU-001",
  "price": 99.99,
  "costPrice": 50.0,
  "category": "Electronics",
  "stockQuantity": 100,
  "imageUrl": "https://example.com/image.jpg"
}
```

#### Order Management

```bash
GET /api/client-admin/orders
PUT /api/client-admin/orders/:orderId/status
Authorization: Bearer <token>
```

Update order status:

```json
{
  "status": "processing|shipped|delivered"
}
```

#### Customers

```bash
GET /api/client-admin/customers
Authorization: Bearer <token>
```

#### Discounts

```bash
GET /api/client-admin/discounts
POST /api/client-admin/discounts
Authorization: Bearer <token>
```

Discount payload:

```json
{
  "code": "SUMMER20",
  "description": "Summer 20% off",
  "discountType": "percentage|fixed",
  "discountValue": 20,
  "minOrderAmount": 500,
  "maxUses": 100,
  "validFrom": "2024-06-01T00:00:00Z",
  "validUntil": "2024-08-31T23:59:59Z"
}
```

### Storefront APIs

Public APIs for customer-facing operations.

#### Get Products

```bash
GET /api/store/:tenantId/products?category=Electronics
```

#### Create Order

```bash
POST /api/store/:tenantId/orders
Content-Type: application/json

{
  "customerName": "Jane Doe",
  "customerEmail": "jane@example.com",
  "customerPhone": "+1234567890",
  "items": [
    {
      "productId": "uuid",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "address": "123 Main St"
  },
  "discountCode": "SAVE10"
}
```

#### Track Order

```bash
GET /api/store/:tenantId/track/:orderNumber
```

#### Validate Discount

```bash
POST /api/store/:tenantId/validate-discount
Content-Type: application/json

{
  "code": "SAVE10",
  "orderAmount": 1000
}
```

##  Security Features

### Data Isolation

- Every table includes a `tenant_id` field for complete data separation
- All API endpoints enforce tenant isolation through middleware
- Clients can only access their own data

### Authentication & Authorization

- JWT tokens with 24-hour expiration
- Bcrypt password hashing with 10 salt rounds
- Role-based access control (RBAC)
  - super-admin: Full platform control
  - finance-admin: Billing and revenue access
  - support-admin: Support and customer service access
  - admin: Client business owner
  - editor: Limited product/content management

### Additional Security

- CORS enabled with proper headers
- HTTPS enforced in production
- Rate limiting ready for implementation
- CSRF protection through token validation
- Audit logging of all admin actions (ready for implementation)

##  Frontend Structure

```
client/
├── pages/
│   ├── Index.tsx (Landing page)
│   ├── NotFound.tsx
│   ├── auth/
│   │   ├── Login.tsx
│   │   └── Signup.tsx
│   ├── super-admin/
│   │   └── Dashboard.tsx
│   ├── client-admin/
│   │   └── Dashboard.tsx
│   └── storefront/
│       └── Home.tsx
├── components/
│   └── ui/ (shadcn/ui components)
├── lib/
│   ├── utils.ts
│   └── api.ts (API client)
├── hooks/
│   └── use-mobile.tsx
├── App.tsx (Routing setup)
├── global.css (Tailwind styles)
└── vite-env.d.ts
```

##  Backend Structure

```
server/
├── index.ts (Server setup and route registration)
├── db.ts (Database connection and initialization)
├── auth.ts (JWT, password hashing utilities)
└── routes/
    ├── auth.ts (Authentication endpoints)
    ├── super-admin.ts (Super-admin APIs)
    ├── client-admin.ts (Client admin APIs)
    ├── storefront.ts (Public storefront APIs)
    └── demo.ts (Demo endpoint)
```

##  Database Initialization

The database schema is automatically created on first startup. Tables include:

- Proper indexes on frequently queried fields
- Foreign key constraints for referential integrity
- Timestamps for audit trail (created_at, updated_at)
- Status and is_active flags for soft deletes

To manually initialize:

```bash
curl -X POST http://localhost:8080/api/init-db
```

##  Testing

Run the test suite:

```bash
pnpm test
```

Test files are located alongside the source code with `.spec.ts` extension.

##  Features Implemented

### Super-Admin Dashboard

- ✅ Client management (CRUD)
- ✅ Analytics and KPIs
- ✅ Billing and subscription tracking
- ✅ Theme management and assignment
- ✅ Top performing clients insights
- ✅ Total revenue tracking

### Client-Admin Dashboard

- ✅ Store dashboard with KPIs
- ✅ Product management (CRUD)
- ✅ Inventory tracking
- ✅ Order management with status updates
- ✅ Customer database
- ✅ Discount and promotion creation
- ✅ Theme customization
- ✅ Store settings and configuration

### Customer Storefront

- ✅ Product catalog with filtering
- ✅ Shopping cart with quantity management
- ✅ Discount code validation
- ✅ Checkout flow
- ✅ Order creation with unique order numbers
- ✅ Order tracking by order number
- ✅ Customer authentication ready
- ✅ Responsive design for all devices

##  Deployment

### Build

```bash
pnpm build
```

Outputs:

- `dist/spa/` - Production frontend bundle
- `dist/server/` - Production backend

### Production Server

```bash
pnpm start
```

### Docker Deployment

The project includes Docker configuration for containerization (ready for implementation).

##  Multi-Language Support

The application is structured for i18n (Internationalization):

- Primary: English
- Ready for: Tamil, Hindi

Language strings can be added to a `locales/` directory for easy translation.

##  Monitoring & Logging

The system is ready for:

- Prometheus metrics export
- Structured logging with Winston
- Error tracking with Sentry
- Request logging middleware

##  Contributing

Guidelines for development:

1. Use TypeScript for all new code
2. Follow the existing project structure
3. Write tests for new features
4. Ensure proper error handling
5. Use meaningful commit messages

## License
This project is proprietary and confidential.

##  Support

For issues and questions:

1. Check the API documentation above
2. Review the code comments in source files
3. Check the database schema in `server/db.ts`

##  Future Enhancements

- [ ] Payment gateway integration (Razorpay, Stripe)
- [ ] Advanced analytics with charts
- [ ] Email notifications for orders
- [ ] SMS notifications
- [ ] Shipping integration
- [ ] Advanced inventory management
- [ ] Customer reviews and ratings
- [ ] Wishlist functionality
- [ ] Marketing automation
- [ ] API quota management
- [ ] White-label customization
- [ ] Mobile apps (iOS/Android)
- [ ] Real-time notifications with WebSockets
- [ ] Advanced search with Elasticsearch
- [ ] CDN integration for images

##  Quick Links

- API Base URL: `http://localhost:8080/api`
- Frontend: `http://localhost:8080`
- Database: TiDB Cloud (AWS ap-southeast-1)

---

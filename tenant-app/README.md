# Tenant Storefront App

A standalone React application for individual tenant storefronts with theme customization support.

## Quick Start

### Prerequisites
- Node.js 18+
- Main backend running on http://localhost:8080

### Installation

```bash
cd tenant-app
pnpm install
```

### Configuration

Create a `.env` file based on `.env.example`:

```env
VITE_TENANT_ID=your-tenant-id
VITE_TENANT_NAME=Your Store Name
VITE_BACKEND_URL=http://localhost:8080
VITE_THEME=modern
```

### Running the App

```bash
pnpm dev
```

The app will run on `http://localhost:8081` by default.

## Features

- **5 Pre-built Themes**: Modern, Dark Red, Green, Purple Neon, Warm Yellow, Elegant Purple
- **Advanced Customization**: Customize primary, secondary, and accent colors
- **Product Catalog**: Display products from main backend
- **Shopping Cart**: Add products to cart (checkout ready)
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Theme Persistence**: Theme settings saved to localStorage

## Project Structure

```
tenant-app/
├── client/
│   ├── pages/
│   │   ├── Home.tsx              # Storefront home page
│   │   └── ThemeCustomization.tsx # Theme customization page
│   ├── components/
│   │   ├── Button.tsx            # Button component
│   │   └── Card.tsx              # Card component
│   ├── lib/
│   │   ├── themes.ts             # Theme definitions (5 themes)
│   │   ├── api.ts                # API calls to main backend
│   │   └── utils.ts              # Utility functions
│   ├── App.tsx                   # Main app component
│   ├── main.tsx                  # Entry point
│   ├── global.css                # Global styles with theme variables
│   └── vite-env.d.ts            # TypeScript environment definitions
├── vite.config.ts                # Vite configuration
├── tailwind.config.ts             # Tailwind CSS config
├── index.html                    # HTML entry point
└── package.json                  # Project dependencies
```

## Available Themes

1. **Modern** - Clean, contemporary design
2. **Dark Red** - Dark background with vibrant red and gold
3. **Green** - Fresh green with clean design
4. **Purple Neon** - Dark with neon purple and pink
5. **Warm Yellow** - Warm colors, playful feel
6. **Elegant Purple** - Premium look with sophisticated tones

## API Integration

The app communicates with the main backend at `VITE_BACKEND_URL`:

- `GET /api/store/:tenantId/products` - Get all products
- `GET /api/store/:tenantId/products/:productId` - Get single product
- `POST /api/store/:tenantId/orders` - Create order
- `GET /api/store/:tenantId/orders/:orderId` - Get order details
- `GET /api/store/:tenantId/track/:orderNumber` - Track order
- `POST /api/store/:tenantId/validate-discount` - Validate discount code

## Environment Variables

- `VITE_TENANT_ID` - Unique identifier for this tenant
- `VITE_TENANT_NAME` - Display name of the store
- `VITE_BACKEND_URL` - URL of the main backend API
- `VITE_THEME` - Default theme to load

## Building for Production

```bash
pnpm build
```

Output will be in `dist/` directory.

## Multi-Tenant Setup

Each tenant runs their own instance with different configuration:

```bash
# Tenant 1 - On port 8081
VITE_TENANT_ID=tenant-1 VITE_TENANT_NAME="Store 1" pnpm dev

# Tenant 2 - On port 8082
VITE_TENANT_ID=tenant-2 VITE_TENANT_NAME="Store 2" pnpm dev --port 8082
```

Or use different `.env` files and containers for each tenant.

## Contributing

Follow the existing code style and component patterns. All theme customizations are stored in `localStorage` for persistence.

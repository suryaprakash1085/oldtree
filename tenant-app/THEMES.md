# 🎆 Professional Store Templates

The tenant storefront includes 2 professional templates designed for firecracker and celebration product e-commerce stores. Each template offers a complete design system with unique layouts, components, and styling.

## Available Templates

### 1. 🎆 **Crackers Online Booking** - Professional Table Layout
**Best for**: Firecracker retailers, product catalogs, booking-focused stores

**Features**:
- Professional booking table layout with detailed product information
- Category filtering and product organization
- Quick buy functionality with cart management
- Color-coded product rows for visual organization
- Responsive table design for all devices
- Color scheme: Orange, Purple, Yellow
- Dynamic category filtering
- Organized product listing

**Color Scheme**:
```
Primary: #f97316 (Orange)
Secondary: #fbbf24 (Amber)
Accent: #a855f7 (Purple)
```

**Best For**: 
- Traditional firecracker retailers
- Bulk order focused stores
- B2B and B2C operations
- Customers who prefer detailed product information
- Professional presentation of product catalog

**Layout Features**:
- Header with store name and cart
- Hero section with promotional message
- Category filter buttons
- Product table with all details
- Quick buy buttons
- Fixed cart summary at bottom
- Professional footer

---

### 2. 🌈 **Sri Venkateswara Crackers** - Modern Product Grid
**Best for**: Modern crackers stores, visual product showcase, festival retailers

**Features**:
- Colorful product card grid with vibrant design
- Modern hover effects and animations
- Category filtering with visual feedback
- Individual product cards with images and details
- Quick buy buttons with shopping cart integration
- About section with store information
- Responsive grid layout (1-4 columns based on screen size)
- Color scheme: Orange with colorful cards

**Color Scheme**:
```
Primary: #f97316 (Orange)
Secondary: #ea580c (Dark Orange)
Accent: #facc15 (Amber)
```

**Best For**:
- Modern firecracker retailers
- Visual product showcase
- Festival and celebration stores
- Younger demographic targeting
- High-engagement storefronts
- Brands emphasizing vibrant products

**Layout Features**:
- Header with store name and cart
- Hero section with promotional banners
- Category filter buttons
- Colorful product cards grid (4 columns on desktop, 2 on tablet, 1 on mobile)
- Colorful category badges
- Individual product images
- Stock status indicators
- Quick buy buttons
- About section with store information
- Professional footer

---

## Shared Components

Both templates use shared components for consistency:

### Header Component
- Store name display
- Shopping cart with item counter
- Customizable colors and branding
- Responsive design

### Footer Component
- Store information
- Support section
- Contact information
- Copyright

### Hero Section Component
- Promotional messaging
- Customizable backgrounds
- Call-to-action buttons
- Responsive text sizing

---

## Project Structure

```
tenant-app/client/
├── templates/
│   ├── BookingTemplate.tsx           # Crackers Online Booking Template
│   ├── BookingTemplate.css           # Booking template styles
│   ├── ProductShowcaseTemplate.tsx   # Sri Venkateswara Template
│   ├── ProductShowcaseTemplate.css   # Showcase template styles
├── components/
│   ├── shared/
│   │   ├── Header.tsx                # Shared header component
│   │   ├── Footer.tsx                # Shared footer component
│   │   └── HeroSection.tsx           # Shared hero section
│   ├── Button.tsx                    # Custom button component
│   └── Card.tsx                      # Custom card component
├── lib/
│   ├── api.ts                        # API calls
│   ├── templateLoader.ts             # Template loading logic
│   └── utils.ts                      # Utility functions
└── global.css                        # Global styles
```

---

## Features Comparison

| Feature | Booking Table | Product Grid |
|---------|---------------|--------------|
| Product Listing | Table Format | Card Grid |
| Category Filtering | ✅ Yes | ✅ Yes |
| Product Images | Small Icons | Large Images |
| Quick Buy | ✅ Yes | ✅ Yes |
| Shopping Cart | ✅ Yes | ✅ Yes |
| Animations | Minimal | Modern Hover Effects |
| About Section | ❌ No | ✅ Yes |
| Visual Showcase | ❌ Limited | ✅ Enhanced |
| Mobile Responsiveness | ✅ Yes | ✅ Yes |
| Customization | Basic | Full Colors |

---

## Implementation Details

### Template Loading
Templates are loaded dynamically using the `templateLoader.ts` module:

```typescript
export type TemplateName = "booking" | "product-showcase";

export const TEMPLATES: Record<TemplateName, TemplateInfo> = {
  "booking": { /* ... */ },
  "product-showcase": { /* ... */ }
};

export async function loadTemplate(templateId: TemplateName) {
  // Lazy load template components
}
```

### Color Customization
Each template supports the same primary colors:
- Orange (#f97316) - Main brand color
- Secondary colors (varies by template)
- Accent colors for highlights

### Responsive Design
Both templates are fully responsive:
- Desktop: Optimal layout with full features
- Tablet: Adjusted grid/table sizing
- Mobile: Single column/simplified layout

---

## Admin Dashboard Integration

Store admins can switch templates from the client admin panel:

1. Go to **Appearance** tab
2. Select desired template
3. Preview colors and features
4. Click **Apply Selected Template**

Changes are applied immediately to the storefront.

---

## Recommended Template Choices

| Store Focus | Recommended | Reason |
|-------------|-------------|--------|
| Bulk Orders | Booking Table | Detailed product info, quick bulk buying |
| Visual Showcase | Product Grid | Beautiful display, modern feel |
| Traditional Retail | Booking Table | Familiar layout, detailed info |
| Modern Brand | Product Grid | Contemporary design, engaging |
| Festival Sales | Product Grid | Vibrant, celebrates products |

---

## Browser Compatibility

Both templates support:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Modern mobile browsers

---

## Performance

Both templates are optimized for:
- Fast page load times
- Lazy loading of images
- Efficient state management
- Responsive performance on mobile

---

## Future Enhancements

Potential additions:
- [ ] Additional template designs
- [ ] Custom color picker for templates
- [ ] Product filtering beyond categories
- [ ] Search functionality
- [ ] Product comparison feature
- [ ] Wishlist functionality
- [ ] Advanced analytics dashboard
- [ ] A/B testing capabilities

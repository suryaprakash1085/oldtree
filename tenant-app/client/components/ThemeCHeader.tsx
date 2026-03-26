import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Heart, Download, Menu, X } from "lucide-react";

interface ThemeCHeaderProps {
  tenantName: string;
  tenantLogo: string | null;
  cartSize: number;
  wishlistSize: number;
  onSearchClick: () => void;
  onWishlistClick: () => void;
  onCheckout: () => void;
  priceListUrl: string | null;
  showContactUs?: boolean;
  showPaymentInfo?: boolean;
}

export default function ThemeCHeader({
  tenantName,
  tenantLogo,
  cartSize,
  wishlistSize,
  onSearchClick,
  onWishlistClick,
  onCheckout,
  priceListUrl,
  showContactUs = false,
  showPaymentInfo = false,
}: ThemeCHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="theme-c-header">
      <div className="theme-c-header-content">
        <div className="theme-c-logo-section">
          {tenantLogo ? (
            <img src={tenantLogo} alt={tenantName} className="theme-c-logo-img" />
          ) : (
            <h1 className="theme-c-logo-text">{tenantName}</h1>
          )}
        </div>

        <button className="theme-c-nav-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <nav className={`theme-c-header-nav ${mobileMenuOpen ? 'open' : ''}`}>
          <Link to="/" className="theme-c-header-btn" onClick={() => setMobileMenuOpen(false)}>Home</Link>
          <Link to="/products" className="theme-c-header-btn" onClick={() => setMobileMenuOpen(false)}>Products</Link>
          <Link to="/track-order" className="theme-c-header-btn" onClick={() => setMobileMenuOpen(false)}>Track Order</Link>
          {showContactUs && <Link to="/page/contact" className="theme-c-header-btn" onClick={() => setMobileMenuOpen(false)}>Contact Us</Link>}
          {showPaymentInfo && <Link to="/page/payment-info" className="theme-c-header-btn" onClick={() => setMobileMenuOpen(false)}>Payment Info</Link>}
        </nav>

        <div className="theme-c-header-actions">
          <button
            className="theme-c-header-btn-icon"
            onClick={onSearchClick}
            title="Search products"
          >
            <Search size={20} />
          </button>
          <button
            className="theme-c-header-btn-icon"
            onClick={onWishlistClick}
            title={`View wishlist (${wishlistSize})`}
          >
            <Heart size={20} />
          </button>
          {priceListUrl && (
            <a
              href={priceListUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="theme-c-header-btn-icon hover:opacity-75 transition-opacity"
              title="Download price list"
            >
              <Download size={20} />
            </a>
          )}
          <div className="theme-c-cart-section">
            <span className="theme-c-cart-count">{cartSize}</span>
          </div>
          {cartSize > 0 && (
            <button onClick={onCheckout} className="theme-c-checkout-link">
              Checkout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

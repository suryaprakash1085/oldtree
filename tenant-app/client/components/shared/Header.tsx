import { ShoppingCart } from "lucide-react";
import { ReactNode } from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  cartCount?: number;
  onCartClick?: () => void;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  children?: ReactNode;
}

export function Header({
  title,
  subtitle,
  cartCount = 0,
  onCartClick,
  backgroundColor = "bg-gradient-to-r from-orange-500 to-orange-600",
  textColor = "text-white",
  borderColor = "border-orange-400",
  children,
}: HeaderProps) {
  return (
    <header className={`sticky top-0 z-50 ${backgroundColor} shadow-lg border-b-4 ${borderColor}`}>
      <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
        <div>
          <h1 className={`text-4xl font-black ${textColor} drop-shadow-lg`}>
            {title}
          </h1>
          {subtitle && (
            <p className={`${textColor} text-sm font-bold opacity-90`}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex gap-4 items-center">
          {children}
          {onCartClick && (
            <button
              onClick={onCartClick}
              className="relative hover:opacity-80 transition-opacity"
            >
              <ShoppingCart className={`w-8 h-8 ${textColor}`} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-black font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  {cartCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

import { ReactNode } from "react";

interface FooterProps {
  storeName: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  children?: ReactNode;
}

export function Footer({
  storeName,
  backgroundColor = "bg-gray-900",
  textColor = "text-gray-100",
  borderColor = "border-orange-400",
  children,
}: FooterProps) {
  return (
    <footer
      className={`${backgroundColor} ${borderColor} border-t-4 mt-16 py-12 px-4`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className={`font-black text-lg mb-3 text-orange-400`}>
              {storeName}
            </h3>
            <p className={`${textColor} text-sm`}>
              Your trusted source for premium products
            </p>
          </div>
          <div>
            <h3 className={`font-black text-lg mb-3 text-orange-400`}>
              Support
            </h3>
            <p className={`${textColor} text-sm`}>24/7 Customer Support Available</p>
          </div>
          <div>
            <h3 className={`font-black text-lg mb-3 text-orange-400`}>
              Contact
            </h3>
            <p className={`${textColor} text-sm`}>
              Reach us anytime for assistance
            </p>
          </div>
        </div>
        {children}
        <div className={`border-t-2 border-orange-400/30 pt-6 text-center ${textColor} text-sm`}>
          <p>© 2024 {storeName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

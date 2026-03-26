import { ReactNode } from "react";

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  backgroundColor?: string;
  textColor?: string;
  children?: ReactNode;
}

export function HeroSection({
  title,
  subtitle,
  backgroundColor = "bg-gradient-to-b from-orange-600 to-orange-700",
  textColor = "text-white",
  children,
}: HeroSectionProps) {
  return (
    <section
      className={`py-16 px-4 ${backgroundColor} ${textColor} relative overflow-hidden`}
    >
      <div className="max-w-7xl mx-auto text-center relative z-10">
        <h2 className="text-5xl md:text-6xl font-black mb-6 drop-shadow-lg">
          {title}
        </h2>
        {subtitle && (
          <p className="text-lg md:text-2xl mb-8 max-w-3xl mx-auto font-semibold opacity-90">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}

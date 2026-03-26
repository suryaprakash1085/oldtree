import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
}

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "rounded-lg font-semibold transition-colors",
        variant === "primary" &&
          "bg-primary text-primary-foreground hover:opacity-90",
        variant === "secondary" &&
          "bg-secondary text-secondary-foreground hover:opacity-90",
        variant === "outline" &&
          "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-4 py-2 text-base",
        size === "lg" && "px-6 py-3 text-lg",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

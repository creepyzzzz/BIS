import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "dark" | "ghost" | "outline";
  size?: "xs" | "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors duration-150 select-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer tracking-tight";

    const variantStyles = {
      primary: "bg-[#000000] text-[#FFFFFF] hover:bg-[#1f1f1f] border border-[#000000] shadow-[0_1px_2px_rgba(0,0,0,0.06)]",
      secondary: "bg-[#64D7C2] text-[#000000] hover:bg-[#52c6b1] border border-[#64D7C2] shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
      dark: "bg-neutral-900 text-white hover:bg-neutral-800 border border-neutral-900",
      outline: "bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 shadow-[0_1px_2px_rgba(0,0,0,0.02)]",
      ghost: "bg-transparent text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 border border-transparent",
    };

    // Scaled up slightly for better ergonomics and readability
    const sizeStyles = {
      xs: "h-7 px-2.5 text-xs rounded-[4px]",
      sm: "h-8 px-3.5 text-xs rounded-[4px]",
      md: "h-9 px-4 text-sm font-medium rounded-[4px]",
      lg: "h-11 px-5 text-sm font-medium rounded-[4px]",
      icon: "h-9 w-9 p-0 rounded-[4px]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

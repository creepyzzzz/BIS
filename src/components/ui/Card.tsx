import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "tinted";
}

export function Card({ className, variant = "default", children, ...props }: CardProps) {
  const variantStyles = {
    default: "bg-white border border-neutral-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.02)]",
    elevated: "bg-[#F7F9F5] border border-neutral-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.02)]",
    tinted: "bg-[#F2F8EC] border border-[#C1F48F]/80",
  };

  return (
    <div
      className={cn("rounded-[6px] p-5 transition-all", variantStyles[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}

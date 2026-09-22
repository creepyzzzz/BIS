import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "accent" | "lime" | "muted" | "missing" | "available" | "neutral";
}

export function Badge({ className, variant = "neutral", children, ...props }: BadgeProps) {
  const variantStyles = {
    neutral: "bg-neutral-100 text-neutral-800 border-neutral-200",
    primary: "bg-[#64D7C2]/20 text-[#1E2C0F] border-[#64D7C2]/60",
    accent: "bg-[#D399ED]/20 text-[#1E2C0F] border-[#D399ED]/60",
    lime: "bg-[#C1F48F]/40 text-[#1E2C0F] border-[#C1F48F]",
    muted: "bg-neutral-50 text-neutral-600 border-neutral-200",
    missing: "bg-rose-50 text-rose-700 border-rose-200 font-medium",
    available: "bg-emerald-50 text-emerald-800 border-emerald-200 font-medium",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] text-xs font-medium border tracking-tight",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

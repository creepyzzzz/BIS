import React from "react";
import Link from "next/link";
import Image from "next/image";
import { UserIcon, Logout01Icon } from "hugeicons-react";

interface TopBarProps {
  userRole?: "super_admin" | "agent" | null;
  userName?: string | null;
  onLogout?: () => void;
}

export function TopBar({ userRole, userName, onLogout }: TopBarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#F9FCF5]/90 backdrop-blur-md z-50 border-b border-neutral-200/80 px-4 sm:px-8">
      <div className="max-w-[1240px] h-full mx-auto flex items-center justify-between">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Berhampore Insight Solutions Logo"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-900 text-base tracking-tight group-hover:text-black transition-colors">
              Berhampore Insight Solutions
            </span>
            <span className="text-xs text-neutral-400 font-mono">BIS</span>
          </div>
        </Link>

        {/* User Navigation / Role Actions */}
        <div className="flex items-center gap-3.5">
          {userName && (
            <div className="flex items-center gap-2 bg-neutral-100 px-3 py-1.5 rounded-[4px] border border-neutral-200 text-neutral-800 text-xs">
              <UserIcon size={14} className="text-neutral-500" />
              <span className="font-medium">{userName}</span>
              <span className="text-[10px] bg-neutral-200 px-1.5 py-0.5 rounded font-mono uppercase font-semibold">
                {userRole === "super_admin" ? "Admin" : "Agent"}
              </span>
            </div>
          )}

          <Link
            href="/agent"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 px-2.5 transition-colors"
          >
            Agent Wizard
          </Link>

          <Link
            href="/admin"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 px-2.5 transition-colors"
          >
            Admin Portal
          </Link>

          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign Out"
              className="w-8 h-8 rounded-[4px] flex items-center justify-center border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              <Logout01Icon size={15} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

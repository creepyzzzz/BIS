"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  SecurityLockIcon,
  ArrowRight01Icon,
  Loading03Icon,
  AlertCircleIcon,
} from "hugeicons-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        throw error;
      }

      // Verify if user is super_admin
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile || profile.role !== "super_admin") {
        await supabase.auth.signOut();
        throw new Error("Access restricted: You do not have Super Admin privileges.");
      }

      // Success
      router.push("/admin");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to authenticate. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-4 selection:bg-[#64D7C2]/30 text-[#111827]">
      {/* Top Brand Link */}
      <Link href="/" className="mb-8 flex items-center gap-3 group">
        <div className="relative w-9 h-9">
          <Image
            src="/logo.png"
            alt="Berhampore Insight Solutions"
            fill
            sizes="36px"
            className="object-contain"
            priority
          />
        </div>
        <span className="font-semibold text-neutral-900 text-base tracking-tight group-hover:text-black transition-colors">
          Berhampore Insight Solutions
        </span>
      </Link>

      {/* Vercel-Style Login Container */}
      <div className="w-full max-w-[380px] space-y-4">
        <Card className="p-7 bg-white border-neutral-200/90 shadow-[0_4px_12px_rgba(0,0,0,0.03)] space-y-5">
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
              Super Admin Sign In
            </h1>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Enter your authorized email and password to access the administrative control portal.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-[4px] bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircleIcon size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="admin@berhamporeinsight.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
              className="w-full h-10 flex items-center justify-center gap-2 text-sm mt-2"
            >
              {loading ? (
                <>
                  <Loading03Icon size={16} className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In to Dashboard
                  <ArrowRight01Icon size={16} />
                </>
              )}
            </Button>
          </form>

          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-400">
            <span className="flex items-center gap-1 font-mono">
              <SecurityLockIcon size={12} />
              SSL 256-bit
            </span>
            <Badge variant="neutral" className="text-[10px] font-mono">
              RBAC PROTECTED
            </Badge>
          </div>
        </Card>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-neutral-500 hover:text-neutral-900 font-medium transition-colors"
          >
            ← Back to Public Portal
          </Link>
        </div>
      </div>
    </div>
  );
}

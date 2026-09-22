"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import {
  DashboardSquare01Icon,
  Store01Icon,
  FileValidationIcon,
  UserGroupIcon,
  Invoice01Icon,
  PlusSignIcon,
  Search01Icon,
  ArrowRight01Icon,
  Loading03Icon,
  SparklesIcon,
  Layers01Icon,
  Settings02Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Logout01Icon,
} from "hugeicons-react";

type NavTab = "overview" | "shops" | "audits" | "invoices" | "categories" | "agents" | "pricing";

function VercelSidebarIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="2" width="12" height="12" rx="2" />
      <path d="M6.5 2v12" />
    </svg>
  );
}

interface NavItemProps {
  label: string;
  icon: React.ReactNode;
  count?: number;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}

function NavItem({ label, icon, count, active, collapsed, onClick }: NavItemProps) {
  if (collapsed) {
    return (
      <div className="relative group flex justify-center py-0.5">
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          className={`w-10 h-10 rounded-[6px] flex items-center justify-center transition-colors ${
            active
              ? "bg-neutral-900 text-white shadow-sm"
              : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          }`}
        >
          {icon}
        </button>

        {/* Floating Tooltip */}
        <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-2 px-2.5 py-1 bg-neutral-900 text-white text-xs font-medium rounded-[5px] shadow-lg whitespace-nowrap z-50 animate-in fade-in zoom-in-95 duration-150">
          <span>{label}</span>
          {count !== undefined && (
            <span className="text-[10px] font-mono text-neutral-400 bg-neutral-800 px-1.5 py-0.2 rounded">
              {count}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-[5px] text-sm font-medium transition-colors ${
        active
          ? "bg-neutral-900 text-white shadow-sm"
          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
      }`}
    >
      <span className="flex items-center gap-2.5 truncate">
        {icon}
        <span className="truncate">{label}</span>
      </span>
      {count !== undefined && (
        <span className="text-xs font-mono opacity-80 pl-2">{count}</span>
      )}
    </button>
  );
}

export default function SuperAdminPortal() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [adminUser, setAdminUser] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Vercel-style Collapsible Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        const saved = localStorage.getItem("bis_admin_sidebar");
        if (saved !== null) {
          setSidebarOpen(saved === "true");
        } else {
          setSidebarOpen(true);
        }
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setSidebarOpen((prev) => {
          const next = !prev;
          if (!isMobile) {
            localStorage.setItem("bis_admin_sidebar", String(next));
          }
          return next;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobile]);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      if (!isMobile) {
        localStorage.setItem("bis_admin_sidebar", String(next));
      }
      return next;
    });
  };

  // Live Database State
  const [stats, setStats] = useState({
    totalShops: 0,
    totalAudits: 0,
    totalInvoices: 0,
    totalRevenue: 0,
  });

  const [shops, setShops] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);

  // Modals / Forms State
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [selectedDocTypeIds, setSelectedDocTypeIds] = useState<string[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const [agentName, setAgentName] = useState("");
  const [agentPhone, setAgentPhone] = useState("");
  const [isAddingAgent, setIsAddingAgent] = useState(false);

  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [editFeeValue, setEditFeeValue] = useState("");

  // Load live Supabase data
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin");
      if (res.ok) {
        const data = await res.json();
        setShops(data.shops || []);
        setAudits(data.audits || []);
        setInvoices(data.invoices || []);
        setCategories(data.categories || []);
        setDocumentTypes(data.document_types || []);
        setAgents(data.agents || []);
        setStats(data.stats || { totalShops: 0, totalAudits: 0, totalInvoices: 0, totalRevenue: 0 });
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Verify Super Admin Auth Session
  useEffect(() => {
    let mounted = true;

    const verifySuperAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.replace("/admin/login");
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id, role, full_name, email")
          .eq("id", session.user.id)
          .single();

        if (error || !profile || profile.role !== "super_admin") {
          await supabase.auth.signOut();
          router.replace("/admin/login");
          return;
        }

        if (mounted) {
          setAdminUser({ ...session.user, ...profile });
          setAuthChecking(false);
          fetchData();
        }
      } catch (err) {
        console.error("Super Admin auth check failed:", err);
        router.replace("/admin/login");
      }
    };

    verifySuperAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/admin/login");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  // Handle Add Category
  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setIsAddingCategory(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_category",
          name: newCatName.trim(),
          description: newCatDesc.trim(),
          doc_type_ids: selectedDocTypeIds,
        }),
      });
      if (res.ok) {
        setNewCatName("");
        setNewCatDesc("");
        setSelectedDocTypeIds([]);
        fetchData();
      }
    } catch (e) {
      alert("Failed to create category");
    } finally {
      setIsAddingCategory(false);
    }
  };

  // Handle Provision Agent
  const handleCreateAgent = async () => {
    if (!agentName.trim()) return;
    setIsAddingAgent(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_agent",
          full_name: agentName.trim(),
          phone: agentPhone.trim(),
        }),
      });
      if (res.ok) {
        setAgentName("");
        setAgentPhone("");
        fetchData();
      }
    } catch (e) {
      alert("Failed to provision agent");
    } finally {
      setIsAddingAgent(false);
    }
  };

  // Handle Update Doc Fee
  const handleUpdateFee = async (id: string) => {
    if (!editFeeValue) return;
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_doc_fee",
          id,
          default_fee: editFeeValue,
        }),
      });
      if (res.ok) {
        setEditingFeeId(null);
        setEditFeeValue("");
        fetchData();
      }
    } catch (e) {
      alert("Failed to update fee");
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-4 selection:bg-[#64D7C2]/30 text-[#111827]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative w-12 h-12">
            <Image
              src="/logo.png"
              alt="Berhampore Insight Solutions"
              fill
              sizes="48px"
              className="object-contain animate-pulse"
              priority
            />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-neutral-900 tracking-tight">
              Berhampore Insight Solutions
            </h2>
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-neutral-500">
              <Loading03Icon size={14} className="animate-spin text-[#006251]" />
              <span>Verifying Super Admin clearance...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex text-[#111827]">
      {/* Mobile Backdrop */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-neutral-900/30 backdrop-blur-[2px] z-40 transition-opacity"
        />
      )}

      {/* VERCEL-STYLE SLEEK COLLAPSIBLE SIDEBAR */}
      <aside
        className={`bg-white border-r border-neutral-200 flex flex-col fixed inset-y-0 left-0 z-50 select-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isMobile
            ? sidebarOpen
              ? "w-64 translate-x-0 shadow-xl"
              : "w-64 -translate-x-full"
            : sidebarOpen
            ? "w-64 translate-x-0"
            : "w-16 translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className={`h-16 border-b border-neutral-200 flex items-center ${sidebarOpen ? "px-3.5 justify-between" : "justify-center relative group"}`}>
          {sidebarOpen ? (
            <>
              <Link href="/" className="flex items-center gap-2.5 group min-w-0">
                <div className="relative w-7 h-7 shrink-0">
                  <Image
                    src="/logo.png"
                    alt="BIS Logo"
                    fill
                    sizes="28px"
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-sm tracking-tight text-neutral-900 leading-tight group-hover:text-black transition-colors truncate">
                    Berhampore Insight
                  </span>
                  <span className="text-[11px] text-neutral-500 font-mono">Super Admin</span>
                </div>
              </Link>

              <div className="flex items-center gap-1 shrink-0">
                <Badge variant="neutral" className="text-[10px] px-1.5 py-0 font-mono">PROD</Badge>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  title={isMobile ? "Close sidebar" : "Collapse to icons (Ctrl+B)"}
                  aria-label="Toggle sidebar"
                  className="p-1.5 rounded-[4px] text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors"
                >
                  {isMobile ? <Cancel01Icon size={16} /> : <VercelSidebarIcon className="w-4 h-4" />}
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleSidebar}
                title="Expand sidebar (Ctrl+B)"
                aria-label="Expand sidebar"
                className="w-10 h-10 rounded-[6px] flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              >
                <div className="relative w-6 h-6 group-hover:hidden">
                  <Image
                    src="/logo.png"
                    alt="BIS Logo"
                    fill
                    sizes="24px"
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="hidden group-hover:block">
                  <VercelSidebarIcon className="w-4 h-4" />
                </div>
              </button>

              {/* Tooltip on collapsed brand */}
              <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 text-white text-xs font-medium rounded-[5px] shadow-lg whitespace-nowrap z-50">
                <span>Expand sidebar</span>
                <span className="text-[10px] font-mono text-neutral-400">⌘B</span>
              </div>
            </>
          )}
        </div>

        {/* Navigation Items */}
        <nav className={`flex-1 ${sidebarOpen ? "px-3 py-4 space-y-1" : "px-2 py-4 space-y-1.5"} overflow-y-auto overflow-x-hidden`}>
          {sidebarOpen ? (
            <div className="px-2.5 pb-1.5 text-[11px] font-mono uppercase text-neutral-400 font-semibold tracking-wider">
              Management
            </div>
          ) : (
            <div className="my-1.5 mx-auto w-6 h-px bg-neutral-200" />
          )}

          <NavItem
            label="Overview"
            icon={<DashboardSquare01Icon size={17} />}
            active={activeTab === "overview"}
            collapsed={!sidebarOpen && !isMobile}
            onClick={() => {
              setActiveTab("overview");
              if (isMobile) setSidebarOpen(false);
            }}
          />

          <NavItem
            label="Registered Shops"
            icon={<Store01Icon size={17} />}
            count={stats.totalShops}
            active={activeTab === "shops"}
            collapsed={!sidebarOpen && !isMobile}
            onClick={() => {
              setActiveTab("shops");
              if (isMobile) setSidebarOpen(false);
            }}
          />

          <NavItem
            label="Audit Records"
            icon={<FileValidationIcon size={17} />}
            count={stats.totalAudits}
            active={activeTab === "audits"}
            collapsed={!sidebarOpen && !isMobile}
            onClick={() => {
              setActiveTab("audits");
              if (isMobile) setSidebarOpen(false);
            }}
          />

          <NavItem
            label="Invoices & Proforma"
            icon={<Invoice01Icon size={17} />}
            count={stats.totalInvoices}
            active={activeTab === "invoices"}
            collapsed={!sidebarOpen && !isMobile}
            onClick={() => {
              setActiveTab("invoices");
              if (isMobile) setSidebarOpen(false);
            }}
          />

          {sidebarOpen ? (
            <div className="pt-5 px-2.5 pb-1.5 text-[11px] font-mono uppercase text-neutral-400 font-semibold tracking-wider">
              Configuration
            </div>
          ) : (
            <div className="my-2.5 mx-auto w-6 h-px bg-neutral-200" />
          )}

          <NavItem
            label="Shop Categories"
            icon={<Layers01Icon size={17} />}
            count={categories.length}
            active={activeTab === "categories"}
            collapsed={!sidebarOpen && !isMobile}
            onClick={() => {
              setActiveTab("categories");
              if (isMobile) setSidebarOpen(false);
            }}
          />

          <NavItem
            label="Certificate Matrix"
            icon={<Settings02Icon size={17} />}
            count={documentTypes.length}
            active={activeTab === "pricing"}
            collapsed={!sidebarOpen && !isMobile}
            onClick={() => {
              setActiveTab("pricing");
              if (isMobile) setSidebarOpen(false);
            }}
          />

          <NavItem
            label="Field Agents"
            icon={<UserGroupIcon size={17} />}
            count={agents.length}
            active={activeTab === "agents"}
            collapsed={!sidebarOpen && !isMobile}
            onClick={() => {
              setActiveTab("agents");
              if (isMobile) setSidebarOpen(false);
            }}
          />
        </nav>

        {/* Bottom Workspace Context */}
        {sidebarOpen ? (
          <div className="p-3 border-t border-neutral-200 space-y-2">
            <div className="px-1 py-1 flex items-center justify-between text-xs">
              <div className="truncate pr-2">
                <div className="font-semibold text-neutral-900 truncate text-xs">
                  {adminUser?.full_name || "Super Admin"}
                </div>
                <div className="text-[11px] text-neutral-400 truncate font-mono">
                  {adminUser?.email || "admin@berhamporeinsight.com"}
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                title="Sign out of Admin Portal"
                className="p-1.5 rounded-[4px] text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
              >
                <Logout01Icon size={16} />
              </button>
            </div>

            <Link
              href="/agent"
              className="flex items-center justify-between p-2 rounded-[5px] bg-neutral-50 hover:bg-neutral-100 text-xs font-medium text-neutral-700 transition-colors border border-neutral-200"
            >
              <span className="flex items-center gap-2 truncate">
                <SparklesIcon size={14} className="text-neutral-500 shrink-0" />
                <span className="truncate">Open Agent Portal</span>
              </span>
              <ArrowRight01Icon size={13} className="shrink-0" />
            </Link>
          </div>
        ) : (
          <div className="p-2 border-t border-neutral-200 flex flex-col items-center gap-1.5">
            <div className="relative group">
              <button
                type="button"
                onClick={handleSignOut}
                aria-label="Sign Out"
                className="w-10 h-10 rounded-[6px] flex items-center justify-center text-neutral-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <Logout01Icon size={16} />
              </button>
              <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center px-2.5 py-1 bg-neutral-900 text-white text-xs font-medium rounded-[5px] shadow-lg whitespace-nowrap z-50">
                <span>Sign Out</span>
              </div>
            </div>

            <div className="relative group">
              <Link
                href="/agent"
                aria-label="Open Agent Portal"
                className="w-10 h-10 rounded-[6px] flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors border border-neutral-200"
              >
                <SparklesIcon size={16} className="text-neutral-500" />
              </Link>
              <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center px-2.5 py-1 bg-neutral-900 text-white text-xs font-medium rounded-[5px] shadow-lg whitespace-nowrap z-50">
                <span>Open Agent Portal</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* MAIN CONTENT AREA */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isMobile
            ? "pl-0"
            : sidebarOpen
            ? "pl-64"
            : "pl-16"
        }`}
      >
        {/* Top Header Bar */}
        <header className="h-16 bg-white/95 backdrop-blur-sm border-b border-neutral-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Mobile-only toggle button */}
            <button
              type="button"
              onClick={toggleSidebar}
              title="Toggle sidebar"
              aria-label="Toggle sidebar"
              className="md:hidden p-1.5 rounded-[5px] border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700"
            >
              <VercelSidebarIcon className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-neutral-400 hidden sm:inline">Dashboard</span>
              <span className="text-xs text-neutral-300 hidden sm:inline">/</span>
              <span className="text-sm font-semibold text-neutral-900 capitalize tracking-tight">
                {activeTab}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search01Icon size={15} className="absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search shops, locations, or filings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 pr-3.5 w-56 sm:w-72 text-xs bg-neutral-50 border border-neutral-200 rounded-[4px] outline-none focus:border-neutral-900 focus:bg-white transition-colors"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5"
            >
              <Loading03Icon size={14} className={loading ? "animate-spin" : ""} />
              Sync
            </Button>

            <button
              type="button"
              onClick={handleSignOut}
              title="Sign Out"
              className="h-8 px-2.5 rounded-[4px] border border-neutral-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-neutral-600 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Logout01Icon size={14} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="p-7 max-w-[1240px] w-full mx-auto space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5 bg-white">
                  <div className="flex items-center justify-between text-neutral-500 mb-1.5">
                    <span className="text-xs font-medium uppercase tracking-wider">Registered Shops</span>
                    <Store01Icon size={17} />
                  </div>
                  <div className="text-3xl font-bold font-mono text-neutral-900">{stats.totalShops}</div>
                  <div className="text-xs text-emerald-700 font-medium mt-1.5">Live database records</div>
                </Card>

                <Card className="p-5 bg-white">
                  <div className="flex items-center justify-between text-neutral-500 mb-1.5">
                    <span className="text-xs font-medium uppercase tracking-wider">Audit Sessions</span>
                    <FileValidationIcon size={17} />
                  </div>
                  <div className="text-3xl font-bold font-mono text-neutral-900">{stats.totalAudits}</div>
                  <div className="text-xs text-neutral-500 mt-1.5">On-site inspections</div>
                </Card>

                <Card className="p-5 bg-white">
                  <div className="flex items-center justify-between text-neutral-500 mb-1.5">
                    <span className="text-xs font-medium uppercase tracking-wider">Total Invoices</span>
                    <Invoice01Icon size={17} />
                  </div>
                  <div className="text-3xl font-bold font-mono text-neutral-900">{stats.totalInvoices}</div>
                  <div className="text-xs text-neutral-500 mt-1.5">Proforma & final</div>
                </Card>

                <Card className="p-5 bg-white">
                  <div className="flex items-center justify-between text-neutral-500 mb-1.5">
                    <span className="text-xs font-medium uppercase tracking-wider">Regularization Total</span>
                    <span className="text-sm font-mono font-bold">₹</span>
                  </div>
                  <div className="text-3xl font-bold font-mono text-neutral-900">
                    ₹{stats.totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1.5">Calculated filings pipeline</div>
                </Card>
              </div>

              {/* Recent Activity Table */}
              <Card className="p-0 overflow-hidden bg-white">
                <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-neutral-900">Recent Field Compliance Audits</h2>
                    <p className="text-xs text-neutral-500 mt-0.5">Live feed of merchant visits and digital sign-offs.</p>
                  </div>
                  <Button variant="outline" size="xs" onClick={() => setActiveTab("audits")}>
                    View All
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-neutral-50/60 border-b border-neutral-100 text-neutral-500 font-medium uppercase text-[11px]">
                        <th className="py-3 px-5">Merchant Shop</th>
                        <th className="py-3 px-5">Inspection Location</th>
                        <th className="py-3 px-5">Compliance Status</th>
                        <th className="py-3 px-5">Timestamp</th>
                        <th className="py-3 px-5 text-right">Digital Signature</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-sm">
                      {audits.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-neutral-400 text-sm">
                            No field audits conducted yet. Complete your first inspection in the Agent Wizard!
                          </td>
                        </tr>
                      ) : (
                        audits.slice(0, 5).map((audit) => {
                          const missingCount = (audit.audit_documents || []).filter((d: any) => d.status === "missing").length;
                          return (
                            <tr key={audit.id} className="hover:bg-neutral-50/70">
                              <td className="py-3.5 px-5">
                                <div className="font-semibold text-neutral-900 text-sm">{audit.shops?.shop_name || "Unknown Shop"}</div>
                                <div className="text-xs text-neutral-500">{audit.shops?.owner_name} ({audit.shops?.phone})</div>
                              </td>
                              <td className="py-3.5 px-5 text-neutral-700 text-xs">{audit.place}</td>
                              <td className="py-3.5 px-5">
                                {missingCount > 0 ? (
                                  <Badge variant="missing">{missingCount} Missing Certificates</Badge>
                                ) : (
                                  <Badge variant="available">100% Verified</Badge>
                                )}
                              </td>
                              <td className="py-3.5 px-5 text-neutral-500 font-mono text-xs">
                                {new Date(audit.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                              </td>
                              <td className="py-3.5 px-5 text-right">
                                {audit.signature_url ? (
                                  <span className="text-emerald-700 font-medium text-xs inline-flex items-center gap-1.5">
                                    <CheckmarkCircle02Icon size={14} /> Captured
                                  </span>
                                ) : (
                                  <span className="text-neutral-400 text-xs">None</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 2: REGISTERED SHOPS */}
          {activeTab === "shops" && (
            <Card className="p-0 overflow-hidden bg-white">
              <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-900">Registered Merchant Establishments</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">Shops recorded in the Supabase database.</p>
                </div>
                <Badge variant="neutral">{shops.length} Total</Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-neutral-50/60 border-b border-neutral-100 text-neutral-500 font-medium uppercase text-[11px]">
                      <th className="py-3 px-5">Shop Legal Name</th>
                      <th className="py-3 px-5">Proprietor</th>
                      <th className="py-3 px-5">WhatsApp Phone</th>
                      <th className="py-3 px-5">Physical Address</th>
                      <th className="py-3 px-5 text-right">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-sm">
                    {shops.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-neutral-400 text-sm">
                          No shops registered yet. Complete an onboarding audit via the Field Agent portal.
                        </td>
                      </tr>
                    ) : (
                      shops.map((shop) => (
                        <tr key={shop.id} className="hover:bg-neutral-50/70">
                          <td className="py-3.5 px-5 font-semibold text-neutral-900">{shop.shop_name}</td>
                          <td className="py-3.5 px-5 text-neutral-800">{shop.owner_name}</td>
                          <td className="py-3.5 px-5 font-mono text-neutral-700 text-xs">{shop.phone}</td>
                          <td className="py-3.5 px-5 text-neutral-600 max-w-xs truncate text-xs">{shop.address}</td>
                          <td className="py-3.5 px-5 text-right text-neutral-400 font-mono text-xs">
                            {new Date(shop.created_at).toLocaleDateString("en-IN")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB 3: AUDITS */}
          {activeTab === "audits" && (
            <Card className="p-0 overflow-hidden bg-white">
              <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-900">Comprehensive Audit Logs</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">Inspections recorded with digital signatures and compliance notes.</p>
                </div>
                <Badge variant="neutral">{audits.length} Audits</Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-neutral-50/60 border-b border-neutral-100 text-neutral-500 font-medium uppercase text-[11px]">
                      <th className="py-3 px-5">Audit Ref</th>
                      <th className="py-3 px-5">Merchant Shop</th>
                      <th className="py-3 px-5">Location</th>
                      <th className="py-3 px-5">Missing Filings</th>
                      <th className="py-3 px-5">Digital Signature</th>
                      <th className="py-3 px-5 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-sm">
                    {audits.map((audit) => {
                      const missingItems = (audit.audit_documents || []).filter((d: any) => d.status === "missing");
                      return (
                        <tr key={audit.id} className="hover:bg-neutral-50/70">
                          <td className="py-3.5 px-5 font-mono text-neutral-500 text-xs">{audit.id.slice(0, 8)}</td>
                          <td className="py-3.5 px-5">
                            <div className="font-semibold text-neutral-900">{audit.shops?.shop_name}</div>
                            <div className="text-xs text-neutral-500">{audit.shops?.owner_name}</div>
                          </td>
                          <td className="py-3.5 px-5 text-neutral-700 text-xs">{audit.place}</td>
                          <td className="py-3.5 px-5">
                            {missingItems.length > 0 ? (
                              <Badge variant="missing">{missingItems.length} Missing</Badge>
                            ) : (
                              <Badge variant="available">Verified</Badge>
                            )}
                          </td>
                          <td className="py-3.5 px-5">
                            {audit.signature_url ? (
                              <img src={audit.signature_url} alt="Signature" className="h-7 w-auto object-contain" />
                            ) : (
                              <span className="text-neutral-400 text-xs">None</span>
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-right text-neutral-500 font-mono text-xs">
                            {new Date(audit.created_at).toLocaleDateString("en-IN")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB 4: INVOICES */}
          {activeTab === "invoices" && (
            <Card className="p-0 overflow-hidden bg-white">
              <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-900">Invoices & Proforma Quotations</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">Estimates and tax invoices issued to local merchants.</p>
                </div>
                <Badge variant="neutral">{invoices.length} Total</Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-neutral-50/60 border-b border-neutral-100 text-neutral-500 font-medium uppercase text-[11px]">
                      <th className="py-3 px-5">Type</th>
                      <th className="py-3 px-5">Merchant</th>
                      <th className="py-3 px-5">Line Items</th>
                      <th className="py-3 px-5">Status</th>
                      <th className="py-3 px-5 text-right">Total Payable</th>
                      <th className="py-3 px-5 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-sm">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-neutral-400 text-sm">
                          No invoices issued yet.
                        </td>
                      </tr>
                    ) : (
                      invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-neutral-50/70">
                          <td className="py-3.5 px-5 font-mono font-medium text-neutral-900 uppercase">
                            <Badge variant={inv.type === "proforma" ? "accent" : "primary"}>
                              {inv.type}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-5">
                            <div className="font-semibold text-neutral-900">{inv.shops?.shop_name}</div>
                            <div className="text-xs text-neutral-500">{inv.shops?.owner_name}</div>
                          </td>
                          <td className="py-3.5 px-5 text-neutral-600 text-xs">
                            {(inv.line_items || []).length} Regularization Filings
                          </td>
                          <td className="py-3.5 px-5">
                            <Badge variant="available">Issued</Badge>
                          </td>
                          <td className="py-3.5 px-5 text-right font-mono font-bold text-neutral-900">
                            ₹{Number(inv.total_amount).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-5 text-right text-neutral-400 font-mono text-xs">
                            {new Date(inv.created_at).toLocaleDateString("en-IN")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB 5: CATEGORIES CONFIG */}
          {activeTab === "categories" && (
            <div className="space-y-6">
              {/* Add Category Form */}
              <Card className="p-6 bg-white space-y-4">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-900">Create New Compliance Category</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">Define business categories and map mandatory regulatory certificates.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Input
                    label="Category Title"
                    placeholder="e.g. Chemical & Fertilizer Retail"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                  />
                  <Input
                    label="Description"
                    placeholder="e.g. Hazardous chemicals, pesticides, farm supplies"
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                  />
                </div>

                {/* Document Type Checkboxes */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-neutral-700">
                    Attach Mandatory Regulatory Requirements:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {documentTypes.map((dt) => {
                      const isChecked = selectedDocTypeIds.includes(dt.id);
                      return (
                        <div
                          key={dt.id}
                          onClick={() => {
                            if (isChecked) {
                              setSelectedDocTypeIds(selectedDocTypeIds.filter((id) => id !== dt.id));
                            } else {
                              setSelectedDocTypeIds([...selectedDocTypeIds, dt.id]);
                            }
                          }}
                          className={`p-3 rounded-[4px] border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                            isChecked
                              ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                              : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                          }`}
                        >
                          <span className="font-mono text-xs font-medium">{dt.code}</span>
                          <span className="text-xs opacity-80 font-mono">₹{Number(dt.default_fee).toFixed(0)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    disabled={!newCatName.trim() || isAddingCategory}
                    onClick={handleCreateCategory}
                    className="flex items-center gap-1.5"
                  >
                    <PlusSignIcon size={16} />
                    {isAddingCategory ? "Creating..." : "Save Category"}
                  </Button>
                </div>
              </Card>

              {/* Existing Categories List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((cat) => (
                  <Card key={cat.id} className="p-5 bg-white space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm text-neutral-900">{cat.name}</h3>
                      <Badge variant="neutral">Active</Badge>
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed">{cat.description}</p>
                    <div className="pt-2.5 border-t border-neutral-100">
                      <span className="text-[11px] text-neutral-400 font-mono">
                        UUID: {cat.id}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: PRICING MATRIX */}
          {activeTab === "pricing" && (
            <Card className="p-0 overflow-hidden bg-white">
              <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-900">Certificate & Regularization Fee Matrix</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Default regularization fees applied when missing documents are aggregated.
                  </p>
                </div>
                <Badge variant="neutral">{documentTypes.length} Types</Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-neutral-50/60 border-b border-neutral-100 text-neutral-500 font-medium uppercase text-[11px]">
                      <th className="py-3 px-5">Code</th>
                      <th className="py-3 px-5">Certificate Full Title</th>
                      <th className="py-3 px-5 text-right">Default Fee (INR)</th>
                      <th className="py-3 px-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-sm">
                    {documentTypes.map((doc) => {
                      const isEditing = editingFeeId === doc.id;
                      return (
                        <tr key={doc.id} className="hover:bg-neutral-50/70">
                          <td className="py-3.5 px-5 font-mono font-semibold text-neutral-900 text-xs">{doc.code}</td>
                          <td className="py-3.5 px-5 text-neutral-800">{doc.name}</td>
                          <td className="py-3.5 px-5 text-right font-mono font-medium text-neutral-900">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editFeeValue}
                                onChange={(e) => setEditFeeValue(e.target.value)}
                                className="w-28 px-2 py-1 text-sm text-right border border-neutral-300 rounded outline-none"
                                autoFocus
                              />
                            ) : (
                              `₹${Number(doc.default_fee).toFixed(2)}`
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            {isEditing ? (
                              <div className="inline-flex gap-1.5">
                                <Button size="xs" variant="primary" onClick={() => handleUpdateFee(doc.id)}>
                                  Save
                                </Button>
                                <Button size="xs" variant="outline" onClick={() => setEditingFeeId(null)}>
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => {
                                  setEditingFeeId(doc.id);
                                  setEditFeeValue(doc.default_fee.toString());
                                }}
                              >
                                Edit Fee
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB 7: AGENTS */}
          {activeTab === "agents" && (
            <div className="space-y-6">
              {/* Provision Agent Card */}
              <Card className="p-6 bg-white space-y-4">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-900">Provision Field Compliance Agent</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">Add an authorized field agent to conduct merchant inspections.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Input
                    label="Agent Full Name"
                    placeholder="e.g. Subhashish Roy"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                  />
                  <Input
                    label="Phone Number"
                    placeholder="e.g. +91 98321 00000"
                    value={agentPhone}
                    onChange={(e) => setAgentPhone(e.target.value)}
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    variant="primary"
                    size="md"
                    disabled={!agentName.trim() || isAddingAgent}
                    onClick={handleCreateAgent}
                    className="flex items-center gap-1.5"
                  >
                    <PlusSignIcon size={16} />
                    {isAddingAgent ? "Provisioning..." : "Provision Agent"}
                  </Button>
                </div>
              </Card>

              {/* Agents Table */}
              <Card className="p-0 overflow-hidden bg-white">
                <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-neutral-900">Authorized Agent List</h2>
                  <Badge variant="neutral">{agents.length} Agents</Badge>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-neutral-50/60 border-b border-neutral-100 text-neutral-500 font-medium uppercase text-[11px]">
                        <th className="py-3 px-5">Agent Name</th>
                        <th className="py-3 px-5">Contact Phone</th>
                        <th className="py-3 px-5">Role</th>
                        <th className="py-3 px-5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-sm">
                      {agents.map((ag) => (
                        <tr key={ag.id} className="hover:bg-neutral-50/70">
                          <td className="py-3.5 px-5 font-semibold text-neutral-900">{ag.full_name}</td>
                          <td className="py-3.5 px-5 font-mono text-neutral-600 text-xs">{ag.phone || "—"}</td>
                          <td className="py-3.5 px-5 font-mono text-xs uppercase">{ag.role}</td>
                          <td className="py-3.5 px-5 text-right">
                            <Badge variant="available">Active</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

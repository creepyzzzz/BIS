import Link from "next/link";
import Image from "next/image";
import { TopBar } from "@/components/ui/TopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  SmartPhone01Icon,
  SecurityLockIcon,
  Task01Icon,
  FileAttachmentIcon,
  SentIcon,
  ArrowRight01Icon,
} from "hugeicons-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F9FCF5] text-[#1E2C0F] pb-28">
      <TopBar />

      <main className="max-w-[1060px] mx-auto px-5 sm:px-8 pt-28 space-y-14">
        {/* HERO SECTION */}
        <section className="text-center space-y-6 max-w-[760px] mx-auto pt-8">
          {/* Logo Brand Presentation */}
          <div className="flex justify-center mb-3">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 drop-shadow-sm">
              <Image
                src="/logo.png"
                alt="Berhampore Insight Solutions"
                fill
                sizes="(max-width: 768px) 96px, 112px"
                className="object-contain"
                priority
              />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-neutral-900 tracking-tight leading-tight">
            Berhampore Insight Solutions
          </h1>

          <p className="text-base sm:text-lg text-neutral-600 max-w-[620px] mx-auto leading-relaxed">
            Field compliance auditing & merchant onboarding portal. Standardize on-site certificate inspections,
            auto-flag missing documents into actionable proforma estimates, record digital signatures, and dispatch invoices via WhatsApp.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <Link href="/agent">
              <Button size="lg" variant="primary" className="w-full sm:w-auto flex items-center gap-2">
                <SmartPhone01Icon size={17} />
                Launch Field Agent Wizard
                <ArrowRight01Icon size={17} />
              </Button>
            </Link>

            <Link href="/admin">
              <Button size="lg" variant="outline" className="w-full sm:w-auto flex items-center gap-2">
                <SecurityLockIcon size={17} />
                Super Admin Portal
              </Button>
            </Link>
          </div>
        </section>

        {/* WORKFLOW CARDS GRID */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="p-6 space-y-3 bg-white">
            <div className="w-9 h-9 rounded-[4px] bg-neutral-100 flex items-center justify-center text-neutral-800 border border-neutral-200">
              <Task01Icon size={18} />
            </div>
            <h3 className="text-base font-semibold text-neutral-900 tracking-tight">
              Dynamic Checklists
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
              Multi-category audit logic (Grocery, Eatery, Pharmacy, General Trade). Dynamically builds
              mandatory certificate matrices.
            </p>
          </Card>

          <Card className="p-6 space-y-3 bg-white">
            <div className="w-9 h-9 rounded-[4px] bg-neutral-100 flex items-center justify-center text-neutral-800 border border-neutral-200">
              <FileAttachmentIcon size={18} />
            </div>
            <h3 className="text-base font-semibold text-neutral-900 tracking-tight">
              Actionable Notes Engine
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
              Missing documents are automatically aggregated into structured inspection reports with
              regularization cost estimates.
            </p>
          </Card>

          <Card className="p-6 space-y-3 bg-white">
            <div className="w-9 h-9 rounded-[4px] bg-neutral-100 flex items-center justify-center text-neutral-800 border border-neutral-200">
              <SentIcon size={18} />
            </div>
            <h3 className="text-base font-semibold text-neutral-900 tracking-tight">
              Direct WhatsApp Dispatch
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
              Instant notification links and server-generated proforma quotations dispatched directly
              to merchant mobile devices.
            </p>
          </Card>
        </section>
      </main>
    </div>
  );
}

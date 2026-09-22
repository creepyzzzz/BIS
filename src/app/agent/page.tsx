"use client";

import React, { useState, useEffect } from "react";
import { TopBar } from "@/components/ui/TopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { SignatureCanvas } from "@/components/ui/SignatureCanvas";
import { aggregateAuditFindings } from "@/lib/complianceEngine";
import { generateWhatsAppNotificationUrl } from "@/lib/whatsapp";
import { uploadToStorage } from "@/lib/upload";
import { DocStatus, DocumentType } from "@/types";
import {
  CheckmarkCircle02Icon,
  CloudUploadIcon,
  File01Icon,
  SentIcon,
  ArrowRight01Icon,
  AlertCircleIcon,
  Loading03Icon,
} from "hugeicons-react";
import confetti from "canvas-confetti";

export default function AgentInspectionWizard() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Dynamic Categories and Document Types from Supabase
  const [categories, setCategories] = useState<any[]>([]);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [isLoadingMasterData, setIsLoadingMasterData] = useState(false);

  // Shop Details
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Categories Selection
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // Inspection Checklist
  const [checklist, setChecklist] = useState<
    Array<{
      document_type_id: string;
      document_type: DocumentType;
      status: DocStatus;
      fileUrl?: string;
      fileName?: string;
      notes?: string;
    }>
  >([]);

  // Sign-off
  const [place, setPlace] = useState("Merchant Shop Premises");
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoiceHtml, setInvoiceHtml] = useState<string | null>(null);

  // Load live categories and requirements from Supabase on mount
  useEffect(() => {
    async function loadData() {
      setIsLoadingMasterData(true);
      try {
        const [catRes, docRes] = await Promise.all([
          fetch("/api/admin?type=categories"),
          fetch("/api/admin?type=document_types"),
        ]);

        if (docRes.ok) {
          const docData = await docRes.json();
          if (docData.document_types) {
            setDocTypes(docData.document_types);
          }
        }

        if (catRes.ok) {
          const catData = await catRes.json();
          if (catData.categories && catData.categories.length > 0) {
            const formatted = catData.categories.map((c: any) => ({
              id: c.id,
              name: c.name,
              description: c.description || "Operational compliance category",
              requiredDocs: (c.category_requirements || []).map((cr: any) => cr.document_types).filter(Boolean),
              requiredDocCodes: (c.category_requirements || []).map((cr: any) => cr.document_types?.code).filter(Boolean),
            }));
            setCategories(formatted);
            if (formatted.length > 0) {
              setSelectedCategoryIds([formatted[0].id]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load categories and document types from Supabase:", err);
      } finally {
        setIsLoadingMasterData(false);
      }
    }
    loadData();
  }, []);

  // Initialize checklist dynamically when advancing from Category selection
  const handleProceedToChecklist = () => {
    const docMap = new Map<string, DocumentType>();

    selectedCategoryIds.forEach((catId) => {
      const cat = categories.find((c) => c.id === catId);
      if (cat) {
        if (cat.requiredDocs && cat.requiredDocs.length > 0) {
          cat.requiredDocs.forEach((d: DocumentType) => {
            if (d && !docMap.has(d.id)) docMap.set(d.id, d);
          });
        } else if (cat.requiredDocCodes) {
          cat.requiredDocCodes.forEach((code: string) => {
            const dt = docTypes.find((d) => d.code === code);
            if (dt && !docMap.has(dt.id)) docMap.set(dt.id, dt);
          });
        }
      }
    });

    const items = Array.from(docMap.values()).map((docType) => ({
      document_type_id: docType.id,
      document_type: docType,
      status: "missing" as DocStatus,
    }));

    setChecklist(items);
    setStep(3);
  };

  const toggleCategory = (catId: string) => {
    if (selectedCategoryIds.includes(catId)) {
      if (selectedCategoryIds.length > 1) {
        setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== catId));
      }
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, catId]);
    }
  };

  const handleDocStatusChange = (index: number, status: DocStatus) => {
    const updated = [...checklist];
    updated[index].status = status;
    setChecklist(updated);
  };

  // Direct Supabase Storage Upload for Verified Certificates
  const handleFileUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { fileUrl } = await uploadToStorage(file, file.name, "certificates");
      const updated = [...checklist];
      updated[index].status = "available";
      updated[index].fileUrl = fileUrl;
      updated[index].fileName = file.name;
      setChecklist(updated);
    } catch (err: any) {
      alert("Certificate upload failed: " + err.message);
    }
  };

  const findings = aggregateAuditFindings(checklist);

  const handleSubmitAudit = async () => {
    if (!signatureUrl) {
      alert("Please capture the merchant's signature to complete the audit.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/invoices/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop: { shop_name: shopName, owner_name: ownerName, phone, address },
          audit: {
            place,
            inspection_date: new Date().toISOString(),
            signature_url: signatureUrl,
            auto_notes: findings.autoNotes,
          },
          lineItems: findings.lineItems,
          totalAmount: findings.totalEstimateFee,
          type: findings.missingItems.length > 0 ? "proforma" : "final",
          checklist: checklist.map((item) => ({
            document_type_id: item.document_type_id,
            status: item.status,
            fileUrl: item.fileUrl,
            notes: item.notes,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to finalize audit");

      setInvoiceHtml(data.html);
      confetti({ particleCount: 70, spread: 50, origin: { y: 0.6 } });
      setStep(5);
    } catch (err: any) {
      alert("Error submitting audit: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintInvoice = () => {
    if (invoiceHtml) {
      const printWin = window.open("", "_blank");
      if (printWin) {
        printWin.document.write(invoiceHtml);
        printWin.document.close();
        printWin.focus();
        setTimeout(() => printWin.print(), 250);
      }
    } else {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FCF5] pb-28 text-neutral-900">
      <TopBar userName="Field Agent" userRole="agent" />

      <main className="max-w-[720px] mx-auto px-5 pt-24">
        {/* Step Progress indicator */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase text-neutral-500 font-medium">
              Phase {step} of 5
            </span>
            <h1 className="text-lg font-semibold text-neutral-900 tracking-tight mt-0.5">
              {step === 1 && "Shop & Merchant Profile"}
              {step === 2 && "Business Categories"}
              {step === 3 && "Certificate Checklist"}
              {step === 4 && "Sign-Off & Location"}
              {step === 5 && "Audit Summary & WhatsApp Dispatch"}
            </h1>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all ${
                  step === s
                    ? "w-8 bg-neutral-900"
                    : step > s
                    ? "w-4 bg-neutral-400"
                    : "w-4 bg-neutral-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: SHOP PROFILING */}
        {step === 1 && (
          <Card className="p-6 space-y-5">
            <p className="text-sm text-neutral-600 leading-relaxed">
              Enter merchant legal information for registration and WhatsApp invoice delivery.
            </p>

            <Input
              label="Shop Legal Name"
              placeholder="e.g. Apex Supermarket"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
            />

            <Input
              label="Owner / Proprietor Full Name"
              placeholder="e.g. Ramesh Kumar"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
            />

            <Input
              label="WhatsApp Phone Number"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <Input
              label="Physical Business Address"
              placeholder="Shop No. 4, MG Road Market Complex"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />

            <div className="pt-3 flex justify-end">
              <Button
                variant="primary"
                size="md"
                disabled={!shopName || !ownerName || !phone || !address}
                onClick={() => setStep(2)}
                className="flex items-center gap-2"
              >
                Proceed to Categories
                <ArrowRight01Icon size={16} />
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 2: CATEGORY SELECTION */}
        {step === 2 && (
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-neutral-900">
                  Select Operational Categories
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Mandatory document requirements are dynamically aggregated across categories from Supabase.
                </p>
              </div>
              {isLoadingMasterData && (
                <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
                  <Loading03Icon size={14} className="animate-spin" />
                  Syncing...
                </div>
              )}
            </div>

            {categories.length === 0 ? (
              <div className="py-10 text-center text-neutral-400 text-xs flex flex-col items-center justify-center gap-2">
                <Loading03Icon size={18} className="animate-spin text-neutral-600" />
                Loading categories from Supabase...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.map((cat) => {
                  const isSelected = selectedCategoryIds.includes(cat.id);
                  const reqCount = cat.requiredDocCodes?.length || cat.requiredDocs?.length || 0;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`p-4 rounded-[6px] border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                          : "bg-white text-neutral-900 border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{cat.name}</span>
                        {isSelected ? (
                          <CheckmarkCircle02Icon size={16} className="text-[#64D7C2]" />
                        ) : (
                          <div className="w-4 h-4 rounded-[3px] border border-neutral-300" />
                        )}
                      </div>
                      <p className={`text-xs mt-1.5 leading-relaxed ${isSelected ? "text-neutral-300" : "text-neutral-500"}`}>
                        {cat.description}
                      </p>
                      <div className="mt-3">
                        <span className={`text-[11px] px-2 py-0.5 rounded-[4px] font-mono ${
                          isSelected ? "bg-neutral-800 text-neutral-200" : "bg-neutral-100 text-neutral-600"
                        }`}>
                          {reqCount} Requirements
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-3 flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button variant="primary" size="md" onClick={handleProceedToChecklist}>
                Build Checklist
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 3: DYNAMIC CHECKLIST */}
        {step === 3 && (
          <div className="space-y-5">
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div>
                  <h2 className="text-base font-semibold text-neutral-900">Mandatory Certificate Checklist</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Verify certificates on-site or mark as missing. Files upload directly to Supabase Storage.
                  </p>
                </div>
                <Badge variant="neutral">{checklist.length} Documents</Badge>
              </div>

              <div className="space-y-3">
                {checklist.map((item, idx) => (
                  <div
                    key={item.document_type_id}
                    className="p-4 rounded-[6px] bg-neutral-50/90 border border-neutral-200 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-sm text-neutral-900">
                          {item.document_type.name}
                        </div>
                        <div className="text-xs text-neutral-500 mt-0.5 font-mono">
                          Regularization Fee: ₹{Number(item.document_type.default_fee).toFixed(2)}
                        </div>
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDocStatusChange(idx, "available")}
                          className={`px-3 py-1 text-xs font-medium rounded-[4px] border transition-colors ${
                            item.status === "available"
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                              : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                          }`}
                        >
                          Available
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDocStatusChange(idx, "missing")}
                          className={`px-3 py-1 text-xs font-medium rounded-[4px] border transition-colors ${
                            item.status === "missing"
                              ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                              : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                          }`}
                        >
                          Missing
                        </button>
                      </div>
                    </div>

                    {item.status === "available" && (
                      <div className="pt-2.5 border-t border-neutral-200/80 flex items-center justify-between">
                        <label className="inline-flex items-center gap-2 text-xs font-medium text-neutral-700 cursor-pointer bg-white px-3 py-1.5 rounded-[4px] border border-neutral-200 hover:bg-neutral-50 shadow-sm">
                          <CloudUploadIcon size={15} />
                          <span>{item.fileName ? item.fileName : "Upload Certificate (Supabase)"}</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => handleFileUpload(idx, e)}
                          />
                        </label>
                        {item.fileUrl && (
                          <span className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                            <CheckmarkCircle02Icon size={14} />
                            Stored in Cloud
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* REAL-TIME AUTO NOTES */}
            <Card variant="tinted" className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircleIcon size={16} className="text-neutral-800" />
                  <h3 className="font-semibold text-sm text-neutral-900">
                    Automated Compliance Notes
                  </h3>
                </div>
                <Badge variant="missing">{findings.missingItems.length} Missing Filings</Badge>
              </div>

              <pre className="text-xs bg-white p-3.5 rounded-[4px] border border-neutral-200 font-mono text-neutral-800 whitespace-pre-wrap leading-relaxed shadow-sm">
                {findings.autoNotes}
              </pre>

              <div className="flex items-center justify-between pt-1.5 text-sm">
                <span className="text-neutral-600 font-medium">Estimated Regularization Fee:</span>
                <span className="font-bold text-neutral-900 font-mono text-base">
                  ₹{findings.totalEstimateFee.toFixed(2)}
                </span>
              </div>
            </Card>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button variant="primary" size="md" onClick={() => setStep(4)}>
                Proceed to Sign-Off
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: SIGN-OFF & LOCATION */}
        {step === 4 && (
          <Card className="p-6 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Audit Sign-Off & Verification</h2>
              <p className="text-xs text-neutral-500 mt-1">
                Confirm inspection location and capture merchant digital signature.
              </p>
            </div>

            <Input
              label="Inspection Location / Premises"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />

            <div className="space-y-2">
              <label className="block text-xs font-medium text-neutral-700">
                Merchant Authorized Signature
              </label>
              <SignatureCanvas
                onSave={(dataUrl) => setSignatureUrl(dataUrl)}
                onClear={() => setSignatureUrl(null)}
              />
            </div>

            <div className="pt-3 flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={!signatureUrl || isSubmitting}
                onClick={handleSubmitAudit}
              >
                {isSubmitting ? "Saving to Supabase..." : "Finalize & Issue Audit"}
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 5: SUMMARY & WHATSAPP */}
        {step === 5 && (
          <Card className="p-8 space-y-6 text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-[6px] mx-auto flex items-center justify-center text-emerald-700 border border-emerald-200">
              <CheckmarkCircle02Icon size={24} />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-semibold text-neutral-900 tracking-tight">
                Audit Successfully Recorded
              </h2>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Merchant record created, missing documents aggregated, and invoice synced directly to Supabase.
              </p>
            </div>

            <div className="bg-neutral-50 p-4 rounded-[6px] border border-neutral-200 text-left space-y-2 max-w-md mx-auto text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500 font-medium">Merchant:</span>
                <span className="font-semibold text-neutral-900">{shopName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-medium">Proprietor:</span>
                <span className="font-medium text-neutral-900">{ownerName} ({phone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-medium">Missing Certificates:</span>
                <span className="font-semibold text-rose-700">{findings.missingItems.length}</span>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-2 font-semibold text-sm">
                <span>Regularization Total:</span>
                <span className="font-mono">₹{findings.totalEstimateFee.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <a
                href={generateWhatsAppNotificationUrl({
                  phoneNumber: phone,
                  ownerName,
                  shopName,
                  missingCount: findings.missingItems.length,
                  totalAmount: findings.totalEstimateFee,
                  invoiceType: findings.missingItems.length > 0 ? "proforma" : "final",
                })}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#128C7E] text-white font-medium h-10 px-5 rounded-[4px] hover:bg-[#075E54] transition-colors text-sm shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
              >
                <SentIcon size={16} />
                Send via WhatsApp
              </a>

              <button
                type="button"
                onClick={handlePrintInvoice}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-black text-white font-medium h-10 px-5 rounded-[4px] hover:bg-neutral-800 transition-colors text-sm border border-black shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
              >
                <File01Icon size={16} />
                Print / Download Invoice
              </button>
            </div>

            <div className="pt-3 border-t border-neutral-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStep(1);
                  setShopName("");
                  setOwnerName("");
                  setPhone("");
                  setAddress("");
                  setSignatureUrl(null);
                  setInvoiceHtml(null);
                }}
              >
                Start New Shop Inspection
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}

import { DocumentType, DocStatus, AuditDocument } from "@/types";

export interface MissingDocumentItem {
  code: string;
  name: string;
  fee: number;
  reason?: string;
}

/**
 * Aggregates all missing documents from the checklist and generates:
 * 1. Structured action-required notes text.
 * 2. Calculated proforma quotation total and line items.
 */
export function aggregateAuditFindings(
  checklist: Array<{
    document_type_id: string;
    document_type: DocumentType;
    status: DocStatus;
    notes?: string;
  }>
) {
  const missingItems: MissingDocumentItem[] = [];
  const availableItems: string[] = [];

  checklist.forEach((item) => {
    if (item.status === "missing") {
      missingItems.push({
        code: item.document_type.code,
        name: item.document_type.name,
        fee: Number(item.document_type.default_fee) || 0,
        reason: item.notes || "Not submitted during field audit",
      });
    } else if (item.status === "available") {
      availableItems.push(item.document_type.name);
    }
  });

  const totalEstimateFee = missingItems.reduce((acc, curr) => acc + curr.fee, 0);

  let autoNotes = "COMPLIANCE INSPECTION AUDIT REPORT\n";
  autoNotes += "----------------------------------------\n";

  if (availableItems.length > 0) {
    autoNotes += `[VERIFIED DOCUMENTS (${availableItems.length})]:\n`;
    availableItems.forEach((doc, idx) => {
      autoNotes += `  ${idx + 1}. ${doc} - Verified on-site\n`;
    });
    autoNotes += "\n";
  }

  if (missingItems.length > 0) {
    autoNotes += `[ACTION REQUIRED - MISSING REGULATORY FILINGS (${missingItems.length})]:\n`;
    missingItems.forEach((item, idx) => {
      autoNotes += `  ${idx + 1}. ${item.name} (Estimated Regularization Fee: ₹${item.fee.toFixed(2)})\n`;
    });
    autoNotes += `\nTotal Estimated Compliance Filing Cost: ₹${totalEstimateFee.toFixed(2)}\n`;
  } else {
    autoNotes += "[STATUS]: 100% Compliant. All mandatory category certificates verified.\n";
  }

  return {
    missingItems,
    availableItems,
    totalEstimateFee,
    autoNotes,
    lineItems: missingItems.map((item) => ({
      code: item.code,
      title: item.name,
      fee: item.fee,
      status: "missing_regularization",
    })),
  };
}

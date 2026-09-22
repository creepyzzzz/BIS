/**
 * Formats compliance summaries and constructs direct WhatsApp Web/App URLs.
 */
export function generateWhatsAppNotificationUrl({
  phoneNumber,
  ownerName,
  shopName,
  pdfUrl,
  missingCount,
  totalAmount,
  invoiceType = "proforma",
}: {
  phoneNumber: string;
  ownerName: string;
  shopName: string;
  pdfUrl?: string | null;
  missingCount: number;
  totalAmount: number;
  invoiceType?: "proforma" | "final";
}): string {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");

  const invoiceLabel = invoiceType === "proforma" ? "Cost Estimate (Proforma Invoice)" : "Tax Invoice";

  const message = `*Berhampore Insight Solutions | Compliance Update*

Dear *${ownerName}*,
Thank you for participating in the merchant compliance audit for *${shopName}*.

*Audit Overview:*
• Pending / Missing Certificates: *${missingCount}*
• Estimated Regularization Fee: *₹${totalAmount.toFixed(2)}*
• ${invoiceLabel}: ${pdfUrl ? pdfUrl : "Document attached with your field representative."}

Our team is dedicated to assisting you with regulatory filings and licensing. For queries, please reply directly to this message.`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

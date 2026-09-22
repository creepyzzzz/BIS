import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { shop, audit, lineItems, totalAmount, type = "proforma", checklist } = await req.json();

    if (!shop || !audit) {
      return NextResponse.json({ error: "Missing shop or audit data" }, { status: 400 });
    }

    // 1. Insert or reuse Shop
    const { data: insertedShop, error: shopError } = await supabaseAdmin
      .from("shops")
      .insert({
        shop_name: shop.shop_name,
        owner_name: shop.owner_name,
        phone: shop.phone,
        address: shop.address,
      })
      .select()
      .single();

    if (shopError) {
      console.error("Shop save error:", shopError);
      throw shopError;
    }

    // 2. Insert Audit Session
    const { data: insertedAudit, error: auditError } = await supabaseAdmin
      .from("audits")
      .insert({
        shop_id: insertedShop.id,
        agent_id: null,
        place: audit.place || "Merchant Premises",
        inspection_date: audit.inspection_date ? new Date(audit.inspection_date) : new Date(),
        signature_url: audit.signature_url || null,
        auto_notes: audit.auto_notes || null,
      })
      .select()
      .single();

    if (auditError) {
      console.error("Audit save error:", auditError);
      throw auditError;
    }

    // 3. Insert Audit Documents
    if (checklist && Array.isArray(checklist) && checklist.length > 0) {
      const docRows = checklist.map((item: any) => ({
        audit_id: insertedAudit.id,
        document_type_id: item.document_type_id,
        status: item.status || "missing",
        file_url: item.fileUrl || null,
        notes: item.notes || null,
      }));

      const { error: docsError } = await supabaseAdmin
        .from("audit_documents")
        .insert(docRows);

      if (docsError) {
        console.error("Audit documents save error:", docsError);
      }
    }

    // 4. Generate Invoice Document ID
    const invoiceId = `BIS-${Date.now().toString().slice(-6)}`;
    const invoiceDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    // 5. Insert Invoice record in database
    const { data: insertedInvoice, error: invError } = await supabaseAdmin
      .from("invoices")
      .insert({
        shop_id: insertedShop.id,
        audit_id: insertedAudit.id,
        type: type,
        status: "issued",
        total_amount: Number(totalAmount) || 0,
        line_items: lineItems || [],
        pdf_url: null,
      })
      .select()
      .single();

    if (invError) {
      console.error("Invoice save error:", invError);
    }

    const isProforma = type === "proforma";
    const docTitle = isProforma ? "PROFORMA ESTIMATE / QUOTATION" : "TAX INVOICE";

    // Clean, crisp printable document template with BIS branding
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${docTitle} - ${invoiceId}</title>
        <style>
          * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          body { background: #F9FCF5; color: #111827; margin: 0; padding: 32px; font-size: 13px; }
          .container { max-width: 760px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 4px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #111827; padding-bottom: 20px; }
          .brand { font-size: 20px; font-weight: 700; color: #111827; letter-spacing: -0.02em; }
          .doc-badge { background: #f3f4f6; color: #111827; padding: 4px 10px; border-radius: 3px; font-weight: 600; font-size: 11px; border: 1px solid #e5e7eb; letter-spacing: 0.02em; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 24px 0; font-size: 13px; }
          .meta-label { font-size: 10px; text-transform: uppercase; color: #6b7280; font-weight: 600; margin-bottom: 4px; letter-spacing: 0.05em; }
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .table th { background: #f9fafb; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #4b5563; border-bottom: 1px solid #e5e7eb; letter-spacing: 0.03em; }
          .table td { padding: 12px; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
          .total-box { margin-left: auto; width: 260px; background: #f9fafb; border-radius: 4px; padding: 14px; margin-top: 16px; border: 1px solid #e5e7eb; }
          .total-row { display: flex; justify-content: space-between; font-weight: 700; font-size: 15px; color: #111827; }
          .signature-box { margin-top: 36px; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 16px; border-top: 1px dashed #e5e7eb; }
          .sig-img { max-height: 50px; max-width: 160px; object-fit: contain; }
          @media print {
            body { background: #fff; padding: 0; }
            .container { border: none; box-shadow: none; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <div class="brand">Berhampore Insight Solutions</div>
              <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">Merchant Compliance & Shop Auditing Platform</div>
            </div>
            <div style="text-align: right;">
              <span class="doc-badge">${docTitle}</span>
              <div style="margin-top: 6px; font-weight: 700; font-size: 14px;">#${invoiceId}</div>
              <div style="font-size: 11px; color: #6b7280;">Date: ${invoiceDate}</div>
            </div>
          </div>

          <div class="meta-grid">
            <div>
              <div class="meta-label">Merchant Details</div>
              <div style="font-weight: 700; font-size: 14px;">${shop.shop_name}</div>
              <div>Proprietor: ${shop.owner_name}</div>
              <div>Phone: ${shop.phone}</div>
              <div style="color: #4b5563;">${shop.address}</div>
            </div>
            <div>
              <div class="meta-label">Inspection Reference</div>
              <div>Location: <strong>${audit.place}</strong></div>
              <div>Timestamp: <strong>${audit.inspection_date || invoiceDate}</strong></div>
              <div>Audit ID: <span style="font-family: monospace; font-size: 11px;">${insertedAudit.id.slice(0, 8)}</span></div>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Certificate Description</th>
                <th>Regulatory Requirement</th>
                <th style="text-align: right;">Regularization Fee</th>
              </tr>
            </thead>
            <tbody>
              ${
                lineItems && lineItems.length > 0
                  ? lineItems
                      .map(
                        (item: any) => `
                        <tr>
                          <td><strong>${item.title}</strong></td>
                          <td style="color: #4b5563;">Compliance Regularization & Filing</td>
                          <td style="text-align: right; font-weight: 600;">₹${Number(item.fee).toFixed(2)}</td>
                        </tr>
                      `
                      )
                      .join("")
                  : `<tr><td colspan="3" style="text-align:center; color:#6b7280; padding: 24px;">All category certificates verified on-site. No regularization fees required.</td></tr>`
              }
            </tbody>
          </table>

          <div class="total-box">
            <div class="total-row">
              <span>Total Payable:</span>
              <span>₹${Number(totalAmount).toFixed(2)}</span>
            </div>
          </div>

          <div class="signature-box">
            <div>
              <div style="font-size: 11px; color: #6b7280;">Authorized Inspection Officer</div>
              <div style="font-weight: 600; margin-top: 4px;">Field Verification Team, BIS</div>
            </div>
            <div style="text-align: right;">
              ${
                audit.signature_url
                  ? `<img src="${audit.signature_url}" class="sig-img" alt="Merchant Signature" />`
                  : `<div style="height:35px; border-bottom:1px solid #111827; width:140px;"></div>`
              }
              <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">Merchant Authorized Signatory</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return NextResponse.json({
      success: true,
      shopId: insertedShop.id,
      auditId: insertedAudit.id,
      invoiceId,
      html,
    });
  } catch (error: any) {
    console.error("Invoice API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process and record audit" }, { status: 500 });
  }
}

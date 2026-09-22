import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET: Fetch master data (categories, doc types, recent audits, stats)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    if (type === "categories") {
      const { data: categories, error: catError } = await supabaseAdmin
        .from("categories")
        .select(`
          id,
          name,
          description,
          category_requirements (
            document_type_id,
            is_mandatory,
            document_types (
              id,
              code,
              name,
              default_fee
            )
          )
        `)
        .order("name", { ascending: true });

      if (catError) throw catError;
      return NextResponse.json({ categories });
    }

    if (type === "document_types") {
      const { data: document_types, error: docError } = await supabaseAdmin
        .from("document_types")
        .select("*")
        .order("code", { ascending: true });

      if (docError) throw docError;
      return NextResponse.json({ document_types });
    }

    // Default: Dashboard data
    const [shopsRes, auditsRes, invoicesRes, categoriesRes, docTypesRes, agentsRes] = await Promise.all([
      supabaseAdmin.from("shops").select("id, shop_name, owner_name, phone, address, created_at").order("created_at", { ascending: false }).limit(20),
      supabaseAdmin.from("audits").select(`
        id,
        inspection_date,
        place,
        signature_url,
        auto_notes,
        created_at,
        shops ( id, shop_name, owner_name, phone ),
        audit_documents ( id, status, document_types ( code, name ) )
      `).order("created_at", { ascending: false }).limit(20),
      supabaseAdmin.from("invoices").select("id, type, status, total_amount, line_items, pdf_url, created_at, shops ( shop_name, owner_name )").order("created_at", { ascending: false }).limit(20),
      supabaseAdmin.from("categories").select("id, name, description").order("name", { ascending: true }),
      supabaseAdmin.from("document_types").select("*").order("name", { ascending: true }),
      supabaseAdmin.from("profiles").select("id, full_name, role, phone, created_at").order("created_at", { ascending: false }),
    ]);

    const totalRevenue = (invoicesRes.data || []).reduce((acc: number, curr: any) => acc + (Number(curr.total_amount) || 0), 0);

    return NextResponse.json({
      shops: shopsRes.data || [],
      audits: auditsRes.data || [],
      invoices: invoicesRes.data || [],
      categories: categoriesRes.data || [],
      document_types: docTypesRes.data || [],
      agents: agentsRes.data || [],
      stats: {
        totalShops: shopsRes.data?.length || 0,
        totalAudits: auditsRes.data?.length || 0,
        totalInvoices: invoicesRes.data?.length || 0,
        totalRevenue,
      },
    });
  } catch (error: any) {
    console.error("Admin API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch admin data" }, { status: 500 });
  }
}

// POST: Add Category or Provision Agent
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "create_category") {
      const { name, description, doc_type_ids } = body;
      if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

      const { data: newCat, error: catError } = await supabaseAdmin
        .from("categories")
        .insert({ name, description })
        .select()
        .single();

      if (catError) throw catError;

      if (doc_type_ids && Array.isArray(doc_type_ids) && doc_type_ids.length > 0) {
        const reqRows = doc_type_ids.map((dtId: string) => ({
          category_id: newCat.id,
          document_type_id: dtId,
          is_mandatory: true,
        }));
        await supabaseAdmin.from("category_requirements").insert(reqRows);
      }

      return NextResponse.json({ success: true, category: newCat });
    }

    if (action === "create_agent") {
      const { full_name, phone } = body;
      if (!full_name) return NextResponse.json({ error: "Full name is required" }, { status: 400 });

      const { data: newProfile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: crypto.randomUUID(),
          full_name,
          phone,
          role: "agent",
        })
        .select()
        .single();

      if (profileError) throw profileError;
      return NextResponse.json({ success: true, profile: newProfile });
    }

    if (action === "update_doc_fee") {
      const { id, default_fee } = body;
      const { error } = await supabaseAdmin
        .from("document_types")
        .update({ default_fee: Number(default_fee) })
        .eq("id", id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Admin POST Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process request" }, { status: 500 });
  }
}

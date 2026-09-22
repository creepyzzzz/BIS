-- ==============================================================================
-- Field Compliance & Shop Onboarding Platform
-- PostgreSQL Database Schema & Row Level Security (RLS) Policies
-- ==============================================================================

-- Role and Status Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'agent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE doc_status AS ENUM ('available', 'missing', 'not_applicable');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invoice_type AS ENUM ('proforma', 'final');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('draft', 'issued', 'paid', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'agent',
    full_name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Shop Categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Master Document Types
CREATE TABLE IF NOT EXISTS document_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    default_fee NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Category Document Requirements Mapping
CREATE TABLE IF NOT EXISTS category_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    document_type_id UUID NOT NULL REFERENCES document_types(id) ON DELETE CASCADE,
    is_mandatory BOOLEAN DEFAULT true,
    UNIQUE (category_id, document_type_id)
);

-- 5. Registered Shops
CREATE TABLE IF NOT EXISTS shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES profiles(id),
    shop_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Audit Sessions
CREATE TABLE IF NOT EXISTS audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES profiles(id),
    inspection_date TIMESTAMPTZ DEFAULT NOW(),
    place TEXT NOT NULL,
    signature_url TEXT,
    auto_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Audit Documents Checklist
CREATE TABLE IF NOT EXISTS audit_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    document_type_id UUID NOT NULL REFERENCES document_types(id),
    status doc_status NOT NULL DEFAULT 'missing',
    file_url TEXT,
    r2_key TEXT,
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Quotations and Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    audit_id UUID REFERENCES audits(id) ON DELETE SET NULL,
    type invoice_type NOT NULL DEFAULT 'proforma',
    status invoice_status NOT NULL DEFAULT 'draft',
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users can view own, Super Admins can manage all
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id OR is_super_admin());

CREATE POLICY "Super admin can update profiles" ON profiles
    FOR ALL USING (is_super_admin());

-- Categories: Read-only for authenticated, write for super admin
CREATE POLICY "Anyone authenticated can view categories" ON categories
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admin manage categories" ON categories
    FOR ALL USING (is_super_admin());

-- Document Types: Read-only for authenticated, write for super admin
CREATE POLICY "Anyone authenticated can view document types" ON document_types
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admin manage document types" ON document_types
    FOR ALL USING (is_super_admin());

-- Category Requirements: Read for all, manage for super admin
CREATE POLICY "Anyone authenticated can view category requirements" ON category_requirements
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admin manage category requirements" ON category_requirements
    FOR ALL USING (is_super_admin());

-- Shops: Agents view & insert own, Super Admins view all
CREATE POLICY "Agents can view and insert own shops" ON shops
    FOR ALL USING (created_by = auth.uid() OR is_super_admin());

-- Audits: Agents view & insert own audits, Super Admins view all
CREATE POLICY "Agents can manage own audits" ON audits
    FOR ALL USING (agent_id = auth.uid() OR is_super_admin());

-- Audit Documents: Access follows parent audit
CREATE POLICY "Audit documents access based on audit ownership" ON audit_documents
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM audits 
        WHERE audits.id = audit_documents.audit_id 
        AND (audits.agent_id = auth.uid() OR is_super_admin())
      )
    );

-- Invoices: Agents access invoices for their shops/audits, Super Admins manage all
CREATE POLICY "Invoices view and manage" ON invoices
    FOR ALL USING (
      is_super_admin() OR
      EXISTS (
        SELECT 1 FROM shops
        WHERE shops.id = invoices.shop_id AND shops.created_by = auth.uid()
      )
    );

-- ==============================================================================
-- SEED DATA
-- ==============================================================================

-- Master Document Types
INSERT INTO document_types (code, name, default_fee) VALUES
    ('SHOP_EST', 'Shop & Establishment Act Certificate', 1200.00),
    ('TRADE_LIC', 'Municipal Trade License', 2500.00),
    ('BUS_PAN', 'Business / Shop PAN Card', 500.00),
    ('FIRE_NOC', 'Fire Safety Certificate / NOC', 4500.00),
    ('PEST_CTRL', 'Pest Control Compliance Certificate', 1500.00),
    ('FSSAI_LIC', 'Food Safety / FSSAI License or Registration', 3000.00)
ON CONFLICT (code) DO NOTHING;

-- Initial Shop Categories
INSERT INTO categories (id, name, description) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Retail Grocery & Supermarket', 'Packaged goods, provisions, daily consumer goods'),
    ('00000000-0000-0000-0000-000000000002', 'Restaurant & Eatery', 'Dining establishments, cafes, food stalls, bakeries'),
    ('00000000-0000-0000-0000-000000000003', 'Pharmacy & Healthcare', 'Retail chemist, medical equipment, wellness centers'),
    ('00000000-0000-0000-0000-000000000004', 'General Merchandise & Apparel', 'Clothing, hardware, electronics, footwear')
ON CONFLICT (name) DO NOTHING;

-- Category Requirements Mapping
-- Retail Grocery: Shop & Est, Trade Lic, PAN, Pest Control, FSSAI
INSERT INTO category_requirements (category_id, document_type_id, is_mandatory)
SELECT '00000000-0000-0000-0000-000000000001', id, true
FROM document_types
WHERE code IN ('SHOP_EST', 'TRADE_LIC', 'BUS_PAN', 'PEST_CTRL', 'FSSAI_LIC')
ON CONFLICT DO NOTHING;

-- Restaurant & Eatery: Shop & Est, Trade Lic, PAN, Fire Safety, Pest Control, FSSAI
INSERT INTO category_requirements (category_id, document_type_id, is_mandatory)
SELECT '00000000-0000-0000-0000-000000000002', id, true
FROM document_types
WHERE code IN ('SHOP_EST', 'TRADE_LIC', 'BUS_PAN', 'FIRE_NOC', 'PEST_CTRL', 'FSSAI_LIC')
ON CONFLICT DO NOTHING;

-- Pharmacy: Shop & Est, Trade Lic, PAN, Fire Safety, Pest Control
INSERT INTO category_requirements (category_id, document_type_id, is_mandatory)
SELECT '00000000-0000-0000-0000-000000000003', id, true
FROM document_types
WHERE code IN ('SHOP_EST', 'TRADE_LIC', 'BUS_PAN', 'FIRE_NOC', 'PEST_CTRL')
ON CONFLICT DO NOTHING;

# Product Requirement Document (PRD)

**Project Name:** Field Compliance & Shop Onboarding Platform

**Target Audience:** Autonomous AI Coding Agent / Engineering Team

**Version:** 1.0.0

**Status:** Approved for Implementation

---

## 1. System Overview & Objective

The Field Compliance & Shop Onboarding Platform is a web-based mobile-responsive portal designed for field agents visiting local merchant shops. It standardizes merchant onboarding, streamlines multi-category certificate auditing (e.g., Shop & Establishment, Trade License, Business PAN, Fire Safety, Pest Control, Food Safety), flags missing documents automatically into actionable notes, collects authorized signatures, produces estimates (proforma invoices) and final tax invoices, and dispatches them directly to merchants via WhatsApp.

---

## 2. Tech Stack & Infrastructure

* **Frontend:** Clean, responsive web app featuring a single-section landing page and mobile-first inspection wizard.
* **Backend Database & Authentication:** Supabase (PostgreSQL) with Role-Based Access Control (RBAC).
* **File & Media Storage:** Cloudflare R2 (S3-compatible) for storing certificates, inspection files, and signature assets.
* **Customer Communication:** WhatsApp Business API / Webhooks (preferred over SMS/Email for engagement and invoice delivery).
* **Document Engine:** Server-side PDF generation for Quotations (Proforma Invoices) and Final Invoices.

---

## 3. User Roles & Permission Matrix

### Super Admin

* Provisions and manages Field Agent credentials and Agent IDs.
* Creates and maintains Shop Categories.
* Configures required document checklists per category.
* Maintains global visibility to monitor all agents, registered shops, audits, and issued invoices.

### Field Agent

* Authenticates via role-based login.
* Accesses a personal dashboard showing metrics: total shops onboarded and pending audits.
* Executes shop onboarding and collects compliance records.
* Generates Proforma Invoices (Quotations) and Final Tax Invoices.

---

## 4. End-to-End Functional Workflows

### 4.1 Shop Profiling & Onboarding Form

* Agent initiates "Add New Shop".
* Captures Merchant Details: Shop Legal Name, Owner Full Name, Mobile Contact Number (WhatsApp enabled), and Complete Physical Address.

### 4.2 Category Selection & Dynamic Audit Checklist

* Agent selects a shop category.
* Agent can add multiple categories within the same audit session via an "Add More Category" action.
* System dynamically populates the mandatory document checklist pre-configured by the Super Admin:
  * Shop & Establishment Act Certificate
  * Municipal Trade License
  * Business / Shop PAN Card
  * Fire Safety Certificate / NOC
  * Pest Control Compliance Certificate
  * Food Safety / FSSAI License or Registration

### 4.3 Checklist Handling & Automated Notes

* For each requirement in the checklist:
  * If present: Agent uploads the document directly to Cloudflare R2.
  * If missing: The document is flagged, and the platform automatically aggregates it into a dedicated **Notes / Action Required** column/section.
* Audit Sign-Off: Captures Inspection Date & Timestamp, Place/Location, and Authorized Signature.

### 4.4 Invoicing & Estimates

* **Proforma Invoice / Quotation:** Generated upfront as an initial cost estimate based on missing documents that require processing.
* **Final Tax Invoice:** Generated once regulatory filings, document verifications, or services are completed.
* Both Super Admin and Field Agent have permission to generate these invoices.
* PDF download link and inspection summaries are dispatched directly to the merchant's WhatsApp number.

---

## 5. Database Schema (PostgreSQL / Supabase DDL)

```sql
-- Role and Status Enums
CREATE TYPE user_role AS ENUM ('super_admin', 'agent');
CREATE TYPE doc_status AS ENUM ('available', 'missing', 'not_applicable');
CREATE TYPE invoice_type AS ENUM ('proforma', 'final');
CREATE TYPE invoice_status AS ENUM ('draft', 'issued', 'paid', 'cancelled');

-- User Profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'agent',
    full_name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shop Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Master Document Types
CREATE TABLE document_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    default_fee NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Category Document Requirements Mapping
CREATE TABLE category_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    document_type_id UUID NOT NULL REFERENCES document_types(id) ON DELETE CASCADE,
    is_mandatory BOOLEAN DEFAULT true,
    UNIQUE (category_id, document_type_id)
);

-- Registered Shops
CREATE TABLE shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES profiles(id),
    shop_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Sessions
CREATE TABLE audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES profiles(id),
    inspection_date TIMESTAMPTZ DEFAULT NOW(),
    place TEXT NOT NULL,
    signature_url TEXT,
    auto_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Documents Checklist
CREATE TABLE audit_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    document_type_id UUID NOT NULL REFERENCES document_types(id),
    status doc_status NOT NULL DEFAULT 'missing',
    file_url TEXT,
    r2_key TEXT,
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotations and Invoices
CREATE TABLE invoices (
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
```

---

## 6. AI Agent Implementation Steps

* **Step 1: Database & RBAC Setup:** Run the database schema migration in Supabase and define Row Level Security (RLS) policies granting Super Admins global read/write and restricting Agents to their assigned audits.
* **Step 2: Storage Infrastructure:** Configure Cloudflare R2 S3-compatible client and create an API route to issue presigned upload URLs for documents and signatures.
* **Step 3: Super Admin Portal:** Build management views for Agent provisioning, Category CRUD, Document Requirement mapping, and the Global Audit Log.
* **Step 4: Field Agent Inspection Workflow:** Build a mobile-optimized multi-step wizard:
  1. Shop & Owner information entry.
  2. Multi-category selection.
  3. Dynamic checklist with R2 direct-upload and auto-populating "Notes" for missing items.
  4. Inspection place, date, and digital signature canvas sign-off.
* **Step 5: Invoicing & WhatsApp Integration:** Develop the PDF template generator for Proforma Quotations and Invoices, upload PDFs to R2, and connect the WhatsApp API webhook/service to message summaries directly to the merchant.

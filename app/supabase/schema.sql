-- Supabase Database Schema for PooKanakuApp

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Customers Table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    address TEXT,
    category VARCHAR(50) CHECK (category IN ('Hotel', 'Household', 'Temple', 'Shop', 'Function Hall')),
    daily_requirement TEXT,
    flower_preferences TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Flower Types Table
CREATE TABLE flower_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL, -- e.g., kg, bunch, piece
    default_rate DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Daily Supplies Table
CREATE TABLE daily_supplies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    flower_type_id UUID REFERENCES flower_types(id) ON DELETE RESTRICT,
    supply_date DATE NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit_rate DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_rate) STORED,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Calendar Entries (Verification)
CREATE TABLE calendar_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Delivered', 'Half Supply', 'No Supply', 'Holiday')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, entry_date)
);

-- 5. Invoices Table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    billing_month DATE NOT NULL, -- Stored as the first day of the month
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    outstanding_amount DECIMAL(12, 2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    status VARCHAR(50) DEFAULT 'Unpaid' CHECK (status IN ('Unpaid', 'Partially Paid', 'Paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, billing_month)
);

-- 6. Invoice Items Table (Detailed breakdown of the invoice)
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    flower_type_id UUID REFERENCES flower_types(id) ON DELETE RESTRICT,
    total_quantity DECIMAL(10, 2) NOT NULL,
    average_rate DECIMAL(10, 2) NOT NULL,
    item_total DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Payments Table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) CHECK (payment_method IN ('Cash', 'UPI', 'Bank Transfer', 'Cheque')),
    reference_number VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Expenses Table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50) CHECK (category IN ('Flower Purchase', 'Transportation', 'Salary', 'Electricity', 'Packaging', 'Miscellaneous')),
    amount DECIMAL(12, 2) NOT NULL,
    expense_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Shop Leaves Table
CREATE TABLE shop_leaves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leave_date DATE NOT NULL,
    leave_type VARCHAR(50) NOT NULL CHECK (leave_type IN ('Full Leave','Half Day','Festival Holiday','Stock Unavailable','Transport Issue','Emergency Closure','Custom')),
    reason VARCHAR(255),
    custom_description TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(leave_date, leave_type)
);

-- Function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_customers_modtime BEFORE UPDATE ON customers FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_flower_types_modtime BEFORE UPDATE ON flower_types FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_daily_supplies_modtime BEFORE UPDATE ON daily_supplies FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_calendar_entries_modtime BEFORE UPDATE ON calendar_entries FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_invoices_modtime BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_expenses_modtime BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_shop_leaves_modtime BEFORE UPDATE ON shop_leaves FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 10. Users Table (Admin-only users)
CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        auth_uid UUID, -- optional link to Supabase Auth user's id (auth.uid())
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255),
        role VARCHAR(50) NOT NULL DEFAULT 'Admin' CHECK (role IN ('Admin')),
        is_super BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for users updated_at
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: allow admins to manage users. This policy allows a logged-in user to manage
-- the users row that corresponds to their `auth.uid()` if their role is 'Admin'.
-- NOTE: Bootstrapping the first admin must be done via the Supabase SQL editor
-- using the service role or by inserting an initial row manually.
CREATE POLICY "Admins can manage their users rows" ON users
    FOR ALL
    USING (
        -- allow if the request is from an authenticated user whose auth.uid() matches auth_uid and role is Admin
        (auth.uid() IS NOT NULL AND auth.uid() = auth_uid AND role = 'Admin')
    )
    WITH CHECK (
        (auth.uid() IS NOT NULL AND auth.uid() = auth_uid AND role = 'Admin')
    );

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE flower_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_supplies ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_leaves ENABLE ROW LEVEL SECURITY;

-- Policies: Allow authenticated users full access, deny anonymous
-- NOTE: App uses service_role key for data access (bypasses RLS),
-- but these policies protect against anonymous browser client access.

-- Customers
CREATE POLICY "Authenticated users can manage customers" ON customers
    FOR ALL USING (auth.role() = 'authenticated');
-- Flower Types
CREATE POLICY "Authenticated users can manage flower_types" ON flower_types
    FOR ALL USING (auth.role() = 'authenticated');
-- Daily Supplies
CREATE POLICY "Authenticated users can manage daily_supplies" ON daily_supplies
    FOR ALL USING (auth.role() = 'authenticated');
-- Calendar Entries
CREATE POLICY "Authenticated users can manage calendar_entries" ON calendar_entries
    FOR ALL USING (auth.role() = 'authenticated');
-- Invoices
CREATE POLICY "Authenticated users can manage invoices" ON invoices
    FOR ALL USING (auth.role() = 'authenticated');
-- Invoice Items
CREATE POLICY "Authenticated users can manage invoice_items" ON invoice_items
    FOR ALL USING (auth.role() = 'authenticated');
-- Payments
CREATE POLICY "Authenticated users can manage payments" ON payments
    FOR ALL USING (auth.role() = 'authenticated');
-- Expenses
CREATE POLICY "Authenticated users can manage expenses" ON expenses
    FOR ALL USING (auth.role() = 'authenticated');
-- Shop Leaves
CREATE POLICY "Authenticated users can manage shop_leaves" ON shop_leaves
    FOR ALL USING (auth.role() = 'authenticated');

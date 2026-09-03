-- ==============================================================================
-- METAL CREATIVO CHILE - SCHEMA OFICIAL DE BASE DE DATOS SUPABASE (POSTGRESQL)
-- Arquitectura de Ciberseguridad con Row Level Security (RLS) & Auditoria
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_gateway AS ENUM ('mercadopago', 'transferencia', 'webpay');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLA DE CLIENTES (Protegida por Ley 19.628 de Datos Personales)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rut VARCHAR(20) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    region VARCHAR(100) NOT NULL,
    comuna VARCHAR(100) NOT NULL,
    address_street TEXT NOT NULL,
    address_number VARCHAR(50) NOT NULL,
    address_extra TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DE PEDIDOS (ORDERS)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number SERIAL UNIQUE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE RESTRICT,
    status order_status DEFAULT 'pending' NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount > 0),
    shipping_method VARCHAR(50) DEFAULT 'starken' NOT NULL,
    shipping_cost NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    payment_method payment_gateway NOT NULL,
    payment_id VARCHAR(100) UNIQUE, -- Idempotencia ante reintentos de webhook
    preference_id VARCHAR(100),     -- ID de Checkout Pro Mercado Pago
    tracking_number VARCHAR(100),   -- Codigo de seguimiento Starken/Chilexpress
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA DE DETALLE DE PEDIDOS (ORDER ITEMS)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price > 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal NUMERIC(12, 2) GENERATED ALWAYS AS (unit_price * quantity) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA DE LOGS DE WEBHOOKS (Auditoria Criptografica y Trazabilidad)
CREATE TABLE IF NOT EXISTS public.payment_webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gateway VARCHAR(50) DEFAULT 'mercadopago' NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payment_id VARCHAR(100),
    raw_payload JSONB NOT NULL,
    signature_verified BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. INDICES
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON public.orders(payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_customers_rut ON public.customers(rut);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- 7. CIBERSEGURIDAD: ROW LEVEL SECURITY (RLS) ESTRICTO
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Politicas RLS para SERVICE_ROLE (Backend seguro en Vercel)
DROP POLICY IF EXISTS "Service role full access on customers" ON public.customers;
CREATE POLICY "Service role full access on customers"
ON public.customers FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on orders" ON public.orders;
CREATE POLICY "Service role full access on orders"
ON public.orders FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on order_items" ON public.order_items;
CREATE POLICY "Service role full access on order_items"
ON public.order_items FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on webhook logs" ON public.payment_webhook_logs;
CREATE POLICY "Service role full access on webhook logs"
ON public.payment_webhook_logs FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

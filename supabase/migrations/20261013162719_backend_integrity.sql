-- Backend-only integrity boundaries. Existing customer/order data is preserved.
-- Apply as one transaction; a legacy duplicate audit key aborts instead of deleting evidence.
BEGIN;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'web_mercadopago',
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'CLP',
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS request_hash text,
  ADD COLUMN IF NOT EXISTS public_token_hash text,
  ADD COLUMN IF NOT EXISTS ip_hash text,
  ADD COLUMN IF NOT EXISTS preference_request_id uuid,
  ADD COLUMN IF NOT EXISTS preference_started_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_unique
  ON public.orders (idempotency_key);
CREATE UNIQUE INDEX IF NOT EXISTS payment_webhook_event_unique
  ON public.payment_webhook_logs (gateway, payment_id, event_type);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders (created_at DESC);

ALTER TABLE public.orders ADD CONSTRAINT orders_backend_channel_check
  CHECK (channel IN ('web_mercadopago', 'web_transferencia', 'whatsapp_bot', 'mercadolibre')) NOT VALID;
ALTER TABLE public.orders ADD CONSTRAINT orders_backend_currency_check
  CHECK (currency = 'CLP') NOT VALID;

CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 255),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 255),
  phone text NOT NULL DEFAULT '' CHECK (char_length(phone) <= 50),
  product_interest text NOT NULL DEFAULT '' CHECK (char_length(product_interest) <= 255),
  message text NOT NULL DEFAULT '' CHECK (char_length(message) BETWEEN 0 AND 4000),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'handled', 'spam')),
  idempotency_key text NOT NULL UNIQUE CHECK (char_length(idempotency_key) BETWEEN 16 AND 128),
  request_hash text NOT NULL CHECK (request_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX contact_messages_created_at_idx ON public.contact_messages (created_at DESC);

CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '' CHECK (char_length(name) <= 255),
  phone text NOT NULL UNIQUE CHECK (phone ~ '^[0-9]{6,20}$'),
  product text NOT NULL DEFAULT '' CHECK (char_length(product) <= 255),
  commune text NOT NULL DEFAULT '' CHECK (char_length(commune) <= 100),
  region text NOT NULL DEFAULT '' CHECK (char_length(region) <= 100),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'negotiating', 'quoted', 'won', 'lost')),
  source text NOT NULL DEFAULT 'whatsapp_bot' CHECK (char_length(source) <= 64),
  estimated_shipping numeric(10,2) CHECK (estimated_shipping >= 0),
  last_message text NOT NULL DEFAULT '' CHECK (char_length(last_message) <= 8192),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX leads_created_at_idx ON public.leads (created_at DESC);

CREATE TABLE public.backend_rate_limits (
  scope text NOT NULL CHECK (char_length(scope) BETWEEN 1 AND 64),
  key text NOT NULL CHECK (key ~ '^[a-f0-9]{64}$'),
  window_start timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  hits integer NOT NULL CHECK (hits BETWEEN 1 AND 10000),
  PRIMARY KEY (scope, key)
);
CREATE INDEX backend_rate_limits_expires_idx ON public.backend_rate_limits (expires_at);

CREATE TABLE public.whatsapp_sessions (
  phone text PRIMARY KEY CHECK (phone ~ '^[0-9]{6,20}$'),
  history jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(history) = 'array' AND jsonb_array_length(history) <= 20),
  active_message_id text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.whatsapp_messages (
  id text PRIMARY KEY CHECK (char_length(id) BETWEEN 1 AND 200),
  phone text NOT NULL REFERENCES public.whatsapp_sessions(phone) ON DELETE RESTRICT,
  text text NOT NULL CHECK (char_length(text) BETWEEN 1 AND 8192),
  customer_name text NOT NULL DEFAULT '' CHECK (char_length(customer_name) <= 255),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'uncertain', 'awaiting_configuration', 'retryable')),
  history_snapshot jsonb,
  response jsonb,
  sent_count integer NOT NULL DEFAULT 0 CHECK (sent_count BETWEEN 0 AND 30),
  retry_count integer NOT NULL DEFAULT 0 CHECK (retry_count BETWEEN 0 AND 5),
  retry_after timestamptz,
  error_code text CHECK (char_length(error_code) <= 100),
  first_processing_started_at timestamptz,
  processing_started_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX whatsapp_messages_phone_created_idx ON public.whatsapp_messages (phone, created_at DESC);

-- No browser role receives table access. RPCs below also explicitly restrict EXECUTE.
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backend_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.customers, public.orders, public.order_items,
  public.payment_webhook_logs, public.security_audit_events, public.contact_messages,
  public.leads, public.backend_rate_limits, public.whatsapp_sessions, public.whatsapp_messages
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.customers, public.orders,
  public.order_items, public.payment_webhook_logs, public.security_audit_events,
  public.contact_messages, public.leads, public.backend_rate_limits,
  public.whatsapp_sessions, public.whatsapp_messages TO service_role;
REVOKE ALL ON SEQUENCE public.orders_order_number_seq FROM PUBLIC, anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.orders_order_number_seq TO service_role;

CREATE POLICY backend_service_contact ON public.contact_messages FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY backend_service_leads ON public.leads FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY backend_service_limits ON public.backend_rate_limits FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY backend_service_sessions ON public.whatsapp_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY backend_service_messages ON public.whatsapp_messages FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE FUNCTION public.backend_consume_rate_limit(
  p_scope text, p_key text, p_limit integer, p_window_seconds integer
) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_start timestamptz;
  v_allowed boolean;
BEGIN
  IF p_scope IS NULL OR char_length(p_scope) NOT BETWEEN 1 AND 64
    OR p_key IS NULL OR p_key !~ '^[a-f0-9]{64}$'
    OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 10000
    OR p_window_seconds IS NULL OR p_window_seconds NOT BETWEEN 1 AND 86400 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid_rate_limit';
  END IF;
  v_start := to_timestamp(floor(extract(epoch FROM v_now) / p_window_seconds) * p_window_seconds);

  -- Delete at most 100 expired rate rows per request; never customer or order records.
  WITH expired AS (
    SELECT r.scope, r.key FROM public.backend_rate_limits AS r
    WHERE r.expires_at < v_now ORDER BY r.expires_at LIMIT 100 FOR UPDATE SKIP LOCKED
  )
  DELETE FROM public.backend_rate_limits AS r USING expired AS e
  WHERE r.scope = e.scope AND r.key = e.key;

  INSERT INTO public.backend_rate_limits AS r (scope, key, window_start, expires_at, hits)
  VALUES (p_scope, p_key, v_start, v_start + make_interval(secs => p_window_seconds), 1)
  ON CONFLICT (scope, key) DO UPDATE SET
    window_start = EXCLUDED.window_start,
    expires_at = EXCLUDED.expires_at,
    hits = CASE WHEN r.window_start <> EXCLUDED.window_start THEN 1 ELSE r.hits + 1 END
  WHERE r.window_start <> EXCLUDED.window_start OR r.hits < p_limit
  RETURNING true INTO v_allowed;
  RETURN coalesce(v_allowed, false);
END;
$$;

CREATE FUNCTION public.backend_admin_totals() RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT jsonb_build_object(
    'total_orders', count(*),
    'total_revenue', coalesce(sum(o.total_amount) FILTER (
      WHERE o.status::text IN ('paid', 'preparing', 'shipped', 'delivered')), 0),
    'average_ticket', coalesce(round(avg(o.total_amount) FILTER (
      WHERE o.status::text IN ('paid', 'preparing', 'shipped', 'delivered')), 2), 0),
    'channels', jsonb_build_object(
      'web', count(*) FILTER (WHERE o.channel IN ('web_mercadopago', 'web_transferencia')),
      'mercadolibre', count(*) FILTER (WHERE o.channel = 'mercadolibre'),
      'whatsapp', count(*) FILTER (WHERE o.channel = 'whatsapp_bot')),
    'lead_count', (SELECT count(*) FROM public.leads),
    'won_leads', (SELECT count(*) FROM public.leads WHERE status = 'won')
  ) FROM public.orders AS o;
$$;

CREATE FUNCTION public.backend_create_order(
  p_idempotency_key text, p_request_hash text, p_token_hash text,
  p_customer jsonb, p_items jsonb, p_total numeric, p_shipping_method text,
  p_shipping_cost numeric, p_payment_method text, p_channel text,
  p_ip_hash text, p_user_agent text
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_customer_id uuid;
  v_item jsonb;
  v_subtotal numeric := 0;
  v_quantity integer;
  v_price numeric;
  v_reused boolean := false;
BEGIN
  IF p_idempotency_key IS NULL OR p_idempotency_key !~ '^[A-Za-z0-9_-]{16,128}$'
    OR p_request_hash IS NULL OR p_request_hash !~ '^[a-f0-9]{64}$'
    OR p_token_hash IS NULL OR p_token_hash !~ '^[a-f0-9]{64}$'
    OR p_ip_hash IS NULL OR p_ip_hash !~ '^[a-f0-9]{64}$'
    OR p_customer IS NULL OR jsonb_typeof(p_customer) <> 'object'
    OR p_items IS NULL OR jsonb_typeof(p_items) <> 'array'
    OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 20
    OR p_total IS NULL OR p_total <= 0 OR p_total <> trunc(p_total) OR p_total > 9999999999
    OR p_shipping_cost IS NULL OR p_shipping_cost < 0
    OR p_shipping_cost <> trunc(p_shipping_cost) OR p_shipping_cost > 99999999
    OR p_shipping_method IS NULL OR p_shipping_method NOT IN ('starken', 'starken_por_pagar', 'rm_express')
    OR p_payment_method IS NULL OR p_payment_method NOT IN ('mercadopago', 'transferencia')
    OR p_channel IS NULL OR p_channel NOT IN ('web_mercadopago', 'web_transferencia', 'whatsapp_bot', 'mercadolibre')
    OR char_length(coalesce(p_user_agent, '')) > 1024 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid_order';
  END IF;

  -- Serializes competing requests with the same key across all backend instances.
  PERFORM pg_advisory_xact_lock(hashtextextended('backend-order:' || p_idempotency_key, 0));
  SELECT * INTO v_order FROM public.orders WHERE idempotency_key = p_idempotency_key FOR UPDATE;
  IF FOUND THEN
    IF v_order.request_hash IS DISTINCT FROM p_request_hash
      OR v_order.public_token_hash IS DISTINCT FROM p_token_hash THEN
      RAISE EXCEPTION USING ERRCODE = '23505', MESSAGE = 'idempotency_conflict';
    END IF;
    v_reused := true;
  ELSE
    FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
      IF jsonb_typeof(v_item) <> 'object'
        OR coalesce(v_item->>'id', '') = '' OR char_length(v_item->>'id') > 50
        OR coalesce(v_item->>'title', '') = '' OR char_length(v_item->>'title') > 255
        OR v_item->>'currency_id' IS DISTINCT FROM 'CLP'
        OR coalesce(v_item->>'quantity', '') !~ '^[0-9]{1,3}$'
        OR coalesce(v_item->>'unit_price', '') !~ '^[0-9]{1,8}$' THEN
        RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid_order_item';
      END IF;
      v_quantity := (v_item->>'quantity')::integer;
      v_price := (v_item->>'unit_price')::numeric;
      IF v_quantity NOT BETWEEN 1 AND 100 OR v_price <= 0 THEN
        RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid_order_item';
      END IF;
      v_subtotal := v_subtotal + v_quantity * v_price;
    END LOOP;
    IF v_subtotal + p_shipping_cost <> p_total THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'order_total_mismatch';
    END IF;

    INSERT INTO public.customers (
      rut, full_name, email, phone, region, comuna, address_street, address_number, address_extra
    ) VALUES (
      p_customer->>'rut', p_customer->>'full_name', p_customer->>'email',
      p_customer->>'phone', p_customer->>'region', p_customer->>'comuna',
      p_customer->>'address_street', p_customer->>'address_number', p_customer->>'address_extra'
    ) RETURNING id INTO v_customer_id;
    INSERT INTO public.orders (
      customer_id, total_amount, shipping_method, shipping_cost, payment_method,
      channel, currency, idempotency_key, request_hash, public_token_hash, ip_hash, user_agent
    ) VALUES (
      v_customer_id, p_total, p_shipping_method, p_shipping_cost,
      p_payment_method::public.payment_gateway, p_channel, 'CLP',
      p_idempotency_key, p_request_hash, p_token_hash, p_ip_hash, p_user_agent
    ) RETURNING * INTO v_order;
    INSERT INTO public.order_items (order_id, product_id, product_name, unit_price, quantity)
      SELECT v_order.id, item->>'id', item->>'title',
        (item->>'unit_price')::numeric, (item->>'quantity')::integer
      FROM jsonb_array_elements(p_items) AS item;
  END IF;

  RETURN jsonb_build_object(
    'id', v_order.id, 'order_number', v_order.order_number, 'status', v_order.status,
    'total_amount', v_order.total_amount, 'shipping_method', v_order.shipping_method,
    'shipping_cost', v_order.shipping_cost, 'payment_method', v_order.payment_method,
    'payment_id', v_order.payment_id, 'preference_id', v_order.preference_id,
    'channel', v_order.channel, 'currency', v_order.currency,
    'created_at', v_order.created_at, 'reused', v_reused
  );
END;
$$;

CREATE FUNCTION public.backend_apply_payment(
  p_order_id uuid, p_payment_id text, p_amount numeric, p_currency text
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  IF p_order_id IS NULL OR p_payment_id IS NULL
    OR p_payment_id !~ '^[A-Za-z0-9_-]{1,100}$' THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'invalid_payment', 'status', NULL);
  END IF;
  -- Prevent races that attempt to associate one provider payment with two orders.
  PERFORM pg_advisory_xact_lock(hashtextextended('backend-payment:' || p_payment_id, 0));
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'order_not_found', 'status', NULL);
  END IF;
  IF v_order.payment_method::text <> 'mercadopago' THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'payment_method_mismatch', 'status', v_order.status);
  END IF;
  IF p_amount IS NULL OR p_amount IS DISTINCT FROM v_order.total_amount THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'amount_mismatch', 'status', v_order.status);
  END IF;
  IF p_currency IS DISTINCT FROM v_order.currency THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'currency_mismatch', 'status', v_order.status);
  END IF;
  IF EXISTS (SELECT 1 FROM public.orders WHERE payment_id = p_payment_id AND id <> p_order_id) THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'payment_already_assigned', 'status', v_order.status);
  END IF;
  IF v_order.payment_id IS NOT NULL AND v_order.payment_id <> p_payment_id THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'payment_id_mismatch', 'status', v_order.status);
  END IF;
  IF v_order.payment_id = p_payment_id AND v_order.status::text IN ('paid', 'preparing', 'shipped', 'delivered') THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'already_applied', 'status', v_order.status);
  END IF;
  IF v_order.status::text <> 'pending' THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'order_state_conflict', 'status', v_order.status);
  END IF;
  UPDATE public.orders SET status = 'paid'::public.order_status, payment_id = p_payment_id,
    paid_at = clock_timestamp(), updated_at = clock_timestamp() WHERE id = p_order_id;
  RETURN jsonb_build_object('applied', true, 'status', 'paid');
END;
$$;

CREATE FUNCTION public.backend_claim_preference(p_order_id uuid, p_request_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_now timestamptz := clock_timestamp();
BEGIN
  IF p_order_id IS NULL OR p_request_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid_preference_claim';
  END IF;
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('claimed', false, 'preference_id', NULL, 'reason', 'order_not_found');
  END IF;
  IF v_order.preference_id IS NOT NULL THEN
    RETURN jsonb_build_object('claimed', false, 'preference_id', v_order.preference_id);
  END IF;
  IF v_order.payment_method::text <> 'mercadopago' OR v_order.status::text <> 'pending' THEN
    RETURN jsonb_build_object('claimed', false, 'preference_id', NULL, 'reason', 'order_state_conflict');
  END IF;
  IF v_order.preference_request_id IS NOT NULL
    AND v_order.preference_started_at > v_now - interval '45 seconds' THEN
    RETURN jsonb_build_object('claimed', false, 'preference_id', NULL, 'reason', 'preference_busy');
  END IF;
  UPDATE public.orders SET preference_request_id = p_request_id,
    preference_started_at = v_now, updated_at = v_now WHERE id = p_order_id;
  RETURN jsonb_build_object('claimed', true, 'preference_id', NULL);
END;
$$;

CREATE FUNCTION public.backend_finish_preference(p_order_id uuid, p_request_id uuid, p_preference_id text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  IF p_order_id IS NULL OR p_request_id IS NULL OR p_preference_id IS NULL
    OR p_preference_id !~ '^[A-Za-z0-9_-]{1,100}$' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid_preference_result';
  END IF;
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND OR v_order.preference_request_id IS DISTINCT FROM p_request_id THEN RETURN false; END IF;
  IF v_order.preference_id IS NOT NULL THEN RETURN v_order.preference_id = p_preference_id; END IF;
  IF v_order.payment_method::text <> 'mercadopago' OR v_order.status::text <> 'pending' THEN RETURN false; END IF;
  UPDATE public.orders SET preference_id = p_preference_id, updated_at = clock_timestamp() WHERE id = p_order_id;
  RETURN true;
END;
$$;

CREATE FUNCTION public.backend_claim_whatsapp(p_id text, p_phone text, p_text text, p_name text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_session public.whatsapp_sessions%ROWTYPE;
  v_message public.whatsapp_messages%ROWTYPE;
  v_active public.whatsapp_messages%ROWTYPE;
  v_now timestamptz := clock_timestamp();
  v_resume boolean := false;
  v_history jsonb;
BEGIN
  IF p_id IS NULL OR char_length(p_id) NOT BETWEEN 1 AND 200
    OR p_phone IS NULL OR p_phone !~ '^[0-9]{6,20}$'
    OR p_text IS NULL OR char_length(p_text) NOT BETWEEN 1 AND 8192
    OR char_length(coalesce(p_name, '')) > 255 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid_whatsapp_message';
  END IF;
  INSERT INTO public.whatsapp_sessions (phone) VALUES (p_phone) ON CONFLICT (phone) DO NOTHING;
  SELECT * INTO v_session FROM public.whatsapp_sessions WHERE phone = p_phone FOR UPDATE;
  SELECT * INTO v_message FROM public.whatsapp_messages WHERE id = p_id FOR UPDATE;
  IF FOUND THEN
    IF v_message.phone IS DISTINCT FROM p_phone OR v_message.text IS DISTINCT FROM p_text THEN
      RETURN jsonb_build_object('claimed', false, 'status', v_message.status, 'reason', 'identity_conflict');
    END IF;
    IF v_message.status IN ('pending', 'processing', 'retryable') AND (
      coalesce(v_message.first_processing_started_at, v_now) <= v_now - interval '20 minutes'
      OR v_message.created_at <= v_now - interval '24 hours') THEN
      UPDATE public.whatsapp_messages SET status = 'failed', retry_after = NULL,
        error_code = 'retry_window_exhausted', updated_at = v_now WHERE id = p_id;
      UPDATE public.whatsapp_sessions SET active_message_id = NULL, updated_at = v_now
        WHERE phone = p_phone AND active_message_id = p_id;
      RETURN jsonb_build_object('claimed', false, 'status', 'failed', 'reason', 'retry_window_exhausted',
        'response', v_message.response, 'sent_count', v_message.sent_count);
    END IF;
    IF v_message.status = 'retryable' AND v_message.retry_after > v_now THEN
      RETURN jsonb_build_object('claimed', false, 'status', 'retryable', 'reason', 'retry_backoff',
        'history', v_message.history_snapshot, 'response', v_message.response, 'sent_count', v_message.sent_count);
    END IF;
    IF v_message.status = 'processing' AND v_message.sent_count > 0
      AND coalesce(v_message.processing_started_at, '-infinity'::timestamptz) <= v_now - interval '2 minutes' THEN
      UPDATE public.whatsapp_messages SET status = 'uncertain',
        error_code = 'stale_partial_delivery', updated_at = v_now WHERE id = p_id;
      UPDATE public.whatsapp_sessions SET active_message_id = NULL, updated_at = v_now
        WHERE phone = p_phone AND active_message_id = p_id;
      RETURN jsonb_build_object('claimed', false, 'status', 'uncertain', 'sent_count', v_message.sent_count);
    END IF;
    IF v_message.status NOT IN ('pending', 'processing', 'retryable')
      OR (v_message.status = 'processing'
        AND v_message.processing_started_at > v_now - interval '2 minutes') THEN
      RETURN jsonb_build_object('claimed', false, 'status', v_message.status, 'history', v_message.history_snapshot,
        'response', v_message.response, 'sent_count', v_message.sent_count);
    END IF;
  ELSE
    INSERT INTO public.whatsapp_messages (id, phone, text, customer_name)
      VALUES (p_id, p_phone, p_text, coalesce(p_name, '')) RETURNING * INTO v_message;
  END IF;

  IF v_session.active_message_id IS NOT NULL AND v_session.active_message_id <> p_id THEN
    SELECT * INTO v_active FROM public.whatsapp_messages WHERE id = v_session.active_message_id FOR UPDATE;
    IF FOUND AND v_active.status = 'retryable' THEN
      IF coalesce(v_active.first_processing_started_at, v_now) > v_now - interval '20 minutes'
        AND v_active.created_at > v_now - interval '24 hours' THEN
        RETURN jsonb_build_object('claimed', false, 'status', 'pending', 'reason', 'conversation_busy');
      END IF;
      UPDATE public.whatsapp_messages SET status = 'failed', retry_after = NULL,
        error_code = 'retry_window_exhausted', updated_at = v_now WHERE id = v_active.id;
    END IF;
    IF FOUND AND v_active.status IN ('processing', 'uncertain')
      AND v_active.processing_started_at > v_now - interval '2 minutes' THEN
      RETURN jsonb_build_object('claimed', false, 'status', 'pending', 'reason', 'conversation_busy');
    END IF;
  END IF;
  v_resume := v_message.response IS NOT NULL
    AND jsonb_typeof(v_message.response->'bubbles') = 'array'
    AND jsonb_array_length(v_message.response->'bubbles') > 0;
  v_history := CASE WHEN v_resume THEN coalesce(v_message.history_snapshot, v_session.history) ELSE v_session.history END;
  UPDATE public.whatsapp_messages SET status = 'processing',
    history_snapshot = v_history, first_processing_started_at = coalesce(first_processing_started_at, v_now),
    processing_started_at = v_now, retry_after = NULL, updated_at = v_now
    WHERE id = p_id;
  UPDATE public.whatsapp_sessions SET active_message_id = p_id, updated_at = v_now WHERE phone = p_phone;
  RETURN jsonb_build_object('claimed', true, 'status', 'processing', 'history', v_history,
    'response', CASE WHEN v_resume THEN v_message.response ELSE NULL END, 'sent_count', v_message.sent_count);
END;
$$;

CREATE FUNCTION public.backend_start_whatsapp_send(p_id text, p_index integer)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_phone text;
  v_active_id text;
  v_started boolean;
  v_message public.whatsapp_messages%ROWTYPE;
  v_now timestamptz := clock_timestamp();
BEGIN
  IF p_id IS NULL OR p_index IS NULL OR p_index NOT BETWEEN 0 AND 29 THEN RETURN false; END IF;
  SELECT phone INTO v_phone FROM public.whatsapp_messages WHERE id = p_id;
  IF NOT FOUND THEN RETURN false; END IF;
  SELECT active_message_id INTO v_active_id FROM public.whatsapp_sessions WHERE phone = v_phone FOR UPDATE;
  IF v_active_id IS DISTINCT FROM p_id THEN RETURN false; END IF;
  SELECT * INTO v_message FROM public.whatsapp_messages WHERE id = p_id FOR UPDATE;
  IF v_message.status = 'processing' AND (
    coalesce(v_message.first_processing_started_at, v_now) <= v_now - interval '20 minutes'
    OR v_message.created_at <= v_now - interval '24 hours') THEN
    UPDATE public.whatsapp_messages SET status = 'failed', retry_after = NULL,
      error_code = 'retry_window_exhausted', updated_at = v_now WHERE id = p_id;
    UPDATE public.whatsapp_sessions SET active_message_id = NULL, updated_at = v_now WHERE phone = v_phone;
    RETURN false;
  END IF;
  -- Mark uncertainty BEFORE provider I/O. Crashes/timeouts cannot cause automatic duplicate sends.
  UPDATE public.whatsapp_messages SET status = 'uncertain',
    processing_started_at = clock_timestamp(), updated_at = clock_timestamp()
    WHERE id = p_id AND status = 'processing' AND sent_count = p_index
    RETURNING true INTO v_started;
  RETURN coalesce(v_started, false);
END;
$$;

CREATE FUNCTION public.backend_finish_whatsapp(
  p_id text, p_response jsonb, p_status text, p_sent_count integer, p_error_code text
) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_phone text;
  v_active_id text;
  v_message public.whatsapp_messages%ROWTYPE;
  v_history jsonb;
  v_lead jsonb;
  v_shipping numeric;
  v_now timestamptz := clock_timestamp();
  v_status text := p_status;
  v_retry_count integer;
  v_retry_after timestamptz;
  v_error_code text := nullif(p_error_code, '');
BEGIN
  IF p_status IS NULL OR p_status NOT IN ('processing', 'completed', 'failed', 'uncertain', 'awaiting_configuration', 'retryable')
    OR p_sent_count IS NULL OR p_sent_count NOT BETWEEN 0 AND 30
    OR char_length(coalesce(p_error_code, '')) > 100
    OR p_response IS NULL OR jsonb_typeof(p_response) <> 'object'
    OR octet_length(p_response::text) > 65536
    OR jsonb_typeof(p_response->'bubbles') IS DISTINCT FROM 'array'
    OR jsonb_array_length(p_response->'bubbles') > 30
    OR EXISTS (SELECT 1 FROM jsonb_array_elements(p_response->'bubbles') AS b
      WHERE jsonb_typeof(b) <> 'string' OR char_length(b #>> '{}') > 8192) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid_whatsapp_result';
  END IF;
  SELECT phone INTO v_phone FROM public.whatsapp_messages WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'whatsapp_message_not_found'; END IF;
  -- Every RPC takes the session lock before the message lock, avoiding lock-order deadlocks.
  SELECT active_message_id INTO v_active_id FROM public.whatsapp_sessions WHERE phone = v_phone FOR UPDATE;
  SELECT * INTO v_message FROM public.whatsapp_messages WHERE id = p_id FOR UPDATE;
  IF v_message.status = 'completed' THEN RETURN; END IF;
  IF v_active_id IS DISTINCT FROM p_id THEN
    RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'whatsapp_claim_lost';
  END IF;
  IF v_message.response IS NOT NULL AND jsonb_typeof(v_message.response->'bubbles') = 'array'
    AND (v_message.sent_count > 0 OR jsonb_array_length(v_message.response->'bubbles') > 0)
    AND v_message.response->'bubbles' IS DISTINCT FROM p_response->'bubbles' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'whatsapp_response_changed';
  END IF;
  v_retry_count := v_message.retry_count;
  IF p_status = 'processing' THEN
    IF v_message.status = 'processing' AND v_message.sent_count = p_sent_count THEN RETURN; END IF;
    IF v_message.status <> 'uncertain' OR p_sent_count <> v_message.sent_count + 1
      OR p_sent_count > jsonb_array_length(p_response->'bubbles') THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid_whatsapp_ack';
    END IF;
  ELSIF p_status = 'completed' THEN
    IF v_message.status <> 'processing' OR p_sent_count <> v_message.sent_count
      OR p_sent_count <> jsonb_array_length(p_response->'bubbles') THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'incomplete_whatsapp_delivery';
    END IF;
  ELSIF p_status = 'awaiting_configuration' THEN
    IF v_message.status <> 'processing' OR p_sent_count <> v_message.sent_count THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid_whatsapp_configuration_state';
    END IF;
  ELSIF p_status = 'retryable' THEN
    IF v_message.status <> 'uncertain' OR p_sent_count <> v_message.sent_count
      OR p_sent_count >= jsonb_array_length(p_response->'bubbles') THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid_whatsapp_retry_state';
    END IF;
    v_retry_count := least(v_message.retry_count + 1, 5);
    IF coalesce(v_message.first_processing_started_at, v_now) <= v_now - interval '20 minutes'
      OR v_message.created_at <= v_now - interval '24 hours' THEN
      v_status := 'failed'; v_error_code := 'retry_window_exhausted';
    ELSIF v_retry_count >= 5 THEN
      v_status := 'failed'; v_error_code := 'retry_limit_exhausted';
    ELSE
      v_retry_after := v_now + make_interval(secs => least(300, 15 * power(2, v_retry_count - 1))::integer);
    END IF;
  ELSIF v_message.status NOT IN ('processing', 'uncertain') OR p_sent_count <> v_message.sent_count THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid_whatsapp_failure_state';
  END IF;

  IF p_status = 'completed' THEN
    IF jsonb_typeof(p_response->'history') IS DISTINCT FROM 'array'
      OR EXISTS (SELECT 1 FROM jsonb_array_elements(p_response->'history') AS h
        WHERE jsonb_typeof(h) <> 'object' OR h->>'sender' IS NULL
          OR h->>'sender' NOT IN ('user', 'bot') OR jsonb_typeof(h->'text') IS DISTINCT FROM 'string'
          OR char_length(h->>'text') > 8192) THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid_whatsapp_history';
    END IF;
    SELECT coalesce(jsonb_agg(h.value ORDER BY h.position), '[]'::jsonb) INTO v_history
      FROM jsonb_array_elements(p_response->'history') WITH ORDINALITY AS h(value, position)
      WHERE h.position > greatest(jsonb_array_length(p_response->'history') - 20, 0);
    UPDATE public.whatsapp_sessions SET history = v_history, updated_at = clock_timestamp() WHERE phone = v_phone;
  END IF;

  IF p_status IN ('completed', 'awaiting_configuration') THEN
    v_lead := CASE WHEN jsonb_typeof(p_response->'lead') = 'object' THEN p_response->'lead' ELSE '{}'::jsonb END;
    IF coalesce(v_lead->>'estimated_shipping', '') ~ '^[0-9]{1,8}(\.[0-9]{1,2})?$' THEN
      v_shipping := (v_lead->>'estimated_shipping')::numeric;
    END IF;
    INSERT INTO public.leads AS l (name, phone, product, commune, region, source, estimated_shipping, last_message)
      VALUES (
        left(coalesce(nullif(v_lead->>'name', ''), v_message.customer_name), 255), v_phone,
        left(coalesce(v_lead->>'product', ''), 255), left(coalesce(v_lead->>'commune', ''), 100),
        left(coalesce(v_lead->>'region', ''), 100), 'whatsapp_bot', v_shipping, v_message.text
      ) ON CONFLICT (phone) DO UPDATE SET
        name = coalesce(nullif(EXCLUDED.name, ''), l.name),
        product = coalesce(nullif(EXCLUDED.product, ''), l.product),
        commune = coalesce(nullif(EXCLUDED.commune, ''), l.commune),
        region = coalesce(nullif(EXCLUDED.region, ''), l.region),
        estimated_shipping = coalesce(EXCLUDED.estimated_shipping, l.estimated_shipping),
        last_message = EXCLUDED.last_message, updated_at = clock_timestamp();
  END IF;

  UPDATE public.whatsapp_messages SET status = v_status, response = p_response,
    sent_count = p_sent_count, retry_count = v_retry_count, retry_after = v_retry_after,
    error_code = v_error_code, updated_at = v_now
    WHERE id = p_id;
  IF v_status NOT IN ('processing', 'retryable') THEN
    UPDATE public.whatsapp_sessions SET active_message_id = NULL, updated_at = clock_timestamp() WHERE phone = v_phone;
  END IF;
END;
$$;

-- Operator-only recovery. This queues work; it never calls Meta or sends a message.
-- Uncertain delivery requires an explicit acknowledgement of possible duplication.
CREATE FUNCTION public.backend_requeue_whatsapp(p_id text, p_confirm_delivery_uncertain boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_phone text;
  v_session public.whatsapp_sessions%ROWTYPE;
  v_message public.whatsapp_messages%ROWTYPE;
  v_now timestamptz := clock_timestamp();
  v_response jsonb;
  v_history jsonb;
  v_reply text;
BEGIN
  IF p_id IS NULL OR char_length(p_id) NOT BETWEEN 1 AND 200 THEN RETURN false; END IF;
  SELECT phone INTO v_phone FROM public.whatsapp_messages WHERE id = p_id;
  IF NOT FOUND THEN RETURN false; END IF;
  SELECT * INTO v_session FROM public.whatsapp_sessions WHERE phone = v_phone FOR UPDATE;
  SELECT * INTO v_message FROM public.whatsapp_messages WHERE id = p_id FOR UPDATE;
  IF v_message.status NOT IN ('failed', 'awaiting_configuration', 'uncertain')
    OR v_message.created_at <= v_now - interval '24 hours'
    OR (v_message.status = 'uncertain' AND p_confirm_delivery_uncertain IS DISTINCT FROM true)
    OR (v_session.active_message_id IS NOT NULL AND v_session.active_message_id <> p_id) THEN
    RETURN false;
  END IF;
  -- An in-flight send is not stolen even when uncertainty has been acknowledged.
  IF v_message.status = 'uncertain' AND v_session.active_message_id = p_id
    AND v_message.processing_started_at > v_now - interval '2 minutes' THEN RETURN false; END IF;
  v_response := v_message.response;
  IF v_response IS NULL AND v_message.sent_count > 0 THEN RETURN false; END IF;
  IF v_response IS NOT NULL THEN
    IF jsonb_typeof(v_response->'bubbles') IS DISTINCT FROM 'array'
      OR jsonb_array_length(v_response->'bubbles') < v_message.sent_count THEN RETURN false; END IF;
    SELECT coalesce(string_agg(b.value #>> '{}', ' ' ORDER BY b.position), '') INTO v_reply
      FROM jsonb_array_elements(v_response->'bubbles') WITH ORDINALITY AS b(value, position);
    -- Rebase history only. Preserve the generated bubbles/lead and confirmed send prefix.
    SELECT coalesce(jsonb_agg(jsonb_build_object('sender', h.value->>'sender',
      'text', left(h.value->>'text', 1024)) ORDER BY h.position), '[]'::jsonb) INTO v_history
      FROM jsonb_array_elements(v_session.history) WITH ORDINALITY AS h(value, position)
      WHERE h.value->>'sender' IN ('user', 'bot') AND jsonb_typeof(h.value->'text') = 'string';
    v_history := v_history || jsonb_build_array(jsonb_build_object('sender', 'user', 'text', left(v_message.text, 1024)));
    IF v_reply <> '' THEN
      v_history := v_history || jsonb_build_array(jsonb_build_object('sender', 'bot', 'text', left(v_reply, 1024)));
    END IF;
    SELECT coalesce(jsonb_agg(h.value ORDER BY h.position), '[]'::jsonb) INTO v_history
      FROM jsonb_array_elements(v_history) WITH ORDINALITY AS h(value, position)
      WHERE h.position > greatest(jsonb_array_length(v_history) - 20, 0);
    v_response := jsonb_set(v_response, '{history}', v_history, true);
    IF octet_length(v_response::text) > 65536 THEN RETURN false; END IF;
  END IF;
  UPDATE public.whatsapp_messages SET status = 'pending', response = v_response,
    history_snapshot = v_session.history, retry_count = 0, retry_after = NULL,
    first_processing_started_at = NULL, processing_started_at = NULL,
    error_code = 'manual_requeued', updated_at = v_now WHERE id = p_id;
  UPDATE public.whatsapp_sessions SET active_message_id = NULL, updated_at = v_now WHERE phone = v_phone;
  INSERT INTO public.security_audit_events(event_type, ip_address, details) VALUES (
    'whatsapp_manual_requeue', 'backend-service', jsonb_build_object('message_id', p_id,
      'previous_status', v_message.status, 'sent_count', v_message.sent_count,
      'uncertain_confirmed', v_message.status = 'uncertain' AND p_confirm_delivery_uncertain IS TRUE));
  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.backend_consume_rate_limit(text, text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.backend_admin_totals() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.backend_create_order(text, text, text, jsonb, jsonb, numeric, text, numeric, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.backend_apply_payment(uuid, text, numeric, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.backend_claim_preference(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.backend_finish_preference(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.backend_claim_whatsapp(text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.backend_start_whatsapp_send(text, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.backend_finish_whatsapp(text, jsonb, text, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.backend_requeue_whatsapp(text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.backend_consume_rate_limit(text, text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.backend_admin_totals() TO service_role;
GRANT EXECUTE ON FUNCTION public.backend_create_order(text, text, text, jsonb, jsonb, numeric, text, numeric, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.backend_apply_payment(uuid, text, numeric, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.backend_claim_preference(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.backend_finish_preference(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.backend_claim_whatsapp(text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.backend_start_whatsapp_send(text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.backend_finish_whatsapp(text, jsonb, text, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.backend_requeue_whatsapp(text, boolean) TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;

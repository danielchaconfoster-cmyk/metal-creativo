'use strict';
const { createClient } = require('@supabase/supabase-js');
const { HttpError } = require('./http');

function getDatabase() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new HttpError(503, 'DATABASE_NOT_CONFIGURED');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function rpc(db, name, args) {
  const { data, error } = await db.rpc(name, args);
  if (error) {
    if (error.message?.toLowerCase().includes('idempotency_conflict')) throw new HttpError(409, 'IDEMPOTENCY_CONFLICT');
    throw new HttpError(503, 'DATABASE_UNAVAILABLE');
  }
  return data;
}

module.exports = { getDatabase, rpc };

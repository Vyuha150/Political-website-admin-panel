#!/usr/bin/env node
/**
 * create-admin.js
 * Helper script to create or reset an admin user in Supabase using the
 * service role key. Run from the `Political-website-admin-panel` folder.
 *
 * Usage:
 *   npm install @supabase/supabase-js
 *   SUPABASE_URL=https://<project>.supabase.co SUPABASE_SERVICE_ROLE_KEY=<key> \
 *     ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=StrongPass123! \
 *     FULL_NAME="Admin Name" node scripts/create-admin.js
 *
 * Notes:
 * - The script uses the Supabase Admin API via the service role key.
 * - It creates a user (or returns existing user) and upserts a `profiles`
 *   row with role `admin`.
 * - Never commit your service role key to version control.
 * - This script does not set any `tenant_id` fields (use separate Supabase
 *   projects per MLA for isolation).
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load local env files if present so the script can be run directly
try {
  // prefer .env.local, fall back to .env
  const dotenv = require('dotenv');
  const localPath = path.resolve(process.cwd(), '.env.local');
  const envPath = path.resolve(process.cwd(), '.env');
  const loaded = dotenv.config({ path: localPath });
  if (loaded.error) {
    dotenv.config({ path: envPath });
  }
} catch (e) {
  // dotenv not installed — that's fine, user can pass env vars inline
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const FULL_NAME = process.env.FULL_NAME || 'Administrator';

const missing = [];
if (!SUPABASE_URL) missing.push('SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
if (!SERVICE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
if (!ADMIN_EMAIL) missing.push('ADMIN_EMAIL');
if (!ADMIN_PASSWORD) missing.push('ADMIN_PASSWORD');
if (missing.length) {
  console.error('Missing required environment variables:', missing.join(', '));
  console.error('Either set them inline or create a .env.local file. See script header for usage.');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

async function upsertProfile(userId) {
  // The schema in this repo uses `name` for the profiles table.
  const profile = { id: userId, name: FULL_NAME, role: 'admin' };
  console.log('Upserting profile:', profile);
  const { error } = await supabaseAdmin.from('profiles').upsert(profile, { onConflict: 'id' });
  if (error) throw error;
}

async function main() {
  try {
    // Create user via admin API
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (error) {
      // If user already exists, try to find by email
      if (error.status === 409 || /User already exists/i.test(error.message)) {
        console.warn('User already exists, attempting to lookup by email...');
        const { data: users, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
          query: ADMIN_EMAIL,
        });
        if (listErr) throw listErr;
        const found = users?.users?.find((u) => u.email === ADMIN_EMAIL) || users?.find?.((u) => u.email === ADMIN_EMAIL);
        if (!found) throw new Error('Could not locate existing user');
        await upsertProfile(found.id);
        console.log('Upserted profile for existing user:', found.id);
        return;
      }
      throw error;
    }

    const userId = data?.user?.id || data?.id;
    if (!userId) throw new Error('Could not get created user id');
    await upsertProfile(userId);
    console.log('Created admin user and profile:', userId);
    console.log('Sign-in at /signin with:', ADMIN_EMAIL);
  } catch (err) {
    console.error('Failed to create or upsert admin user:', err.message || err);
    process.exit(2);
  }
}

main();

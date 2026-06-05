/**
 * Cleanup dummy/test data from Supabase tables.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/cleanup-dummy.js
 *
 * To actually delete found rows add `--delete` flag and confirm prompts:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/cleanup-dummy.js --delete
 */

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TABLES = [
  'grievances',
  'social_media_grievances',
  'volunteers',
  'yuva_shakthi_members',
  'mahila_shakti_registrations',
  'scheme_eligibility',
  'citizen_feedback',
  'complaints',
  'contact_messages',
];

// Generic filters looking for common dummy/test markers. Adjust as needed.
const FILTER = [
  'name.ilike.%25test%25',
  'email.ilike.%25test%25',
  'email.ilike.%25example%25',
  'phone.ilike.123%25',
  'phone.ilike.000%25',
  'message.ilike.%25lorem%25',
  'message.ilike.%25dummy%25',
  'title.ilike.%25test%25',
].join(',');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

async function findCandidates(table) {
  try {
    const { data, error } = await supabase.from(table).select('*').or(FILTER).limit(200);
    if (error) {
      console.error(`Error querying ${table}:`, error.message || error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error(`Exception querying ${table}:`, err.message || err);
    return [];
  }
}

async function deleteCandidates(table) {
  try {
    const { data, error } = await supabase.from(table).delete().or(FILTER).limit(1000);
    if (error) {
      console.error(`Error deleting from ${table}:`, error.message || error);
      return null;
    }
    return data;
  } catch (err) {
    console.error(`Exception deleting ${table}:`, err.message || err);
    return null;
  }
}

async function main() {
  const doDelete = process.argv.includes('--delete');

  for (const table of TABLES) {
    process.stdout.write(`Checking ${table}... `);
    const rows = await findCandidates(table);
    if (!rows || rows.length === 0) {
      console.log('no candidates');
      continue;
    }
    console.log(`${rows.length} candidate(s)`);
    console.table(rows.map((r) => ({ id: r.id || r._id || r.uuid || '(no id)', ...pickPreview(r) })));

    if (doDelete) {
      const answer = await ask(`Delete ${rows.length} candidate(s) from ${table}? (y/N) `);
      if (answer.toLowerCase() === 'y') {
        const deleted = await deleteCandidates(table);
        if (deleted) console.log(`Deleted ${deleted.length} rows from ${table}`);
        else console.log(`No rows deleted from ${table}`);
      } else {
        console.log('Skipped deletion for', table);
      }
    }
  }
  rl.close();
}

function pickPreview(row) {
  const preview = {};
  if (row.name) preview.name = row.name;
  if (row.email) preview.email = row.email;
  if (row.phone) preview.phone = row.phone;
  if (row.title) preview.title = row.title;
  if (row.message) preview.message = String(row.message).slice(0, 80);
  return preview;
}

function ask(q) {
  return new Promise((res) => rl.question(q, (a) => res(a)));
}

main().catch((e) => {
  console.error(e);
  rl.close();
});

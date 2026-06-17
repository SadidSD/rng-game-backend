#!/usr/bin/env node
/**
 * post-migrate.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Run this script after every `prisma migrate dev` or `prisma migrate deploy`
 * to ensure Row-Level Security is enabled on ALL public tables.
 *
 * PostgreSQL never enables RLS by default on new tables, so any migration that
 * creates a new table will leave it unprotected unless this is run.
 *
 * Usage:
 *   node post-migrate.js
 *
 * Or add to package.json scripts:
 *   "migrate": "prisma migrate deploy && node post-migrate.js"
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { Client } = require('pg');
require('dotenv').config();

// Use DIRECT_URL for DDL operations (bypasses PgBouncer)
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

async function enableRLSOnAllTables(client) {
  // Get all tables in the public schema
  const { rows: tables } = await client.query(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);

  let fixed = 0;
  let alreadyEnabled = 0;

  for (const { tablename } of tables) {
    const { rows } = await client.query(
      `SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = $1`,
      [tablename]
    );

    if (rows[0]?.rowsecurity) {
      console.log(`  ✅  ${tablename} (RLS already enabled)`);
      alreadyEnabled++;
    } else {
      await client.query(`ALTER TABLE "${tablename}" ENABLE ROW LEVEL SECURITY`);
      console.log(`  🔒  ${tablename} (RLS just enabled)`);
      fixed++;
    }
  }

  console.log(`\n  RLS: ${alreadyEnabled} already enabled, ${fixed} newly enabled.`);
}

async function revokePublicAccess(client) {
  console.log('\n🚫 Revoking anon/authenticated privileges on all public tables...\n');

  const statements = [
    `REVOKE ALL PRIVILEGES ON ALL TABLES    IN SCHEMA public FROM anon`,
    `REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon`,
    `REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM anon`,
    `REVOKE USAGE ON SCHEMA public FROM anon`,
    `REVOKE ALL PRIVILEGES ON ALL TABLES    IN SCHEMA public FROM authenticated`,
    `REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM authenticated`,
    `REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM authenticated`,
    `REVOKE USAGE ON SCHEMA public FROM authenticated`,
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon`,
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM authenticated`,
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon`,
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated`,
  ];

  for (const sql of statements) {
    await client.query(sql);
  }

  console.log('  ✅  All anon/authenticated privileges revoked.');
  console.log('  ✅  Default privileges locked for future tables.');
}

async function main() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();

    console.log('\n🔒 Post-migrate: Step 1 — Enable RLS on all public tables...\n');
    await enableRLSOnAllTables(client);

    console.log('\n🔒 Post-migrate: Step 2 — Lock down anon/authenticated access...');
    await revokePublicAccess(client);

    console.log('\n✅ Post-migrate complete. Database is fully secured.\n');

  } catch (err) {
    console.error('❌ Post-migrate error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

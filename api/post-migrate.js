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

async function enableRLSOnAllTables() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log('\n🔒 Post-migrate: Enabling RLS on all public tables...\n');

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
      // Check current RLS status
      const { rows } = await client.query(
        `SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = $1`,
        [tablename]
      );

      if (rows[0]?.rowsecurity) {
        console.log(`  ✅  ${tablename} (already enabled)`);
        alreadyEnabled++;
      } else {
        await client.query(`ALTER TABLE "${tablename}" ENABLE ROW LEVEL SECURITY`);
        console.log(`  🔒  ${tablename} (just enabled)`);
        fixed++;
      }
    }

    console.log(`\n✅ Done — ${alreadyEnabled} already enabled, ${fixed} newly enabled.\n`);

  } catch (err) {
    console.error('❌ Error enabling RLS:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

enableRLSOnAllTables();

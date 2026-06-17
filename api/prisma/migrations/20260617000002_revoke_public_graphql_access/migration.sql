-- =============================================================================
-- Migration: Tighten GraphQL schema visibility & table privileges
-- =============================================================================
-- Supabase exposes a public GraphQL API (pg_graphql). By default the `anon`
-- and `authenticated` roles have SELECT on all public tables, which means:
--   1. Every table name appears in the public GraphQL schema (the warning).
--   2. Anyone who finds your Supabase URL can enumerate your data model.
--
-- Our NestJS backend connects as the postgres superuser via Prisma and does NOT
-- use the anon/authenticated roles at all, so revoking their access has zero
-- impact on the backend API.
-- =============================================================================

-- ── Revoke ALL privileges from anonymous (unauthenticated) users ───────────────
REVOKE ALL PRIVILEGES ON ALL TABLES    IN SCHEMA public FROM anon;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE USAGE ON SCHEMA public FROM anon;

-- ── Revoke ALL privileges from authenticated Supabase JWT users ───────────────
-- (We don't use Supabase Auth — auth is handled by our own NestJS JWT service)
REVOKE ALL PRIVILEGES ON ALL TABLES    IN SCHEMA public FROM authenticated;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;
REVOKE USAGE ON SCHEMA public FROM authenticated;

-- ── Revoke ALL privileges from the service_role GraphQL exposure ──────────────
-- service_role still works at the postgres level but should not have
-- default grants that leak through to public GraphQL introspection.
REVOKE ALL PRIVILEGES ON ALL TABLES    IN SCHEMA public FROM service_role;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM service_role;

-- ── Lock down future tables automatically ────────────────────────────────────
-- ALTER DEFAULT PRIVILEGES ensures any NEW table created by future migrations
-- also won't automatically get anon/authenticated access.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON TABLES FROM authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM authenticated;

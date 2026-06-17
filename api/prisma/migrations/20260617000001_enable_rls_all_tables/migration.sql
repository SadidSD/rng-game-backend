-- =============================================================================
-- Migration: Enable Row-Level Security (RLS) on all tables
-- =============================================================================
-- This migration enables RLS on every table in the public schema.
-- The backend connects using the Supabase postgres/service role, which
-- bypasses RLS by default. This means all existing API functionality is
-- preserved while anonymous/public direct table access is blocked.
-- =============================================================================

-- ── Core / Multi-Tenancy ──────────────────────────────────────────────────────

ALTER TABLE "Store"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApiKey"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User"           ENABLE ROW LEVEL SECURITY;

-- ── Products & Inventory ──────────────────────────────────────────────────────

ALTER TABLE "Card"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductVariant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InventoryItem"  ENABLE ROW LEVEL SECURITY;

-- ── Orders & Customers ───────────────────────────────────────────────────────

ALTER TABLE "Customer"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem"      ENABLE ROW LEVEL SECURITY;

-- ── Buylist ───────────────────────────────────────────────────────────────────

ALTER TABLE "BuylistRule"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BuylistOffer"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BuylistOfferImage"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BuylistItem"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BuylistFeaturedCard" ENABLE ROW LEVEL SECURITY;

-- ── Events ───────────────────────────────────────────────────────────────────

ALTER TABLE "Event"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EventPlayer"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EventTicket"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EventWaitlist"  ENABLE ROW LEVEL SECURITY;

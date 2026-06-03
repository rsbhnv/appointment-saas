-- =============================================================================
-- Fix: move btree_gist out of public schema (Supabase security advisor).
-- Uses ALTER EXTENSION SET SCHEMA to preserve dependent exclusion constraints.
-- =============================================================================

create schema if not exists extensions;

alter extension btree_gist set schema extensions;

-- Schema access for roles that resolve extension objects (Supabase convention).
grant usage on schema extensions to postgres, anon, authenticated, service_role;

comment on schema extensions is
  'Dedicated schema for PostgreSQL extensions (not application tables).';

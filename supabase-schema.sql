-- ============================================================
-- LifeOS Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ------------------- objects -------------------
create table if not exists public.objects (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  type        text not null check (type in ('person','self','event','idea','goal')),
  name        text not null,
  description text,
  properties  jsonb default '{}'::jsonb,
  tag_ids     uuid[] default '{}',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table public.objects enable row level security;
create policy "Users can only access their own objects"
  on public.objects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------- notes -------------------
create table if not exists public.notes (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  object_id   uuid references public.objects(id) on delete cascade not null,
  content     text default '',
  created_at  timestamptz default now()
);
alter table public.notes enable row level security;
create policy "Users can only access their own notes"
  on public.notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------- relations -------------------
create table if not exists public.relations (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references auth.users(id) on delete cascade not null,
  source_object_id  uuid references public.objects(id) on delete cascade not null,
  target_object_id  uuid references public.objects(id) on delete cascade not null,
  type             text not null,
  strength         int,
  note             text,
  created_at       timestamptz default now()
);
alter table public.relations enable row level security;
create policy "Users can only access their own relations"
  on public.relations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------- tags -------------------
create table if not exists public.tags (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  color       text,
  created_at  timestamptz default now(),
  usage_count int default 0
);
alter table public.tags enable row level security;
create policy "Users can only access their own tags"
  on public.tags for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------- templates -------------------
create table if not exists public.templates (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid references auth.users(id) on delete cascade not null,
  name              text not null,
  category          text not null,
  is_default        boolean default false,
  content           text default '',
  template_version   int default 1,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),
  usage_count       int default 0,
  last_used_at      timestamptz
);
alter table public.templates enable row level security;
create policy "Users can only access their own templates"
  on public.templates for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------- settings -------------------
create table if not exists public.settings (
  user_id    uuid references auth.users(id) on delete cascade not null,
  key        text not null,
  value      text,
  updated_at timestamptz default now(),
  primary key (user_id, key)
);
alter table public.settings enable row level security;
create policy "Users can only access their own settings"
  on public.settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------- indexes -------------------
create index if not exists idx_objects_user     on public.objects(user_id);
create index if not exists idx_notes_user      on public.notes(user_id);
create index if not exists idx_notes_object    on public.notes(object_id);
create index if not exists idx_relations_user  on public.relations(user_id);
create index if not exists idx_tags_user       on public.tags(user_id);
create index if not exists idx_templates_user  on public.templates(user_id);
create index if not exists idx_settings_user   on public.settings(user_id);

-- ============================================================
-- Done! Now enable Email auth in Supabase Dashboard → Authentication → Providers
-- ============================================================

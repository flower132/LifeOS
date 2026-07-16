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
  type        text not null check (type in ('person','self','event','idea','goal','project','knowledge')),
  name        text not null,
  description text,
  properties  jsonb default '{}'::jsonb,
  ai_profile  jsonb default null,
  ai_insights jsonb default '[]'::jsonb,
  ai_suggestions jsonb default '[]'::jsonb,
  memories    jsonb default '[]'::jsonb,
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
  object_id   uuid references public.objects(id) on delete set null,
  content     text default '',
  source_type text default 'text',
  attachments jsonb default '[]'::jsonb,
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

-- ------------------- ai_analysis_history -------------------
create table if not exists public.ai_analysis_history (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  object_type text not null check (object_type in ('person','self','event','idea','goal','project','knowledge')),
  object_id   uuid references public.objects(id) on delete set null,
  raw_text_input text default '',
  image_count int default 0,
  image_thumbnails jsonb default '[]'::jsonb,
  provider    text default '',
  model       text default '',
  duration_ms int default 0,
  raw_output  text default '',
  profile_snapshot jsonb default null,
  insights_snapshot jsonb default '[]'::jsonb,
  suggestions_snapshot jsonb default '[]'::jsonb,
  memories_snapshot jsonb default '[]'::jsonb,
  created_at  timestamptz default now()
);
alter table public.ai_analysis_history enable row level security;
create policy "Users can only access their own AI analysis history"
  on public.ai_analysis_history for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------- intelligence caches -------------------
-- Intelligence outputs are computed caches, not primary user data.
-- They are stored as typed JSON blobs to keep offline/online sync simple.
create table if not exists public.intelligence_cache (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table public.intelligence_cache enable row level security;
create policy "Users can only access their own intelligence cache"
  on public.intelligence_cache for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.intelligence_meta (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  last_full_analysis_at timestamptz,
  last_incremental_analysis_at timestamptz,
  analysis_version text default '1.0.0',
  pending_update boolean default false,
  updated_at  timestamptz default now()
);
alter table public.intelligence_meta enable row level security;
create policy "Users can only access their own intelligence meta"
  on public.intelligence_meta for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.today_stories (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  date        date not null,
  story       text not null,
  greeting    text,
  evidence    jsonb default '[]'::jsonb,
  created_at  timestamptz default now()
);
alter table public.today_stories enable row level security;
create policy "Users can only access their own today stories"
  on public.today_stories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.companion_meta (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  last_focus_date date,
  last_reminder_date date,
  last_reflection_date date,
  last_weekly_week_key text,
  last_monthly_month_key text,
  consecutive_rejections int default 0,
  last_appearance_at timestamptz,
  appearance_count_today int default 0,
  updated_at  timestamptz default now()
);
alter table public.companion_meta enable row level security;
create policy "Users can only access their own companion meta"
  on public.companion_meta for all
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
create index if not exists idx_ai_history_user on public.ai_analysis_history(user_id);
create index if not exists idx_ai_history_object on public.ai_analysis_history(object_id);
create index if not exists idx_intelligence_cache_user on public.intelligence_cache(user_id);
create index if not exists idx_today_stories_user_date on public.today_stories(user_id, date);
create index if not exists idx_companion_meta_user on public.companion_meta(user_id);

-- ============================================================
-- Done! Now enable Email auth in Supabase Dashboard → Authentication → Providers
-- ============================================================

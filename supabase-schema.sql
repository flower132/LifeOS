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

-- ------------------- long-term memory: moments -------------------
create table if not exists public.moments (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  kind        text not null check (kind in ('first_meeting','first_goal','first_travel','first_move','first_goal_completed','first_job_change','first_venture','first_graduation','milestone')),
  dedupe_key  text not null,
  title       text not null,
  description text,
  memory_ids  jsonb default '[]'::jsonb,
  object_ids  jsonb default '[]'::jsonb,
  occurred_at timestamptz not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create unique index if not exists idx_moments_user_dedupe on public.moments(user_id, dedupe_key);
alter table public.moments enable row level security;
create policy "Users can only access their own moments"
  on public.moments for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------- long-term memory: chapters -------------------
create table if not exists public.chapters (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  dedupe_key  text not null,
  title       text not null,
  description text default '',
  start_date  timestamptz not null,
  end_date    timestamptz,
  people      jsonb default '[]'::jsonb,
  goals       jsonb default '[]'::jsonb,
  places      jsonb default '[]'::jsonb,
  representative_memory_ids jsonb default '[]'::jsonb,
  status      text default 'active' check (status in ('active','closed')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create unique index if not exists idx_chapters_user_dedupe on public.chapters(user_id, dedupe_key);
alter table public.chapters enable row level security;
create policy "Users can only access their own chapters"
  on public.chapters for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------- long-term memory: memory_relations -------------------
create table if not exists public.memory_relations (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references auth.users(id) on delete cascade not null,
  source_memory_id text not null,
  target_memory_id text not null,
  reason           text default '',
  confidence       double precision default 0,
  created_at       timestamptz default now()
);
create index if not exists idx_memory_relations_source on public.memory_relations(user_id, source_memory_id);
create index if not exists idx_memory_relations_target on public.memory_relations(user_id, target_memory_id);
alter table public.memory_relations enable row level security;
create policy "Users can only access their own memory relations"
  on public.memory_relations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------- long-term memory: anniversaries -------------------
create table if not exists public.anniversaries (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  title        text not null,
  source_type  text not null check (source_type in ('person','goal','project','event','moment')),
  source_id    text not null,
  original_date timestamptz not null,
  month_day    text not null,
  created_at   timestamptz default now()
);
create unique index if not exists idx_anniversaries_user_source on public.anniversaries(user_id, source_type, source_id);
create index if not exists idx_anniversaries_user_month_day on public.anniversaries(user_id, month_day);
alter table public.anniversaries enable row level security;
create policy "Users can only access their own anniversaries"
  on public.anniversaries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------- long-term memory: highlights -------------------
create table if not exists public.highlights (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  year       int not null,
  category   text not null check (category in ('most_important','most_growth','happiest','hardest','key_decision','relationship_change')),
  title      text not null,
  memory_id  text,
  object_id  text,
  score      double precision default 0,
  created_at timestamptz default now()
);
create unique index if not exists idx_highlights_user_year_category on public.highlights(user_id, year, category);
alter table public.highlights enable row level security;
create policy "Users can only access their own highlights"
  on public.highlights for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------- long-term memory: decisions -------------------
create table if not exists public.decisions (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  decision   text not null,
  context    text default '',
  emotion    text default '',
  reason     text default '',
  outcome    text,
  review     text,
  object_ids jsonb default '[]'::jsonb,
  decided_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_decisions_user_decided_at on public.decisions(user_id, decided_at);
alter table public.decisions enable row level security;
create policy "Users can only access their own decisions"
  on public.decisions for all
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

-- ------------------- ai_usage -------------------
-- AI 使用记录（Usage Tracking）：每次 AI 调用一行，无论成功失败。
-- 只存元数据 —— prompt / 响应内容永不落库。
-- user_id 为 text：服务端鉴权接入前本地模式写 "local"，
-- 接入后写 auth.users 的 uuid（text 兼容两种形态，故不加 FK）。
create table if not exists public.ai_usage (
  id              uuid primary key default uuid_generate_v4(),
  user_id         text not null default 'local',
  provider        text not null,
  model           text not null,
  task            text not null,
  request_tokens  int default 0,
  response_tokens int default 0,
  total_tokens    int default 0,
  estimated_cost  numeric(14,8) default 0,
  latency         int default 0,
  success         boolean not null default true,
  error_code      text,
  session_id      text,        -- 预留：会话维度
  conversation_id text,        -- 预留：多轮对话维度
  created_at      timestamptz default now()
);
create index if not exists idx_ai_usage_user_created on public.ai_usage(user_id, created_at desc);
create index if not exists idx_ai_usage_task_created on public.ai_usage(task, created_at desc);
create index if not exists idx_ai_usage_model_created on public.ai_usage(model, created_at desc);
alter table public.ai_usage enable row level security;
-- 服务端路由在鉴权接入前以匿名身份写入，故 insert 放开；
-- 读取仍按用户隔离（本地模式行可被本地读取）。
create policy "Server can insert ai_usage"
  on public.ai_usage for insert
  with check (true);
create policy "Users can read their own ai_usage"
  on public.ai_usage for select
  using (auth.uid()::text = user_id or user_id = 'local');

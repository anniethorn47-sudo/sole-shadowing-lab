-- IELTS SHADOWLAB — Supabase schema v4
-- Run this ONCE in Supabase SQL Editor for the existing project.

create extension if not exists pgcrypto;

create table if not exists public.shadowlab_students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  class_name text not null,
  student_key_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shadowlab_submissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.shadowlab_students(id) on delete cascade,
  question_id integer not null check (question_id between 1 and 168),
  question_text text not null,
  topic text not null,
  route_id text not null,
  route_label text,
  shadow_first numeric,
  shadow_latest numeric,
  clarity numeric,
  fluency numeric,
  rhythm numeric,
  connected_speech numeric,
  under70_pct numeric,
  recall_score numeric,
  attempts integer not null default 1,
  transcript text,
  recall_transcript text,
  detail_json jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','accepted','retry')),
  teacher_note text,
  completed_at timestamptz not null default now(),
  reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(student_id, question_id)
);

create index if not exists shadowlab_students_class_idx on public.shadowlab_students(class_name);
create index if not exists shadowlab_submissions_student_idx on public.shadowlab_submissions(student_id);
create index if not exists shadowlab_submissions_status_idx on public.shadowlab_submissions(status);
create index if not exists shadowlab_submissions_topic_idx on public.shadowlab_submissions(topic);
create index if not exists shadowlab_submissions_completed_idx on public.shadowlab_submissions(completed_at desc);

-- Browser clients never access these tables directly. Only the Netlify Function uses the service-role key.
alter table public.shadowlab_students enable row level security;
alter table public.shadowlab_submissions enable row level security;
revoke all on table public.shadowlab_students from anon, authenticated;
revoke all on table public.shadowlab_submissions from anon, authenticated;
grant all on table public.shadowlab_students to service_role;
grant all on table public.shadowlab_submissions to service_role;

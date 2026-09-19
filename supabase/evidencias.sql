-- MVP evidence registry. Run this migration in Supabase SQL Editor.
create table if not exists public.producer_evidence (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  passport_token_id text,
  activity text not null,
  description text not null,
  media_url text not null,
  media_type text not null,
  file_name text not null,
  file_size bigint not null,
  content_hash text not null,
  status text not null default 'PENDING_REVIEW' check (status in ('PENDING_REVIEW', 'APPROVED', 'REJECTED')),
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists producer_evidence_wallet_idx on public.producer_evidence (wallet_address, created_at desc);

alter table public.producer_evidence enable row level security;

create policy "Evidence can be read publicly"
  on public.producer_evidence for select using (true);

create policy "Evidence can be inserted publicly for MVP"
  on public.producer_evidence for insert with check (char_length(wallet_address) = 42);

insert into storage.buckets (id, name, public)
values ('evidencias', 'evidencias', true)
on conflict (id) do update set public = true;

create policy "Evidence files are publicly readable"
  on storage.objects for select using (bucket_id = 'evidencias');

create policy "Evidence files can be uploaded for MVP"
  on storage.objects for insert with check (bucket_id = 'evidencias');

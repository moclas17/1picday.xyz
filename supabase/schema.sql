-- Create a table for public profiles (though we mostly use it for server-side checks)
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  created_at timestamptz default now(),
  is_pro boolean default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  pro_since timestamptz
);

-- RLS: user can read/update their own profile
alter table profiles enable row level security;
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Daily Photos Table
create table daily_photos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  date date not null,
  s3_key text not null,
  s3_bucket text not null,
  mime_type text not null,
  note text,
  created_at timestamptz default now(),
  constraint unique_user_date unique (user_id, date)
);

-- Indexes
create index daily_photos_user_date_idx on daily_photos (user_id, date desc);

-- RLS
alter table daily_photos enable row level security;

create policy "Users can view own photos" on daily_photos
  for select using (auth.uid() = user_id);

create policy "Users can insert own photos" on daily_photos
  for insert with check (auth.uid() = user_id);

create policy "Users can update own photos" on daily_photos
  for update using (auth.uid() = user_id);

create policy "Users can delete own photos" on daily_photos
  for delete using (auth.uid() = user_id);

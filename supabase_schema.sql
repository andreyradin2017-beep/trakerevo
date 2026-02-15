-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table public.profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  avatar_url text,
  website text,
  constraint username_length check (char_length(username) >= 3)
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- ITEMS
create table public.items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  external_id text,
  source text,
  type text not null,
  title text not null,
  description text,
  image text,
  year integer,
  status text default 'planned',
  rating integer,
  progress integer default 0,
  total_progress integer default 0,
  is_favorite boolean default false,
  is_archived boolean default false,
  list_id text,
  tags text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.items enable row level security;

create policy "Users can view their own items." on items for select using (auth.uid() = user_id);
create policy "Users can insert their own items." on items for insert with check (auth.uid() = user_id);
create policy "Users can update their own items." on items for update using (auth.uid() = user_id);
create policy "Users can delete their own items." on items for delete using (auth.uid() = user_id);

-- LISTS
create table public.lists (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  icon text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.lists enable row level security;

create policy "Users can view their own lists." on lists for select using (auth.uid() = user_id);
create policy "Users can insert their own lists." on lists for insert with check (auth.uid() = user_id);
create policy "Users can update their own lists." on lists for update using (auth.uid() = user_id);
create policy "Users can delete their own lists." on lists for delete using (auth.uid() = user_id);

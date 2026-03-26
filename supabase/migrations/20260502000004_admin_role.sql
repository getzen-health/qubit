alter table profiles add column if not exists role text check (role in ('user','admin')) default 'user';

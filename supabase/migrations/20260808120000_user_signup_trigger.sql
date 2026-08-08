-- Trigger function to handle new user signups
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.usuarios_perfil (
    id, 
    username, 
    role, 
    consentimiento_version,
    consentimiento_fecha
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'Coleccionista_' || substr(new.id::text, 1, 8)),
    'user',
    new.raw_user_meta_data->>'terms_version',
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

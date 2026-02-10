-- Enable RLS for asistencias
alter table asistencias enable row level security;

-- Allow authenticated admins to read asistencia records
create policy "asistencias_read_authenticated"
  on asistencias
  for select
  to authenticated
  using (true);

-- Allow authenticated admins to insert/update asistencia records
create policy "asistencias_write_authenticated"
  on asistencias
  for insert
  to authenticated
  with check (true);

create policy "asistencias_update_authenticated"
  on asistencias
  for update
  to authenticated
  using (true)
  with check (true);

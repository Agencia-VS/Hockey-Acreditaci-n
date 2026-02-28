-- Ensure new acreditaciones rows default to 'pendiente'

alter table acreditaciones
  alter column status set default 'pendiente';

-- (This file can be applied manually or used by your deployment process.)

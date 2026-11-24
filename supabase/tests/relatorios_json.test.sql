begin;
select plan(1);
select ok((select 'application/json' = any(allowed_mime_types) and 'application/pdf' = any(allowed_mime_types) from storage.buckets where id = 'relatorios'), 'bucket relatorios aceita o JSON da página do QR, além do PDF');
select * from finish();
rollback;

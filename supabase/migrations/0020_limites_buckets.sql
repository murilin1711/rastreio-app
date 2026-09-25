-- NERO · segurança: limite de tamanho e de tipo NO SERVIDOR para os arquivos.
--
-- Até aqui o teto de 10 MB e a lista de tipos viviam só no app (`documentos/storage.ts`). Quem
-- tivesse um token válido subia qualquer coisa direto na API de Storage, ignorando a tela: um vídeo
-- de 2 GB, um executável, o que fosse. Validação de cliente é conveniência; quem protege é o servidor.
--
-- `laudos`: o que o paciente anexa. Imagem ou PDF, porque é o que as telas sabem exibir.
-- `relatorios`: PDF gerado pelo próprio app para o QR, então só PDF.
update storage.buckets
   set file_size_limit = 10485760,                                    -- 10 MB, o mesmo do app
       allowed_mime_types = array['image/jpeg','image/png','image/heic','image/webp','application/pdf']
 where id = 'laudos';

update storage.buckets
   set file_size_limit = 10485760,
       allowed_mime_types = array['application/pdf']
 where id = 'relatorios';

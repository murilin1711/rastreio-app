-- NERO · relatório novo (D-067): o QR abre a página /r/ do site, que lê um JSON ao lado do PDF.
--
-- A 0020 limitou o bucket `relatorios` a PDF. Agora cada compartilhamento sobe também `<uuid>.json`
-- (HTML do relatório pronto para a tela + URL assinada do PDF), no mesmo caminho do PDF. O bucket
-- continua privado: a página só lê com a URL assinada de 7 dias, e revogar apaga os dois arquivos.
-- O teto de 10 MB da 0020 continua valendo.
update storage.buckets
   set allowed_mime_types = array['application/pdf','application/json']
 where id = 'relatorios';

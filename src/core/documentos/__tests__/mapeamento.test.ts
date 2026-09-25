import { caminhoNoBucket, extensaoDe, formatarTamanho, linhaParaDocumento, rotuloExameParaVinculo } from '../mapeamento';

test('linha → domínio', () => {
  const d = linhaParaDocumento({ id: 'd', exame_id: 'e', tipo: 'laudo', nome: 'LDL', caminho: 'u/x.jpg', mime: 'image/jpeg', tamanho: 2048, data_documento: '2026-09-13', observacao: null, created_at: 't' });
  expect(d).toMatchObject({ exameId: 'e', tipo: 'laudo', dataDocumento: '2026-09-13', criadoEm: 't' });
});
test('extensão pelo mime ou pelo nome', () => {
  expect(extensaoDe('application/pdf')).toBe('pdf');
  expect(extensaoDe('image/heic')).toBe('heic');
  expect(extensaoDe('application/octet-stream', 'laudo.DOCX')).toBe('docx');
  expect(extensaoDe('application/octet-stream')).toBe('bin');
});
test('caminho começa pela pasta do usuário', () => {
  expect(caminhoNoBucket('user-1', 'abc', 'image/jpeg')).toBe('user-1/abc.jpg');
});
test('tamanho legível', () => {
  expect(formatarTamanho(500)).toBe('1 KB');
  expect(formatarTamanho(1536 * 1024)).toBe('1,5 MB');
});
test('rótulo do exame para vínculo usa dicionário por módulo e data brasileira', () => {
  const rotulos = { rastreando: { mamografia: 'Mamografia' }, cardio: (t: string) => (t === 'ldl' ? 'LDL-colesterol' : t) };
  expect(rotuloExameParaVinculo({ id: '1', tipo: 'mamografia', modulo: 'rastreando', programa: 'mama', dataRealizacao: '2026-03-05' }, rotulos)).toBe('Mamografia: 05/03/2026');
  expect(rotuloExameParaVinculo({ id: '2', tipo: 'ldl', modulo: 'cardio', programa: null, dataRealizacao: '2026-09-01' }, rotulos)).toBe('LDL-colesterol: 01/09/2026');
});

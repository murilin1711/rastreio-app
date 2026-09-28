// Envia um .aab ao teste interno do Google Play e publica a versão para os testadores.
// Uso: node scripts/play-enviar-aab.mjs <arquivo.aab | URL do .aab na EAS> [notas da versão]
// Produção não passa por aqui: a conta de serviço não tem "Release to production", de propósito.
import { readFileSync } from 'node:fs';
import { token, api } from './play-api.mjs';

const [origem, notas] = process.argv.slice(2);
if (!origem) { console.error('uso: node scripts/play-enviar-aab.mjs <arquivo.aab | URL> [notas]'); process.exit(1); }

const aab = origem.startsWith('http')
  ? Buffer.from(await (await fetch(origem)).arrayBuffer())
  : readFileSync(origem);
console.log(`.aab: ${(aab.length / 1e6).toFixed(1)} MB`);

const tk = await token();
const { id } = await api(tk, 'POST', '/edits', {});
try {
  const { versionCode } = await api(tk, 'POST', `/edits/${id}/bundles?uploadType=media`, aab, { upload: true, tipo: 'application/octet-stream' });
  console.log(`enviado: versionCode ${versionCode}`);
  await api(tk, 'PUT', `/edits/${id}/tracks/internal`, {
    track: 'internal',
    releases: [{
      versionCodes: [String(versionCode)],
      status: 'completed',
      ...(notas ? { releaseNotes: [{ language: 'pt-BR', text: notas }] } : {}),
    }],
  });
  await api(tk, 'POST', `/edits/${id}:commit`);
  console.log('teste interno: versão publicada');
} catch (e) {
  await api(tk, 'DELETE', `/edits/${id}`).catch(() => {});
  throw e;
}

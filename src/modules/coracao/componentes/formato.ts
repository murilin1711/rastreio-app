/** Formatação de datas e leituras de PA para as telas do módulo cardio. */
export function dataHoraBr(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm} · ${hh}:${mi}`;
}

export function dataCurtaBr(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

export function dataLongaBr(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

/** 'HH:MM' do horário local de um ISO. */
export function horaLocal(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Combina 'AAAA-MM-DD' + 'HH:MM' locais em ISO. */
export function paraISO(data: string, hora: string): string {
  const [a, m, d] = data.split('-').map(Number);
  const [h, mi] = hora.split(':').map(Number);
  return new Date(a, m - 1, d, h, mi, 0).toISOString();
}

export function haQuanto(iso: string, agora = Date.now()): string {
  const dias = Math.floor((agora - Date.parse(iso)) / 86_400_000);
  if (dias <= 0) return 'hoje';
  if (dias === 1) return 'ontem';
  return `há ${dias} dias`;
}

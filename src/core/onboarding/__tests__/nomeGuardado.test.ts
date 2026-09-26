/** D-063: o nome dito ao Nero fica no celular até a conta existir. */
const mockMem: Record<string, string> = {};
let mockFalhar = false;
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: async (k: string, v: string) => { if (mockFalhar) throw new Error('x'); mockMem[k] = v; },
  getItem: async (k: string) => { if (mockFalhar) throw new Error('x'); return mockMem[k] ?? null; },
  removeItem: async (k: string) => { if (mockFalhar) throw new Error('x'); delete mockMem[k]; },
}));
import { apagarNome, guardarNome, lerNome } from '../nomeGuardado';

beforeEach(() => { mockFalhar = false; for (const k of Object.keys(mockMem)) delete mockMem[k]; });

test('guarda sem espaços nas pontas, lê e apaga', async () => {
  await guardarNome('  Maria  ');
  expect(await lerNome()).toBe('Maria');
  await apagarNome();
  expect(await lerNome()).toBeNull();
});

test('nome em branco apaga o que havia', async () => {
  await guardarNome('Maria');
  await guardarNome('   ');
  expect(await lerNome()).toBeNull();
});

test('falha do armazenamento não lança', async () => {
  mockFalhar = true;
  await expect(guardarNome('Maria')).resolves.toBeUndefined();
  await expect(lerNome()).resolves.toBeNull();
  await expect(apagarNome()).resolves.toBeUndefined();
});

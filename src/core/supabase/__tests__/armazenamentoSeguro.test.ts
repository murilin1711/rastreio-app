/**
 * Onde a sessão mora no aparelho (D-031). Três comportamentos precisam valer, e nenhum é óbvio:
 * a sessão é maior que o limite do Keychain e precisa ser dividida; quem já estava logado não pode
 * ser deslogado pela atualização; e um pedaço faltando não pode virar um JSON cortado.
 */
let mockCofre: Record<string, string> = {};
let mockAntigo: Record<string, string> = {};

jest.mock('expo-secure-store', () => ({
  getItemAsync: async (k: string) => (k in mockCofre ? mockCofre[k] : null),
  setItemAsync: async (k: string, v: string) => {
    // O iOS recusa item acima de 2048 bytes. Se o adapter não dividir, isto estoura no teste.
    if (v.length > 2048) throw new Error('SecureStore: valor acima do limite do Keychain');
    mockCofre[k] = v;
  },
  deleteItemAsync: async (k: string) => { delete mockCofre[k]; },
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: async (k: string) => (k in mockAntigo ? mockAntigo[k] : null),
  removeItem: async (k: string) => { delete mockAntigo[k]; },
  setItem: async (k: string, v: string) => { mockAntigo[k] = v; },
}));

const { armazenamentoSeguro } = require('../armazenamentoSeguro');

const CHAVE = 'sb-ycljqpwpeoonqisqdrws-auth-token';
/** Uma sessão real tem access token, refresh token e o objeto do usuário: passa de 2 KB. */
const sessaoGrande = JSON.stringify({ access_token: 'a'.repeat(1100), refresh_token: 'r'.repeat(900), user: { id: 'u1', email: 'x@y.z' } });

beforeEach(() => { mockCofre = {}; mockAntigo = {}; });

it('guarda e devolve uma sessão maior que o limite do Keychain', async () => {
  expect(sessaoGrande.length).toBeGreaterThan(2048);
  await armazenamentoSeguro.setItem(CHAVE, sessaoGrande);
  expect(await armazenamentoSeguro.getItem(CHAVE)).toBe(sessaoGrande);
  // Ficou em mais de um pedaço, e nenhum deles passa do limite.
  expect(Number(mockCofre[`${CHAVE}__partes`])).toBeGreaterThan(1);
  Object.entries(mockCofre).forEach(([, v]) => expect(v.length).toBeLessThanOrEqual(2048));
});

it('quem já estava logado continua logado: migra do armazenamento antigo', async () => {
  mockAntigo[CHAVE] = sessaoGrande;
  expect(await armazenamentoSeguro.getItem(CHAVE)).toBe(sessaoGrande);
  // E o valor sai do lugar inseguro, para não haver duas cópias.
  expect(mockAntigo[CHAVE]).toBeUndefined();
  expect(await armazenamentoSeguro.getItem(CHAVE)).toBe(sessaoGrande);
});

it('pedaço faltando devolve nulo em vez de um JSON cortado', async () => {
  await armazenamentoSeguro.setItem(CHAVE, sessaoGrande);
  delete mockCofre[`${CHAVE}__1`];
  expect(await armazenamentoSeguro.getItem(CHAVE)).toBeNull();
  // E limpa o resto, para a próxima tentativa não achar sobra.
  expect(mockCofre[`${CHAVE}__0`]).toBeUndefined();
});

it('regravar não deixa pedaço velho para trás', async () => {
  await armazenamentoSeguro.setItem(CHAVE, sessaoGrande);
  await armazenamentoSeguro.setItem(CHAVE, '{"access_token":"curto"}');
  expect(await armazenamentoSeguro.getItem(CHAVE)).toBe('{"access_token":"curto"}');
  expect(Object.keys(mockCofre).filter((k) => k.startsWith(`${CHAVE}__`) && !k.endsWith('partes'))).toHaveLength(1);
});

it('sair apaga dos dois lugares', async () => {
  mockAntigo[CHAVE] = 'sobra antiga';
  await armazenamentoSeguro.setItem(CHAVE, sessaoGrande);
  await armazenamentoSeguro.removeItem(CHAVE);
  expect(await armazenamentoSeguro.getItem(CHAVE)).toBeNull();
  expect(mockAntigo[CHAVE]).toBeUndefined();
  expect(Object.keys(mockCofre)).toHaveLength(0);
});

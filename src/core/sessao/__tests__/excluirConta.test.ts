import { excluirConta } from '../excluirConta';

const mockList = jest.fn();
const mockRemove = jest.fn();
const mockRpc = jest.fn();
const mockCancelarAvisos = jest.fn(async () => undefined);
const mockSignOut = jest.fn(async (_opts: unknown) => ({ error: null }));

jest.mock('expo-notifications', () => ({ cancelAllScheduledNotificationsAsync: () => mockCancelarAvisos() }));
jest.mock('@core/supabase/client', () => ({
  supabase: {
    storage: { from: () => ({ list: mockList, remove: mockRemove }) },
    rpc: (nome: string) => mockRpc(nome),
    auth: { signOut: (opts: unknown) => mockSignOut(opts) },
  },
}));

const UID = 'u-1';

describe('excluirConta (D-013)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockList.mockResolvedValue({ data: [], error: null });
    mockRemove.mockResolvedValue({ data: null, error: null });
    mockRpc.mockResolvedValue({ data: null, error: null });
  });

  it('apaga os arquivos dos dois buckets, chama a função e encerra a sessão local', async () => {
    mockList.mockResolvedValueOnce({ data: [{ name: 'a.pdf' }, { name: 'b.jpg' }], error: null });
    await excluirConta(UID);
    expect(mockList).toHaveBeenCalledTimes(2);
    expect(mockRemove).toHaveBeenCalledWith(['u-1/a.pdf', 'u-1/b.jpg']);
    expect(mockRpc).toHaveBeenCalledWith('excluir_minha_conta');
    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(mockCancelarAvisos).toHaveBeenCalled();
  });

  it('não chama remove quando o bucket está vazio', async () => {
    await excluirConta(UID);
    expect(mockRemove).not.toHaveBeenCalled();
    expect(mockRpc).toHaveBeenCalledTimes(1);
  });

  it('se a função falhar, não encerra a sessão', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { code: 'XX000', message: 'boom' } });
    await expect(excluirConta(UID)).rejects.toBeTruthy();
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('se o storage falhar, não chega a chamar a função', async () => {
    mockList.mockResolvedValueOnce({ data: null, error: { message: 'storage indisponível' } });
    await expect(excluirConta(UID)).rejects.toBeTruthy();
    expect(mockRpc).not.toHaveBeenCalled();
  });
});

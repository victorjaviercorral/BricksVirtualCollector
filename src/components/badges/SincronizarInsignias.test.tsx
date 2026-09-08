import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import SincronizarInsignias from './SincronizarInsignias';
import { toast } from 'sonner';

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));

const responderCon = (body: unknown, ok = true) =>
  vi.fn().mockResolvedValue({ ok, json: () => Promise.resolve(body) });

describe('SincronizarInsignias', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  it('registra las insignias al montar, sin enviar ninguna lista al servidor', async () => {
    const fetchMock = responderCon({ nuevas: [] });
    vi.stubGlobal('fetch', fetchMock);

    render(<SincronizarInsignias />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/insignias/sync', { method: 'POST' }));
    expect(fetchMock.mock.calls[0][1]).not.toHaveProperty('body');
  });

  it('avisa de cada insignia recién desbloqueada con su nombre y su nivel', async () => {
    vi.stubGlobal('fetch', responderCon({ nuevas: ['cantera-2'] }));

    render(<SincronizarInsignias />);

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('¡Insignia desbloqueada: Cubo Lleno!', {
        description: 'Cantera · nivel 2',
      })
    );
  });

  it('una insignia única se anuncia sin nivel', async () => {
    vi.stubGlobal('fetch', responderCon({ nuevas: ['triple-corona'] }));

    render(<SincronizarInsignias />);

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('¡Insignia desbloqueada: Triple Corona!', {
        description: 'Triple Corona',
      })
    );
  });

  it('sin insignias nuevas no molesta con ningún aviso', async () => {
    vi.stubGlobal('fetch', responderCon({ nuevas: [] }));

    render(<SincronizarInsignias />);

    await waitFor(() => expect(toast.success).not.toHaveBeenCalled());
  });

  it('un slug que ya no está en el catálogo se ignora en vez de anunciar un nombre vacío', async () => {
    vi.stubGlobal('fetch', responderCon({ nuevas: ['insignia-retirada'] }));

    render(<SincronizarInsignias />);

    await waitFor(() => expect(toast.success).not.toHaveBeenCalled());
  });

  it('un error del servidor no rompe la página ni avisa de nada', async () => {
    vi.stubGlobal('fetch', responderCon({ error: 'RLS' }, false));

    render(<SincronizarInsignias />);

    await waitFor(() => expect(toast.success).not.toHaveBeenCalled());
  });

  it('un fallo de red se traga en silencio: la Vitrina ya está pintada sin depender de esto', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    render(<SincronizarInsignias />);

    await waitFor(() => expect(toast.success).not.toHaveBeenCalled());
  });

  it('no renderiza nada', () => {
    vi.stubGlobal('fetch', responderCon({ nuevas: [] }));

    const { container } = render(<SincronizarInsignias />);

    expect(container).toBeEmptyDOMElement();
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';

const mockGetUser = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({ auth: { getUser: mockGetUser } })),
}));

const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();
const mockAdminStorageFrom = vi.fn(() => ({ upload: mockUpload, getPublicUrl: mockGetPublicUrl }));
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ storage: { from: mockAdminStorageFrom } })),
}));

// sharp es un binario nativo -- se mockea por completo. Lo que se prueba aquí es que la ruta lo
// invoca correctamente (sin .withMetadata(), que es lo que deja los metadatos fuera) y maneja
// sus fallos, no el propio procesamiento de imagen.
const mockToBuffer = vi.fn();
const mockJpeg = vi.fn(() => ({ toBuffer: mockToBuffer }));
const mockRotate = vi.fn(() => ({ jpeg: mockJpeg }));
const mockSharp = vi.fn((_input: unknown) => ({ rotate: mockRotate }));
vi.mock('sharp', () => ({ default: (input: unknown) => mockSharp(input) }));

describe('POST /api/sets/foto (limpieza EXIF/GPS server-side, ADR-005/ADR-010)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://proyecto.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    };
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    mockToBuffer.mockResolvedValue(Buffer.from('imagen-limpia'));
    mockUpload.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://proyecto.supabase.co/storage/v1/object/public/fotos_sets/u1/123.jpg' } });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // No se construye un Request real con la FormData serializada: el parser de
  // multipart/form-data de undici (Node) revienta con un assertion error interno
  // (webidl.is.File) al mezclar el `File` del entorno jsdom de test con su propio brand-check --
  // un problema conocido de interoperabilidad, no un defecto de la ruta. Se evita el
  // serializado/parseado real y se controla `formData()` directamente, igual que ya se mockea
  // `request.json()` en otras rutas de este proyecto (api/bounties/claim).
  const buildRequest = (formData: FormData) =>
    ({ formData: () => Promise.resolve(formData) }) as unknown as Request;

  // Contenido real del tamaño pedido -- no basta con falsear `file.size` con
  // Object.defineProperty: el parser de multipart/form-data de Node valida que el tamaño
  // declarado coincida con los bytes reales del cuerpo y revienta si no coincide.
  const imageFile = (sizeBytes = 1024, type = 'image/jpeg') =>
    new File([new Uint8Array(sizeBytes)], 'foto.jpg', { type });

  it('devuelve 401 si no hay sesión', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const formData = new FormData();
    formData.append('file', imageFile());

    const res = await POST(buildRequest(formData));
    expect(res.status).toBe(401);
  });

  it('devuelve 400 si falta el fichero', async () => {
    const res = await POST(buildRequest(new FormData()));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Falta el fichero de imagen');
  });

  it('devuelve 400 si la imagen supera los 10MB', async () => {
    const formData = new FormData();
    formData.append('file', imageFile(11 * 1024 * 1024));

    const res = await POST(buildRequest(formData));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('La imagen no debe superar los 10MB');
    expect(mockSharp).not.toHaveBeenCalled();
  });

  it('devuelve 400 si el fichero no es una imagen', async () => {
    const formData = new FormData();
    formData.append('file', imageFile(1024, 'application/pdf'));

    const res = await POST(buildRequest(formData));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('El fichero debe ser una imagen');
  });

  it('devuelve 400 si sharp no puede procesar el fichero (no es una imagen válida)', async () => {
    mockToBuffer.mockRejectedValue(new Error('input buffer contains unsupported image format'));
    const formData = new FormData();
    formData.append('file', imageFile());

    const res = await POST(buildRequest(formData));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('El fichero no es una imagen válida');
  });

  it('devuelve 500 si falta SUPABASE_SERVICE_ROLE_KEY', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const formData = new FormData();
    formData.append('file', imageFile());

    const res = await POST(buildRequest(formData));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('El servicio de subida no está configurado correctamente en el servidor.');
    consoleErrorSpy.mockRestore();
  });

  it('devuelve 500 si falla la subida a Storage', async () => {
    mockUpload.mockResolvedValue({ error: new Error('bucket error') });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const formData = new FormData();
    formData.append('file', imageFile());

    const res = await POST(buildRequest(formData));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('No se pudo subir la foto');
    consoleErrorSpy.mockRestore();
  });

  it('limpia la imagen con sharp (sin .withMetadata()) y sube el resultado con la service_role key', async () => {
    const formData = new FormData();
    formData.append('file', imageFile());

    const res = await POST(buildRequest(formData));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.url).toContain('fotos_sets');

    // rotate() aplica la orientación EXIF a los píxeles antes de descartar el propio EXIF.
    expect(mockSharp).toHaveBeenCalled();
    expect(mockRotate).toHaveBeenCalled();
    expect(mockJpeg).toHaveBeenCalledWith({ quality: 90 });

    // Sube con el cliente admin (service_role), no con la sesión del usuario -- el bucket ya no
    // acepta INSERT directo (migración 20260901100000).
    expect(mockUpload).toHaveBeenCalledWith(
      expect.stringMatching(/^u1\/\d+\.jpg$/),
      expect.any(Buffer),
      { contentType: 'image/jpeg', upsert: false }
    );
  });

  it('devuelve 500 si ocurre un error inesperado', async () => {
    mockGetUser.mockRejectedValue(new Error('fallo de red'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const formData = new FormData();
    formData.append('file', imageFile());

    const res = await POST(buildRequest(formData));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Error interno del servidor');
    consoleErrorSpy.mockRestore();
  });
});

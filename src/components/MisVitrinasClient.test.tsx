import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MisVitrinasClient } from './MisVitrinasClient';

interface MockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

vi.mock('./CrearVitrinaModal', () => ({
  CrearVitrinaModal: ({ isOpen, onClose }: MockModalProps) =>
    isOpen ? (
      <div data-testid="crear-vitrina-modal">
        <button onClick={onClose}>Cerrar</button>
      </div>
    ) : null,
}));

vi.mock('./VitrinasStats', () => ({
  default: ({ numSets, bricksRecibidos, temas }: { numSets: number; bricksRecibidos: number; temas: string[] }) => (
    <div data-testid="vitrinas-stats">
      {numSets}/{bricksRecibidos}/{temas.join(',')}
    </div>
  ),
}));

const vitrina = (over: Record<string, unknown> = {}) => ({
  id: 'v1',
  nombre: 'Naves Star Wars',
  visibilidad: 'pública',
  sets: [{ id: 's1', fotos: [{ url: 'https://cdn/foto.jpg' }] }],
  ...over,
});

describe('MisVitrinasClient — estado vacío', () => {
  it('sin vitrinas muestra la tarjeta de invitación a crear la primera', () => {
    render(<MisVitrinasClient vitrinas={[]} />);

    expect(screen.getByText(/Tu Próxima Gran/)).toBeInTheDocument();
    expect(screen.queryByText('Crear otra vitrina')).not.toBeInTheDocument();
  });

  it('la tarjeta de estado vacío también abre el modal de creación', () => {
    render(<MisVitrinasClient vitrinas={[]} />);

    fireEvent.click(screen.getByText(/Tu Próxima Gran/).closest('button')!);

    expect(screen.getByTestId('crear-vitrina-modal')).toBeInTheDocument();
  });

  it('sin stats no pinta el bloque de estadísticas', () => {
    render(<MisVitrinasClient vitrinas={[]} />);

    expect(screen.queryByTestId('vitrinas-stats')).not.toBeInTheDocument();
  });
});

describe('MisVitrinasClient — con vitrinas', () => {
  it('pinta una tarjeta por vitrina con su nombre y el recuento de sets', () => {
    render(<MisVitrinasClient vitrinas={[vitrina({ sets: [{ id: 's1' }, { id: 's2' }] })]} />);

    expect(screen.getByText('Naves Star Wars')).toBeInTheDocument();
    expect(screen.getByText('2 sets')).toBeInTheDocument();
  });

  it('usa la primera foto del primer set como portada', () => {
    render(<MisVitrinasClient vitrinas={[vitrina()]} />);

    expect(screen.getByAltText('Naves Star Wars')).toHaveAttribute('src', 'https://cdn/foto.jpg');
  });

  it('sin fotos muestra el estado "Vacía" en vez de una imagen rota', () => {
    render(<MisVitrinasClient vitrinas={[vitrina({ sets: [{ id: 's1', fotos: [] }] })]} />);

    expect(screen.getByText('Vacía')).toBeInTheDocument();
    expect(screen.queryByAltText('Naves Star Wars')).not.toBeInTheDocument();
  });

  it('distingue las tres visibilidades con su insignia', () => {
    render(
      <MisVitrinasClient
        vitrinas={[
          vitrina({ id: 'v1', visibilidad: 'pública' }),
          vitrina({ id: 'v2', visibilidad: 'privada' }),
          vitrina({ id: 'v3', visibilidad: 'con_enlace' }),
        ]}
      />
    );

    expect(screen.getByText('Pública')).toBeInTheDocument();
    expect(screen.getByText('Privada')).toBeInTheDocument();
    expect(screen.getByText('Solo Enlace')).toBeInTheDocument();
  });

  it('una visibilidad desconocida no pinta ninguna insignia ni rompe el render', () => {
    render(<MisVitrinasClient vitrinas={[vitrina({ visibilidad: 'borrador-legacy' })]} />);

    expect(screen.queryByText('Pública')).not.toBeInTheDocument();
    expect(screen.queryByText('Privada')).not.toBeInTheDocument();
    expect(screen.queryByText('Solo Enlace')).not.toBeInTheDocument();
  });

  it('enlaza cada tarjeta a la vista de detalle de esa vitrina', () => {
    render(<MisVitrinasClient vitrinas={[vitrina()]} />);

    expect(screen.getByText('Naves Star Wars').closest('a')).toHaveAttribute(
      'href',
      '/dashboard/vitrina/v1'
    );
  });

  it('ofrece una tarjeta para crear otra vitrina cuando ya hay al menos una', () => {
    render(<MisVitrinasClient vitrinas={[vitrina()]} />);

    fireEvent.click(screen.getByText('Crear otra vitrina'));

    expect(screen.getByTestId('crear-vitrina-modal')).toBeInTheDocument();
  });

  it('marca la primera tarjeta para el tour de onboarding, no todas', () => {
    render(<MisVitrinasClient vitrinas={[vitrina({ id: 'v1' }), vitrina({ id: 'v2' })]} />);

    const insignias = screen.getAllByText('Pública');
    expect(insignias[0].closest('[data-tour]')).toHaveAttribute('data-tour', 'vitrina-visibilidad');
    expect(insignias[1].closest('[data-tour]')).toBeNull();
  });
});

describe('MisVitrinasClient — cabecera', () => {
  it('el botón "Crear Vitrina" abre el modal', () => {
    render(<MisVitrinasClient vitrinas={[]} />);

    fireEvent.click(screen.getByText('Crear Vitrina'));

    expect(screen.getByTestId('crear-vitrina-modal')).toBeInTheDocument();
  });

  it('el modal se cierra tras confirmarlo', () => {
    render(<MisVitrinasClient vitrinas={[]} />);

    fireEvent.click(screen.getByText('Crear Vitrina'));
    fireEvent.click(screen.getByText('Cerrar'));

    expect(screen.queryByTestId('crear-vitrina-modal')).not.toBeInTheDocument();
  });

  it('"Añadir Set" enlaza a Mesa de Trabajo', () => {
    render(<MisVitrinasClient vitrinas={[]} />);

    expect(screen.getByText('Añadir Set').closest('a')).toHaveAttribute('href', '/mesa-de-trabajo');
  });

  it('con stats muestra el bloque de contexto de la colección', () => {
    render(
      <MisVitrinasClient
        vitrinas={[vitrina()]}
        stats={{ numSets: 5, bricksRecibidos: 120, temas: ['Star Wars', 'Technic'] }}
      />
    );

    expect(screen.getByTestId('vitrinas-stats')).toHaveTextContent('5/120/Star Wars,Technic');
  });
});

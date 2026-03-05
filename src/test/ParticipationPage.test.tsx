import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ParticipationPage from '../features/participation/components/ParticipationPage';

// Mock Supabase client used by the page
vi.mock('../lib/supabase', () => {
  return {
    getSupabaseClient: vi.fn(),
  };
});

// Mock pigeon-maps to avoid ResizeObserver / DOM APIs during tests
vi.mock('pigeon-maps', () => {
  return {
    Map: (_props: any) => null,
    Marker: (_props: any) => null,
  };
});

import { getSupabaseClient } from '../lib/supabase';

describe('ParticipationPage form', () => {
  const insertMock = vi.fn();
  const fromMock = vi.fn(() => ({
    insert: insertMock,
  }));

  beforeEach(() => {
    insertMock.mockReset();
    fromMock.mockClear();
    (getSupabaseClient as unknown as vi.Mock).mockReturnValue({
      from: fromMock,
    });
  });

  const setup = () => {
    render(
      <MemoryRouter>
        <ParticipationPage />
      </MemoryRouter>,
    );
  };

  it('envía un registro de área verde a Supabase', async () => {
    insertMock.mockResolvedValue({ error: null });

    setup();

    // Asegurar que estamos en el flujo de área verde
    fireEvent.click(screen.getByRole('button', { name: /Nueva área verde/i }));

    fireEvent.change(screen.getByPlaceholderText(/Escribe tu nombre/i), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText(/tucorreo@ejemplo.com/i), {
      target: { value: 'test@example.com' },
    });

    // Área verde
    fireEvent.change(
      screen.getByPlaceholderText(/Parque del Barrio, Jardín central/i),
      { target: { value: 'Parque Central' } },
    );
    fireEvent.change(screen.getByPlaceholderText(/Calle, colonia, referencias/i), {
      target: { value: 'Calle Falsa 123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Enviar propuesta/i }));

    await waitFor(() => {
      expect(fromMock).toHaveBeenCalledWith('participation_submissions');
      expect(insertMock).toHaveBeenCalledTimes(1);
      const arg = insertMock.mock.calls[0][0];
      expect(arg.type).toBe('GREEN_AREA');
      expect(arg.name).toBe('Test User');
      expect(arg.email).toBe('test@example.com');
      expect(arg.data.tipo).toBe('Área verde');
    });
  });

  it('envía un registro de evento a Supabase', async () => {
    insertMock.mockResolvedValue({ error: null });

    setup();

    fireEvent.change(screen.getByPlaceholderText(/Escribe tu nombre/i), {
      target: { value: 'Otra Persona' },
    });
    fireEvent.change(screen.getByPlaceholderText(/tucorreo@ejemplo.com/i), {
      target: { value: 'otra@example.com' },
    });

    // Cambiar explícitamente a evento
    fireEvent.click(screen.getByRole('button', { name: /Evento para agenda/i }));

    fireEvent.change(screen.getByPlaceholderText(/Jornada de reforestación/i), {
      target: { value: 'Jornada de limpieza' },
    });
    // Seleccionar fecha y horario usando los controles actuales del formulario
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2025-02-20' } });
    const allSelects = Array.from(document.querySelectorAll('select'));
    const [startTimeSelect, endTimeSelect] =
      allSelects.length >= 2 ? [allSelects[0] as HTMLSelectElement, allSelects[1] as HTMLSelectElement] : [null, null];
    if (!startTimeSelect || !endTimeSelect) {
      throw new Error('No se encontraron los selects de horario en el formulario de evento');
    }
    fireEvent.change(startTimeSelect, { target: { value: '10:00' } });
    fireEvent.change(endTimeSelect, { target: { value: '11:00' } });

    fireEvent.change(
      screen.getByPlaceholderText(/Dirección o referencia del lugar/i),
      { target: { value: 'Parque XYZ' } },
    );

    fireEvent.click(screen.getByRole('button', { name: /Enviar propuesta/i }));

    await waitFor(() => {
      expect(fromMock).toHaveBeenCalledWith('events');
      expect(insertMock).toHaveBeenCalledTimes(1);
      const arg = insertMock.mock.calls[0][0];
      expect(arg.title).toBe('Jornada de limpieza');
      expect(arg.source).toBe('participation');
      expect(arg.status).toBe('pending');
    });
  });
});


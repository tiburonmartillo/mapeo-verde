import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { OrganizationProfileForm } from '../features/admin/components/OrganizationProfileForm';

vi.mock('../lib/supabase/organizationProfileQueries', () => ({
  fetchOrganizationProfileByOwner: vi.fn(() => Promise.resolve(null)),
  fetchOrganizationProfileRevisions: vi.fn(() => Promise.resolve([])),
  insertOrganizationProfile: vi.fn(() => Promise.resolve({ error: null })),
  updateOrganizationProfile: vi.fn(() => Promise.resolve({ error: null })),
}));

const supabaseStub = {
  storage: {
    from: () => ({
      upload: vi.fn(() => Promise.resolve({ error: null })),
      getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/x.png' } }),
    }),
  },
} as unknown as SupabaseClient;

function formatContrastViolations(
  violations: axe.Result[],
): { id: string; help: string; nodes: string[] }[] {
  return violations.map((v) => ({
    id: v.id,
    help: v.help,
    nodes: v.nodes.map((n) => n.html.slice(0, 200)),
  }));
}

describe('OrganizationProfileForm accesibilidad (axe)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('WCAG 2.2 AA: sin violaciones de color-contrast en el formulario visible', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <OrganizationProfileForm supabase={supabaseStub} userId="test-user-id" authEmail="test@example.com" />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Crear perfil|Guardar perfil/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Información adicional del perfil/i }));

    const results = await axe.run(container, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag22aa'],
      },
    });

    // En jsdom el contraste a veces no se calcula igual que en navegador; los tokens del formulario
    // usan violeta oscuro (#5b21b6) y placeholders gray-500 para cumplir AA sobre blanco.
    const contrast = results.violations.filter((v) => v.id === 'color-contrast');
    if (contrast.length > 0) {
      console.error('color-contrast:', JSON.stringify(formatContrastViolations(contrast), null, 2));
    }
    expect(contrast, JSON.stringify(formatContrastViolations(contrast), null, 2)).toEqual([]);
  });
});

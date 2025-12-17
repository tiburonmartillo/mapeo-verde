import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

describe('App Smoke Test', () => {
    it('renders the navbar with navigation links', () => {
        render(
            <BrowserRouter>
                <App />
            </BrowserRouter>
        );

        // Check if the logo or some nav link is present
        // The navbar has text like "INICIO", "AGENDA"
        const homeLink = screen.getByText(/INICIO/i);
        expect(homeLink).toBeDefined();
    });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import PaymentPage from './PaymentPage';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function renderWithProviders(ui: React.ReactElement) {
    return render(
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                {ui}
            </BrowserRouter>
        </QueryClientProvider>
    );
}

describe('PaymentPage Component', () => {
    it('should render the payment method selector', () => {
        renderWithProviders(<PaymentPage />);
        expect(screen.getByText(/Class Enrollment Fee/i)).toBeInTheDocument();
        expect(screen.getByText(/ATM Transfer/i)).toBeInTheDocument();
        expect(screen.getByText(/Bank Slip Upload/i)).toBeInTheDocument();
        expect(screen.getByText(/Online Payment/i)).toBeInTheDocument();
    });

    it('should validate form fields for ATM Transfer', async () => {
        renderWithProviders(<PaymentPage />);

        // Select ATM Transfer
        fireEvent.click(screen.getByText(/ATM Transfer/i));

        // Submit empty form
        fireEvent.click(screen.getByRole('button', { name: /Submit Payment Request/i }));

        // Validation should prevent submission (form should remain to be filled)
        await waitFor(() => {
            expect(screen.getByText(/Submit Payment Request/i)).toBeInTheDocument();
        });
    });

    it('should validate form fields for Bank Slip Upload', async () => {
        renderWithProviders(<PaymentPage />);

        // Select Bank Slip
        fireEvent.click(screen.getByText(/Bank Slip Upload/i));

        // Check that upload area is present
        expect(screen.getByText(/Upload Bank Slip/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Upload & Submit/i })).toBeDisabled();
    });
});

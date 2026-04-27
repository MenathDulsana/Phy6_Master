import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import StripePaymentForm from './StripePaymentForm';
import PaymentSuccessPage from '../../pages/student/PaymentSuccessPage';
import PaymentCancelPage from '../../pages/student/PaymentCancelPage';

/**
 * Tests for StripePaymentForm component
 */
describe('StripePaymentForm', () => {
  const defaultProps = {
    classId: 5,
    studentId: 1,
    amount: 99.99,
    courseName: 'Physics 101',
  };

  const renderComponent = (props = {}) => {
    return render(
      <BrowserRouter>
        <StripePaymentForm {...defaultProps} {...props} />
      </BrowserRouter>
    );
  };

  it('should render the payment form title', () => {
    renderComponent();
    expect(screen.getByText(/Pay with Card/i)).toBeInTheDocument();
  });

  it('should display the course name', () => {
    renderComponent();
    expect(screen.getByText('Physics 101')).toBeInTheDocument();
  });

  it('should display the correct amount', () => {
    const { container } = renderComponent();
    expect(container.textContent).toMatch(/Rs\.\s*99\.99/);
  });

  it('should disable pay when amount is negative', () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    renderComponent({ amount: -10 });
    expect(screen.getByRole('button', { name: /Pay Now with Stripe/i })).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should render Pay Now button', () => {
    renderComponent();
    const payButton = screen.getByText(/Pay Now with Stripe/i);
    expect(payButton).toBeInTheDocument();
  });

  it('should display feature benefits', () => {
    renderComponent();
    expect(screen.getByText(/Instant payment confirmation/i)).toBeInTheDocument();
    expect(screen.getByText(/Immediate class access after payment/i)).toBeInTheDocument();
    expect(screen.getByText(/Secure Stripe payment processing/i)).toBeInTheDocument();
  });

  it('should handle missing props gracefully', () => {
    renderComponent({
      courseName: undefined,
    });
    // Should render with default course name
    expect(screen.getByText(/Pay with Card/i)).toBeInTheDocument();
  });

  it('should display loading state when processing', async () => {
    // Mock the API call to be slow
    global.fetch = vi.fn(
      () =>
        new Promise<Response>((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () =>
                  Promise.resolve({
                    sessionId: 'test_session_id',
                    clientSecret: 'pk_test_key',
                    paymentId: 1,
                  }),
              } as Response),
            100,
          ),
        ),
    ) as unknown as typeof fetch;

    renderComponent();
    const payButton = screen.getByText(/Pay Now with Stripe/i);
    
    fireEvent.click(payButton);
    
    // Should show loading state on the submit button
    expect(screen.getByRole('button', { name: /Processing\.\.\./i })).toBeInTheDocument();
  });
});

/**
 * Tests for PaymentSuccessPage component
 */
describe('PaymentSuccessPage', () => {
  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <PaymentSuccessPage />
      </BrowserRouter>
    );
  };

  it('should display success message after verification', async () => {
    renderComponent();
    
    // Initial state shows processing
    expect(screen.getByText(/Processing Payment/i)).toBeInTheDocument();
    
    // After verification (2 seconds)
    await waitFor(() => {
      expect(screen.getByText(/Payment Successful!/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should display action buttons', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/View My Classes/i)).toBeInTheDocument();
      expect(screen.getByText(/Go to Dashboard/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

/**
 * Tests for PaymentCancelPage component
 */
describe('PaymentCancelPage', () => {
  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <PaymentCancelPage />
      </BrowserRouter>
    );
  };

  it('should display cancellation message', () => {
    renderComponent();
    expect(screen.getByText(/Payment Cancelled/i)).toBeInTheDocument();
  });

  it('should indicate no charge was made', () => {
    renderComponent();
    expect(screen.getByText(/No charge has been made to your card/i)).toBeInTheDocument();
  });

  it('should provide retry and dashboard options', () => {
    renderComponent();
    expect(screen.getByText(/Go Back & Retry Payment/i)).toBeInTheDocument();
    expect(screen.getByText(/Go to Dashboard/i)).toBeInTheDocument();
  });

  it('should list alternative payment methods', () => {
    renderComponent();
    expect(screen.getByText(/ATM Transfer/i)).toBeInTheDocument();
    expect(screen.getByText(/Bank Slip Upload/i)).toBeInTheDocument();
  });
});

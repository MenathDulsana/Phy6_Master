import React, { useMemo, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { useToast } from '../../components/ui/use-toast';
import { assertValidStripeCheckoutAmount, createStripeCheckoutSession } from '../../lib/api/stripe';
import { CreditCard, Loader2 } from 'lucide-react';

interface StripePaymentFormProps {
  classId: number;
  studentId: number;
  amount: number;
  courseName?: string;
  onSuccess?: () => void;
}

/**
 * StripePaymentForm - React component for Stripe Online Payment
 * Creates a Stripe Checkout Session and redirects the browser to the
 * Stripe-hosted checkout page using the redirectUrl returned by the backend.
 */
const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  classId,
  studentId,
  amount,
  courseName = 'Your Class',
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { amountOk, amountInvalidReason } = useMemo(() => {
    try {
      assertValidStripeCheckoutAmount(amount);
      return { amountOk: true, amountInvalidReason: null as string | null };
    } catch (e) {
      return {
        amountOk: false,
        amountInvalidReason: e instanceof Error ? e.message : 'Invalid amount',
      };
    }
  }, [amount]);

  const handleStripePayment = async () => {
    try {
      assertValidStripeCheckoutAmount(amount);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Invalid amount';
      toast({ title: 'Invalid amount', description: msg, variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const response = await createStripeCheckoutSession({ studentId, classId, amount });

      if (!response.redirectUrl) {
        throw new Error('No redirect URL returned from server.');
      }

      // Redirect browser to Stripe-hosted checkout page.
      // Keep isLoading = true so the button stays disabled during navigation.
      window.location.href = response.redirectUrl;

    } catch (error) {
      console.error('Stripe payment error:', error);
      toast({
        title: 'Payment Error',
        description: error instanceof Error ? error.message : 'Failed to initiate Stripe payment',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Pay with Card (Stripe)
        </CardTitle>
        <CardDescription>
          Secure online payment via Stripe. Instant approval and immediate enrollment access.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Amount Display */}
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="text-sm text-gray-600">Course</div>
          <div className="font-semibold text-gray-900">{courseName}</div>
          <div className="mt-2 flex items-center justify-between border-t pt-2">
            <span className="text-sm font-medium text-gray-600">Amount to Pay</span>
            <span className="text-xl font-bold text-gray-900">Rs. {amount.toLocaleString("en-LK", { minimumFractionDigits: 2 })}</span>
          </div>
          {!amountOk && (
            <p className="mt-2 text-sm font-medium text-destructive">{amountInvalidReason}</p>
          )}
        </div>

        {/* Features */}
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <div className="mt-1 h-1 w-1 rounded-full bg-green-600" />
            <span>Instant payment confirmation</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="mt-1 h-1 w-1 rounded-full bg-green-600" />
            <span>Immediate class access after payment</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="mt-1 h-1 w-1 rounded-full bg-green-600" />
            <span>Secure Stripe payment processing</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="mt-1 h-1 w-1 rounded-full bg-green-600" />
            <span>No accountant review needed</span>
          </div>
        </div>

        {/* Pay Button */}
        <Button
          onClick={handleStripePayment}
          disabled={isLoading || !amountOk}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay Now with Stripe - Rs. {amount.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
            </>
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          You will be redirected to Stripe Checkout to complete the payment securely.
        </p>
      </CardContent>
    </Card>
  );
};

export default StripePaymentForm;
